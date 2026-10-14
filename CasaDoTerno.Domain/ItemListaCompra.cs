namespace CasaDoTerno.Domain.Entities;

// Categoria da lista de compras (ex.: Camisa social, Calça de brim, Insumos). O usuário cadastra as dele.
public class CategoriaListaCompra
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
}

// Um item que precisa ser comprado (lista de compras do mês).
// Não confundir com ItemCompra, que é o item de um lançamento de compra já feito.
public class ItemListaCompra
{
    public int Id { get; set; }

    public int CategoriaCompraId { get; set; }

    public string Descricao { get; set; } = "";
    public string? Tamanho { get; set; }
    public string? Cor { get; set; }

    public int Quantidade { get; set; } = 1;

    // valor de UMA unidade (o total é Quantidade x ValorEstimado)
    public decimal ValorEstimado { get; set; }

    public bool Comprado { get; set; }
    public DateTime? DataCompra { get; set; }

    // mês da lista, no formato "2026-10". Item pendente de um mês antigo continua aparecendo nos meses seguintes.
    public string Mes { get; set; } = "";

    // preenchido quando o item veio da sugestão do estoque (evita sugerir duas vezes)
    public int? ProdutoId { get; set; }

    public DateTime CriadoEm { get; set; }
    public string? CriadoPor { get; set; }
}