using CasaDoTerno.Application.Services;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VendasController : ControllerBase
{
    private readonly CasaDoTernoContext _context;
    private readonly VendaService _vendaService;

    public VendasController(CasaDoTernoContext context, VendaService vendaService)
    {
        _context = context;
        _vendaService = vendaService;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Vendas.Select(v => new
        {
            v.Id,
            v.ClienteId,
            v.DataVenda,
            v.Desconto,
            v.ValorTotal,
            v.CriadoPor,
            v.EditadoPor,
            v.DataEdicao,
            Itens = v.Itens
            
        }).ToList());
    }

    public class NovaVendaRequest
    {
        public int ClienteId { get; set; }
        public decimal Desconto { get; set; }
        public string? Consultor { get; set; }
        public FormaPagamento FormaPagamento { get; set; }
        public int NumeroParcelas { get; set; } = 1;
        public List<VendaService.ItemVendaEntrada> Itens { get; set; } = new();
    }

    [HttpPost]
    [HttpPost]
    public IActionResult Criar([FromBody] NovaVendaRequest request)
    {
        var (sucesso, mensagem, venda) = _vendaService.CriarVenda(
            request.ClienteId, request.Desconto, request.Consultor,
            request.FormaPagamento, request.NumeroParcelas, request.Itens);

        if (!sucesso)
            return BadRequest(mensagem);

        venda!.CriadoPor = User.Identity?.Name;
        _context.SaveChanges();

        return Ok(venda);
    }

    [HttpGet("{id}")]
    public IActionResult BuscarPorId(int id)
    {
        var venda = _context.Vendas
            .Where(v => v.Id == id)
            .Select(v => new
            {
                v.Id,
                v.ClienteId,
                v.DataVenda,
                v.Desconto,
                v.ValorTotal,
                v.Consultor,
                v.FormaPagamento,
                v.CriadoPor,
                v.EditadoPor,
                v.DataEdicao,
                Itens = v.Itens
            })
            .FirstOrDefault();

        if (venda == null)
            return NotFound();

        return Ok(venda);
    }

    public class EditarVendaRequest
    {
        public int ClienteId { get; set; }
        public decimal Desconto { get; set; }
        public string? Consultor { get; set; }
        public List<VendaService.ItemVendaEntrada> Itens { get; set; } = new();
    }
    [HttpPut("{id}")]
    public IActionResult Atualizar(int id, [FromBody] EditarVendaRequest request)
    {
        var (sucesso, mensagem, venda) = _vendaService.AtualizarVenda(
            id, request.ClienteId, request.Desconto, request.Consultor, request.Itens);

        if (!sucesso)
            return BadRequest(mensagem);

        venda!.EditadoPor = User.Identity?.Name;
        venda.DataEdicao = DateTime.Now;
        _context.SaveChanges();

        return Ok(venda);
    }
}