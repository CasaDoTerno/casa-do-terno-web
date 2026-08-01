namespace CasaDoTerno.Domain.Entities;

public class Locacao
{
    public int Id { get; set; }
    public int ProdutoId { get; set; }
    public int ClienteId { get; set; }
    public DateTime DataRetirada { get; set; }
    public DateTime DataDevolucaoPrevista { get; set; }
    public DateTime? DataDevolucaoReal { get; set; }
    public decimal ValorTotal { get; set; }

    // Regra de negócio dentro da própria entidade
    public bool EstaAtrasada()
    {
        return DataDevolucaoReal == null && DateTime.Now > DataDevolucaoPrevista;
    }
}