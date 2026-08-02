namespace CasaDoTerno.Domain.Entities;

public enum OrigemPagamento
{
    Venda,
    Compra,
    Despesa
}

public class Parcela
{
    public int Id { get; set; }
    public OrigemPagamento Origem { get; set; }
    public int OrigemId { get; set; }
    public int NumeroParcela { get; set; }
    public decimal ValorParcela { get; set; }
    public FormaPagamento FormaPagamento { get; set; }
    public DateTime DataVencimento { get; set; }
    public DateTime? DataPagamento { get; set; }

    public bool Paga => DataPagamento != null;
}