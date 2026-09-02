using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasaDoTerno.Infrastructure.Data;
using CasaDoTerno.Application.Services;

namespace CasaDoTerno.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class NotificacoesController : ControllerBase
{
    private readonly CasaDoTernoContext _context;
    private readonly EmailService _email;

    public NotificacoesController(CasaDoTernoContext context, EmailService email)
    {
        _context = context;
        _email = email;
    }

    [HttpPost("lembrete-retirada")]
    public IActionResult LembreteRetirada()
    {
        var amanha = DateTime.Now.Date.AddDays(1);

        var locacoes = _context.Locacoes
            .Where(l => l.DataRetirada.Date == amanha && l.DataRetiradaReal == null)
            .ToList();

        int enviados = 0, semEmail = 0;
        var detalhesErros = new List<string>();

        foreach (var locacao in locacoes)
        {
            var cliente = _context.Clientes.Find(locacao.ClienteId);
            if (cliente == null || string.IsNullOrWhiteSpace(cliente.Email))
            {
                semEmail++;
                continue;
            }

            try
            {
                var corpo = $@"
                <p>Olá, {cliente.Nome}!</p>
                <p>Passando pra lembrar que a retirada da sua locação na <strong>Casa do Terno</strong>
                está marcada para <strong>amanhã, {locacao.DataRetirada:dd/MM/yyyy}</strong>.</p>
                <p>Data prevista de devolução: <strong>{locacao.DataDevolucaoPrevista:dd/MM/yyyy}</strong>.</p>
                <p>Qualquer dúvida, é só nos chamar!</p>
            ";

                _email.Enviar(cliente.Email, "Lembrete: retirada amanhã — Casa do Terno", corpo);
                enviados++;
            }
            catch (Exception ex)
            {
                detalhesErros.Add($"{cliente.Nome} ({cliente.Email}): {ex.Message}");
            }
        }

        return Ok(new { enviados, semEmail, erros = detalhesErros.Count, total = locacoes.Count, detalhesErros });
    }

    [HttpPost("lembrete-devolucao")]
    public IActionResult LembreteDevolucao()
    {
        var amanha = DateTime.Now.Date.AddDays(1);

        var locacoes = _context.Locacoes
            .Where(l => l.DataDevolucaoPrevista.Date == amanha && l.DataDevolucaoReal == null)
            .ToList();

        int enviados = 0, semEmail = 0, erros = 0;

        foreach (var locacao in locacoes)
        {
            var cliente = _context.Clientes.Find(locacao.ClienteId);
            if (cliente == null || string.IsNullOrWhiteSpace(cliente.Email))
            {
                semEmail++;
                continue;
            }

            try
            {
                var corpo = $@"
                    <p>Olá, {cliente.Nome}!</p>
                    <p>Passando pra lembrar que a devolução da sua locação na <strong>Casa do Terno</strong>
                    está prevista para <strong>amanhã, {locacao.DataDevolucaoPrevista:dd/MM/yyyy}</strong>.</p>
                    <p>Lembrando que, conforme o contrato, atrasos na devolução geram multa de
                    R$ 50,00 por dia, por peça.</p>
                    <p>Qualquer dúvida, é só nos chamar!</p>
                ";

                _email.Enviar(cliente.Email, "Lembrete: devolução amanhã — Casa do Terno", corpo);
                enviados++;
            }
            catch
            {
                erros++;
            }
        }

        return Ok(new { enviados, semEmail, erros, total = locacoes.Count });
    }
}