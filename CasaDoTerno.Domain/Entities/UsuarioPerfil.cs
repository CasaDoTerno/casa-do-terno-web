namespace CasaDoTerno.Domain.Entities;

public class UsuarioPerfil
{
    public int Id { get; set; }
    public string UsuarioId { get; set; } = ""; // Id do AspNetUsers
    public int PerfilId { get; set; }
}