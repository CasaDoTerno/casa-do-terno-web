namespace CasaDoTerno.Domain.Entities;

public class Despesa
{
    public int Id { get; set; }
    public string Descricao { get; set; }
    public string? Categoria { get; set; } // ex: "Limpeza", "Aluguel", "Manutenção"
    public decimal Valor { get; set; }
    public DateTime DataLancamento { get; set; } = DateTime.Now;
    public string? Observacao { get; set; }
}