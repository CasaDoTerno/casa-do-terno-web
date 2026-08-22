using CasaDoTerno.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CasaDoTerno.Tests;

public static class ContextoDeTeste
{
    public static CasaDoTernoContext Criar()
    {
        var opcoes = new DbContextOptionsBuilder<CasaDoTernoContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new CasaDoTernoContext(opcoes);
    }
}