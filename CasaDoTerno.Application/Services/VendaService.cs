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
        public string? Ajustes { get; set; }
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
                ValorUnitario = produto.ValorVenda,
                Ajustes = entrada.Ajustes
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
          int numeroParcelas, bool precisaAjuste, DateTime? dataRetiradaAjuste, bool pagamentoPendente,
          List<ItemVendaEntrada> itensEntrada)
    {
        if (itensEntrada == null || itensEntrada.Count == 0)
            return (false, "A venda precisa ter pelo menos um item.", null);

        if (precisaAjuste && dataRetiradaAjuste == null)
            return (false, "Informe a data de retirada, já que essa venda precisa de ajuste.", null);

        var venda = new Venda
        {
            ClienteId = clienteId,
            Desconto = desconto,
            Consultor = consultor,
            FormaPagamento = formaPagamento,
            PrecisaAjuste = precisaAjuste,
            DataRetiradaAjuste = precisaAjuste ? dataRetiradaAjuste : null,
            PagamentoPendente = pagamentoPendente,
            NumeroParcelasPendente = numeroParcelas
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
                ValorUnitario = produto.ValorVenda,
                Ajustes = entrada.Ajustes
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

        venda.ValorTotal = valorTotal - desconto;

        _context.Vendas.Add(venda);
        _context.SaveChanges(); // precisa salvar ANTES, pra gerar o venda.Id

        if (!pagamentoPendente)
        {
            // pagamento acontece na hora — gera as parcelas normalmente, do jeito que já era
            _parcelaService.GerarParcelas(
                OrigemPagamento.Venda, venda.Id, venda.ValorTotal,
                numeroParcelas, formaPagamento, DateTime.Today);

            venda.DataPagamentoRealizado = DateTime.Now;
            _context.SaveChanges();
        }
        // se pagamentoPendente == true, NÃO gera parcela nenhuma ainda —
        // isso só vai acontecer quando RegistrarPagamentoVenda for chamado, depois

        return (true, "Venda criada com sucesso.", venda);
    }

    public (bool sucesso, string mensagem) RegistrarPagamentoVenda(
        int vendaId, FormaPagamento formaPagamento, int numeroParcelas)
    {
        var venda = _context.Vendas.Find(vendaId);
        if (venda == null)
            return (false, "Venda não encontrada.");

        if (!venda.PagamentoPendente)
            return (false, "Essa venda não está com pagamento pendente.");

        venda.PagamentoPendente = false;
        venda.FormaPagamento = formaPagamento;
        venda.DataPagamentoRealizado = DateTime.Now;
        _context.SaveChanges();

        _parcelaService.GerarParcelas(
            OrigemPagamento.Venda, venda.Id, venda.ValorTotal,
            numeroParcelas, formaPagamento, DateTime.Today);

        return (true, "Pagamento registrado com sucesso.");
    }
    public (bool sucesso, string mensagem) ConfirmarRetiradaVenda(int vendaId)
    {
        var venda = _context.Vendas.Find(vendaId);
        if (venda == null)
            return (false, "Venda não encontrada.");

        if (venda.DataRetiradaRealizada != null)
            return (false, "A retirada dessa venda já foi confirmada.");

        venda.DataRetiradaRealizada = CasaDoTerno.Application.Utils.FusoHorario.AgoraBrasilia();
        _context.SaveChanges();

        return (true, "Retirada confirmada com sucesso.");
    }
}