namespace CasaDoTerno.Domain.Entities;

public class LogAuditoria
{
    public int Id { get; set; }
    public string Usuario { get; set; } = "";
    public string Acao { get; set; } = "";
    public string Entidade { get; set; } = "";
    public int EntidadeId { get; set; }
    public string? Detalhes { get; set; }
    public DateTime DataHora { get; set; } = DateTime.Now;
}