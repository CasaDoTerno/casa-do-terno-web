namespace CasaDoTerno.Domain.Entities;

public class Compra
{
    public int Id { get; set; }
    public int FornecedorId { get; set; }
    public DateTime DataCompra { get; set; } = DateTime.Now;
    public decimal ValorTotal { get; set; }
    public FormaPagamento FormaPagamento { get; set; }
    public string? Observacao { get; set; }
    public string? CriadoPor { get; set; }
    public string? EditadoPor { get; set; }
    public DateTime? DataEdicao { get; set; }

    public List<ItemCompra> Itens { get; set; } = new();
}