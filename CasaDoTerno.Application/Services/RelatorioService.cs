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

}
