using CasaDoTerno.Application.Services;
using CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        return Ok(_context.Locacoes.ToList());
    }

    public class NovaLocacaoRequest
    {
        public int ProdutoId { get; set; }
        public int ClienteId { get; set; }
        public DateTime DataRetirada { get; set; }
        public DateTime DataDevolucaoPrevista { get; set; }


    }
    
    [HttpPost]
    public IActionResult Criar([FromBody] NovaLocacaoRequest request)
    {
        var (sucesso, mensagem, locacao) = _locacaoService.CriarLocacao(
            request.ProdutoId, request.ClienteId, request.DataRetirada, request.DataDevolucaoPrevista);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(locacao);
    }
    
    [HttpPut("{id}/devolucao")]
    public IActionResult RegistrarDevolucao(int id)
    {
        var locacao = _context.Locacoes.Find(id);
        if (locacao == null)
            return NotFound("Locação não encontrada.");

        if (locacao.DataDevolucaoReal != null)
            return BadRequest("A devolução dessa locação já foi registrada.");

        locacao.DataDevolucaoReal = DateTime.Now;
        _context.SaveChanges();

        return Ok(locacao);
    }

}