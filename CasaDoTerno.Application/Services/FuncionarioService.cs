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
        public int DiasTrabalhados { get; set; }
        public decimal SalarioProporcional { get; set; }
        public int QuantidadeFaltas { get; set; }
        public int QuantidadeFaltasAbonadas { get; set; }
        public decimal ValorPorDia { get; set; }
        public decimal ValorDescontado { get; set; }
        public decimal TotalVales { get; set; }
        public decimal SalarioLiquido { get; set; }
    }


    public Vale RegistrarVale(int funcionarioId, DateTime data, decimal valor, string? motivo)
    {
        var vale = new Vale
        {
            FuncionarioId = funcionarioId,
            Data = data,
            Valor = valor,
            Motivo = motivo
        };

        _context.Vales.Add(vale);
        _context.SaveChanges();
        return vale;
    }

    public List<Vale> ListarVales(int funcionarioId, int mes, int ano)
    {
        return _context.Vales
            .Where(v => v.FuncionarioId == funcionarioId && v.Data.Month == mes && v.Data.Year == ano)
            .OrderBy(v => v.Data)
            .ToList();
    }

    public (bool sucesso, string mensagem) RemoverVale(int valeId)
    {
        var vale = _context.Vales.Find(valeId);
        if (vale == null)
            return (false, "Vale não encontrado.");

        _context.Vales.Remove(vale);
        _context.SaveChanges();
        return (true, "Vale removido com sucesso.");
    }
    public FolhaPagamento? CalcularFolhaPagamento(int funcionarioId, int mes, int ano)
    {
        var funcionario = _context.Funcionarios.Find(funcionarioId);
        if (funcionario == null)
            return null;

        var primeiroDiaDoMes = new DateTime(ano, mes, 1);
        var ultimoDiaDoMes = primeiroDiaDoMes.AddMonths(1).AddDays(-1);

        // ainda nem tinha sido admitido nesse mês — não recebe nada ainda
        if (funcionario.DataAdmissao.Date > ultimoDiaDoMes)
        {
            return new FolhaPagamento
            {
                FuncionarioId = funcionario.Id,
                NomeFuncionario = funcionario.Nome,
                SalarioBase = funcionario.SalarioBase,
                DiasTrabalhados = 0,
                SalarioProporcional = 0,
                QuantidadeFaltas = 0,
                QuantidadeFaltasAbonadas = 0,
                ValorPorDia = funcionario.SalarioBase / DIVISOR_DIAS_MES,
                ValorDescontado = 0,
                SalarioLiquido = 0
            };
        }

        // por padrão, considera o mês "comercial" cheio (30 dias)
        int diasTrabalhados = DIVISOR_DIAS_MES;

        // se foi admitido justamente NESSE mês, só conta a partir do dia da admissão
        if (funcionario.DataAdmissao.Year == ano && funcionario.DataAdmissao.Month == mes)
        {
            int diaAdmissao = Math.Min(funcionario.DataAdmissao.Day, DIVISOR_DIAS_MES);
            diasTrabalhados = DIVISOR_DIAS_MES - diaAdmissao + 1;
        }

        var faltasDoMes = _context.Faltas
            .Where(f => f.FuncionarioId == funcionarioId && f.Data.Month == mes && f.Data.Year == ano)
            .ToList();

        int faltasNaoAbonadas = faltasDoMes.Count(f => !f.Abonada);
        int faltasAbonadas = faltasDoMes.Count(f => f.Abonada);

        decimal valorPorDia = funcionario.SalarioBase / DIVISOR_DIAS_MES;
        decimal salarioProporcional = valorPorDia * diasTrabalhados;
        decimal valorDescontado = valorPorDia * faltasNaoAbonadas;

        var valesDoMes = _context.Vales
            .Where(v => v.FuncionarioId == funcionarioId && v.Data.Month == mes && v.Data.Year == ano)
            .ToList();
        decimal totalVales = valesDoMes.Sum(v => v.Valor);

        decimal salarioLiquido = salarioProporcional - valorDescontado - totalVales;

        return new FolhaPagamento
        {
            FuncionarioId = funcionario.Id,
            NomeFuncionario = funcionario.Nome,
            SalarioBase = funcionario.SalarioBase,
            DiasTrabalhados = diasTrabalhados,
            SalarioProporcional = salarioProporcional,
            QuantidadeFaltas = faltasNaoAbonadas,
            QuantidadeFaltasAbonadas = faltasAbonadas,
            ValorPorDia = valorPorDia,
            ValorDescontado = valorDescontado,
            TotalVales = totalVales,
            SalarioLiquido = salarioLiquido
        };
    }
}