using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CasaDoTerno.Application.Services;

public class LocacaoService
{
    private readonly ICasaDoTernoContext _context;

    public LocacaoService(ICasaDoTernoContext context)
    {
        _context = context;
    }

    public class ItemLocacaoEntrada
    {
        public int ProdutoId { get; set; }
        public string? Ajustes { get; set; }
        public decimal? ValorItem { get; set; }
    }

    public (bool sucesso, string mensagem, Locacao? locacao) CriarLocacao(
        int clienteId, DateTime dataEvento, DateTime dataRetirada, DateTime dataDevolucaoPrevista,
        string? consultor, decimal desconto, decimal valorEntrada, FormaPagamento formaPagamentoEntrada,
        int? eventoId, bool ehLocacaoPrincipalDoEvento, List<ItemLocacaoEntrada> itensEntrada)
    {
        if (itensEntrada == null || itensEntrada.Count == 0)
            return (false, "A locação precisa ter pelo menos uma peça.", null);

        Evento? evento = null;
        if (eventoId.HasValue)
        {
            evento = _context.Eventos.Find(eventoId.Value);
            if (evento == null)
                return (false, "Evento não encontrado.", null);
        }

        var locacao = new Locacao
        {
            ClienteId = clienteId,
            DataEvento = dataEvento,
            DataRetirada = dataRetirada,
            DataDevolucaoPrevista = dataDevolucaoPrevista,
            Consultor = consultor,
            Desconto = desconto,
            EventoId = eventoId,
            DescontoEvento = 0,
            ValorEntrada = valorEntrada,
            FormaPagamentoEntrada = formaPagamentoEntrada,
            DataPagamentoEntrada = DateTime.Now
        };

        decimal valorTotal = 0;
        var contagemNoPedido = new Dictionary<int, int>();

        foreach (var entrada in itensEntrada)
        {
            var produto = _context.Produtos.Find(entrada.ProdutoId);
            if (produto == null)
                return (false, $"Produto {entrada.ProdutoId} não encontrado.", null);

            if (!produto.DisponivelParaLocacao)
                return (false, $"'{produto.Modelo}' (Tam. {produto.Tamanho}) não está disponível para locação.", null);

            int unidadesReservadas = (
                from item in _context.ItensLocacao
                join loc in _context.Locacoes on item.LocacaoId equals loc.Id
                where item.ProdutoId == entrada.ProdutoId
                      && loc.DataDevolucaoReal == null
                      && dataRetirada < loc.DataDevolucaoPrevista
                      && loc.DataRetirada < dataDevolucaoPrevista
                select item
            ).Count();

            contagemNoPedido.TryGetValue(entrada.ProdutoId, out int jaNoPedido);
            int totalNecessario = unidadesReservadas + jaNoPedido + 1;

            if (totalNecessario > produto.Quantidade)
            {
                var conflitantes = (
                    from item in _context.ItensLocacao
                    join loc in _context.Locacoes on item.LocacaoId equals loc.Id
                    join cli in _context.Clientes on loc.ClienteId equals cli.Id
                    where item.ProdutoId == entrada.ProdutoId
                          && loc.DataDevolucaoReal == null
                          && dataRetirada < loc.DataDevolucaoPrevista
                          && loc.DataRetirada < dataDevolucaoPrevista
                    select new { cli.Nome, loc.DataRetirada, loc.DataDevolucaoPrevista }
                ).ToList();

                var detalhes = string.Join("; ", conflitantes.Select(c =>
                    $"{c.Nome} (retirada {c.DataRetirada:dd/MM}, devolução prevista {c.DataDevolucaoPrevista:dd/MM})"));

                return (false,
                    $"'{produto.Modelo}' (Tam. {produto.Tamanho}) não tem unidades suficientes disponíveis nesse período. Reservado com: {detalhes}",
                    null);
            }

            contagemNoPedido[entrada.ProdutoId] = jaNoPedido + 1;

            var item2 = new ItemLocacao
            {
                ProdutoId = produto.Id,
                Ajustes = entrada.Ajustes,
                ValorItem = entrada.ValorItem ?? produto.ValorLocacao
            };

            locacao.Itens.Add(item2);
            valorTotal += item2.ValorItem;
        }

        locacao.ValorTotal = valorTotal - desconto;

        _context.Locacoes.Add(locacao);
        _context.SaveChanges();

        if (evento != null)
        {
            if (ehLocacaoPrincipalDoEvento)
            {
                DefinirLocacaoPrincipal(evento.Id, locacao.Id);
            }
            else if (evento.LocacaoPrincipalId.HasValue)
            {
                AtualizarDescontoDoEvento(evento.Id);
            }
            // se ainda não tem principal, e essa locação também não é a principal,
            // não faz nada agora — o desconto será calculado quando a principal for definida (mesmo que depois)
        }

        return (true, "Locação criada com sucesso.", locacao);
    }

