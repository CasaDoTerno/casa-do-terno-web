namespace CasaDoTerno.Domain.Entities;

public class Vale
{
    public int Id { get; set; }
    public int FuncionarioId { get; set; }
    public DateTime Data { get; set; }
    public decimal Valor { get; set; }
    public string? Motivo { get; set; }
}