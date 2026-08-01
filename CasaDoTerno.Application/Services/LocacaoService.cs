using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Interfaces;

namespace CasaDoTerno.Application.Services;

public class LocacaoService
{
    private readonly ICasaDoTernoContext _context;

    public LocacaoService(ICasaDoTernoContext context)
    {
        _context = context;
    }

    public (bool sucesso, string mensagem, Locacao? locacao) CriarLocacao(
        int produtoId, int clienteId, DateTime dataRetirada, DateTime dataDevolucaoPrevista)
    {
        var produto = _context.Produtos.Find(produtoId);
        if (produto == null)
            return (false, "Produto não encontrado.", null);

        if (!produto.DisponivelParaLocacao)
            return (false, "Este produto não está disponível para locação.", null);

        // verifica se já existe locação desse produto que cruza com o período pedido
        bool temConflito = _context.Locacoes.Any(l =>
            l.ProdutoId == produtoId &&
            l.DataDevolucaoReal == null &&
            dataRetirada < l.DataDevolucaoPrevista &&
            l.DataRetirada < dataDevolucaoPrevista);

        if (temConflito)
            return (false, "Produto já está reservado nesse período.", null);

        var locacao = new Locacao
        {
            ProdutoId = produtoId,
            ClienteId = clienteId,
            DataRetirada = dataRetirada,
            DataDevolucaoPrevista = dataDevolucaoPrevista,
            ValorTotal = produto.ValorLocacao
        };

        _context.Locacoes.Add(locacao);
        _context.SaveChanges();

        return (true, "Locação criada com sucesso.", locacao);
    }
}