    public (bool sucesso, string mensagem) RegistrarPagamentoRestante(int locacaoId, FormaPagamento formaPagamento)
    {
        var locacao = _context.Locacoes.Find(locacaoId);
        if (locacao == null)
            return (false, "Locação não encontrada.");

        if (locacao.FormaPagamentoRestante != null)
            return (false, "O pagamento do restante já foi registrado.");

        locacao.FormaPagamentoRestante = formaPagamento;
        locacao.DataPagamentoRestante = DateTime.Now;
        _context.SaveChanges();

        return (true, "Pagamento do restante registrado com sucesso.");
    }

    public (bool sucesso, string mensagem) RegistrarRetirada(int locacaoId)
    {
        var locacao = _context.Locacoes.Find(locacaoId);
        if (locacao == null)
            return (false, "Locação não encontrada.");

        if (locacao.DataRetiradaReal != null)
            return (false, "A retirada dessa locação já foi registrada.");

        if (locacao.DataDevolucaoReal != null)
            return (false, "Não é possível registrar retirada de uma locação já devolvida.");

        var produtoIds = _context.ItensLocacao
            .Where(i => i.LocacaoId == locacaoId)
            .Select(i => i.ProdutoId)
            .Distinct()
            .ToList();

        foreach (var produtoId in produtoIds)
        {
            var produto = _context.Produtos.Find(produtoId);
            int capacidadeTotal = produto?.Quantidade ?? 1;

            int unidadesForaAgora = (
                from item in _context.ItensLocacao
                join loc in _context.Locacoes on item.LocacaoId equals loc.Id
                where item.ProdutoId == produtoId
                      && loc.Id != locacaoId
                      && loc.DataRetiradaReal != null
                      && loc.DataDevolucaoReal == null
                select item
            ).Count();

            int unidadesNestaLocacao = _context.ItensLocacao
                .Count(i => i.LocacaoId == locacaoId && i.ProdutoId == produtoId);

            if (unidadesForaAgora + unidadesNestaLocacao > capacidadeTotal)
            {
                var comQuem = (
                    from item in _context.ItensLocacao
                    join loc in _context.Locacoes on item.LocacaoId equals loc.Id
                    join cli in _context.Clientes on loc.ClienteId equals cli.Id
                    where item.ProdutoId == produtoId
                          && loc.Id != locacaoId
                          && loc.DataRetiradaReal != null
                          && loc.DataDevolucaoReal == null
                    select new { cli.Nome, loc.DataDevolucaoPrevista }
                ).ToList();

                var detalhes = string.Join("; ", comQuem.Select(c =>
                    $"{c.Nome} (devolução prevista {c.DataDevolucaoPrevista:dd/MM})"));

                return (false,
                    $"'{produto?.Modelo}' (Tam. {produto?.Tamanho}) não tem unidades suficientes disponíveis pra retirada agora. Está com: {detalhes}");
            }
        }

        locacao.DataRetiradaReal = DateTime.Now;
        _context.SaveChanges();

        return (true, "Retirada registrada com sucesso.");
    }

