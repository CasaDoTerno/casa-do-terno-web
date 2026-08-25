using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasaDoTerno.Infrastructure.Data;

namespace CasaDoTerno.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AuditoriaController : ControllerBase
{
    private readonly CasaDoTernoContext _context;

    public AuditoriaController(CasaDoTernoContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult Listar(
        [FromQuery] string? entidade,
        [FromQuery] int? entidadeId,
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim)
    {
        var query = _context.LogsAuditoria.AsQueryable();

        if (!string.IsNullOrEmpty(entidade))
            query = query.Where(l => l.Entidade == entidade);

        if (entidadeId.HasValue)
            query = query.Where(l => l.EntidadeId == entidadeId.Value);

        if (dataInicio.HasValue)
            query = query.Where(l => l.DataHora >= dataInicio.Value.Date);

        if (dataFim.HasValue)
        {
            var fimAjustado = dataFim.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(l => l.DataHora <= fimAjustado);
        }

        var resultado = query.OrderByDescending(l => l.DataHora).Take(200).ToList();
        return Ok(resultado);
    }
}