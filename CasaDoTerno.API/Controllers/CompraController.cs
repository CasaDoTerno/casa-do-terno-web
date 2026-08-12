using CasaDoTerno.Application.Services;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDoTerno.API.Controllers;

[Authorize(Roles = "Admin")]
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
            c.CriadoPor,
            c.EditadoPor,
            c.DataEdicao,
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
    [HttpGet("{id}")]
    public IActionResult BuscarPorId(int id)
    {
        var compra = _context.Compras
            .Where(c => c.Id == id)
            .Select(c => new
            {
                c.Id,
                c.FornecedorId,
                c.DataCompra,
                c.ValorTotal,
                c.FormaPagamento,
                c.Observacao,
                c.CriadoPor,
                c.EditadoPor,
                c.DataEdicao,
                Itens = c.Itens
            })
            .FirstOrDefault();

        if (compra == null)
            return NotFound();

        return Ok(compra);
    }

    public class EditarCompraRequest
    {
        public int FornecedorId { get; set; }
        public FormaPagamento FormaPagamento { get; set; }
        public string? Observacao { get; set; }
        public List<CompraService.ItemCompraEntrada> Itens { get; set; } = new();
    }

    [HttpPut("{id}")]
    public IActionResult Atualizar(int id, [FromBody] EditarCompraRequest request)
    {
        var (sucesso, mensagem, compra) = _compraService.AtualizarCompra(
            id, request.FornecedorId, request.FormaPagamento, request.Observacao, request.Itens);

        if (!sucesso)
            return BadRequest(mensagem);

        compra!.EditadoPor = User.Identity?.Name;
        compra.DataEdicao = DateTime.Now;
        _context.SaveChanges();

        return Ok(compra);
    }

    [HttpPost]
    public IActionResult Criar([FromBody] NovaCompraRequest request)
    {
        var (sucesso, mensagem, compra) = _compraService.CriarCompra(
            request.FornecedorId, request.FormaPagamento, request.Observacao,
            request.NumeroParcelas, request.Itens);

        if (!sucesso)
            return BadRequest(mensagem);

        compra!.CriadoPor = User.Identity?.Name;
        _context.SaveChanges();

        return Ok(compra);
    }
}