    public (bool sucesso, string mensagem, Locacao? locacao) AtualizarLocacao(
        int locacaoId, int clienteId, DateTime dataEvento, DateTime dataRetirada, DateTime dataDevolucaoPrevista,
        string? consultor, decimal desconto, decimal valorEntrada, FormaPagamento formaPagamentoEntrada,
        int? eventoId, bool ehLocacaoPrincipalDoEvento, List<ItemLocacaoEntrada> itensEntrada)
    {
        var locacao = _context.Locacoes.Include(l => l.Itens).FirstOrDefault(l => l.Id == locacaoId);
        if (locacao == null)
            return (false, "Locação não encontrada.", null);

        if (locacao.DataRetiradaReal != null)
            return (false, "Não é possível editar uma locação que já foi retirada.", null);

        if (itensEntrada == null || itensEntrada.Count == 0)
            return (false, "A locação precisa ter pelo menos uma peça.", null);

        _context.ItensLocacao.RemoveRange(locacao.Itens);
        locacao.Itens.Clear();

        decimal valorTotal = 0;
        var contagemNoPedido = new Dictionary<int, int>();

        foreach (var entrada in itensEntrada)
        {
            var produto = _context.Produtos.Find(entrada.ProdutoId);
            if (produto == null)
                return (false, $"Produto {entrada.ProdutoId} não encontrado.", null);

            if (!produto.DisponivelParaLocacao)
                return (false, $"'{produto.Modelo}' (Tam. {produto.Tamanho}) não está disponível para locação.", null);

            int unidadesReservadas = (
                from item in _context.ItensLocacao
                join loc in _context.Locacoes on item.LocacaoId equals loc.Id
                where item.ProdutoId == entrada.ProdutoId
                      && loc.Id != locacaoId
                      && loc.DataDevolucaoReal == null
                      && dataRetirada < loc.DataDevolucaoPrevista
                      && loc.DataRetirada < dataDevolucaoPrevista
                select item
            ).Count();

            contagemNoPedido.TryGetValue(entrada.ProdutoId, out int jaNoPedido);
            int totalNecessario = unidadesReservadas + jaNoPedido + 1;

            if (totalNecessario > produto.Quantidade)
            {
                var conflitantes = (
                    from item in _context.ItensLocacao
                    join loc in _context.Locacoes on item.LocacaoId equals loc.Id
                    join cli in _context.Clientes on loc.ClienteId equals cli.Id
                    where item.ProdutoId == entrada.ProdutoId
                          && loc.Id != locacaoId
                          && loc.DataDevolucaoReal == null
                          && dataRetirada < loc.DataDevolucaoPrevista
                          && loc.DataRetirada < dataDevolucaoPrevista
                    select new { cli.Nome, loc.DataRetirada, loc.DataDevolucaoPrevista }
                ).ToList();

                var detalhes = string.Join("; ", conflitantes.Select(c =>
                    $"{c.Nome} (retirada {c.DataRetirada:dd/MM}, devolução prevista {c.DataDevolucaoPrevista:dd/MM})"));

                return (false,
                    $"'{produto.Modelo}' (Tam. {produto.Tamanho}) não tem unidades suficientes disponíveis nesse período. Reservado com: {detalhes}",
                    null);
            }

            contagemNoPedido[entrada.ProdutoId] = jaNoPedido + 1;

            var item2 = new ItemLocacao
            {
                ProdutoId = produto.Id,
                Ajustes = entrada.Ajustes,
                ValorItem = entrada.ValorItem ?? produto.ValorLocacao
            };

            locacao.Itens.Add(item2);
            valorTotal += item2.ValorItem;
        }

        locacao.ClienteId = clienteId;
        locacao.DataEvento = dataEvento;
        locacao.DataRetirada = dataRetirada;
        locacao.DataDevolucaoPrevista = dataDevolucaoPrevista;
        locacao.Consultor = consultor;
        locacao.Desconto = desconto;
        locacao.EventoId = eventoId;
        locacao.ValorEntrada = valorEntrada;
        locacao.FormaPagamentoEntrada = formaPagamentoEntrada;
        locacao.ValorTotal = valorTotal - desconto;

        _context.SaveChanges();

        if (eventoId.HasValue)
        {
            var evento = _context.Eventos.Find(eventoId.Value);
            if (evento != null)
            {
                if (ehLocacaoPrincipalDoEvento)
                {
                    DefinirLocacaoPrincipal(evento.Id, locacao.Id);
                }
                else if (evento.LocacaoPrincipalId.HasValue)
                {
                    AtualizarDescontoDoEvento(evento.Id);
                }
            }
        }

        return (true, "Locação atualizada com sucesso.", locacao);
    }

    public (bool disponivel, string mensagem, int unidadesDisponiveis) VerificarDisponibilidade(
    int produtoId, DateTime dataRetirada, DateTime dataDevolucaoPrevista,
    int? locacaoIdExcluir, int unidadesJaNoCarrinho)
    {
        var produto = _context.Produtos.Find(produtoId);
        if (produto == null)
            return (false, "Produto não encontrado.", 0);

        if (!produto.DisponivelParaLocacao)
            return (false, $"'{produto.Modelo}' (Tam. {produto.Tamanho}) não está disponível para locação.", 0);

        var conflitantes = (
            from item in _context.ItensLocacao
            join loc in _context.Locacoes on item.LocacaoId equals loc.Id
            join cli in _context.Clientes on loc.ClienteId equals cli.Id
            where item.ProdutoId == produtoId
                  && loc.DataDevolucaoReal == null
                  && dataRetirada < loc.DataDevolucaoPrevista
                  && loc.DataRetirada < dataDevolucaoPrevista
                  && (!locacaoIdExcluir.HasValue || loc.Id != locacaoIdExcluir.Value)
            select new { cli.Nome, loc.DataRetirada, loc.DataDevolucaoPrevista }
        ).ToList();

        int unidadesReservadas = conflitantes.Count;
        int unidadesDisponiveis = produto.Quantidade - unidadesReservadas - unidadesJaNoCarrinho;

        if (unidadesDisponiveis <= 0)
        {
            var detalhes = string.Join("; ", conflitantes.Select(c =>
                $"{c.Nome} (retirada {c.DataRetirada:dd/MM}, devolução prevista {c.DataDevolucaoPrevista:dd/MM})"));

            return (false,
                $"'{produto.Modelo}' (Tam. {produto.Tamanho}) sem unidades disponíveis nesse período. Reservado com: {detalhes}",
                0);
        }

        return (true, "Disponível.", unidadesDisponiveis);
    }
    public (bool sucesso, string mensagem) RegistrarPagamentoMulta(int locacaoId, FormaPagamento formaPagamento)
    {
        var locacao = _context.Locacoes.Find(locacaoId);
        if (locacao == null)
            return (false, "Locação não encontrada.");

        if (locacao.MultaAtraso <= 0)
            return (false, "Essa locação não tem multa de atraso pendente.");

        if (locacao.FormaPagamentoMulta != null)
            return (false, "O pagamento da multa já foi registrado.");

        locacao.FormaPagamentoMulta = formaPagamento;
        locacao.DataPagamentoMulta = DateTime.Now;
        _context.SaveChanges();

        return (true, "Pagamento da multa registrado com sucesso.");
    }
    public (bool sucesso, string mensagem) IsentarMulta(int locacaoId)
    {
        var locacao = _context.Locacoes.Find(locacaoId);
        if (locacao == null)
            return (false, "Locação não encontrada.");

        if (locacao.MultaAtraso <= 0)
            return (false, "Essa locação não tem multa de atraso pra isentar.");

        if (locacao.FormaPagamentoMulta != null)
            return (false, "Essa multa já foi paga — não é possível isentar depois de paga.");

        locacao.MultaAtraso = 0;
        _context.SaveChanges();

        return (true, "Multa isentada com sucesso.");
    }

