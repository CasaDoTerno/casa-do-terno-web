using CasaDoTerno.Application.Services;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDoTerno.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class ParcelasController : ControllerBase
{
    private readonly CasaDoTernoContext _context;
    private readonly ParcelaService _parcelaService;

    public ParcelasController(CasaDoTernoContext context, ParcelaService parcelaService)
    {
        _context = context;
        _parcelaService = parcelaService;
    }

    [HttpGet("em-aberto")]
    public IActionResult ListarEmAberto()
    {
        var parcelas = _context.Parcelas
            .Where(p => p.DataPagamento == null)
            .OrderBy(p => p.DataVencimento)
            .ToList();

        return Ok(parcelas);
    }

    [HttpGet("vencidas")]
    public IActionResult ListarVencidas()
    {
        var hoje = DateTime.Today;
        var parcelas = _context.Parcelas
            .Where(p => p.DataPagamento == null && p.DataVencimento < hoje)
            .OrderBy(p => p.DataVencimento)
            .ToList();

        return Ok(parcelas);
    }

    [HttpPut("{id}/pagamento")]
    public IActionResult RegistrarPagamento(int id)
    {
        var (sucesso, mensagem) = _parcelaService.RegistrarPagamentoParcela(id);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(mensagem);
    }
}