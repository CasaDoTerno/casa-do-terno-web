using CasaDoTerno.Domain.Entities;

namespace CasaDoTerno.Application.Services;

public class TotalPorFormaPagamento
{
    public FormaPagamento FormaPagamento { get; set; }
    public decimal Valor { get; set; }
}

public class FechamentoCaixaResultado
{
    public DateTime Data { get; set; }
    public List<TotalPorFormaPagamento> Entradas { get; set; } = new();
    public decimal TotalEntradas { get; set; }
    public List<TotalPorFormaPagamento> Saidas { get; set; } = new();
    public decimal TotalSaidas { get; set; }
    public decimal SaldoLiquido { get; set; }
}