using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Interfaces;

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

        // pega todas as peças dessa locação
        var produtoIds = _context.ItensLocacao
            .Where(i => i.LocacaoId == locacaoId)
            .Select(i => i.ProdutoId)
            .ToList();

        // CHECAGEM FÍSICA: cada peça, na hora da retirada de verdade,
        // não pode estar atualmente "na rua" com outra locação
        foreach (var produtoId in produtoIds)
        {
            bool emPosseDeOutraLocacao = (
                from item in _context.ItensLocacao
                join loc in _context.Locacoes on item.LocacaoId equals loc.Id
                where item.ProdutoId == produtoId
                      && loc.Id != locacaoId
                      && loc.DataRetiradaReal != null
                      && loc.DataDevolucaoReal == null
                select item
            ).Any();

            if (emPosseDeOutraLocacao)
            {
                var produto = _context.Produtos.Find(produtoId);
                return (false, $"'{produto?.Modelo}' ainda está com outro cliente (aguardando devolução). Não é possível retirar agora.");
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

        foreach (var entrada in itensEntrada)
        {
            var produto = _context.Produtos.Find(entrada.ProdutoId);
            if (produto == null)
                return (false, $"Produto {entrada.ProdutoId} não encontrado.", null);

            if (!produto.DisponivelParaLocacao)
                return (false, $"'{produto.Modelo}' não está disponível para locação.", null);

            bool temConflito = (
                from itens in _context.ItensLocacao
                join loc in _context.Locacoes on itens.LocacaoId equals loc.Id
                where itens.ProdutoId == entrada.ProdutoId
                      && loc.DataDevolucaoReal == null
                      && dataRetirada < loc.DataDevolucaoPrevista
                      && loc.DataRetirada < dataDevolucaoPrevista
                select itens
            ).Any();

            if (temConflito)
                return (false, $"'{produto.Modelo}' já está reservado nesse período.", null);

            var item = new ItemLocacao
            {
                ProdutoId = produto.Id,
                Ajustes = entrada.Ajustes,
                ValorItem = produto.ValorLocacao
            };

            locacao.Itens.Add(item);
            valorTotal += item.ValorItem;
        } // ← o foreach fecha AQUI

        locacao.ValorTotal = valorTotal - desconto;

        _context.Locacoes.Add(locacao);
        _context.SaveChanges();

        return (true, "Locação criada com sucesso.", locacao);
    }
}