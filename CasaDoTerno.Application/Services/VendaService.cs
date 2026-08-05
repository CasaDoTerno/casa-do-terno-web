using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CasaDoTerno.Application.Services;

public class VendaService
{
    private readonly ICasaDoTernoContext _context;

    private readonly ParcelaService _parcelaService;

    public VendaService(ICasaDoTernoContext context, ParcelaService parcelaService)
    {
        _context = context;
        _parcelaService = parcelaService;
    }

    public class ItemVendaEntrada
    {
        public int ProdutoId { get; set; }
        public int Quantidade { get; set; }
    }

    public (bool sucesso, string mensagem, Venda? venda) AtualizarVenda(
    int vendaId, int clienteId, decimal desconto, string? consultor,
    List<ItemVendaEntrada> itensEntrada)
    {
        var venda = _context.Vendas.Include(v => v.Itens).FirstOrDefault(v => v.Id == vendaId);
        if (venda == null)
            return (false, "Venda não encontrada.", null);

        if (itensEntrada == null || itensEntrada.Count == 0)
            return (false, "A venda precisa ter pelo menos um item.", null);

        // devolve ao estoque a quantidade dos itens ANTIGOS, antes de remover
        foreach (var itemAntigo in venda.Itens)
        {
            var produtoAntigo = _context.Produtos.Find(itemAntigo.ProdutoId);
            if (produtoAntigo != null && produtoAntigo.ControlaEstoque)
            {
                produtoAntigo.Quantidade += itemAntigo.Quantidade;
                if (produtoAntigo.Quantidade > 0)
                    produtoAntigo.DisponivelParaVenda = true;
            }
        }

        _context.ItensVenda.RemoveRange(venda.Itens);
        venda.Itens.Clear();

        // aplica os itens NOVOS, com as mesmas checagens da criação
        decimal valorTotal = 0;
        foreach (var entrada in itensEntrada)
        {
            var produto = _context.Produtos.Find(entrada.ProdutoId);
            if (produto == null)
                return (false, $"Produto {entrada.ProdutoId} não encontrado.", null);

            if (produto.ControlaEstoque && produto.Quantidade < entrada.Quantidade)
                return (false, $"Estoque insuficiente de '{produto.Modelo}' (disponível: {produto.Quantidade}).", null);

            var item = new ItemVenda
            {
                ProdutoId = produto.Id,
                Quantidade = entrada.Quantidade,
                ValorUnitario = produto.ValorVenda
            };

            venda.Itens.Add(item);
            valorTotal += item.ValorTotal;

            if (produto.ControlaEstoque)
            {
                produto.Quantidade -= entrada.Quantidade;
                if (produto.Quantidade <= 0)
                    produto.DisponivelParaVenda = false;
            }
        }

        venda.ClienteId = clienteId;
        venda.Desconto = desconto;
        venda.Consultor = consultor;
        venda.ValorTotal = valorTotal - desconto;

        _context.SaveChanges();

        return (true, "Venda atualizada com sucesso.", venda);
    }
    public (bool sucesso, string mensagem, Venda? venda) CriarVenda(
          int clienteId, decimal desconto, string? consultor, FormaPagamento formaPagamento,
          int numeroParcelas, List<ItemVendaEntrada> itensEntrada)
    {
        if (itensEntrada == null || itensEntrada.Count == 0)
            return (false, "A venda precisa ter pelo menos um item.", null);

        var venda = new Venda
        {
            ClienteId = clienteId,
            Desconto = desconto,
            Consultor = consultor,
            FormaPagamento = formaPagamento
        };
        decimal valorTotal = 0;

        foreach (var entrada in itensEntrada)
        {
            var produto = _context.Produtos.Find(entrada.ProdutoId);
            if (produto == null)
                return (false, $"Produto {entrada.ProdutoId} não encontrado.", null);

            if (!produto.DisponivelParaVenda)
                return (false, $"Produto '{produto.Modelo}' não está disponível para venda.", null);

            if (produto.ControlaEstoque && produto.Quantidade < entrada.Quantidade)
                return (false, $"Estoque insuficiente de '{produto.Modelo}' (disponível: {produto.Quantidade}).", null);

            var item = new ItemVenda
            {
                ProdutoId = produto.Id,
                Quantidade = entrada.Quantidade,
                ValorUnitario = produto.ValorVenda
            };

            venda.Itens.Add(item);
            valorTotal += item.ValorTotal;

            // dá baixa no estoque, se esse produto controla estoque
            if (produto.ControlaEstoque)
            {
                produto.Quantidade -= entrada.Quantidade;
                if (produto.Quantidade <= 0)
                    produto.DisponivelParaVenda = false;
            }
        }

        venda.ValorTotal = valorTotal - desconto;

        _context.Vendas.Add(venda);
        _context.SaveChanges(); // precisa salvar ANTES, pra gerar o venda.Id

        _parcelaService.GerarParcelas(
            OrigemPagamento.Venda, venda.Id, venda.ValorTotal,
            numeroParcelas, formaPagamento, DateTime.Today);

        return (true, "Venda criada com sucesso.", venda);
    }


}