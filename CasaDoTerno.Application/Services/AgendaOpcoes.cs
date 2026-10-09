namespace CasaDoTerno.Application.Services;

// lida da seção "Agenda" do appsettings / variáveis de ambiente (Agenda__CalendarId etc.)
public class AgendaOpcoes
{
    // id da agenda do Google (em Configurações da agenda > Integrar agenda)
    public string CalendarId { get; set; } = "";

    // conteúdo do arquivo .json da conta de serviço, em uma linha só
    public string CredenciaisJson { get; set; } = "";

    public string HoraAbertura { get; set; } = "09:00";
    public string HoraFechamento { get; set; } = "18:00";
    public int DuracaoMinutos { get; set; } = 30;
    public int VagasPorHorario { get; set; } = 2;

    // 0 = domingo ... 6 = sábado. Vazio = segunda a sábado.
    public int[] DiasFuncionamento { get; set; } = Array.Empty<int>();

    public int[] DiasEfetivos => DiasFuncionamento.Length == 0 ? new[] { 1, 2, 3, 4, 5, 6 } : DiasFuncionamento;

    // true = o sistema importa as reservas feitas pelos clientes na página de agendamento do Google
    public bool ImportarReservas { get; set; } = true;

    // opcional: só importa eventos cujo título contenha este texto (ex: "Retirada"). Vazio = qualquer evento com convidado.
    public string TituloReserva { get; set; } = "";

    // sem CalendarId/credenciais o sistema continua controlando os horários, só não fala com o Google
    public bool GoogleAtivo =>
        !string.IsNullOrWhiteSpace(CalendarId) && !string.IsNullOrWhiteSpace(CredenciaisJson);
}