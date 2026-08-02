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
    public IActionResult Criar([FromBody] NovaVendaRequest request)
    {
        var (sucesso, mensagem, venda) = _vendaService.CriarVenda(
            request.ClienteId, request.Desconto, request.Consultor,
            request.FormaPagamento, request.NumeroParcelas, request.Itens);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(venda);
    }
}