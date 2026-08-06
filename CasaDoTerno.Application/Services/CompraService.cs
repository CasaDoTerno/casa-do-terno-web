using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using static CasaDoTerno.Application.Services.CompraService;

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

    public (bool sucesso, string mensagem, Compra? compra) AtualizarCompra(
        int compraId, int fornecedorId, FormaPagamento formaPagamento, string? observacao,
        List<ItemCompraEntrada> itensEntrada)
    {
        var compra = _context.Compras.Include(c => c.Itens).FirstOrDefault(c => c.Id == compraId);
        if (compra == null)
            return (false, "Compra não encontrada.", null);

        if (itensEntrada == null || itensEntrada.Count == 0)
            return (false, "A compra precisa ter pelo menos um item.", null);

        // desfaz a entrada de estoque dos itens ANTIGOS (subtrai de volta)
        foreach (var itemAntigo in compra.Itens)
        {
            var produtoAntigo = _context.Produtos.Find(itemAntigo.ProdutoId);
            if (produtoAntigo != null)
            {
                produtoAntigo.Quantidade -= itemAntigo.Quantidade;
            }
        }

        _context.ItensCompra.RemoveRange(compra.Itens);
        compra.Itens.Clear();

        // aplica os itens NOVOS, com nova entrada de estoque
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

            produto.Quantidade += entrada.Quantidade;
            produto.ControlaEstoque = true;
            if (produto.Quantidade > 0)
                produto.DisponivelParaVenda = true;
        }

        compra.FornecedorId = fornecedorId;
        compra.FormaPagamento = formaPagamento;
        compra.Observacao = observacao;
        compra.ValorTotal = valorTotal;

        _context.SaveChanges();

        return (true, "Compra atualizada com sucesso.", compra);
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