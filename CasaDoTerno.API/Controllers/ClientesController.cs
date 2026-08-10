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

    [HttpPut("{id}")]
    public IActionResult Atualizar(int id, [FromBody] Cliente clienteAtualizado)
    {
        var cliente = _context.Clientes.Find(id);
        if (cliente == null)
            return NotFound();

        var cpfNovo = ApenasDigitos(clienteAtualizado.Cpf);
        var telefoneNovo = ApenasDigitos(clienteAtualizado.Telefone);

        var outrosClientes = _context.Clientes.Where(c => c.Id != id).ToList();

        if (cpfNovo != "" && outrosClientes.Any(c => ApenasDigitos(c.Cpf) == cpfNovo))
            return BadRequest("Já existe outro cliente cadastrado com esse CPF.");

        if (telefoneNovo != "" && outrosClientes.Any(c => ApenasDigitos(c.Telefone) == telefoneNovo))
            return BadRequest("Já existe outro cliente cadastrado com esse telefone.");

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

    [HttpPost]
    public IActionResult Criar([FromBody] Cliente cliente)
    {
        var cpfNovo = ApenasDigitos(cliente.Cpf);
        var telefoneNovo = ApenasDigitos(cliente.Telefone);

        var clientesExistentes = _context.Clientes.ToList();

        if (cpfNovo != "" && clientesExistentes.Any(c => ApenasDigitos(c.Cpf) == cpfNovo))
            return BadRequest("Já existe um cliente cadastrado com esse CPF.");

        if (telefoneNovo != "" && clientesExistentes.Any(c => ApenasDigitos(c.Telefone) == telefoneNovo))
            return BadRequest("Já existe um cliente cadastrado com esse telefone.");

        _context.Clientes.Add(cliente);
        _context.SaveChanges();
        return Ok(cliente);
    }
    private static string ApenasDigitos(string? texto)
    {
        return new string((texto ?? "").Where(char.IsDigit).ToArray());
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