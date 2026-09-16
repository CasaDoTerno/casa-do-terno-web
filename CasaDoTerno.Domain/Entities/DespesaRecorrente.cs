namespace CasaDoTerno.Domain.Entities;

public class DespesaRecorrente
{
    public int Id { get; set; }
    public string Descricao { get; set; } = "";
    public decimal Valor { get; set; }
    public int DiaVencimento { get; set; } // 1 a 31
    public bool Ativa { get; set; } = true;
    public int? UltimoMesGerado { get; set; }
    public int? UltimoAnoGerado { get; set; }
}