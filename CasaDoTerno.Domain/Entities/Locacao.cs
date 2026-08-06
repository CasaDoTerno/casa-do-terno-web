namespace CasaDoTerno.Domain.Entities;

public class Locacao
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public DateTime DataReserva { get; set; } = DateTime.Now;
    public DateTime DataEvento { get; set; }
    public DateTime DataRetirada { get; set; }
    public DateTime DataDevolucaoPrevista { get; set; }
    public DateTime? DataDevolucaoReal { get; set; }
    public string? Consultor { get; set; }

    public decimal Desconto { get; set; }
    public decimal ValorTotal { get; set; }

    public decimal ValorEntrada { get; set; }
    public FormaPagamento FormaPagamentoEntrada { get; set; }
    public DateTime? DataPagamentoEntrada { get; set; }

    public FormaPagamento? FormaPagamentoRestante { get; set; }
    public DateTime? DataPagamentoRestante { get; set; }
    public DateTime? DataRetiradaReal { get; set; }
    public string? CriadoPor { get; set; }
    public string? EditadoPor { get; set; }
    public DateTime? DataEdicao { get; set; }

    public decimal ValorRestante => ValorTotal - ValorEntrada;

    public List<ItemLocacao> Itens { get; set; } = new();

    public bool EstaAtrasada()
    {
        return DataDevolucaoReal == null && DateTime.Now > DataDevolucaoPrevista;
    }
}