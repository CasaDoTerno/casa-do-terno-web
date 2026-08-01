using Microsoft.AspNetCore.Mvc;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VendasController : ControllerBase
{
    private readonly CasaDoTernoContext _context;

    public VendasController(CasaDoTernoContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Vendas.ToList());
    }

    public class NovaVendaRequest
    {
        public int ProdutoId { get; set; }
        public int ClienteId { get; set; }
    }

    [HttpPost]
    public IActionResult Criar([FromBody] NovaVendaRequest request)
    {
        var produto = _context.Produtos.Find(request.ProdutoId);
        if (produto == null)
            return NotFound("Produto não encontrado.");

        if (!produto.DisponivelParaVenda)
            return BadRequest("Este produto não está disponível para venda.");

        var venda = new Venda
        {
            ProdutoId = request.ProdutoId,
            ClienteId = request.ClienteId,
            ValorTotal = produto.ValorVenda
        };

        _context.Vendas.Add(venda);

        // já que foi vendido, marca o produto como indisponível
        produto.DisponivelParaVenda = false;
        produto.DisponivelParaLocacao = false;

        _context.SaveChanges();

        return Ok(venda);
    }
}