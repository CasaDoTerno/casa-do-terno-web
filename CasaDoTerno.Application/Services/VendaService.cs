using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Interfaces;

namespace CasaDoTerno.Application.Services;

public class VendaService
{
    private readonly ICasaDoTernoContext _context;

    public VendaService(ICasaDoTernoContext context)
    {
        _context = context;
    }

    public class ItemVendaEntrada
    {
        public int ProdutoId { get; set; }
        public int Quantidade { get; set; }
    }

    public (bool sucesso, string mensagem, Venda? venda) CriarVenda(
        int clienteId, decimal desconto, string? consultor,
        FormaPagamento formaPagamento, List<ItemVendaEntrada> itensEntrada)
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
        _context.SaveChanges();

        return (true, "Venda criada com sucesso.", venda);
    }
}