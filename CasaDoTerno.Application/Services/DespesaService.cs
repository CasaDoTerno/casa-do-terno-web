using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Interfaces;

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
        FormaPagamento formaPagamento, int numeroParcelas)
    {
        var despesa = new Despesa
        {
            Descricao = descricao,
            Categoria = categoria,
            Valor = valor,
            Observacao = observacao
        };

        _context.Despesas.Add(despesa);
        _context.SaveChanges();

        _parcelaService.GerarParcelas(
            OrigemPagamento.Despesa, despesa.Id, despesa.Valor,
            numeroParcelas, formaPagamento, DateTime.Today);

        return despesa;
    }
}