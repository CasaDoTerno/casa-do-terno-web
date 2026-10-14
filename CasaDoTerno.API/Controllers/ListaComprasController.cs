using System.Text.RegularExpressions;
using CasaDoTerno.Application.Utils;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ListaComprasController : ControllerBase
{
    private readonly CasaDoTernoContext _context;

    public ListaComprasController(CasaDoTernoContext context)
    {
        _context = context;
    }

    private static readonly Regex FormatoMes = new(@"^\d{4}-(0[1-9]|1[0-2])$");

    // ---------------------------------------------------------------- categorias

    [HttpGet("categorias")]
    public IActionResult ListarCategorias()
    {
        // primeira vez: cria as categorias básicas
        if (!_context.CategoriasListaCompra.Any())
        {
            _context.CategoriasListaCompra.AddRange(
                new CategoriaListaCompra { Nome = "Camisa social" },
                new CategoriaListaCompra { Nome = "Calça de brim" },
                new CategoriaListaCompra { Nome = "Insumos (mercado e limpeza)" });
            _context.SaveChanges();
        }

        return Ok(_context.CategoriasListaCompra.OrderBy(c => c.Id).Select(c => new { c.Id, c.Nome }).ToList());
    }

    public class CategoriaRequest
    {
        public string Nome { get; set; } = "";
    }

    [HttpPost("categorias")]
    public IActionResult CriarCategoria([FromBody] CategoriaRequest request)
    {
        var nome = (request.Nome ?? "").Trim();
        if (nome.Length == 0) return BadRequest("Informe o nome da categoria.");
        if (nome.Length > 60) return BadRequest("Nome muito longo (máx. 60 letras).");

        if (_context.CategoriasListaCompra.Any(c => c.Nome.ToLower() == nome.ToLower()))
            return BadRequest("Já existe uma categoria com esse nome.");

        var categoria = new CategoriaListaCompra { Nome = nome };
        _context.CategoriasListaCompra.Add(categoria);
        _context.SaveChanges();
        return Ok(new { categoria.Id, categoria.Nome });
    }

    [HttpPut("categorias/{id}")]
    public IActionResult RenomearCategoria(int id, [FromBody] CategoriaRequest request)
    {
        var categoria = _context.CategoriasListaCompra.Find(id);
        if (categoria == null) return NotFound();

        var nome = (request.Nome ?? "").Trim();
        if (nome.Length == 0) return BadRequest("Informe o nome da categoria.");
        if (nome.Length > 60) return BadRequest("Nome muito longo (máx. 60 letras).");

        if (_context.CategoriasListaCompra.Any(c => c.Id != id && c.Nome.ToLower() == nome.ToLower()))
            return BadRequest("Já existe uma categoria com esse nome.");

        categoria.Nome = nome;
        _context.SaveChanges();
        return Ok(new { categoria.Id, categoria.Nome });
    }

    [HttpDelete("categorias/{id}")]
    public IActionResult RemoverCategoria(int id)
    {
        var categoria = _context.CategoriasListaCompra.Find(id);
        if (categoria == null) return NotFound();

        if (_context.ItensListaCompra.Any(i => i.CategoriaCompraId == id))
            return BadRequest("Essa categoria tem itens na lista. Remova ou mude os itens antes.");

        _context.CategoriasListaCompra.Remove(categoria);
        _context.SaveChanges();
        return Ok();
    }

    // ---------------------------------------------------------------- itens

    // itens do mês + os que ficaram pendentes de meses anteriores
    [HttpGet("itens")]
    public IActionResult ListarItens([FromQuery] string? mes)
    {
        var mesAtual = FusoHorario.HojeBrasilia().ToString("yyyy-MM");
        if (string.IsNullOrWhiteSpace(mes) || !FormatoMes.IsMatch(mes)) mes = mesAtual;

        var itens = _context.ItensListaCompra
            .Where(i => i.Mes == mes || !i.Comprado)
            .ToList()
            .Where(i => i.Mes == mes || string.CompareOrdinal(i.Mes, mes) < 0)
            .OrderBy(i => i.Comprado)
            .ThenBy(i => i.Descricao)
            .Select(i => new
            {
                i.Id,
                i.CategoriaCompraId,
                i.Descricao,
                i.Tamanho,
                i.Cor,
                i.Quantidade,
                i.ValorEstimado,
                i.Comprado,
                DataCompra = i.DataCompra?.ToString("yyyy-MM-dd"),
                i.Mes,
                i.ProdutoId,
                DeMesAnterior = i.Mes != mes
            })
            .ToList();

        return Ok(itens);
    }

    public class ItemRequest
    {
        public int CategoriaCompraId { get; set; }
        public string Descricao { get; set; } = "";
        public string? Tamanho { get; set; }
        public string? Cor { get; set; }
        public int Quantidade { get; set; } = 1;
        public decimal ValorEstimado { get; set; }
        public string? Mes { get; set; }
        public int? ProdutoId { get; set; }
    }

    private string? Validar(ItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Descricao)) return "Informe a descrição do item.";
        if (request.Descricao.Trim().Length > 120) return "Descrição muito longa (máx. 120 letras).";
        if (request.Quantidade < 1) return "A quantidade precisa ser pelo menos 1.";
        if (request.ValorEstimado < 0) return "O valor não pode ser negativo.";
        if (!_context.CategoriasListaCompra.Any(c => c.Id == request.CategoriaCompraId)) return "Categoria inválida.";
        return null;
    }

    [HttpPost("itens")]
    public IActionResult CriarItem([FromBody] ItemRequest request)
    {
        var erro = Validar(request);
        if (erro != null) return BadRequest(erro);

        var mes = request.Mes;
        if (string.IsNullOrWhiteSpace(mes) || !FormatoMes.IsMatch(mes))
            mes = FusoHorario.HojeBrasilia().ToString("yyyy-MM");

        var item = new ItemListaCompra
        {
            CategoriaCompraId = request.CategoriaCompraId,
            Descricao = request.Descricao.Trim(),
            Tamanho = string.IsNullOrWhiteSpace(request.Tamanho) ? null : request.Tamanho.Trim(),
            Cor = string.IsNullOrWhiteSpace(request.Cor) ? null : request.Cor.Trim(),
            Quantidade = request.Quantidade,
            ValorEstimado = request.ValorEstimado,
            Mes = mes,
            ProdutoId = request.ProdutoId,
            CriadoEm = FusoHorario.AgoraBrasilia(),
            CriadoPor = User.Identity?.Name
        };
        _context.ItensListaCompra.Add(item);
        _context.SaveChanges();
        return Ok(new { item.Id });
    }

    [HttpPut("itens/{id}")]
    public IActionResult AtualizarItem(int id, [FromBody] ItemRequest request)
    {
        var item = _context.ItensListaCompra.Find(id);
        if (item == null) return NotFound();

        var erro = Validar(request);
        if (erro != null) return BadRequest(erro);

        item.CategoriaCompraId = request.CategoriaCompraId;
        item.Descricao = request.Descricao.Trim();
        item.Tamanho = string.IsNullOrWhiteSpace(request.Tamanho) ? null : request.Tamanho.Trim();
        item.Cor = string.IsNullOrWhiteSpace(request.Cor) ? null : request.Cor.Trim();
        item.Quantidade = request.Quantidade;
        item.ValorEstimado = request.ValorEstimado;
        _context.SaveChanges();
        return Ok();
    }

    public class CompradoRequest
    {
        public bool Comprado { get; set; }
    }

    [HttpPut("itens/{id}/comprado")]
    public IActionResult MarcarComprado(int id, [FromBody] CompradoRequest request)
    {
        var item = _context.ItensListaCompra.Find(id);
        if (item == null) return NotFound();

        item.Comprado = request.Comprado;
        item.DataCompra = request.Comprado ? FusoHorario.HojeBrasilia().Date : null;
        _context.SaveChanges();
        return Ok();
    }

    [HttpDelete("itens/{id}")]
    public IActionResult RemoverItem(int id)
    {
        var item = _context.ItensListaCompra.Find(id);
        if (item == null) return NotFound();

        _context.ItensListaCompra.Remove(item);
        _context.SaveChanges();
        return Ok();
    }

    // ---------------------------------------------------------------- sugestões do estoque

    // produtos que controlam estoque e estão no mínimo (ou abaixo) e ainda não estão na lista
    [HttpGet("sugestoes")]
    public IActionResult Sugestoes()
    {
        bool admin = User.IsInRole("Admin");

        var jaNaLista = _context.ItensListaCompra
            .Where(i => !i.Comprado && i.ProdutoId != null)
            .Select(i => i.ProdutoId!.Value)
            .ToList();

        var sugestoes = _context.Produtos
            .Where(p => p.ControlaEstoque && p.Quantidade <= p.EstoqueMinimo)
            .ToList()
            .Where(p => !jaNaLista.Contains(p.Id))
            .OrderBy(p => p.Categoria)
            .ThenBy(p => p.Modelo)
            .Select(p => new
            {
                ProdutoId = p.Id,
                p.Modelo,
                p.Referencia,
                p.Cor,
                p.Tamanho,
                Categoria = (int)p.Categoria,
                p.Quantidade,
                p.EstoqueMinimo,
                Sugerido = Math.Max(p.EstoqueMinimo - p.Quantidade, 1),
                ValorCusto = admin ? p.ValorCusto : 0m
            })
            .ToList();

        return Ok(sugestoes);
    }
}