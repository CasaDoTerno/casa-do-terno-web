using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Application.Utils;

namespace CasaDoTerno.Application.Services;

public class ParcelaService
{
    private readonly ICasaDoTernoContext _context;

    public ParcelaService(ICasaDoTernoContext context)
    {
        _context = context;
    }

    public void GerarParcelas(
        OrigemPagamento origem, int origemId, decimal valorTotal,
        int numeroParcelas, FormaPagamento formaPagamento, DateTime primeiroVencimento,
        bool forcarPendente = false)
    {
        if (numeroParcelas < 1) numeroParcelas = 1;

        decimal valorPorParcela = Math.Round(valorTotal / numeroParcelas, 2);
        decimal somaParcelas = 0;

        for (int i = 1; i <= numeroParcelas; i++)
        {
            bool ultimaParcela = i == numeroParcelas;
            decimal valorDaVez = ultimaParcela ? (valorTotal - somaParcelas) : valorPorParcela;
            somaParcelas += valorDaVez;

            var parcela = new Parcela
            {
                Origem = origem,
                OrigemId = origemId,
                NumeroParcela = i,
                ValorParcela = valorDaVez,
                FormaPagamento = formaPagamento,
                DataVencimento = primeiroVencimento.AddMonths(i - 1)
            };

            // parcela única nasce paga (comportamento de sempre), a menos que quem chamou
            // peça pra ficar pendente (boleto a pagar, despesa recorrente...)
            if (numeroParcelas == 1 && !forcarPendente)
                parcela.DataPagamento = FusoHorario.AgoraBrasilia();

            _context.Parcelas.Add(parcela);
        }

        _context.SaveChanges();
    }

    public (bool sucesso, string mensagem) RegistrarPagamentoParcela(
        int parcelaId, FormaPagamento? formaPagamento = null, DateTime? dataPagamento = null)
    {
        var parcela = _context.Parcelas.Find(parcelaId);
        if (parcela == null)
            return (false, "Parcela não encontrada.");

        if (parcela.Paga)
            return (false, "Essa parcela já foi paga.");

        var agora = FusoHorario.AgoraBrasilia();

        if (dataPagamento != null && dataPagamento.Value.Date > agora.Date)
            return (false, "A data de pagamento não pode ser no futuro.");

        // a forma pela qual realmente foi paga pode ser diferente da prevista
        if (formaPagamento != null)
            parcela.FormaPagamento = formaPagamento.Value;

        // sem data (ou data de hoje): usa o momento exato. Data passada: usa a data escolhida.
        parcela.DataPagamento = (dataPagamento == null || dataPagamento.Value.Date == agora.Date)
            ? agora
            : dataPagamento.Value.Date;

        _context.SaveChanges();

        return (true, "Pagamento registrado com sucesso.");
    }
}