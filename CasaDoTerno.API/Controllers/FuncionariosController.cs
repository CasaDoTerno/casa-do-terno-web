using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;
using CasaDoTerno.Application.Services;

namespace CasaDoTerno.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class FuncionariosController : ControllerBase
{
    private readonly CasaDoTernoContext _context;
    private readonly FuncionarioService _funcionarioService;

    public FuncionariosController(CasaDoTernoContext context, FuncionarioService funcionarioService)
    {
        _context = context;
        _funcionarioService = funcionarioService;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Funcionarios.OrderBy(f => f.Nome).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult BuscarPorId(int id)
    {
        var funcionario = _context.Funcionarios.Find(id);
        if (funcionario == null) return NotFound();
        return Ok(funcionario);
    }

    [HttpPost]
    public IActionResult Criar([FromBody] Funcionario funcionario)
    {
        _context.Funcionarios.Add(funcionario);
        _context.SaveChanges();
        return Ok(funcionario);
    }

    [HttpPut("{id}")]
    public IActionResult Atualizar(int id, [FromBody] Funcionario funcionarioAtualizado)
    {
        var funcionario = _context.Funcionarios.Find(id);
        if (funcionario == null) return NotFound();

        funcionario.Nome = funcionarioAtualizado.Nome;
        funcionario.Cargo = funcionarioAtualizado.Cargo;
        funcionario.Telefone = funcionarioAtualizado.Telefone;
        funcionario.Cpf = funcionarioAtualizado.Cpf;
        funcionario.SalarioBase = funcionarioAtualizado.SalarioBase;
        funcionario.DataAdmissao = funcionarioAtualizado.DataAdmissao;

        _context.SaveChanges();
        return Ok(funcionario);
    }

    [HttpPut("{id}/desativar")]
    public IActionResult Desativar(int id)
    {
        var funcionario = _context.Funcionarios.Find(id);
        if (funcionario == null) return NotFound();

        funcionario.Ativo = false;
        _context.SaveChanges();
        return Ok(funcionario);
    }

    [HttpPut("{id}/reativar")]
    public IActionResult Reativar(int id)
    {
        var funcionario = _context.Funcionarios.Find(id);
        if (funcionario == null) return NotFound();

        funcionario.Ativo = true;
        _context.SaveChanges();
        return Ok(funcionario);
    }

    // --- Faltas ---

    public class RegistrarFaltaRequest
    {
        public DateTime Data { get; set; }
        public string? Motivo { get; set; }
        public bool Abonada { get; set; }
    }

    [HttpPost("{id}/faltas")]
    public IActionResult RegistrarFalta(int id, [FromBody] RegistrarFaltaRequest request)
    {
        var funcionario = _context.Funcionarios.Find(id);
        if (funcionario == null) return NotFound("Funcionário não encontrado.");

        var jaExiste = _context.Faltas.Any(f => f.FuncionarioId == id && f.Data.Date == request.Data.Date);
        if (jaExiste)
            return BadRequest("Já existe uma falta registrada nesse dia pra esse funcionário.");

        var falta = new Falta
        {
            FuncionarioId = id,
            Data = request.Data,
            Motivo = request.Motivo,
            Abonada = request.Abonada
        };

        _context.Faltas.Add(falta);
        _context.SaveChanges();
        return Ok(falta);
    }

    [HttpGet("{id}/faltas")]
    public IActionResult ListarFaltas(int id, [FromQuery] int mes, [FromQuery] int ano)
    {
        var faltas = _context.Faltas
            .Where(f => f.FuncionarioId == id && f.Data.Month == mes && f.Data.Year == ano)
            .OrderBy(f => f.Data)
            .ToList();

        return Ok(faltas);
    }

    [HttpDelete("faltas/{faltaId}")]
    public IActionResult RemoverFalta(int faltaId)
    {
        var falta = _context.Faltas.Find(faltaId);
        if (falta == null) return NotFound();

        _context.Faltas.Remove(falta);
        _context.SaveChanges();
        return Ok(new { mensagem = "Falta removida com sucesso." });
    }

    // --- Folha de pagamento ---

    [HttpGet("{id}/folha-pagamento")]
    public IActionResult FolhaPagamento(int id, [FromQuery] int mes, [FromQuery] int ano)
    {
        var folha = _funcionarioService.CalcularFolhaPagamento(id, mes, ano);
        if (folha == null) return NotFound("Funcionário não encontrado.");
        return Ok(folha);
    }
}