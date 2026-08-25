namespace CasaDoTerno.Domain.Entities;

public class Funcionario
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
    public string? Cargo { get; set; }
    public string? Telefone { get; set; }
    public string? Cpf { get; set; }
    public decimal SalarioBase { get; set; }
    public DateTime DataAdmissao { get; set; }
    public bool Ativo { get; set; } = true;
}