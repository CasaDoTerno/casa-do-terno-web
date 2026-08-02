using Microsoft.AspNetCore.Mvc;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Services;
using CasaDoTerno.Infrastructure.Data;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DespesasController : ControllerBase
{
    private readonly CasaDoTernoContext _context;
    private readonly DespesaService _despesaService;

    public DespesasController(CasaDoTernoContext context, DespesaService despesaService)
    {
        _context = context;
        _despesaService = despesaService;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Despesas.ToList());
    }

    public class NovaDespesaRequest
    {
        public string Descricao { get; set; }
        public string? Categoria { get; set; }
        public decimal Valor { get; set; }
        public string? Observacao { get; set; }
        public FormaPagamento FormaPagamento { get; set; }
        public int NumeroParcelas { get; set; } = 1;
    }

    [HttpPost]
    public IActionResult Criar([FromBody] NovaDespesaRequest request)
    {
        var despesa = _despesaService.CriarDespesa(
            request.Descricao, request.Categoria, request.Valor, request.Observacao,
            request.FormaPagamento, request.NumeroParcelas);

        return Ok(despesa);
    }
}