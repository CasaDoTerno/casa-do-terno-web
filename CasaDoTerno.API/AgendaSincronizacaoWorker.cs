using CasaDoTerno.Application.Services;

namespace CasaDoTerno.API;

// a cada 3 minutos (enquanto o servidor está acordado) confere o Google Agenda
public class AgendaSincronizacaoWorker : BackgroundService
{
    private readonly IServiceProvider _servicos;

    public AgendaSincronizacaoWorker(IServiceProvider servicos)
    {
        _servicos = servicos;
    }

    protected override async Task ExecuteAsync(CancellationToken parar)
    {
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(45), parar);

            while (!parar.IsCancellationRequested)
            {
                try
                {
                    using var escopo = _servicos.CreateScope();
                    var sync = escopo.ServiceProvider.GetRequiredService<AgendaSincronizacao>();
                    await sync.SincronizarAsync(forcar: true);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Agenda] Rotina falhou: {ex.Message}");
                }

                await Task.Delay(TimeSpan.FromMinutes(3), parar);
            }
        }
        catch (OperationCanceledException)
        {
            // servidor desligando
        }
    }
}