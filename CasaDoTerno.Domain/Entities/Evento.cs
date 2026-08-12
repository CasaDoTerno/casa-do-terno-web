namespace CasaDoTerno.Domain.Entities;

public enum TipoEvento
{
    Casamento,
    Formatura,
    Aniversario
}

public class Evento
{
    public int Id { get; set; }
    public TipoEvento Tipo { get; set; }
    public string Nome { get; set; } = "";
    public DateTime Data { get; set; }
    public string? Observacao { get; set; }
}