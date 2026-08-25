
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CasaDoTerno.Infrastructure.Data;

public class CasaDoTernoContext : IdentityDbContext<IdentityUser>, ICasaDoTernoContext
{
    public CasaDoTernoContext(DbContextOptions<CasaDoTernoContext> options) : base(options) { }

    public DbSet<Produto> Produtos { get; set; }
    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Locacao> Locacoes { get; set; }
    public DbSet<Venda> Vendas { get; set; }
    public DbSet<ItemVenda> ItensVenda { get; set; }
    public DbSet<ItemLocacao> ItensLocacao { get; set; }
    public DbSet<Fornecedor> Fornecedores { get; set; }
    public DbSet<Compra> Compras { get; set; }
    public DbSet<ItemCompra> ItensCompra { get; set; }
    public DbSet<Parcela> Parcelas { get; set; }
    public DbSet<Despesa> Despesas { get; set; }
    public DbSet<Evento> Eventos { get; set; }
    public DbSet<Perfil> Perfis { get; set; }
    public DbSet<UsuarioPerfil> UsuarioPerfis { get; set; }
    public DbSet<MetaMensal> MetasMensais { get; set; }
    public DbSet<Funcionario> Funcionarios { get; set; }
    public DbSet<Falta> Faltas { get; set; }

}