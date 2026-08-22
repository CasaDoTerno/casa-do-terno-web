using CasaDoTerno.Application.Services;
using CasaDoTerno.Domain.Entities;
using Xunit;

namespace CasaDoTerno.Tests;

public class LocacaoServiceEvento
{
    [Fact]
    public void PecaPrincipal_GanhaDescontoQuandoPadrinhoEntra()
    {
        using var contexto = ContextoDeTeste.Criar();

        var cliente = new Cliente { Nome = "Noivo", Cpf = "111", Telefone = "111" };
        var padrinho = new Cliente { Nome = "Padrinho", Cpf = "222", Telefone = "222" };
        var produto = new Produto { Modelo = "Terno AC", Tamanho = "44", Cor = "Preto", Quantidade = 5, DisponivelParaLocacao = true, ControlaEstoque = true, ValorLocacao = 600 };
        var evento = new Evento { Nome = "Casamento Teste", Data = DateTime.Today };

        contexto.Clientes.AddRange(cliente, padrinho);
        contexto.Produtos.Add(produto);
        contexto.Eventos.Add(evento);
        contexto.SaveChanges();

        var service = new LocacaoService(contexto);
        var itens = new List<LocacaoService.ItemLocacaoEntrada> { new() { ProdutoId = produto.Id } };

        // cria a locação do noivo, marcando como principal do evento
        var (sucessoNoivo, _, locacaoNoivo) = service.CriarLocacao(
            cliente.Id, DateTime.Today.AddDays(10), DateTime.Today.AddDays(8), DateTime.Today.AddDays(10),
            null, 0, 0, FormaPagamento.Dinheiro, evento.Id, true, itens);

        Assert.True(sucessoNoivo);
        Assert.Equal(600, locacaoNoivo!.ValorTotal); // sem padrinho ainda, sem desconto

        // cria a locação do padrinho, vinculada ao mesmo evento (peça diferente, sem trava)
        var produtoPadrinho = new Produto { Modelo = "Terno AC 2", Tamanho = "46", Cor = "Preto", Quantidade = 5, DisponivelParaLocacao = true, ControlaEstoque = true, ValorLocacao = 500 };
        contexto.Produtos.Add(produtoPadrinho);
        contexto.SaveChanges();

        var itensPadrinho = new List<LocacaoService.ItemLocacaoEntrada> { new() { ProdutoId = produtoPadrinho.Id } };

        var (sucessoPadrinho, _, _) = service.CriarLocacao(
            padrinho.Id, DateTime.Today.AddDays(10), DateTime.Today.AddDays(8), DateTime.Today.AddDays(10),
            null, 0, 0, FormaPagamento.Dinheiro, evento.Id, false, itensPadrinho);

        Assert.True(sucessoPadrinho);

        // recarrega a locação do noivo do banco — ela deveria ter ganhado o desconto agora
        var noivoAtualizado = contexto.Locacoes.Find(locacaoNoivo.Id)!;
        Assert.Equal(10, noivoAtualizado.DescontoEvento);
        Assert.Equal(590, noivoAtualizado.ValorTotal);
    }
}