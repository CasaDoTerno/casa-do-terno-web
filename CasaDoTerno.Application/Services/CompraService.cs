using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Interfaces;

namespace CasaDoTerno.Application.Services;

public class CompraService
{
    private readonly ICasaDoTernoContext _context;
    private readonly ParcelaService _parcelaService;

    public CompraService(ICasaDoTernoContext context, ParcelaService parcelaService)
    {
        _context = context;
        _parcelaService = parcelaService;
    }

    public class ItemCompraEntrada
    {
        public int ProdutoId { get; set; }
        public int Quantidade { get; set; }
        public decimal ValorUnitario { get; set; }
    }

    public (bool sucesso, string mensagem, Compra? compra) CriarCompra(
          int fornecedorId, FormaPagamento formaPagamento, string? observacao,
          int numeroParcelas, List<ItemCompraEntrada> itensEntrada)
    {
        if (itensEntrada == null || itensEntrada.Count == 0)
            return (false, "A compra precisa ter pelo menos um item.", null);

        var compra = new Compra
        {
            FornecedorId = fornecedorId,
            FormaPagamento = formaPagamento,
            Observacao = observacao
        };

        decimal valorTotal = 0;

        foreach (var entrada in itensEntrada)
        {
            var produto = _context.Produtos.Find(entrada.ProdutoId);
            if (produto == null)
                return (false, $"Produto {entrada.ProdutoId} não encontrado.", null);

            var item = new ItemCompra
            {
                ProdutoId = produto.Id,
                Quantidade = entrada.Quantidade,
                ValorUnitario = entrada.ValorUnitario
            };

            compra.Itens.Add(item);
            valorTotal += item.ValorTotal;

            // ENTRADA no estoque (o oposto da baixa que fazemos na venda)
            produto.Quantidade += entrada.Quantidade;
            produto.ControlaEstoque = true; // se comprou, passa a controlar estoque
            if (produto.Quantidade > 0)
                produto.DisponivelParaVenda = true; // volta a ficar disponível, se tinha zerado
        }

        compra.ValorTotal = valorTotal;

        _context.Compras.Add(compra);
        _context.SaveChanges();

        _parcelaService.GerarParcelas(
            OrigemPagamento.Compra, compra.Id, compra.ValorTotal,
            numeroParcelas, formaPagamento, DateTime.Today);

        return (true, "Compra registrada com sucesso.", compra);
    }
}