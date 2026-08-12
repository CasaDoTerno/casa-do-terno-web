using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Domain.Entities;

namespace CasaDoTerno.Application.Services;

public class RelatorioService
{
    private readonly ICasaDoTernoContext _context;

    public RelatorioService(ICasaDoTernoContext context)
    {
        _context = context;
    }
    public FechamentoCaixaResultado FechamentoCaixa(DateTime data)
    {
        var dataInicio = data.Date;
        var dataFim = dataInicio.AddDays(1);

        // ENTRADAS: parcelas de VENDA pagas nesse dia (inclui à vista, que já nasce paga)
        var entradasVenda = _context.Parcelas
            .Where(p => p.Origem == OrigemPagamento.Venda
                        && p.DataPagamento != null
                        && p.DataPagamento >= dataInicio && p.DataPagamento < dataFim)
            .Select(p => new { p.FormaPagamento, Valor = p.ValorParcela })
            .ToList();

        // ENTRADAS: entrada e restante de locações pagos nesse dia (modelo próprio, não usa Parcela)
        var entradasLocacao = _context.Locacoes
            .Where(l => l.DataPagamentoEntrada != null
                        && l.DataPagamentoEntrada >= dataInicio && l.DataPagamentoEntrada < dataFim)
            .Select(l => new { l.FormaPagamentoEntrada, Valor = l.ValorEntrada })
            .ToList();

        var restantesLocacao = _context.Locacoes
            .Where(l => l.DataPagamentoRestante != null
                        && l.DataPagamentoRestante >= dataInicio && l.DataPagamentoRestante < dataFim)
            .Select(l => new { l.FormaPagamentoRestante, Valor = l.ValorRestante })
            .ToList();

        var todasEntradas = new List<TotalPorFormaPagamento>();
        todasEntradas.AddRange(entradasVenda.Select(e => new TotalPorFormaPagamento { FormaPagamento = e.FormaPagamento, Valor = e.Valor }));
        todasEntradas.AddRange(entradasLocacao.Select(e => new TotalPorFormaPagamento { FormaPagamento = e.FormaPagamentoEntrada, Valor = e.Valor }));
        todasEntradas.AddRange(restantesLocacao.Select(e => new TotalPorFormaPagamento { FormaPagamento = e.FormaPagamentoRestante!.Value, Valor = e.Valor }));

        var entradasAgrupadas = todasEntradas
            .GroupBy(e => e.FormaPagamento)
            .Select(g => new TotalPorFormaPagamento { FormaPagamento = g.Key, Valor = g.Sum(x => x.Valor) })
            .ToList();

        // SAÍDAS: parcelas de COMPRA e de DESPESA pagas nesse dia
        var saidasAgrupadas = _context.Parcelas
            .Where(p => (p.Origem == OrigemPagamento.Compra || p.Origem == OrigemPagamento.Despesa)
                        && p.DataPagamento != null
                        && p.DataPagamento >= dataInicio && p.DataPagamento < dataFim)
            .GroupBy(p => p.FormaPagamento)
            .Select(g => new TotalPorFormaPagamento { FormaPagamento = g.Key, Valor = g.Sum(p => p.ValorParcela) })
            .ToList();

        var totalEntradas = entradasAgrupadas.Sum(e => e.Valor);
        var totalSaidas = saidasAgrupadas.Sum(s => s.Valor);

        return new FechamentoCaixaResultado
        {
            Data = dataInicio,
            Entradas = entradasAgrupadas,
            TotalEntradas = totalEntradas,
            Saidas = saidasAgrupadas,
            TotalSaidas = totalSaidas,
            SaldoLiquido = totalEntradas - totalSaidas
        };
    }
    public class ProdutoMovimentado
    {
        public int ProdutoId { get; set; }
        public string Modelo { get; set; } = "";
        public string? Referencia { get; set; }
        public int QuantidadeLocacoes { get; set; }
        public int QuantidadeVendida { get; set; }
        public int TotalMovimentacoes => QuantidadeLocacoes + QuantidadeVendida;
    }
    public List<ProdutoMovimentado> ProdutosMaisMovimentados(DateTime dataInicio, DateTime dataFim)
    {
        var fimAjustado = dataFim.Date.AddDays(1).AddTicks(-1);

        // quantas vezes cada produto foi alugado (cada linha de ItemLocacao = 1 vez)
        var locacoesPorProduto = (
            from item in _context.ItensLocacao
            join loc in _context.Locacoes on item.LocacaoId equals loc.Id
            where loc.DataEvento >= dataInicio.Date && loc.DataEvento <= fimAjustado
            group item by item.ProdutoId into g
            select new { ProdutoId = g.Key, Quantidade = g.Count() }
        ).ToList();

        // quantas unidades de cada produto foram vendidas (soma a Quantidade de cada ItemVenda)
        var vendasPorProduto = (
            from item in _context.ItensVenda
            join venda in _context.Vendas on item.VendaId equals venda.Id
            where venda.DataVenda >= dataInicio.Date && venda.DataVenda <= fimAjustado
            group item by item.ProdutoId into g
            select new { ProdutoId = g.Key, Quantidade = g.Sum(i => i.Quantidade) }
        ).ToList();

        var produtoIds = locacoesPorProduto.Select(l => l.ProdutoId)
            .Union(vendasPorProduto.Select(v => v.ProdutoId))
            .Distinct();

        var produtos = _context.Produtos.ToList();

        var resultado = produtoIds.Select(id =>
        {
            var produto = produtos.FirstOrDefault(p => p.Id == id);
            return new ProdutoMovimentado
            {
                ProdutoId = id,
                Modelo = produto?.Modelo ?? $"Produto #{id}",
                Referencia = produto?.Referencia,
                QuantidadeLocacoes = locacoesPorProduto.FirstOrDefault(l => l.ProdutoId == id)?.Quantidade ?? 0,
                QuantidadeVendida = vendasPorProduto.FirstOrDefault(v => v.ProdutoId == id)?.Quantidade ?? 0,
            };
        })
        .OrderByDescending(p => p.TotalMovimentacoes)
        .ToList();

        return resultado;
    }

}
