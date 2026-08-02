namespace CasaDoTerno.Domain.Entities;

public enum CategoriaProduto
{
    Terno,
    Calca,
    Camisa,
    Sapato,
    acessorio
}

public class Produto
{
    public int Id { get; set; }
    public string Modelo { get; set; }
    public CategoriaProduto Categoria { get; set; }
    public string Tamanho { get; set; }
    public string Cor { get; set; }
    public decimal ValorVenda { get; set; }
    public decimal ValorLocacao { get; set; }
    public bool DisponivelParaVenda { get; set; }
    public bool DisponivelParaLocacao { get; set; }

    // controle de estoque (novo)
    public string? Referencia { get; set; }
    public bool ControlaEstoque { get; set; }
    public int Quantidade { get; set; }
    public int EstoqueMinimo { get; set; }
    public string? Observacao { get; set; }
}