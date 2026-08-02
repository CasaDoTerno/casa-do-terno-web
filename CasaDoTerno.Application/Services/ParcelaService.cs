using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Interfaces;

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
        int numeroParcelas, FormaPagamento formaPagamento, DateTime primeiroVencimento)
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

            if (numeroParcelas == 1)
                parcela.DataPagamento = DateTime.Now;

            _context.Parcelas.Add(parcela);
        }

        _context.SaveChanges();
    }

    public (bool sucesso, string mensagem) RegistrarPagamentoParcela(int parcelaId)
    {
        var parcela = _context.Parcelas.Find(parcelaId);
        if (parcela == null)
            return (false, "Parcela não encontrada.");

        if (parcela.Paga)
            return (false, "Essa parcela já foi paga.");

        parcela.DataPagamento = DateTime.Now;
        _context.SaveChanges();

        return (true, "Pagamento registrado com sucesso.");
    }
}