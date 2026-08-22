using CasaDoTerno.Application.Services;
using CasaDoTerno.Domain.Entities;
using Xunit;

namespace CasaDoTerno.Tests;

public class LocacaoServiceMulta
{
    [Fact]
    public void CalculaMulta_QuandoDevolucaoAtrasada()
    {
        using var contexto = ContextoDeTeste.Criar();

        var cliente = new Cliente { Nome = "Cliente Teste", Cpf = "111", Telefone = "111" };
        contexto.Clientes.Add(cliente);

        // cria a locação já com retirada feita e devolução prevista há 3 dias
        var locacao = new Locacao
        {
            ClienteId = cliente.Id,
            DataEvento = DateTime.Today.AddDays(-4),
            DataRetirada = DateTime.Today.AddDays(-4),
            DataRetiradaReal = DateTime.Today.AddDays(-4),
            DataDevolucaoPrevista = DateTime.Today.AddDays(-3),
            ValorEntrada = 0,
            FormaPagamentoEntrada = FormaPagamento.Dinheiro
        };
        locacao.Itens.Add(new ItemLocacao { ProdutoId = 1, ValorItem = 100 });
        locacao.Itens.Add(new ItemLocacao { ProdutoId = 2, ValorItem = 100 });

        contexto.Locacoes.Add(locacao);
        contexto.SaveChanges();

        var service = new LocacaoService(contexto);

        var (sucesso, _, multa) = service.RegistrarDevolucao(locacao.Id);

        Assert.True(sucesso);
        Assert.Equal(300, multa); // 3 dias de atraso x R$50 x 2 peças
    }

    [Fact]
    public void NaoCalculaMulta_QuandoDevolucaoNoPrazo()
    {
        using var contexto = ContextoDeTeste.Criar();

        var cliente = new Cliente { Nome = "Cliente Teste", Cpf = "111", Telefone = "111" };
        contexto.Clientes.Add(cliente);

        var locacao = new Locacao
        {
            ClienteId = cliente.Id,
            DataEvento = DateTime.Today,
            DataRetirada = DateTime.Today,
            DataRetiradaReal = DateTime.Today,
            DataDevolucaoPrevista = DateTime.Today.AddDays(1), // ainda não venceu
            ValorEntrada = 0,
            FormaPagamentoEntrada = FormaPagamento.Dinheiro
        };
        locacao.Itens.Add(new ItemLocacao { ProdutoId = 1, ValorItem = 100 });

        contexto.Locacoes.Add(locacao);
        contexto.SaveChanges();

        var service = new LocacaoService(contexto);
        var (sucesso, _, multa) = service.RegistrarDevolucao(locacao.Id);

        Assert.True(sucesso);
        Assert.Equal(0, multa);
    }
}