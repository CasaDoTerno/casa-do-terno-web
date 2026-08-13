using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;

namespace CasaDoTerno.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class PerfisController : ControllerBase
{
    private readonly CasaDoTernoContext _context;

    public PerfisController(CasaDoTernoContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Perfis.ToList());
    }

    [HttpGet("{id}")]
    public IActionResult BuscarPorId(int id)
    {
        var perfil = _context.Perfis.Find(id);
        if (perfil == null) return NotFound();
        return Ok(perfil);
    }

    [HttpPost]
    public IActionResult Criar([FromBody] Perfil perfil)
    {
        _context.Perfis.Add(perfil);
        _context.SaveChanges();
        return Ok(perfil);
    }

    [HttpPut("{id}")]
    public IActionResult Atualizar(int id, [FromBody] Perfil perfilAtualizado)
    {
        var perfil = _context.Perfis.Find(id);
        if (perfil == null) return NotFound();

        perfil.Nome = perfilAtualizado.Nome;
        perfil.ModulosPermitidos = perfilAtualizado.ModulosPermitidos;

        _context.SaveChanges();
        return Ok(perfil);
    }
}