using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Services;
using CasaDoTerno.Infrastructure.Data;

namespace CasaDoTerno.API.Controllers;

[Authorize]
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
    [HttpPut("{id}/cancelar")]
    public IActionResult Cancelar(int id)
    {
        var (sucesso, mensagem) = _locacaoService.CancelarLocacao(id);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(new { mensagem });
    }

    [HttpGet]
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
            l.Pronta,
            l.DataCancelamento,
            l.CriadoPor,
            l.EditadoPor,
            l.DataEdicao,
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
        public int? EventoId { get; set; }
        public bool EhLocacaoPrincipalDoEvento { get; set; }
    }

    [HttpPost]
    public IActionResult Criar([FromBody] NovaLocacaoRequest request)
    {
        var (sucesso, mensagem, locacao) = _locacaoService.CriarLocacao(
            request.ClienteId, request.DataEvento, request.DataRetirada, request.DataDevolucaoPrevista,
            request.Consultor, request.Desconto, request.ValorEntrada, request.FormaPagamentoEntrada, request.EventoId, request.EhLocacaoPrincipalDoEvento,
            request.Itens);

        if (!sucesso)
            return BadRequest(mensagem);

        locacao!.CriadoPor = User.Identity?.Name;
        _context.SaveChanges();

        return Ok(locacao);
    }

    public class MarcarProntaRequest
    {
        public bool Pronta { get; set; }
    }

    [HttpPut("{id}/pronta")]
    public IActionResult MarcarPronta(int id, [FromBody] MarcarProntaRequest request)
    {
        var locacao = _context.Locacoes.Find(id);
        if (locacao == null) return NotFound();

        locacao.Pronta = request.Pronta;
        _context.SaveChanges();
        return Ok(locacao);
    }

    [HttpGet("verificar-disponibilidade")]
    public IActionResult VerificarDisponibilidade(
    [FromQuery] int produtoId,
    [FromQuery] DateTime dataRetirada,
    [FromQuery] DateTime dataDevolucaoPrevista,
    [FromQuery] int? locacaoIdExcluir,
    [FromQuery] int unidadesJaNoCarrinho = 0)
    {
        var (disponivel, mensagem, unidadesDisponiveis) = _locacaoService.VerificarDisponibilidade(
            produtoId, dataRetirada, dataDevolucaoPrevista, locacaoIdExcluir, unidadesJaNoCarrinho);

        return Ok(new { disponivel, mensagem, unidadesDisponiveis });
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
                l.CriadoPor,
                l.EditadoPor,
                l.DataEdicao,
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
        public int? EventoId { get; set; }
        public bool EhLocacaoPrincipalDoEvento { get; set; }
    }

    [HttpPut("{id}")]
    public IActionResult Atualizar(int id, [FromBody] EditarLocacaoRequest request)
    {
        var (sucesso, mensagem, locacao) = _locacaoService.AtualizarLocacao(
            id, request.ClienteId, request.DataEvento, request.DataRetirada, request.DataDevolucaoPrevista,
            request.Consultor, request.Desconto, request.ValorEntrada, request.FormaPagamentoEntrada, request.EventoId, request.EhLocacaoPrincipalDoEvento,
            request.Itens);

        if (!sucesso)
            return BadRequest(mensagem);
        locacao!.EditadoPor = User.Identity?.Name;
        locacao.DataEdicao = DateTime.Now;
        _context.SaveChanges();

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
    [HttpPut("{id}/isentar-multa")]
    public IActionResult IsentarMulta(int id)
    {
        var (sucesso, mensagem) = _locacaoService.IsentarMulta(id);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(new { mensagem });
    }


    [HttpPut("{id}/devolucao")]
    public IActionResult RegistrarDevolucao(int id)
    {
        var (sucesso, mensagem, multa) = _locacaoService.RegistrarDevolucao(id);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(new { mensagem, multa });
    }
    public class PagamentoMultaRequest
    {
        public FormaPagamento FormaPagamento { get; set; }
    }

    [HttpPut("{id}/pagamento-multa")]
    public IActionResult RegistrarPagamentoMulta(int id, [FromBody] PagamentoMultaRequest request)
    {
        var (sucesso, mensagem) = _locacaoService.RegistrarPagamentoMulta(id, request.FormaPagamento);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(new { mensagem });
    }
}