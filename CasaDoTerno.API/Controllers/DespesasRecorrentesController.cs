using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasaDoTerno.Infrastructure.Data;
using CasaDoTerno.Application.Services;

namespace CasaDoTerno.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class DespesasRecorrentesController : ControllerBase
{
    private readonly CasaDoTernoContext _context;
    private readonly DespesaRecorrenteService _service;

    public DespesasRecorrentesController(CasaDoTernoContext context, DespesaRecorrenteService service)
    {
        _context = context;
        _service = service;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.DespesasRecorrentes.OrderBy(d => d.DiaVencimento).ToList());
    }

    public class NovaDespesaRecorrenteRequest
    {
        public string Descricao { get; set; } = "";
        public decimal Valor { get; set; }
        public int DiaVencimento { get; set; }
    }

    [HttpPost]
    public IActionResult Criar([FromBody] NovaDespesaRecorrenteRequest request)
    {
        var recorrente = _service.CriarDespesaRecorrente(request.Descricao, request.Valor, request.DiaVencimento);
        return Ok(recorrente);
    }

    [HttpPut("{id}/desativar")]
    public IActionResult Desativar(int id)
    {
        var recorrente = _context.DespesasRecorrentes.Find(id);
        if (recorrente == null) return NotFound();

        recorrente.Ativa = false;
        _context.SaveChanges();
        return Ok(recorrente);
    }

    [HttpPost("gerar-do-mes")]
    public IActionResult GerarDoMes()
    {
        var geradas = _service.GerarOcorrenciasDoMes();
        return Ok(new { mensagem = $"{geradas} despesa(s) recorrente(s) gerada(s) este mês." });
    }
}