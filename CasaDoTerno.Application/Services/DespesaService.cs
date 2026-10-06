using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Application.Utils;

namespace CasaDoTerno.Application.Services;

public class DespesaService
{
    private readonly ICasaDoTernoContext _context;
    private readonly ParcelaService _parcelaService;

    public DespesaService(ICasaDoTernoContext context, ParcelaService parcelaService)
    {
        _context = context;
        _parcelaService = parcelaService;
    }

    public Despesa CriarDespesa(
        string descricao, string? categoria, decimal valor, string? observacao,
        FormaPagamento formaPagamento, int numeroParcelas,
        bool aguardandoPagamento = false, DateTime? dataVencimento = null)
    {
        if (aguardandoPagamento && dataVencimento == null)
            throw new ArgumentException("Informe a data de vencimento.", nameof(dataVencimento));

        // "a pagar": parcelas vencem a partir da data escolhida.
        // "já paguei": vence/foi paga hoje (no horário de Brasília).
        var primeiroVencimento = aguardandoPagamento
            ? dataVencimento!.Value.Date
            : FusoHorario.HojeBrasilia();

        var despesa = new Despesa
        {
            Descricao = descricao,
            Categoria = categoria,
            Valor = valor,
            Observacao = observacao,
            DataLancamento = aguardandoPagamento
                ? primeiroVencimento
                : FusoHorario.AgoraBrasilia()
        };

        _context.Despesas.Add(despesa);
        _context.SaveChanges();

        _parcelaService.GerarParcelas(
            OrigemPagamento.Despesa, despesa.Id, despesa.Valor,
            numeroParcelas, formaPagamento, primeiroVencimento,
            forcarPendente: aguardandoPagamento);

        return despesa;
    }
}