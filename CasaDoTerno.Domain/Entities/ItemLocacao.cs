namespace CasaDoTerno.Domain.Entities;

public class ItemLocacao
{
    public int Id { get; set; }
    public int LocacaoId { get; set; }
    public int ProdutoId { get; set; }
    public decimal ValorItem { get; set; }
    public string? Ajustes { get; set; } // ex: "Manga -2cm, Bainha +1cm"
}