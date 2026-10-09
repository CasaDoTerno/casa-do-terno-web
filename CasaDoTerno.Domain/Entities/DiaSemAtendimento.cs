namespace CasaDoTerno.Domain.Entities;

// Dias (ou períodos) em que a loja não atende: feriado, férias, ponto facultativo...
// Nesses dias o sistema não oferece horários de retirada.
public class DiaSemAtendimento
{
    public int Id { get; set; }

    // período inclusive. Um dia só: DataInicio == DataFim
    public DateTime DataInicio { get; set; }
    public DateTime DataFim { get; set; }

    public string Motivo { get; set; } = "Sem atendimento";

    public DateTime CriadoEm { get; set; }
    public string? CriadoPor { get; set; }
}