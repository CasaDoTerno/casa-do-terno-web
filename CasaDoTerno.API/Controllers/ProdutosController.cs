using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;
using global::CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProdutosController : ControllerBase
{
    private readonly CasaDoTernoContext _context;

    public ProdutosController(CasaDoTernoContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Produtos.ToList());
    }

    [HttpGet("{id}")]
    public IActionResult BuscarPorId(int id)
    {
        var produto = _context.Produtos.Find(id);
        if (produto == null)
            return NotFound();

        return Ok(produto);
    }
    [HttpPost]
    public IActionResult Criar([FromBody] Produto terno)
    {
        _context.Produtos.Add(terno); 
        _context.SaveChanges();
        return Ok(terno);
    }
    [HttpGet("estoque-baixo")]
    public IActionResult EstoqueBaixo()
    {
        var produtos = _context.Produtos
            .Where(p => p.ControlaEstoque && p.Quantidade <= p.EstoqueMinimo)
            .ToList();

        return Ok(produtos);
    }

    [HttpPut("{id}")]
    public IActionResult Atualizar(int id, [FromBody] Produto produtoAtualizado)
    {
        var produto = _context.Produtos.Find(id);
        if (produto == null)
            return NotFound();

        produto.Modelo = produtoAtualizado.Modelo;
        produto.Categoria = produtoAtualizado.Categoria;
        produto.Tamanho = produtoAtualizado.Tamanho;
        produto.Cor = produtoAtualizado.Cor;
        produto.ValorVenda = produtoAtualizado.ValorVenda;
        produto.ValorLocacao = produtoAtualizado.ValorLocacao;
        produto.DisponivelParaVenda = produtoAtualizado.DisponivelParaVenda;
        produto.DisponivelParaLocacao = produtoAtualizado.DisponivelParaLocacao;

        _context.SaveChanges();
        return Ok(produto);
    }

    [HttpDelete("{id}")]
    public IActionResult Excluir(int id)
    {
        var produto = _context.Produtos.Find(id);
        if (produto == null)
            return NotFound();

        _context.Produtos.Remove(produto);
        _context.SaveChanges();
        return NoContent();
    }

}