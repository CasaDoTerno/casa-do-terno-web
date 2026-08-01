using CasaDoTerno.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CasaDoTerno.Application.Interfaces;

public interface ICasaDoTernoContext
{
    DbSet<Produto> Produtos { get; }
    DbSet<Cliente> Clientes { get; }
    DbSet<Locacao> Locacoes { get; }
    DbSet<Venda> Vendas { get; }
    int SaveChanges();
}