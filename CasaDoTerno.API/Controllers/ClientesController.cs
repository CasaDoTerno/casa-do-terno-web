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

    public class ItemDebito
    {
        public string Tipo { get; set; } = ""; // "Venda" ou "Locação"
        public int Id { get; set; }
        public decimal Valor { get; set; }
        public DateTime Data { get; set; }
    }
    [HttpGet("com-debito")]
    public IActionResult ClientesComDebito()
    {
        var idsComVendaPendente = _context.Vendas
            .Where(v => v.PagamentoPendente)
            .Select(v => v.ClienteId)
            .Distinct()
            .ToList();

        var idsComLocacaoPendente = _context.Locacoes
            .ToList()
            .Where(l => l.ValorRestante > 0 && l.FormaPagamentoRestante == null)
            .Select(l => l.ClienteId)
            .Distinct()
            .ToList();

        var idsComDebito = idsComVendaPendente.Union(idsComLocacaoPendente).ToList();

        var resultado = idsComDebito.Select(clienteId =>
        {
            var cliente = _context.Clientes.Find(clienteId);
            var totalVendas = _context.Vendas
                .Where(v => v.ClienteId == clienteId && v.PagamentoPendente)
                .Sum(v => (decimal?)v.ValorTotal) ?? 0;
            var totalLocacoes = _context.Locacoes
                .Where(l => l.ClienteId == clienteId)
                .ToList()
                .Where(l => l.ValorRestante > 0 && l.FormaPagamentoRestante == null)
                .Sum(l => (decimal?)l.ValorRestante) ?? 0;

            return new
            {
                clienteId,
                nome = cliente?.Nome ?? $"Cliente #{clienteId}",
                totalDebito = totalVendas + totalLocacoes
            };
        })
        .OrderByDescending(c => c.totalDebito)
        .ToList();

        return Ok(resultado);
    }

    [HttpGet("{id}/debitos")]
    public IActionResult Debitos(int id)
    {
        var itens = new List<ItemDebito>();

        var vendasPendentes = _context.Vendas
            .Where(v => v.ClienteId == id && v.PagamentoPendente)
            .ToList();

        itens.AddRange(vendasPendentes.Select(v => new ItemDebito
        {
            Tipo = "Venda",
            Id = v.Id,
            Valor = v.ValorTotal,
            Data = v.DataVenda
        }));

        var todasLocacoesDoCliente = _context.Locacoes
            .Where(l => l.ClienteId == id)
            .ToList();

        var locacoesComRestante = todasLocacoesDoCliente
            .Where(l => l.ValorRestante > 0 && l.FormaPagamentoRestante == null)
            .ToList();

        itens.AddRange(locacoesComRestante.Select(l => new ItemDebito
        {
            Tipo = "Locação",
            Id = l.Id,
            Valor = l.ValorRestante,
            Data = l.DataEvento
        }));

        var total = itens.Sum(i => i.Valor);

        return Ok(new { itens = itens.OrderBy(i => i.Data).ToList(), total });
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