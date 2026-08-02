namespace CasaDoTerno.Domain.Entities;

public class Fornecedor
{
    public int Id { get; set; }
    public string Nome { get; set; }
    public string? Cnpj { get; set; }
    public string? Telefone { get; set; }
}