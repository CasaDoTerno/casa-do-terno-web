using Microsoft.AspNetCore.Mvc;
using CasaDoTerno.Application.Services;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RelatoriosController : ControllerBase
{
    private readonly RelatorioService _relatorioService;

    public RelatoriosController(RelatorioService relatorioService)
    {
        _relatorioService = relatorioService;
    }

    [HttpGet("fechamento-caixa")]
    public IActionResult FechamentoCaixa([FromQuery] DateTime? data)
    {
        var dataConsulta = data ?? DateTime.Today;
        var resultado = _relatorioService.FechamentoCaixa(dataConsulta);
        return Ok(resultado);
    }
}