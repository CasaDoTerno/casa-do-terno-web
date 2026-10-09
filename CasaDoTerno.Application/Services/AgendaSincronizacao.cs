using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Application.Utils;
using CasaDoTerno.Domain.Entities;
using System.Text.RegularExpressions;
using Google;
using Google.Apis.Calendar.v3.Data;

namespace CasaDoTerno.Application.Services;

// Mantém o sistema e o Google Agenda iguais, nos dois sentidos:
//  - sistema -> Google: cria, remarca e apaga eventos
//  - Google -> sistema: arrastar um evento remarca a retirada; apagar um evento cancela o agendamento
//  - reservas dos clientes (página de agendamento do Google) viram agendamentos no sistema;
//    se o cliente remarcar ou cancelar pelo Google, o sistema acompanha
public class AgendaSincronizacao
{
    private static readonly SemaphoreSlim _emAndamento = new(1, 1);
    private static DateTime _ultimaExecucaoUtc = DateTime.MinValue;

    private readonly ICasaDoTernoContext _context;
    private readonly GoogleAgendaClient _google;
    private readonly AgendaService _agenda;
    private readonly LocacaoService _locacoes;
    private readonly AgendaOpcoes _opcoes;

    private const string MarcaBloco = "— CASA DO TERNO (preenchido pelo sistema) —";

    public AgendaSincronizacao(
        ICasaDoTernoContext context, GoogleAgendaClient google, AgendaService agenda,
        LocacaoService locacoes, AgendaOpcoes opcoes)
    {
        _opcoes = opcoes;
        _context = context;
        _google = google;
        _agenda = agenda;
        _locacoes = locacoes;
    }

    public record ResultadoSync(int Enviados, int Cancelados, int Remarcados, int Recusados, int Importados);

    private static readonly ResultadoSync Vazio = new(0, 0, 0, 0, 0);

