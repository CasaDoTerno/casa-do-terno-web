namespace CasaDoTerno.Domain.Entities;

public class Venda
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public DateTime DataVenda { get; set; } = DateTime.Now;
    public decimal Desconto { get; set; }
    public decimal ValorTotal { get; set; }
    public string? Consultor { get; set; }
    public FormaPagamento FormaPagamento { get; set; }
    public string? CriadoPor { get; set; }
    public string? EditadoPor { get; set; }
    public DateTime? DataEdicao { get; set; }
    public bool PrecisaAjuste { get; set; }
    public DateTime? DataRetiradaAjuste { get; set; }
    public bool PagamentoPendente { get; set; }
    public DateTime? DataPagamentoRealizado { get; set; }
    public int NumeroParcelasPendente { get; set; } = 1;
    public DateTime? DataRetiradaRealizada { get; set; }
    public List<ItemVenda> Itens { get; set; } = new();
}   