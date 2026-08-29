namespace CasaDoTerno.Domain.Entities;

public class Cliente
{
    public int Id { get; set; }
    public string Nome { get; set; }
    public string Cpf { get; set; }
    public string Telefone { get; set; }
    public string? Endereco { get; set; }
    public string? Email { get; set; }

    // Medidas (em cm) — todas opcionais, preenchidas conforme o cliente vai sendo atendido
    public decimal? Ombro { get; set; }
    public decimal? Manga { get; set; }
    public decimal? Abdomen { get; set; }
    public decimal? Bainha { get; set; }
    public decimal? Cintura { get; set; }
    public decimal? Panturrilha { get; set; }
    public decimal? Coxa { get; set; }
}