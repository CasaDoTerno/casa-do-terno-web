using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Domain.Entities;

namespace CasaDoTerno.Application.Services;

public class FuncionarioService
{
    private readonly ICasaDoTernoContext _context;
    private const int DIVISOR_DIAS_MES = 30;

    public FuncionarioService(ICasaDoTernoContext context)
    {
        _context = context;
    }

    public class FolhaPagamento
    {
        public int FuncionarioId { get; set; }
        public string NomeFuncionario { get; set; } = "";
        public decimal SalarioBase { get; set; }
        public int QuantidadeFaltas { get; set; }
        public int QuantidadeFaltasAbonadas { get; set; }
        public decimal ValorPorDia { get; set; }
        public decimal ValorDescontado { get; set; }
        public decimal SalarioLiquido { get; set; }
    }

    public FolhaPagamento? CalcularFolhaPagamento(int funcionarioId, int mes, int ano)
    {
        var funcionario = _context.Funcionarios.Find(funcionarioId);
        if (funcionario == null)
            return null;

        var faltasDoMes = _context.Faltas
            .Where(f => f.FuncionarioId == funcionarioId && f.Data.Month == mes && f.Data.Year == ano)
            .ToList();

        int faltasNaoAbonadas = faltasDoMes.Count(f => !f.Abonada);
        int faltasAbonadas = faltasDoMes.Count(f => f.Abonada);

        decimal valorPorDia = funcionario.SalarioBase / DIVISOR_DIAS_MES;
        decimal valorDescontado = valorPorDia * faltasNaoAbonadas;
        decimal salarioLiquido = funcionario.SalarioBase - valorDescontado;

        return new FolhaPagamento
        {
            FuncionarioId = funcionario.Id,
            NomeFuncionario = funcionario.Nome,
            SalarioBase = funcionario.SalarioBase,
            QuantidadeFaltas = faltasNaoAbonadas,
            QuantidadeFaltasAbonadas = faltasAbonadas,
            ValorPorDia = valorPorDia,
            ValorDescontado = valorDescontado,
            SalarioLiquido = salarioLiquido
        };
    }
}