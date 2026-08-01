namespace CasaDoTerno.Domain.Entities;

public class Venda
{
    public int Id { get; set; }
    public int ProdutoId { get; set; }
    public int ClienteId { get; set; }
    public DateTime DataVenda { get; set; } = DateTime.Now;
    public decimal ValorTotal { get; set; }
}