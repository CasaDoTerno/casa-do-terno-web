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
    DbSet<Parcela> Parcelas { get; }
    DbSet<Despesa> Despesas { get; }
    DbSet<Evento> Eventos { get; }
    DbSet<Perfil> Perfis { get; }
    DbSet<UsuarioPerfil> UsuarioPerfis { get; }
    DbSet<MetaMensal> MetasMensais { get; }
    DbSet<Funcionario> Funcionarios { get; }
    DbSet<Falta> Faltas { get; }
    int SaveChanges();
}