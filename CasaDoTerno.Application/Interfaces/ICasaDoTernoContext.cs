using CasaDoTerno.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CasaDoTerno.Application.Interfaces;

public interface ICasaDoTernoContext
{
    DbSet<Produto> Produtos { get; }
    DbSet<Cliente> Clientes { get; }
    DbSet<Locacao> Locacoes { get; }
    DbSet<Venda> Vendas { get; }
    DbSet<ItemVenda> ItensVenda { get; }
    DbSet<ItemLocacao> ItensLocacao { get; }
    DbSet<Fornecedor> Fornecedores { get; }
    DbSet<Compra> Compras { get; }
    DbSet<ItemCompra> ItensCompra { get; }
    int SaveChanges();
}