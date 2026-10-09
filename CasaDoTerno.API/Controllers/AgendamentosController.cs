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

    // reservas feitas pelos clientes no link do Google que ainda não viraram locação
    [HttpGet("reservas-pendentes")]
    public async Task<IActionResult> ReservasPendentes()
    {
        await _sync.SincronizarAsync();

        var reservas = _agenda.ReservasSemLocacao();
        var clienteIds = reservas.Where(r => r.ClienteId.HasValue).Select(r => r.ClienteId!.Value).Distinct().ToList();
        var clientes = _context.Clientes.Where(c => clienteIds.Contains(c.Id)).ToDictionary(c => c.Id);

        return Ok(reservas.Select(r =>
        {
            clientes.TryGetValue(r.ClienteId ?? 0, out var cliente);
            return new
            {
                r.Id,
                Data = r.Inicio.ToString("yyyy-MM-dd"),
                Hora = r.Inicio.ToString("HH:mm"),
                ClienteId = r.ClienteId,
                Nome = cliente?.Nome ?? r.NomeExterno,
                Email = cliente?.Email ?? r.EmailExterno,
                Telefone = cliente?.Telefone ?? r.TelefoneExterno
            };
        }));
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
            DoLinkDoGoogle = agendamento.Origem == OrigemAgendamento.Google,
            agendamento.ObservacaoSync
        });
    }

    // consulta de agendamentos (tela "Agendamentos")
    [HttpGet]
    public IActionResult Listar([FromQuery] DateTime? de, [FromQuery] DateTime? ate, [FromQuery] bool incluirCancelados = false)
    {
        var inicio = (de ?? CasaDoTerno.Application.Utils.FusoHorario.HojeBrasilia()).Date;
        var fim = (ate ?? inicio.AddDays(30)).Date.AddDays(1);

        var consulta = _context.Agendamentos.Where(a => a.Inicio >= inicio && a.Inicio < fim);
        if (!incluirCancelados) consulta = consulta.Where(a => a.Status == StatusAgendamento.Ativo);

        var agendamentos = consulta.OrderBy(a => a.Inicio).ToList();

        var clienteIds = agendamentos.Where(a => a.ClienteId.HasValue).Select(a => a.ClienteId!.Value).Distinct().ToList();
        var clientes = _context.Clientes.Where(c => clienteIds.Contains(c.Id)).ToDictionary(c => c.Id);

        return Ok(agendamentos.Select(a =>
        {
            clientes.TryGetValue(a.ClienteId ?? 0, out var cliente);
            return new
            {
                a.Id,
                a.LocacaoId,
                a.Inicio,
                a.Fim,
                Cancelado = a.Status == StatusAgendamento.Cancelado,
                Origem = a.Origem == OrigemAgendamento.Google ? "google" : "sistema",
                Cliente = cliente?.Nome ?? a.NomeExterno ?? "(sem nome)",
                ClienteCadastrado = cliente != null,
                Telefone = cliente?.Telefone ?? a.TelefoneExterno,
                Email = cliente?.Email ?? a.EmailExterno,
                NoGoogle = a.GoogleEventId != null,
                a.ObservacaoSync
            };
        }));
    }

    // cancela só o agendamento (a locação, se existir, continua). Apaga o evento no Google.
    [HttpPost("{id}/cancelar")]
    public async Task<IActionResult> Cancelar(int id)
    {
        var agendamento = _context.Agendamentos.Find(id);
        if (agendamento == null) return NotFound();

        _agenda.Cancelar(id);
        await _sync.PublicarAsync(id);
        return Ok();
    }

    // força uma sincronização agora (botão "Atualizar agenda")
    [HttpPost("sincronizar")]
    public async Task<IActionResult> Sincronizar()
    {
        var resultado = await _sync.SincronizarAsync(forcar: true);
        return Ok(resultado);
    }
}