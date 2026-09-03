using CasaDoTerno.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDoTerno.API.Controllers;

[Authorize(Roles = "Admin")]
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
    [HttpGet("produtos-mais-movimentados")]
    public IActionResult ProdutosMaisMovimentados([FromQuery] DateTime dataInicio, [FromQuery] DateTime dataFim)
    {
        var resultado = _relatorioService.ProdutosMaisMovimentados(dataInicio, dataFim);
        return Ok(resultado);
    }
    [HttpGet("entradas-por-dia")]
    public IActionResult EntradasPorDia([FromQuery] DateTime dataInicio, [FromQuery] DateTime dataFim)
    {
        var resultado = _relatorioService.EntradasPorDia(dataInicio, dataFim);
        return Ok(resultado);
    }
    [HttpGet("pagamentos-por-tipo")]
    public IActionResult PagamentosPorTipo([FromQuery] DateTime dataInicio, [FromQuery] DateTime dataFim)
    {
        var resultado = _relatorioService.PagamentosPorTipo(dataInicio, dataFim);
        return Ok(resultado);
    }
}