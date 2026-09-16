using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Domain.Entities;

namespace CasaDoTerno.Application.Services;

public class DespesaRecorrenteService
{
    private readonly ICasaDoTernoContext _context;
    private readonly ParcelaService _parcelaService;

    public DespesaRecorrenteService(ICasaDoTernoContext context, ParcelaService parcelaService)
    {
        _context = context;
        _parcelaService = parcelaService;
    }

    public DespesaRecorrente CriarDespesaRecorrente(string descricao, decimal valor, int diaVencimento)
    {
        var recorrente = new DespesaRecorrente
        {
            Descricao = descricao,
            Valor = valor,
            DiaVencimento = diaVencimento,
            Ativa = true
        };

        _context.DespesasRecorrentes.Add(recorrente);
        _context.SaveChanges();

        // já gera a primeira ocorrência (desse mês, se o dia ainda não passou; senão, do mês que vem)
        GerarOcorrenciaSeNecessario(recorrente, DateTime.Now);

        return recorrente;
    }

    public int GerarOcorrenciasDoMes()
    {
        var agora = CasaDoTerno.Application.Utils.FusoHorario.AgoraBrasilia();
        var recorrentesAtivas = _context.DespesasRecorrentes.Where(d => d.Ativa).ToList();

        int geradas = 0;
        foreach (var recorrente in recorrentesAtivas)
        {
            if (GerarOcorrenciaSeNecessario(recorrente, agora))
                geradas++;
        }

        return geradas;
    }

    private bool GerarOcorrenciaSeNecessario(DespesaRecorrente recorrente, DateTime referencia)
    {
        // já gerou esse mês? não faz de novo
        if (recorrente.UltimoMesGerado == referencia.Month && recorrente.UltimoAnoGerado == referencia.Year)
            return false;

        int ultimoDiaDoMes = DateTime.DaysInMonth(referencia.Year, referencia.Month);
        int dia = Math.Min(recorrente.DiaVencimento, ultimoDiaDoMes);
        var vencimento = new DateTime(referencia.Year, referencia.Month, dia);

        var despesa = new Despesa
        {
            Descricao = recorrente.Descricao,
            Valor = recorrente.Valor,
            DataLancamento = vencimento,
            Categoria = "Recorrente",
            Observacao = "Gerada automaticamente (despesa recorrente).",
            DespesaRecorrenteId = recorrente.Id
        };

        _context.Despesas.Add(despesa);
        _context.SaveChanges();

        _parcelaService.GerarParcelas(
            OrigemPagamento.Despesa, despesa.Id, recorrente.Valor,
            1, FormaPagamento.Boleto, vencimento);

        recorrente.UltimoMesGerado = referencia.Month;
        recorrente.UltimoAnoGerado = referencia.Year;
        _context.SaveChanges();

        return true;
    }
}