    public (bool sucesso, string mensagem, decimal multa) RegistrarDevolucao(int locacaoId)
    {
        var locacao = _context.Locacoes.Include(l => l.Itens).FirstOrDefault(l => l.Id == locacaoId);
        if (locacao == null)
            return (false, "Locação não encontrada.", 0);

        if (locacao.DataRetiradaReal == null)
            return (false, "Essa locação ainda não foi retirada — não é possível registrar devolução.", 0);

        if (locacao.DataDevolucaoReal != null)
            return (false, "A devolução dessa locação já foi registrada.", 0);

        var hoje = DateTime.Now.Date;
        decimal multa = 0;

        if (hoje > locacao.DataDevolucaoPrevista.Date)
        {
            int diasAtraso = (hoje - locacao.DataDevolucaoPrevista.Date).Days;
            multa = diasAtraso * 50 * locacao.Itens.Count;
        }

        locacao.DataDevolucaoReal = DateTime.Now;
        locacao.MultaAtraso = multa;

        _context.SaveChanges();

        var mensagem = multa > 0
            ? $"Devolução registrada. Multa por atraso: R$ {multa:F2}."
            : "Devolução registrada com sucesso.";

        return (true, mensagem, multa);
    }
    // marca uma locação como a "principal" de um evento — se já existia outra principal, ela é desmarcada
    private void DefinirLocacaoPrincipal(int eventoId, int novaLocacaoPrincipalId)
    {
        var evento = _context.Eventos.Find(eventoId);
        if (evento == null) return;

        if (evento.LocacaoPrincipalId.HasValue && evento.LocacaoPrincipalId.Value != novaLocacaoPrincipalId)
        {
            var principalAntiga = _context.Locacoes.Include(l => l.Itens)
                .FirstOrDefault(l => l.Id == evento.LocacaoPrincipalId.Value);

            if (principalAntiga != null)
            {
                decimal subtotalAntiga = principalAntiga.Itens.Sum(i => i.ValorItem);
                principalAntiga.DescontoEvento = 0;
                principalAntiga.ValorTotal = subtotalAntiga - principalAntiga.Desconto;
            }
        }

        evento.LocacaoPrincipalId = novaLocacaoPrincipalId;
        _context.SaveChanges();

        AtualizarDescontoDoEvento(eventoId);
    }

    // recalcula o desconto da locação principal, contando quantas OUTRAS locações
    // (padrinhos) estão vinculadas ao mesmo evento — não importa a ordem em que foram criadas
    private void AtualizarDescontoDoEvento(int eventoId)
    {
        var evento = _context.Eventos.Find(eventoId);
        if (evento == null || !evento.LocacaoPrincipalId.HasValue)
            return;

        var principal = _context.Locacoes.Include(l => l.Itens)
            .FirstOrDefault(l => l.Id == evento.LocacaoPrincipalId.Value);
        if (principal == null)
            return;

        int quantidadeVinculadas = _context.Locacoes.Count(l => l.EventoId == eventoId && l.Id != principal.Id);

        decimal subtotalPrincipal = principal.Itens.Sum(i => i.ValorItem);
        principal.DescontoEvento = quantidadeVinculadas * 10;
        principal.ValorTotal = subtotalPrincipal - principal.Desconto - principal.DescontoEvento;

        _context.SaveChanges();
    }
}