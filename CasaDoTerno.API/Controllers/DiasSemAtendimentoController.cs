using CasaDoTerno.Application.Utils;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DiasSemAtendimentoController : ControllerBase
{
    private readonly CasaDoTernoContext _context;

    public DiasSemAtendimentoController(CasaDoTernoContext context)
    {
        _context = context;
    }

    // por padrão só os que ainda não passaram
    [HttpGet]
    public IActionResult Listar([FromQuery] bool todos = false)
    {
        var hoje = FusoHorario.HojeBrasilia().Date;

        var consulta = _context.DiasSemAtendimento.AsQueryable();
        if (!todos) consulta = consulta.Where(d => d.DataFim >= hoje);

        var lista = consulta
            .OrderBy(d => d.DataInicio)
            .ToList()
            .Select(d => new
            {
                d.Id,
                DataInicio = d.DataInicio.ToString("yyyy-MM-dd"),
                DataFim = d.DataFim.ToString("yyyy-MM-dd"),
                d.Motivo
            });

        return Ok(lista);
    }

    public class NovoDiaSemAtendimentoRequest
    {
        public DateTime DataInicio { get; set; }
        public DateTime? DataFim { get; set; }   // vazio = só um dia
        public string? Motivo { get; set; }
    }

    [HttpPost]
    public IActionResult Criar([FromBody] NovoDiaSemAtendimentoRequest request)
    {
        var inicio = DateTime.SpecifyKind(request.DataInicio.Date, DateTimeKind.Unspecified);
        var fim = DateTime.SpecifyKind((request.DataFim ?? request.DataInicio).Date, DateTimeKind.Unspecified);

        if (fim < inicio)
            return BadRequest("A data final não pode ser antes da data inicial.");

        if ((fim - inicio).TotalDays > 370)
            return BadRequest("Período muito longo. Cadastre no máximo 1 ano por vez.");

        var motivo = string.IsNullOrWhiteSpace(request.Motivo) ? "Sem atendimento" : request.Motivo.Trim();
        if (motivo.Length > 120) motivo = motivo[..120];

        // já existe algo cobrindo esse período?
        bool jaExiste = _context.DiasSemAtendimento.Any(d => d.DataInicio <= inicio && d.DataFim >= fim);
        if (jaExiste)
            return BadRequest("Esse período já está cadastrado como sem atendimento.");

        var dia = new DiaSemAtendimento
        {
            DataInicio = inicio,
            DataFim = fim,
            Motivo = motivo,
            CriadoEm = FusoHorario.AgoraBrasilia(),
            CriadoPor = User.Identity?.Name
        };
        _context.DiasSemAtendimento.Add(dia);
        _context.SaveChanges();

        // agendamentos que já existiam nesse período NÃO são cancelados sozinhos: avisa pra o atendente resolver
        var fimDoDia = fim.AddDays(1);
        int afetados = _context.Agendamentos.Count(a =>
            a.Status == StatusAgendamento.Ativo && a.Inicio >= inicio && a.Inicio < fimDoDia);

        return Ok(new { dia.Id, AgendamentosNoPeriodo = afetados });
    }

    [HttpDelete("{id}")]
    public IActionResult Remover(int id)
    {
        var dia = _context.DiasSemAtendimento.Find(id);
        if (dia == null) return NotFound();

        _context.DiasSemAtendimento.Remove(dia);
        _context.SaveChanges();
        return Ok();
    }
}