namespace CasaDoTerno.Domain.Entities;

public enum TipoLancamentoFolha
{
    Comissao = 0,
    Inss = 1
}

public class LancamentoFolha
{
    public int Id { get; set; }
    public int FuncionarioId { get; set; }
    public TipoLancamentoFolha Tipo { get; set; }
    public DateTime Data { get; set; }
    public decimal Valor { get; set; }
    public string? Descricao { get; set; }
}