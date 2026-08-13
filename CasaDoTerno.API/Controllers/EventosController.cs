using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;

namespace CasaDoTerno.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EventosController : ControllerBase
{
    private readonly CasaDoTernoContext _context;

    public EventosController(CasaDoTernoContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Eventos.OrderByDescending(e => e.Data).ToList());
    }

    [HttpPost]
    public IActionResult Criar([FromBody] Evento evento)
    {
        _context.Eventos.Add(evento);
        _context.SaveChanges();
        return Ok(evento);
    }
    [HttpGet("{id}")]
    public IActionResult BuscarPorId(int id)
    {
        var evento = _context.Eventos.Find(id);
        if (evento == null)
            return NotFound();

        return Ok(evento);
    }
    [HttpPut("{id}")]
    public IActionResult Atualizar(int id, [FromBody] Evento eventoAtualizado)
    {
        var evento = _context.Eventos.Find(id);
        if (evento == null)
            return NotFound();

        evento.Tipo = eventoAtualizado.Tipo;
        evento.Nome = eventoAtualizado.Nome;
        evento.Data = eventoAtualizado.Data;
        evento.Observacao = eventoAtualizado.Observacao;

        _context.SaveChanges();
        return Ok(evento);
    }

}