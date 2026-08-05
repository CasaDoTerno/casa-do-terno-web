using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Services;
using CasaDoTerno.Infrastructure.Data;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocacoesController : ControllerBase
{
    private readonly CasaDoTernoContext _context;
    private readonly LocacaoService _locacaoService;

    public LocacoesController(CasaDoTernoContext context, LocacaoService locacaoService)
    {
        _context = context;
        _locacaoService = locacaoService;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Locacoes.Select(l => new
        {
            l.Id,
            l.ClienteId,
            l.DataReserva,
            l.DataEvento,
            l.DataRetirada,
            l.DataRetiradaReal,
            l.DataDevolucaoPrevista,
            l.DataDevolucaoReal,
            l.Consultor,
            l.Desconto,
            l.ValorTotal,
            l.ValorEntrada,
            l.FormaPagamentoEntrada,
            l.FormaPagamentoRestante,
            l.DataPagamentoRestante,
            l.ValorRestante,
            Itens = l.Itens
        }).ToList());
    }

    public class NovaLocacaoRequest
    {
        public int ClienteId { get; set; }
        public DateTime DataEvento { get; set; }
        public DateTime DataRetirada { get; set; }
        public DateTime DataDevolucaoPrevista { get; set; }
        public string? Consultor { get; set; }
        public decimal Desconto { get; set; }
        public decimal ValorEntrada { get; set; }
        public FormaPagamento FormaPagamentoEntrada { get; set; }
        public List<LocacaoService.ItemLocacaoEntrada> Itens { get; set; } = new();
    }

    [HttpPost]
    public IActionResult Criar([FromBody] NovaLocacaoRequest request)
    {
        var (sucesso, mensagem, locacao) = _locacaoService.CriarLocacao(
            request.ClienteId, request.DataEvento, request.DataRetirada, request.DataDevolucaoPrevista,
            request.Consultor, request.Desconto, request.ValorEntrada, request.FormaPagamentoEntrada,
            request.Itens);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(locacao);
    }
    [HttpGet("{id}")]
    public IActionResult BuscarPorId(int id)
    {
        var locacao = _context.Locacoes
            .Where(l => l.Id == id)
            .Select(l => new
            {
                l.Id,
                l.ClienteId,
                l.DataEvento,
                l.DataRetirada,
                l.DataDevolucaoPrevista,
                l.DataRetiradaReal,
                l.DataDevolucaoReal,
                l.Consultor,
                l.Desconto,
                l.ValorTotal,
                l.ValorEntrada,
                l.FormaPagamentoEntrada,
                Itens = l.Itens
            })
            .FirstOrDefault();

        if (locacao == null)
            return NotFound();

        return Ok(locacao);
    }

    public class EditarLocacaoRequest
    {
        public int ClienteId { get; set; }
        public DateTime DataEvento { get; set; }
        public DateTime DataRetirada { get; set; }
        public DateTime DataDevolucaoPrevista { get; set; }
        public string? Consultor { get; set; }
        public decimal Desconto { get; set; }
        public decimal ValorEntrada { get; set; }
        public FormaPagamento FormaPagamentoEntrada { get; set; }
        public List<LocacaoService.ItemLocacaoEntrada> Itens { get; set; } = new();
    }

    [HttpPut("{id}")]
    public IActionResult Atualizar(int id, [FromBody] EditarLocacaoRequest request)
    {
        var (sucesso, mensagem, locacao) = _locacaoService.AtualizarLocacao(
            id, request.ClienteId, request.DataEvento, request.DataRetirada, request.DataDevolucaoPrevista,
            request.Consultor, request.Desconto, request.ValorEntrada, request.FormaPagamentoEntrada,
            request.Itens);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(locacao);
    }

    public class RetiradaRequest
    {
        public FormaPagamento FormaPagamentoRestante { get; set; }
    }

    public class PagamentoRestanteRequest
    {
        public FormaPagamento FormaPagamento { get; set; }
    }

    [HttpPut("{id}/pagamento-restante")]
    public IActionResult RegistrarPagamentoRestante(int id, [FromBody] PagamentoRestanteRequest request)
    {
        var (sucesso, mensagem) = _locacaoService.RegistrarPagamentoRestante(id, request.FormaPagamento);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(mensagem);
    }

    [HttpPut("{id}/retirada")]
    public IActionResult RegistrarRetirada(int id)
    {
        var (sucesso, mensagem) = _locacaoService.RegistrarRetirada(id);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(mensagem);
    }



    [HttpPut("{id}/devolucao")]
    public IActionResult RegistrarDevolucao(int id)
    {
        var locacao = _context.Locacoes.Find(id);
        if (locacao == null)
            return NotFound("Locação não encontrada.");

        if (locacao.DataRetiradaReal == null)
            return BadRequest("Não é possível devolver uma locação que ainda não foi retirada.");

        if (locacao.DataDevolucaoReal != null)
            return BadRequest("A devolução dessa locação já foi registrada.");

        locacao.DataDevolucaoReal = DateTime.Now;
        _context.SaveChanges();

        return Ok(locacao);
    }
}