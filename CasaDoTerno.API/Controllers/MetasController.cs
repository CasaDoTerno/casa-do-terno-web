using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;

namespace CasaDoTerno.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MetasController : ControllerBase
{
    private readonly CasaDoTernoContext _context;

    public MetasController(CasaDoTernoContext context)
    {
        _context = context;
    }

    [HttpGet("atual")]
    public IActionResult MetaAtual()
    {
        var hoje = DateTime.Now;
        var meta = _context.MetasMensais.FirstOrDefault(m => m.Ano == hoje.Year && m.Mes == hoje.Month);

        if (meta == null)
        {
            meta = new MetaMensal { Ano = hoje.Year, Mes = hoje.Month, Valor = 0 };
            _context.MetasMensais.Add(meta);
            _context.SaveChanges();
        }

        return Ok(meta);
    }

    public class DefinirMetaRequest
    {
        public decimal Valor { get; set; }
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("atual")]
    public IActionResult DefinirMetaAtual([FromBody] DefinirMetaRequest request)
    {
        var hoje = DateTime.Now;
        var meta = _context.MetasMensais.FirstOrDefault(m => m.Ano == hoje.Year && m.Mes == hoje.Month);

        if (meta == null)
        {
            meta = new MetaMensal { Ano = hoje.Year, Mes = hoje.Month, Valor = request.Valor };
            _context.MetasMensais.Add(meta);
        }
        else
        {
            meta.Valor = request.Valor;
        }

        _context.SaveChanges();
        return Ok(meta);
    }
}