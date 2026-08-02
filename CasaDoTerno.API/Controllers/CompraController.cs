using Microsoft.AspNetCore.Mvc;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Services;
using CasaDoTerno.Infrastructure.Data;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ComprasController : ControllerBase
{
    private readonly CasaDoTernoContext _context;
    private readonly CompraService _compraService;

    public ComprasController(CasaDoTernoContext context, CompraService compraService)
    {
        _context = context;
        _compraService = compraService;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Compras.Select(c => new
        {
            c.Id,
            c.FornecedorId,
            c.DataCompra,
            c.ValorTotal,
            c.FormaPagamento,
            c.Observacao,
            Itens = c.Itens
        }).ToList());
    }

    public class NovaCompraRequest
    {
        public int FornecedorId { get; set; }
        public FormaPagamento FormaPagamento { get; set; }
        public string? Observacao { get; set; }
        public int NumeroParcelas { get; set; } = 1;
        public List<CompraService.ItemCompraEntrada> Itens { get; set; } = new();
    }

    [HttpPost]
    public IActionResult Criar([FromBody] NovaCompraRequest request)
    {
        var (sucesso, mensagem, compra) = _compraService.CriarCompra(
            request.FornecedorId, request.FormaPagamento, request.Observacao,
            request.NumeroParcelas, request.Itens);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(compra);
    }
}