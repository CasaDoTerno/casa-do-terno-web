namespace CasaDoTerno.Domain.Entities;

public enum StatusAgendamento
{
    Ativo = 0,
    Cancelado = 1
}

public class Agendamento
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public int? LocacaoId { get; set; }

    // horário de Brasília (sem fuso), igual ao resto do sistema
    public DateTime Inicio { get; set; }
    public DateTime Fim { get; set; }

    public StatusAgendamento Status { get; set; } = StatusAgendamento.Ativo;

    // id do evento no Google Agenda (nulo enquanto não foi enviado)
    public string? GoogleEventId { get; set; }

    // true = o sistema mudou algo e o Google ainda não recebeu
    public bool PrecisaSincronizar { get; set; }

    // último aviso da sincronização (ex: "mudança recusada: horário lotado")
    public string? ObservacaoSync { get; set; }

    public DateTime CriadoEm { get; set; }
    public string? CriadoPor { get; set; }
}