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

    public List<ItemVenda> Itens { get; set; } = new();
}   