using CasaDoTerno.Application.Services;
using CasaDoTerno.Domain.Entities;
using Xunit;

namespace CasaDoTerno.Tests;

public class LocacaoServiceTrava
{
    [Fact]
    public void Bloqueia_QuandoNaoHaMaisUnidadesDisponiveis()
    {
        // Preparo: um produto com só 1 unidade em estoque
        using var contexto = ContextoDeTeste.Criar();
        var cliente = new Cliente { Nome = "Cliente Teste", Cpf = "111", Telefone = "111" };
        var produto = new Produto { Modelo = "Terno Teste", Tamanho = "42", Cor = "Azul", Quantidade = 1, DisponivelParaLocacao = true, ControlaEstoque = true };
        contexto.Clientes.Add(cliente);
        contexto.Produtos.Add(produto);
        contexto.SaveChanges();

        var service = new LocacaoService(contexto);
        var itens = new List<LocacaoService.ItemLocacaoEntrada>
        {
            new() { ProdutoId = produto.Id }
        };

        // Ação: cria a primeira locação (deve dar certo)
        var (sucesso1, _, _) = service.CriarLocacao(
            cliente.Id, DateTime.Today.AddDays(10), DateTime.Today.AddDays(8), DateTime.Today.AddDays(10),
            null, 0, 0, FormaPagamento.Dinheiro, null, false, itens);

        // Ação: tenta criar uma segunda locação, mesmo produto, mesmo período (deve falhar)
        var (sucesso2, mensagem2, _) = service.CriarLocacao(
            cliente.Id, DateTime.Today.AddDays(10), DateTime.Today.AddDays(8), DateTime.Today.AddDays(10),
            null, 0, 0, FormaPagamento.Dinheiro, null, false, itens);

        // Verificação
        Assert.True(sucesso1);
        Assert.False(sucesso2);
        Assert.Contains("não tem unidades suficientes", mensagem2);
    }

    [Fact]
    public void Permite_QuandoQuantidadeSuficiente()
    {
        // Preparo: um produto com 2 unidades em estoque
        using var contexto = ContextoDeTeste.Criar();
        var cliente = new Cliente { Nome = "Cliente Teste", Cpf = "111", Telefone = "111" };
        var produto = new Produto { Modelo = "Camisa Teste", Tamanho = "M", Cor = "Branca", Quantidade = 2, DisponivelParaLocacao = true, ControlaEstoque = true };
        contexto.Clientes.Add(cliente);
        contexto.Produtos.Add(produto);
        contexto.SaveChanges();

        var service = new LocacaoService(contexto);
        var itens = new List<LocacaoService.ItemLocacaoEntrada>
        {
            new() { ProdutoId = produto.Id }
        };

        var (sucesso1, _, _) = service.CriarLocacao(
            cliente.Id, DateTime.Today.AddDays(10), DateTime.Today.AddDays(8), DateTime.Today.AddDays(10),
            null, 0, 0, FormaPagamento.Dinheiro, null, false, itens);

        var (sucesso2, _, _) = service.CriarLocacao(
            cliente.Id, DateTime.Today.AddDays(10), DateTime.Today.AddDays(8), DateTime.Today.AddDays(10),
            null, 0, 0, FormaPagamento.Dinheiro, null, false, itens);

        Assert.True(sucesso1);
        Assert.True(sucesso2);
    }
}