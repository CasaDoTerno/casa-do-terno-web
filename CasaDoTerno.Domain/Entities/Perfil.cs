namespace CasaDoTerno.Domain.Entities;

public class Perfil
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
    public string ModulosPermitidos { get; set; } = ""; // ex: "estoque,locacoes,vendas,clientes"
}