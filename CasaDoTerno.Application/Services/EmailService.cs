using System.Net.Http.Json;
using System.Net.Http.Headers;

namespace CasaDoTerno.Application.Services;

public class EmailService
{
    private readonly string _apiKey;
    private readonly string _remetenteEmail;
    private readonly string _remetenteNome;
    private static readonly HttpClient _httpClient = new HttpClient();

    public EmailService(string apiKey, string remetenteEmail, string remetenteNome)
    {
        _apiKey = apiKey;
        _remetenteEmail = remetenteEmail;
        _remetenteNome = remetenteNome;
    }

    public void Enviar(string destinatario, string assunto, string corpoHtml)
    {
        var payload = new
        {
            sender = new { email = _remetenteEmail, name = _remetenteNome },
            to = new[] { new { email = destinatario } },
            subject = assunto,
            htmlContent = corpoHtml
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
        request.Headers.Add("api-key", _apiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Content = JsonContent.Create(payload);

        var resposta = _httpClient.Send(request);

        if (!resposta.IsSuccessStatusCode)
        {
            var corpoErro = resposta.Content.ReadAsStringAsync().Result;
            throw new Exception($"Falha ao enviar e-mail via Brevo ({resposta.StatusCode}): {corpoErro}");
        }
    }
}