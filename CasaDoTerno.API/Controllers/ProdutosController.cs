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
    public class ProdutoImportado
    {
        public string Modelo { get; set; }
        public int Categoria { get; set; }
        public string Tamanho { get; set; }
        public string Cor { get; set; }
        public string? Referencia { get; set; }
        public decimal ValorCusto { get; set; }
        public decimal ValorVenda { get; set; }
        public decimal ValorLocacao { get; set; }
        public bool ControlaEstoque { get; set; }
        public int Quantidade { get; set; }
        public int EstoqueMinimo { get; set; }
        public string? Observacao { get; set; }
        public bool DisponivelParaVenda { get; set; }
        public bool DisponivelParaLocacao { get; set; }
    }

    public class ImportarProdutosRequest
    {
        public List<ProdutoImportado> Produtos { get; set; } = new();
    }

    [HttpPost("importar")]
    public IActionResult Importar([FromBody] ImportarProdutosRequest request)
    {
        if (request.Produtos == null || request.Produtos.Count == 0)
            return BadRequest("Nenhum produto para importar.");

        var produtos = request.Produtos.Select(p => new Produto
        {
            Modelo = p.Modelo,
            Categoria = (CategoriaProduto)p.Categoria,
            Tamanho = p.Tamanho,
            Cor = p.Cor,
            Referencia = p.Referencia,
            ValorCusto = p.ValorCusto,
            ValorVenda = p.ValorVenda,
            ValorLocacao = p.ValorLocacao,
            ControlaEstoque = p.ControlaEstoque,
            Quantidade = p.Quantidade,
            EstoqueMinimo = p.EstoqueMinimo,
            Observacao = p.Observacao,
            DisponivelParaVenda = p.DisponivelParaVenda,
            DisponivelParaLocacao = p.DisponivelParaLocacao,
        }).ToList();

        _context.Produtos.AddRange(produtos);
        _context.SaveChanges();

        return Ok(new { importados = produtos.Count });
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
        produto.ValorCusto = produtoAtualizado.ValorCusto;
        produto.DisponivelParaVenda = produtoAtualizado.DisponivelParaVenda;
        produto.DisponivelParaLocacao = produtoAtualizado.DisponivelParaLocacao;
        produto.Referencia = produtoAtualizado.Referencia;
        produto.ControlaEstoque = produtoAtualizado.ControlaEstoque;
        produto.Quantidade = produtoAtualizado.Quantidade;
        produto.EstoqueMinimo = produtoAtualizado.EstoqueMinimo;
        produto.Observacao = produtoAtualizado.Observacao;

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