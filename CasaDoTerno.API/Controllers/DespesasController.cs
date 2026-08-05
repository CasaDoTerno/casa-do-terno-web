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
    [HttpGet("{id}")]
    public IActionResult BuscarPorId(int id)
    {
        var despesa = _context.Despesas.Find(id);
        if (despesa == null)
            return NotFound();

        return Ok(despesa);
    }

    public class EditarDespesaRequest
    {
        public string Descricao { get; set; }
        public string? Categoria { get; set; }
        public decimal Valor { get; set; }
        public string? Observacao { get; set; }
    }

    [HttpPut("{id}")]
    public IActionResult Atualizar(int id, [FromBody] EditarDespesaRequest request)
    {
        var despesa = _context.Despesas.Find(id);
        if (despesa == null)
            return NotFound();

        despesa.Descricao = request.Descricao;
        despesa.Categoria = request.Categoria;
        despesa.Valor = request.Valor;
        despesa.Observacao = request.Observacao;

        _context.SaveChanges();
        return Ok(despesa);
    }

    [HttpDelete("{id}")]
    public IActionResult Excluir(int id)
    {
        var despesa = _context.Despesas.Find(id);
        if (despesa == null)
            return NotFound();

        // remove também as parcelas geradas por essa despesa, pra não deixar "lixo" no banco
        var parcelasRelacionadas = _context.Parcelas
            .Where(p => p.Origem == OrigemPagamento.Despesa && p.OrigemId == id);
        _context.Parcelas.RemoveRange(parcelasRelacionadas);

        _context.Despesas.Remove(despesa);
        _context.SaveChanges();
        return NoContent();
    }



}