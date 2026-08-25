using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Domain.Entities;

namespace CasaDoTerno.Application.Services;

public class AuditoriaService
{
    private readonly ICasaDoTernoContext _context;

    public AuditoriaService(ICasaDoTernoContext context)
    {
        _context = context;
    }

    public void Registrar(string? usuario, string acao, string entidade, int entidadeId, string? detalhes = null)
    {
        _context.LogsAuditoria.Add(new LogAuditoria
        {
            Usuario = usuario ?? "desconhecido",
            Acao = acao,
            Entidade = entidade,
            EntidadeId = entidadeId,
            Detalhes = detalhes,
            DataHora = DateTime.Now
        });
        _context.SaveChanges();
    }
}