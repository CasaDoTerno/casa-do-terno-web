namespace CasaDoTerno.Domain.Entities;

public enum StatusAgendamento
{
    Ativo = 0,
    Cancelado = 1
}

public enum OrigemAgendamento
{
    Sistema = 0,   // criado pelo atendente na tela de locação
    Google = 1     // o cliente marcou pelo link de agendamento do Google Agenda
}

public class Agendamento
{
    public int Id { get; set; }

    // nulo enquanto a reserva do link do Google ainda não foi ligada a um cliente cadastrado
    public int? ClienteId { get; set; }
    public int? LocacaoId { get; set; }

    public OrigemAgendamento Origem { get; set; } = OrigemAgendamento.Sistema;

    // dados que o cliente digitou na página de agendamento do Google (reservas sem cadastro)
    public string? NomeExterno { get; set; }
    public string? EmailExterno { get; set; }
    public string? TelefoneExterno { get; set; }

    // horário de Brasília (sem fuso), igual ao resto do sistema
    public DateTime Inicio { get; set; }
    public DateTime Fim { get; set; }

    public StatusAgendamento Status { get; set; } = StatusAgendamento.Ativo;

    // id do evento no Google Agenda (nulo enquanto não foi enviado)
    public string? GoogleEventId { get; set; }

    // true = o sistema mudou algo e o Google ainda não recebeu
    public bool PrecisaSincronizar { get; set; }

    // último aviso da sincronização (ex: "cliente remarcou, mas a locação não pôde acompanhar")
    public string? ObservacaoSync { get; set; }

    public DateTime CriadoEm { get; set; }
    public string? CriadoPor { get; set; }
}