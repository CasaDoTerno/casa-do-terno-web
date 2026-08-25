

namespace CasaDoTerno.Domain.Entities;

public class Falta
{
    public int Id { get; set; }
    public int FuncionarioId { get; set; }
    public DateTime Data { get; set; }
    public string? Motivo { get; set; }
    public bool Abonada { get; set; }
}