    public async Task<ResultadoSync> SincronizarAsync(bool forcar = false)
    {
        if (!_google.Ativo) return Vazio;

        // não bate no Google a cada clique: no máximo uma vez a cada 30 segundos
        if (!forcar && (DateTime.UtcNow - _ultimaExecucaoUtc).TotalSeconds < 30) return Vazio;
        if (!await _emAndamento.WaitAsync(0)) return Vazio;

        try
        {
            _ultimaExecucaoUtc = DateTime.UtcNow;
            var desde = FusoHorario.HojeBrasilia().AddDays(-1);

            CancelarAgendamentosDeLocacoesCanceladas(desde);
            int enviados = await EnviarPendentesAsync(desde);
            var (cancelados, remarcados, recusados, importados) = await TrazerDoGoogleAsync(desde);

            return new ResultadoSync(enviados, cancelados, remarcados, recusados, importados);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Agenda] Falha na sincronização: {ex.Message}");
            return Vazio;
        }
        finally
        {
            _emAndamento.Release();
        }
    }

    // ---------------------------------------------------------------- sistema -> Google

    // locação cancelada no sistema = agendamento cancelado (o evento é apagado no próximo envio)
    private void CancelarAgendamentosDeLocacoesCanceladas(DateTime desde)
    {
        var ativos = _context.Agendamentos
            .Where(a => a.Status == StatusAgendamento.Ativo && a.LocacaoId != null && a.Inicio >= desde)
            .ToList();
        if (ativos.Count == 0) return;

        var ids = ativos.Select(a => a.LocacaoId!.Value).ToList();
        var canceladas = _context.Locacoes
            .Where(l => ids.Contains(l.Id) && l.DataCancelamento != null)
            .Select(l => l.Id)
            .ToList();

        foreach (var agendamento in ativos.Where(a => canceladas.Contains(a.LocacaoId!.Value)))
        {
            agendamento.Status = StatusAgendamento.Cancelado;
            agendamento.PrecisaSincronizar = true;
        }
        _context.SaveChanges();
    }

    private async Task<int> EnviarPendentesAsync(DateTime desde)
    {
        var pendentes = _context.Agendamentos
            .Where(a => a.Inicio >= desde &&
                        (a.PrecisaSincronizar || (a.Status == StatusAgendamento.Ativo && a.GoogleEventId == null)))
            .ToList();

        foreach (var agendamento in pendentes)
            await PublicarInternoAsync(agendamento);

        if (pendentes.Count > 0) _context.SaveChanges();
        return pendentes.Count;
    }

    // chamado logo depois de criar/editar uma locação: manda só esse agendamento, sem esperar a rotina
    public async Task PublicarAsync(int agendamentoId)
    {
        if (!_google.Ativo) return;
        try
        {
            var agendamento = _context.Agendamentos.Find(agendamentoId);
            if (agendamento == null) return;
            await PublicarInternoAsync(agendamento);
            _context.SaveChanges();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Agenda] Falha ao publicar agendamento {agendamentoId}: {ex.Message}");
        }
    }

    private async Task PublicarInternoAsync(Agendamento agendamento)
    {
        try
        {
            if (agendamento.Status == StatusAgendamento.Cancelado)
            {
                if (agendamento.GoogleEventId != null)
                    await _google.ExcluirAsync(agendamento.GoogleEventId);
                agendamento.GoogleEventId = null;
                agendamento.PrecisaSincronizar = false;
                return;
            }

            // reserva feita pelo cliente: NÃO reescreve o evento dele, só acrescenta os dados da locação
            if (agendamento.Origem == OrigemAgendamento.Google && agendamento.GoogleEventId != null)
            {
                await AtualizarReservaDoClienteAsync(agendamento);
                return;
            }

            var evento = MontarEvento(agendamento, null);

            if (agendamento.GoogleEventId == null)
                agendamento.GoogleEventId = await _google.CriarAsync(evento);
            else
                await _google.AtualizarAsync(agendamento.GoogleEventId, evento);

            agendamento.PrecisaSincronizar = false;
            agendamento.ObservacaoSync = null;
        }
        catch (GoogleApiException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound ||
                                            ex.HttpStatusCode == System.Net.HttpStatusCode.Gone)
        {
            // o evento foi apagado no Google enquanto o sistema tentava atualizar
            agendamento.Status = StatusAgendamento.Cancelado;
            agendamento.GoogleEventId = null;
            agendamento.PrecisaSincronizar = false;
            agendamento.ObservacaoSync = "Evento apagado no Google Agenda.";
        }
        catch (Exception ex)
        {
            // fica marcado como pendente e a rotina tenta de novo em alguns minutos
            var texto = $"Falha ao enviar ao Google: {ex.Message}";
            agendamento.ObservacaoSync = texto.Length > 400 ? texto[..400] : texto;
            Console.WriteLine($"[Agenda] {texto}");
        }
    }

    // evento criado pela página de agendamento do Google: mantém o texto do Google e escreve, no fim,
    // o bloco com os dados da locação (que o sistema reescreve sempre que algo muda)
    private async Task AtualizarReservaDoClienteAsync(Agendamento agendamento)
    {
        var evento = await _google.ObterAsync(agendamento.GoogleEventId!);

        if (evento == null || evento.Status == "cancelled")
        {
            agendamento.Status = StatusAgendamento.Cancelado;
            agendamento.GoogleEventId = null;
            agendamento.PrecisaSincronizar = false;
            agendamento.ObservacaoSync = "Reserva cancelada no Google Agenda.";
            return;
        }

        var texto = evento.Description ?? "";
        var posicao = texto.IndexOf(MarcaBloco, StringComparison.Ordinal);
        if (posicao >= 0) texto = texto[..posicao].TrimEnd();

        var bloco = MontarBlocoDaLocacao(agendamento);
        var novoTexto = bloco == null ? texto : (texto.Length == 0 ? bloco : texto + "\n\n" + bloco);

        await _google.AtualizarAsync(agendamento.GoogleEventId!, new Event
        {
            Description = novoTexto,
            Start = GoogleAgendaClient.ParaGoogle(agendamento.Inicio),
            End = GoogleAgendaClient.ParaGoogle(agendamento.Fim)
        });

        agendamento.PrecisaSincronizar = false;
        agendamento.ObservacaoSync = null;
    }

    private string? MontarBlocoDaLocacao(Agendamento agendamento)
    {
        if (!agendamento.LocacaoId.HasValue) return null;
        var locacao = _context.Locacoes.Find(agendamento.LocacaoId.Value);
        if (locacao == null) return null;

        var cliente = _context.Clientes.Find(locacao.ClienteId);
        int qtdPecas = _context.ItensLocacao.Count(i => i.LocacaoId == locacao.Id);

        var linhas = new List<string>
        {
            MarcaBloco,
            $"Cliente: {cliente?.Nome}",
            $"Telefone: {cliente?.Telefone}",
            $"E-mail: {cliente?.Email}",
            $"Locação nº {locacao.Id} ({qtdPecas} peça(s))",
            $"Data da locação (evento): {locacao.DataEvento:dd/MM/yyyy}",
            $"Retirada: {agendamento.Inicio:dd/MM/yyyy} às {agendamento.Inicio:HH\\:mm}",
            $"Devolução prevista: {locacao.DataDevolucaoPrevista:dd/MM/yyyy}"
        };
        return string.Join("\n", linhas);
    }

    private Event MontarEvento(Agendamento agendamento, string? avisoNoTopo)
    {
        Locacao? locacao = agendamento.LocacaoId.HasValue ? _context.Locacoes.Find(agendamento.LocacaoId.Value) : null;
        if (locacao != null) agendamento.ClienteId = locacao.ClienteId;

        var cliente = agendamento.ClienteId.HasValue ? _context.Clientes.Find(agendamento.ClienteId.Value) : null;
        int qtdPecas = locacao == null ? 0 : _context.ItensLocacao.Count(i => i.LocacaoId == locacao.Id);

        var linhas = new List<string>();
        if (!string.IsNullOrEmpty(avisoNoTopo)) { linhas.Add($"⚠ {avisoNoTopo}"); linhas.Add(""); }

        linhas.Add("RETIRADA DE LOCAÇÃO — Casa do Terno");
        linhas.Add($"Cliente: {cliente?.Nome}");
        linhas.Add($"Telefone: {cliente?.Telefone}");
        linhas.Add($"E-mail: {cliente?.Email}");
        if (locacao != null)
        {
            linhas.Add($"Locação nº {locacao.Id} ({qtdPecas} peça(s))");
            linhas.Add($"Data da locação (evento): {locacao.DataEvento:dd/MM/yyyy}");
            linhas.Add($"Retirada: {agendamento.Inicio:dd/MM/yyyy} às {agendamento.Inicio:HH\\:mm}");
            linhas.Add($"Devolução prevista: {locacao.DataDevolucaoPrevista:dd/MM/yyyy}");
        }
        else
        {
            linhas.Add($"Retirada: {agendamento.Inicio:dd/MM/yyyy} às {agendamento.Inicio:HH\\:mm}");
        }
        linhas.Add("");
        linhas.Add("Para remarcar, arraste este evento para outro horário (máximo de 2 clientes por horário).");
        linhas.Add("Para cancelar o agendamento, apague o evento. O texto acima é reescrito pelo sistema.");

        return new Event
        {
            Summary = $"Retirada — {cliente?.Nome ?? "Cliente"}",
            Description = string.Join("\n", linhas),
            Start = GoogleAgendaClient.ParaGoogle(agendamento.Inicio),
            End = GoogleAgendaClient.ParaGoogle(agendamento.Fim),
            ExtendedProperties = new Event.ExtendedPropertiesData
            {
                Private__ = new Dictionary<string, string>
                {
                    ["origem"] = "casadoterno",
                    ["agendamentoId"] = agendamento.Id.ToString()
                }
            }
        };
    }

    // ---------------------------------------------------------------- Google -> sistema

    private async Task<(int cancelados, int remarcados, int recusados, int importados)> TrazerDoGoogleAsync(DateTime desde)
    {
        int cancelados = 0, remarcados = 0, recusados = 0;

        var eventos = await _google.ListarAsync(desde);
        var porId = eventos.Where(e => e.Id != null).GroupBy(e => e.Id).ToDictionary(g => g.Key, g => g.First());

        var ativos = _context.Agendamentos
            .Where(a => a.Status == StatusAgendamento.Ativo && a.GoogleEventId != null && a.Inicio >= desde)
            .ToList();

        foreach (var agendamento in ativos)
        {
            porId.TryGetValue(agendamento.GoogleEventId!, out var evento);

            // não veio na lista (pode ter sido arrastado pra fora da janela): confere um a um
            if (evento == null)
                evento = await _google.ObterAsync(agendamento.GoogleEventId!);

            if (evento == null || evento.Status == "cancelled")
            {
                agendamento.Status = StatusAgendamento.Cancelado;
                agendamento.GoogleEventId = null;
                agendamento.PrecisaSincronizar = false;
                agendamento.ObservacaoSync = "Evento apagado no Google Agenda.";
                cancelados++;
                continue;
            }

            var novoInicio = GoogleAgendaClient.ParaLocal(evento.Start);
            if (novoInicio == null) continue; // evento de dia inteiro: ignora

            // reserva do cliente: o que ele escolheu na página do Google vale; o sistema só acompanha
            if (agendamento.Origem == OrigemAgendamento.Google)
            {
                var novoFim = GoogleAgendaClient.ParaLocal(evento.End) ?? novoInicio.Value + _agenda.DuracaoDoAgendamento;
                bool mudou = Math.Abs((novoInicio.Value - agendamento.Inicio).TotalMinutes) >= 1 ||
                             Math.Abs((novoFim - agendamento.Fim).TotalMinutes) >= 1;
                if (!mudou) continue;

                string? aviso = null;
                if (agendamento.LocacaoId.HasValue && novoInicio.Value.Date != agendamento.Inicio.Date)
                {
                    var (moveu, motivoMover) = _locacoes.MoverRetirada(agendamento.LocacaoId.Value, novoInicio.Value.Date);
                    if (!moveu)
                        aviso = $"O cliente remarcou para {novoInicio.Value:dd/MM HH\\:mm}, mas a locação não pôde acompanhar: {motivoMover}";
                }

                agendamento.Inicio = novoInicio.Value;
                agendamento.Fim = novoFim;
                agendamento.ObservacaoSync = aviso;
                remarcados++;

                if (agendamento.LocacaoId.HasValue) await PublicarInternoAsync(agendamento); // atualiza o bloco do evento
                continue;
            }

            if (Math.Abs((novoInicio.Value - agendamento.Inicio).TotalMinutes) < 1) continue;

            var (ok, motivo) = TentarRemarcar(agendamento, novoInicio.Value);
            if (ok)
            {
                remarcados++;
                agendamento.ObservacaoSync = null;
                // reescreve título/descrição/duração com os dados do sistema
                await PublicarInternoAsync(agendamento);
            }
            else
            {
                recusados++;
                agendamento.ObservacaoSync = motivo.Length > 400 ? motivo[..400] : motivo;
                await DesfazerNoGoogleAsync(agendamento, motivo);
            }
        }

        _context.SaveChanges();

        int importados = ImportarReservasDosClientes(eventos, desde);
        return (cancelados, remarcados, recusados, importados);
    }

    // ---------------------------------------------------------------- reservas dos clientes (página do Google)

    // reserva do cliente = evento ativo, com horário, que NÃO foi criado pelo sistema e tem um convidado
    private bool EhReservaDeCliente(Event e)
    {
        if (e.Status == "cancelled" || e.Start?.DateTimeDateTimeOffset == null) return false;
        if (e.ExtendedProperties?.Private__ != null && e.ExtendedProperties.Private__.ContainsKey("origem")) return false;
        if (ConvidadoDoEvento(e) == null) return false;

        if (!string.IsNullOrWhiteSpace(_opcoes.TituloReserva) &&
            !(e.Summary ?? "").Contains(_opcoes.TituloReserva, StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }

    private static EventAttendee? ConvidadoDoEvento(Event e) =>
        e.Attendees?.FirstOrDefault(a =>
            a.Organizer != true && a.Self != true && a.Resource != true && !string.IsNullOrWhiteSpace(a.Email));

    // procura um telefone no texto do evento (a pergunta "Telefone" da página de agendamento cai na descrição)
    private static string? TelefoneNoTexto(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto)) return null;
        foreach (Match m in Regex.Matches(texto, @"\+?\d[\d\s().\-]{8,}\d"))
        {
            var digitos = new string(m.Value.Where(char.IsDigit).ToArray());
            if (digitos.Length >= 10 && digitos.Length <= 13) return m.Value.Trim();
        }
        return null;
    }

    private int ImportarReservasDosClientes(List<Event> eventos, DateTime desde)
    {
        if (!_opcoes.ImportarReservas) return 0;

        var conhecidos = _context.Agendamentos
            .Where(a => a.GoogleEventId != null)
            .Select(a => a.GoogleEventId!)
            .ToHashSet();

        int importados = 0;

        foreach (var e in eventos)
        {
            if (e.Id == null || conhecidos.Contains(e.Id) || !EhReservaDeCliente(e)) continue;

            var inicio = GoogleAgendaClient.ParaLocal(e.Start);
            if (inicio == null || inicio.Value < desde) continue;
            var fim = GoogleAgendaClient.ParaLocal(e.End) ?? inicio.Value + _agenda.DuracaoDoAgendamento;

            var convidado = ConvidadoDoEvento(e)!;
            var email = convidado.Email.Trim();
            var emailMinusculo = email.ToLower();

            var nome = !string.IsNullOrWhiteSpace(convidado.DisplayName) ? convidado.DisplayName.Trim() : email.Split('@')[0];

            // se o e-mail já é de um cliente cadastrado, liga direto
            int? clienteId = _context.Clientes
                .Where(c => c.Email != null && c.Email.ToLower() == emailMinusculo)
                .Select(c => (int?)c.Id)
                .FirstOrDefault();

            _context.Agendamentos.Add(new Agendamento
            {
                Origem = OrigemAgendamento.Google,
                ClienteId = clienteId,
                NomeExterno = nome,
                EmailExterno = email,
                TelefoneExterno = TelefoneNoTexto(e.Description),
                Inicio = inicio.Value,
                Fim = fim,
                Status = StatusAgendamento.Ativo,
                GoogleEventId = e.Id,
                PrecisaSincronizar = false,
                CriadoEm = FusoHorario.AgoraBrasilia(),
                CriadoPor = "Google Agenda"
            });
            conhecidos.Add(e.Id);
            importados++;
        }

        if (importados > 0) _context.SaveChanges();
        return importados;
    }

    private (bool ok, string motivo) TentarRemarcar(Agendamento agendamento, DateTime novoInicio)
    {
        lock (AgendaService.TravaAgenda)
        {
            var (ok, mensagem) = _agenda.ValidarHorario(novoInicio, agendamento.Id);
            if (!ok) return (false, mensagem);

            // mudou de DIA: a data de retirada da locação muda junto, se as peças permitirem
            if (agendamento.LocacaoId.HasValue && novoInicio.Date != agendamento.Inicio.Date)
            {
                var (moveu, aviso) = _locacoes.MoverRetirada(agendamento.LocacaoId.Value, novoInicio.Date);
                if (!moveu) return (false, aviso);
            }

            agendamento.Inicio = novoInicio;
            agendamento.Fim = novoInicio + _agenda.DuracaoDoAgendamento;
            return (true, "ok");
        }
    }

    // a mudança feita no Google foi recusada: devolve o evento pro horário certo e explica no texto
    private async Task DesfazerNoGoogleAsync(Agendamento agendamento, string motivo)
    {
        try
        {
            var evento = MontarEvento(agendamento, $"MUDANÇA RECUSADA: {motivo}");
            await _google.AtualizarAsync(agendamento.GoogleEventId!, evento);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Agenda] Falha ao desfazer mudança no Google: {ex.Message}");
        }
    }
}