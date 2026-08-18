using MailKit.Net.Smtp;
using MimeKit;
using System.Net.Mail;

namespace CasaDoTerno.Application.Services;

public class EmailService
{
    private readonly string _host;
    private readonly int _porta;
    private readonly string _usuario;
    private readonly string _senha;
    private readonly string _nomeExibicao;

    public EmailService(string host, int porta, string usuario, string senha, string nomeExibicao)
    {
        _host = host;
        _porta = porta;
        _usuario = usuario;
        _senha = senha;
        _nomeExibicao = nomeExibicao;
    }

    public void Enviar(string destinatario, string assunto, string corpoHtml)
    {
        var mensagem = new MimeMessage();
        mensagem.From.Add(new MailboxAddress(_nomeExibicao, _usuario));
        mensagem.To.Add(MailboxAddress.Parse(destinatario));
        mensagem.Subject = assunto;
        mensagem.Body = new TextPart("html") { Text = corpoHtml };

        using var cliente = new SmtpClient();
        cliente.Connect(_host, _porta, MailKit.Security.SecureSocketOptions.StartTls);
        cliente.Authenticate(_usuario, _senha);
        cliente.Send(mensagem);
        cliente.Disconnect(true);
    }
}