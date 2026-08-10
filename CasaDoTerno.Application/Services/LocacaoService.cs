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
    public (bool sucesso, string mensagem, Locacao? locacao) AtualizarLocacao(
    int locacaoId, int clienteId, DateTime dataEvento, DateTime dataRetirada, DateTime dataDevolucaoPrevista,
    string? consultor, decimal desconto, decimal valorEntrada, FormaPagamento formaPagamentoEntrada,
    List<ItemLocacaoEntrada> itensEntrada)
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
                return (false, $"'{produto.Modelo}' não está disponível para locação.", null);

            int unidadesReservadas = (
                from itens in _context.ItensLocacao
                join loc in _context.Locacoes on itens.LocacaoId equals loc.Id
                where itens.ProdutoId == entrada.ProdutoId
                      && loc.Id != locacaoId
                      && loc.DataDevolucaoReal == null
                      && dataRetirada < loc.DataDevolucaoPrevista
                      && loc.DataRetirada < dataDevolucaoPrevista
                select itens
            ).Count();

            contagemNoPedido.TryGetValue(entrada.ProdutoId, out int jaNoPedido);
            int totalNecessario = unidadesReservadas + jaNoPedido + 1;

            if (totalNecessario > produto.Quantidade)
            {
                int disponivel = Math.Max(produto.Quantidade - unidadesReservadas - jaNoPedido, 0);
                return (false, $"'{produto.Modelo}' não tem unidades suficientes disponíveis nesse período (restam {disponivel}).", null);
            }

            contagemNoPedido[entrada.ProdutoId] = jaNoPedido + 1;

            var item = new ItemLocacao
            {
                ProdutoId = produto.Id,
                Ajustes = entrada.Ajustes,
                ValorItem = entrada.ValorItem ?? produto.ValorLocacao
            };

            locacao.Itens.Add(item);
            valorTotal += item.ValorItem;
        }

        locacao.ClienteId = clienteId;
        locacao.DataEvento = dataEvento;
        locacao.DataRetirada = dataRetirada;
        locacao.DataDevolucaoPrevista = dataDevolucaoPrevista;
        locacao.Consultor = consultor;
        locacao.Desconto = desconto;
        locacao.ValorEntrada = valorEntrada;
        locacao.FormaPagamentoEntrada = formaPagamentoEntrada;
        locacao.ValorTotal = valorTotal - desconto;

        _context.SaveChanges();

        return (true, "Locação atualizada com sucesso.", locacao);
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

        // pega todas as peças dessa locação
        var produtoIds = _context.ItensLocacao
            .Where(i => i.LocacaoId == locacaoId)
            .Select(i => i.ProdutoId)
            .ToList();

        // CHECAGEM FÍSICA: cada peça, na hora da retirada de verdade,
        // não pode estar atualmente "na rua" com outra locação
        foreach (var produtoId in produtoIds)
        {
            var produto = _context.Produtos.Find(produtoId);
            int capacidadeTotal = produto?.Quantidade ?? 1;

            // quantas unidades dessa peça estão fisicamente "na rua" agora, com OUTRAS locações
            int unidadesForaAgora = (
                from item in _context.ItensLocacao
                join loc in _context.Locacoes on item.LocacaoId equals loc.Id
                where item.ProdutoId == produtoId
                      && loc.Id != locacaoId
                      && loc.DataRetiradaReal != null
                      && loc.DataDevolucaoReal == null
                select item
            ).Count();

            // quantas unidades dessa peça a locação atual está tentando retirar (pode ter mais de uma igual)
            int unidadesNestaLocacao = _context.ItensLocacao
                .Count(i => i.LocacaoId == locacaoId && i.ProdutoId == produtoId);

            if (unidadesForaAgora + unidadesNestaLocacao > capacidadeTotal)
            {
                return (false, $"'{produto?.Modelo}' não tem unidades suficientes disponíveis pra retirada agora.");
            }
        }

        locacao.DataRetiradaReal = DateTime.Now;
        _context.SaveChanges();

        return (true, "Retirada registrada com sucesso.");
    }

    public (bool sucesso, string mensagem, Locacao? locacao) CriarLocacao(
    int clienteId, DateTime dataEvento, DateTime dataRetirada, DateTime dataDevolucaoPrevista,
    string? consultor, decimal desconto, decimal valorEntrada, FormaPagamento formaPagamentoEntrada,
    List<ItemLocacaoEntrada> itensEntrada)
    {
        if (itensEntrada == null || itensEntrada.Count == 0)
            return (false, "A locação precisa ter pelo menos uma peça.", null);

        var locacao = new Locacao
        {
            ClienteId = clienteId,
            DataEvento = dataEvento,
            DataRetirada = dataRetirada,
            DataDevolucaoPrevista = dataDevolucaoPrevista,
            Consultor = consultor,
            Desconto = desconto,
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
                return (false, $"'{produto.Modelo}' não está disponível para locação.", null);

            // quantas unidades dessa MESMA peça já estão reservadas por OUTRAS locações, no período pedido
            int unidadesReservadas = (
                from itens in _context.ItensLocacao
                join loc in _context.Locacoes on itens.LocacaoId equals loc.Id
                where itens.ProdutoId == entrada.ProdutoId
                      && loc.DataDevolucaoReal == null
                      && dataRetirada < loc.DataDevolucaoPrevista
                      && loc.DataRetirada < dataDevolucaoPrevista
                select itens
            ).Count();

            // quantas unidades dessa MESMA peça já foram colocadas nesse pedido atual (ex: 2 camisas iguais pra padrinhos diferentes)
            contagemNoPedido.TryGetValue(entrada.ProdutoId, out int jaNoPedido);

            int totalNecessario = unidadesReservadas + jaNoPedido + 1;

            if (totalNecessario > produto.Quantidade)
            {
                int disponivel = Math.Max(produto.Quantidade - unidadesReservadas - jaNoPedido, 0);
                return (false, $"'{produto.Modelo}' não tem unidades suficientes disponíveis nesse período (restam {disponivel}).", null);
            }

            contagemNoPedido[entrada.ProdutoId] = jaNoPedido + 1;

            var item = new ItemLocacao
            {
                ProdutoId = produto.Id,
                Ajustes = entrada.Ajustes,
                ValorItem = entrada.ValorItem ?? produto.ValorLocacao
            };

            locacao.Itens.Add(item);
            valorTotal += item.ValorItem;
        }

        locacao.ValorTotal = valorTotal - desconto;

        _context.Locacoes.Add(locacao);
        _context.SaveChanges();

        return (true, "Locação criada com sucesso.", locacao);
    }
}