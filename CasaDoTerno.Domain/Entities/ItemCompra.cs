namespace CasaDoTerno.Domain.Entities;

public class ItemCompra
{
    public int Id { get; set; }
    public int CompraId { get; set; }
    public int ProdutoId { get; set; }
    public int Quantidade { get; set; }
    public decimal ValorUnitario { get; set; }
    public decimal ValorTotal => Quantidade * ValorUnitario;
}