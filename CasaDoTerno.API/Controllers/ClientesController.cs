using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly CasaDoTernoContext _context;

    public ClientesController(CasaDoTernoContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Clientes.ToList());
    }

    [HttpGet("{id}")]
    public IActionResult BuscarPorId(int id)
    {
        var cliente = _context.Clientes.Find(id);
        if (cliente == null) return NotFound();
        return Ok(cliente);
    }
    
    [HttpPost]
    public IActionResult Criar([FromBody] Cliente cliente)
    {
        _context.Clientes.Add(cliente);
        _context.SaveChanges();
        return Ok(cliente);
    }

    [HttpPut("{id}")]
    public IActionResult Atualizar(int id, [FromBody] Cliente clienteAtualizado)
    {
        var cliente = _context.Clientes.Find(id);
        if (cliente == null)
            return NotFound();

        cliente.Nome = clienteAtualizado.Nome;
        cliente.Cpf = clienteAtualizado.Cpf;
        cliente.Telefone = clienteAtualizado.Telefone;
        cliente.Endereco = clienteAtualizado.Endereco;
        cliente.Email = clienteAtualizado.Email;
        cliente.Ombro = clienteAtualizado.Ombro;
        cliente.Manga = clienteAtualizado.Manga;
        cliente.Abdomen = clienteAtualizado.Abdomen;
        cliente.Bainha = clienteAtualizado.Bainha;
        cliente.Cintura = clienteAtualizado.Cintura;

        _context.SaveChanges();
        return Ok(cliente);
    }

    [HttpDelete("{id}")]
    public IActionResult Excluir(int id)
    {
        var cliente = _context.Clientes.Find(id);
        if (cliente == null)
            return NotFound();

        _context.Clientes.Remove(cliente);
        _context.SaveChanges();
        return NoContent();
    }
}