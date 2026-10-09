using CasaDoTerno.Application.Services;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AgendamentosController : ControllerBase
{
    private readonly CasaDoTernoContext _context;
    private readonly AgendaService _agenda;
    private readonly AgendaSincronizacao _sync;

    public AgendamentosController(CasaDoTernoContext context, AgendaService agenda, AgendaSincronizacao sync)
    {
        _context = context;
        _agenda = agenda;
        _sync = sync;
    }

    // horários do dia com as vagas que sobraram (alimenta a tela de locação)
    [HttpGet("horarios")]
    public async Task<IActionResult> Horarios([FromQuery] DateTime data, [FromQuery] int? agendamentoIdIgnorar)
    {
        // antes de responder, puxa o que foi mexido direto no Google Agenda
        await _sync.SincronizarAsync();

        var (aberto, mensagem, horarios) = _agenda.ListarHorarios(data, agendamentoIdIgnorar);
        return Ok(new { aberto, mensagem, horarios });
    }

    // o agendamento ativo de uma locação (a tela de edição usa pra mostrar a hora já marcada)
    [HttpGet("por-locacao/{locacaoId}")]
    public IActionResult PorLocacao(int locacaoId)
    {
        var agendamento = _agenda.PorLocacao(locacaoId);
        if (agendamento == null) return NotFound();

        return Ok(new
        {
            agendamento.Id,
            Data = agendamento.Inicio.ToString("yyyy-MM-dd"),
            Hora = agendamento.Inicio.ToString("HH:mm"),
            NoGoogle = agendamento.GoogleEventId != null,
            agendamento.ObservacaoSync
        });
    }

    // lista simples para consulta
    [HttpGet]
    public IActionResult Listar([FromQuery] DateTime? de, [FromQuery] DateTime? ate)
    {
        var inicio = (de ?? CasaDoTerno.Application.Utils.FusoHorario.HojeBrasilia()).Date;
        var fim = (ate ?? inicio.AddDays(30)).Date.AddDays(1);

        var lista = (
            from a in _context.Agendamentos
            join c in _context.Clientes on a.ClienteId equals c.Id
            where a.Status == StatusAgendamento.Ativo && a.Inicio >= inicio && a.Inicio < fim
            orderby a.Inicio
            select new
            {
                a.Id,
                a.LocacaoId,
                a.Inicio,
                a.Fim,
                Cliente = c.Nome,
                c.Telefone,
                c.Email,
                NoGoogle = a.GoogleEventId != null,
                a.ObservacaoSync
            }
        ).ToList();

        return Ok(lista);
    }

    // força uma sincronização agora (botão "Atualizar agenda")
    [HttpPost("sincronizar")]
    public async Task<IActionResult> Sincronizar()
    {
        var resultado = await _sync.SincronizarAsync(forcar: true);
        return Ok(resultado);
    }
}