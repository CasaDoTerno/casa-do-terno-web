using System.Net;
using Google;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Google.Apis.Util;

namespace CasaDoTerno.Application.Services;

// única classe que conversa com o Google Agenda
public class GoogleAgendaClient
{
    private const string FusoGoogle = "America/Sao_Paulo";

    private readonly AgendaOpcoes _opcoes;
    private CalendarService? _servico;
    private readonly object _trava = new();

    public GoogleAgendaClient(AgendaOpcoes opcoes)
    {
        _opcoes = opcoes;
    }

    public bool Ativo => _opcoes.GoogleAtivo;

    private static readonly Lazy<TimeZoneInfo> _fuso = new(() =>
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo"); }
        catch { return TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time"); }
    });

    // horário de Brasília (sem fuso) -> formato do Google
    public static EventDateTime ParaGoogle(DateTime local)
    {
        var semFuso = DateTime.SpecifyKind(local, DateTimeKind.Unspecified);
        return new EventDateTime
        {
            DateTimeDateTimeOffset = new DateTimeOffset(semFuso, _fuso.Value.GetUtcOffset(semFuso)),
            TimeZone = FusoGoogle
        };
    }

    // formato do Google -> horário de Brasília (sem fuso). Nulo = evento de dia inteiro
    public static DateTime? ParaLocal(EventDateTime? data)
    {
        if (data?.DateTimeDateTimeOffset is not DateTimeOffset momento) return null;
        return TimeZoneInfo.ConvertTime(momento, _fuso.Value).DateTime;
    }

    private CalendarService Servico()
    {
        lock (_trava)
        {
            if (_servico == null)
            {
                var conta = CredentialFactory.FromJson<ServiceAccountCredential>(_opcoes.CredenciaisJson);
                var credencial = GoogleCredential.FromServiceAccountCredential(conta)
                    .CreateScoped(CalendarService.Scope.Calendar);

                _servico = new CalendarService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credencial,
                    ApplicationName = "CasaDoTerno"
                });
            }
            return _servico;
        }
    }

    public async Task<string> CriarAsync(Event evento)
    {
        var criado = await Servico().Events.Insert(evento, _opcoes.CalendarId).ExecuteAsync();
        return criado.Id;
    }

    public async Task AtualizarAsync(string eventoId, Event evento)
    {
        await Servico().Events.Patch(evento, _opcoes.CalendarId, eventoId).ExecuteAsync();
    }

    public async Task ExcluirAsync(string eventoId)
    {
        try
        {
            await Servico().Events.Delete(_opcoes.CalendarId, eventoId).ExecuteAsync();
        }
        catch (GoogleApiException ex) when (ex.HttpStatusCode == HttpStatusCode.NotFound || ex.HttpStatusCode == HttpStatusCode.Gone)
        {
            // já não existe: era o que queríamos
        }
    }

    // null = o evento não existe mais
    public async Task<Event?> ObterAsync(string eventoId)
    {
        try
        {
            return await Servico().Events.Get(_opcoes.CalendarId, eventoId).ExecuteAsync();
        }
        catch (GoogleApiException ex) when (ex.HttpStatusCode == HttpStatusCode.NotFound || ex.HttpStatusCode == HttpStatusCode.Gone)
        {
            return null;
        }
    }

    // eventos criados pelo sistema a partir de "desde" (inclui os apagados)
    public async Task<List<Event>> ListarAsync(DateTime desde)
    {
        var resultado = new List<Event>();
        string? pagina = null;
        var semFuso = DateTime.SpecifyKind(desde, DateTimeKind.Unspecified);

        do
        {
            var pedido = Servico().Events.List(_opcoes.CalendarId);
            pedido.TimeMinDateTimeOffset = new DateTimeOffset(semFuso, _fuso.Value.GetUtcOffset(semFuso));
            pedido.ShowDeleted = true;
            pedido.SingleEvents = true;
            pedido.MaxResults = 250;
            pedido.PrivateExtendedProperty = new Repeatable<string>(new[] { "origem=casadoterno" });
            pedido.PageToken = pagina;

            var resposta = await pedido.ExecuteAsync();
            if (resposta.Items != null) resultado.AddRange(resposta.Items);
            pagina = resposta.NextPageToken;
        } while (!string.IsNullOrEmpty(pagina));

        return resultado;
    }
}