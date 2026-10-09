using CasaDoTerno.Application.Interfaces;
using CasaDoTerno.Application.Utils;
using CasaDoTerno.Domain.Entities;

namespace CasaDoTerno.Application.Services;

public class AgendaService
{
    // trava para que dois atendentes não peguem a última vaga ao mesmo tempo
    public static readonly object TravaAgenda = new();

    private readonly ICasaDoTernoContext _context;
    private readonly AgendaOpcoes _opcoes;

    public AgendaService(ICasaDoTernoContext context, AgendaOpcoes opcoes)
    {
        _context = context;
        _opcoes = opcoes;
    }

    public record HorarioAgenda(string Hora, int VagasRestantes, bool Disponivel, string? Motivo);

    private TimeSpan Abertura => TimeSpan.Parse(_opcoes.HoraAbertura);
    private TimeSpan Fechamento => TimeSpan.Parse(_opcoes.HoraFechamento);
    private TimeSpan Duracao => TimeSpan.FromMinutes(_opcoes.DuracaoMinutos);

    public TimeSpan DuracaoDoAgendamento => Duracao;

    private static int Contar(List<Agendamento> existentes, DateTime inicio, DateTime fim, int? ignorarId) =>
        existentes.Count(a => (!ignorarId.HasValue || a.Id != ignorarId.Value) && a.Inicio < fim && inicio < a.Fim);

    private List<Agendamento> AtivosProximos(DateTime inicio, DateTime fim)
    {
        var de = inicio.AddDays(-1);
        var ate = fim.AddDays(1);
        return _context.Agendamentos
            .Where(a => a.Status == StatusAgendamento.Ativo && a.Inicio >= de && a.Inicio <= ate)
            .ToList();
    }

    // período cadastrado em "Dias sem atendimento" que cobre esse dia (feriado, férias...)
    private DiaSemAtendimento? DiaSemAtendimentoEm(DateTime dia) =>
        _context.DiasSemAtendimento.FirstOrDefault(d => d.DataInicio <= dia && d.DataFim >= dia);

    private static string NomeDoDia(DateTime data) => data.DayOfWeek switch
    {
        DayOfWeek.Sunday => "domingo",
        DayOfWeek.Monday => "segunda-feira",
        DayOfWeek.Tuesday => "terça-feira",
        DayOfWeek.Wednesday => "quarta-feira",
        DayOfWeek.Thursday => "quinta-feira",
        DayOfWeek.Friday => "sexta-feira",
        _ => "sábado"
    };

    // lista os horários do dia com as vagas que sobraram (alimenta o modal de horários)
    public (bool aberto, string? mensagem, List<HorarioAgenda> horarios) ListarHorarios(DateTime data, int? ignorarId)
    {
        var dia = data.Date;
        var lista = new List<HorarioAgenda>();

        var bloqueio = DiaSemAtendimentoEm(dia);
        if (bloqueio != null)
            return (false, $"A loja não atende em {dia:dd/MM/yyyy}: {bloqueio.Motivo}. Escolha outro dia de retirada.", lista);

        if (!_opcoes.DiasEfetivos.Contains((int)dia.DayOfWeek))
            return (false, $"A loja não atende em {NomeDoDia(dia)}. Escolha outro dia de retirada.", lista);

        var agora = FusoHorario.AgoraBrasilia();
        var existentes = AtivosProximos(dia, dia.AddDays(1));

        for (var t = Abertura; t + Duracao <= Fechamento; t += Duracao)
        {
            var inicio = dia + t;
            var fim = inicio + Duracao;
            var hora = t.ToString(@"hh\:mm");

            if (inicio <= agora)
            {
                lista.Add(new HorarioAgenda(hora, 0, false, "passou"));
                continue;
            }

            int vagas = Math.Max(0, _opcoes.VagasPorHorario - Contar(existentes, inicio, fim, ignorarId));
            lista.Add(new HorarioAgenda(hora, vagas, vagas > 0, vagas > 0 ? null : "lotado"));
        }

        return (true, null, lista);
    }

    // todas as regras de um horário: dia sem atendimento, expediente, passado, grade de 30 min e vagas
    public (bool ok, string mensagem) ValidarHorario(DateTime inicio, int? ignorarId)
    {
        var fim = inicio + Duracao;

        var bloqueio = DiaSemAtendimentoEm(inicio.Date);
        if (bloqueio != null)
            return (false, $"A loja não atende em {inicio:dd/MM/yyyy}: {bloqueio.Motivo}. Escolha outro dia de retirada.");

        if (!_opcoes.DiasEfetivos.Contains((int)inicio.DayOfWeek))
            return (false, $"A loja não atende em {NomeDoDia(inicio)}. Escolha outro dia de retirada.");

        if (inicio.TimeOfDay < Abertura || fim.TimeOfDay > Fechamento || fim.Date != inicio.Date)
            return (false, $"Horário fora do expediente ({Abertura:hh\\:mm} às {Fechamento:hh\\:mm}).");

        if (inicio.Second != 0 || inicio.TimeOfDay.TotalMinutes % _opcoes.DuracaoMinutos != 0)
            return (false, $"Use horários de {_opcoes.DuracaoMinutos} em {_opcoes.DuracaoMinutos} minutos.");

        if (inicio <= FusoHorario.AgoraBrasilia())
            return (false, $"O horário {inicio:HH\\:mm} do dia {inicio:dd/MM/yyyy} já passou.");

        int ocupadas = Contar(AtivosProximos(inicio, fim), inicio, fim, ignorarId);
        if (ocupadas >= _opcoes.VagasPorHorario)
            return (false,
                $"O horário das {inicio:HH\\:mm} do dia {inicio:dd/MM/yyyy} não está disponível: " +
                $"já tem {ocupadas} cliente(s) agendado(s) (limite de {_opcoes.VagasPorHorario} por horário).");

        return (true, "Horário disponível.");
    }

    public (bool ok, string mensagem, Agendamento? agendamento) Reservar(int clienteId, DateTime inicio, string? criadoPor)
    {
        lock (TravaAgenda)
        {
            var (ok, mensagem) = ValidarHorario(inicio, null);
            if (!ok) return (false, mensagem, null);

            var agendamento = new Agendamento
            {
                ClienteId = clienteId,
                Inicio = inicio,
                Fim = inicio + Duracao,
                Status = StatusAgendamento.Ativo,
                PrecisaSincronizar = true,
                CriadoEm = FusoHorario.AgoraBrasilia(),
                CriadoPor = criadoPor
            };

            _context.Agendamentos.Add(agendamento);
            _context.SaveChanges();
            return (true, "Horário reservado.", agendamento);
        }
    }

    // a locação não foi criada: devolve a vaga (o agendamento ainda não tinha ido pro Google)
    public void Descartar(int agendamentoId)
    {
        var agendamento = _context.Agendamentos.Find(agendamentoId);
        if (agendamento == null) return;
        _context.Agendamentos.Remove(agendamento);
        _context.SaveChanges();
    }

    public void VincularLocacao(int agendamentoId, int locacaoId)
    {
        var agendamento = _context.Agendamentos.Find(agendamentoId);
        if (agendamento == null) return;
        agendamento.LocacaoId = locacaoId;
        _context.SaveChanges();
    }

    // ---------------------------------------------------------------- reservas feitas pelo link do Google (não usado se o Google estiver desligado)

    public List<Agendamento> ReservasSemLocacao()
    {
        var hoje = FusoHorario.HojeBrasilia();
        return _context.Agendamentos
            .Where(a => a.Status == StatusAgendamento.Ativo &&
                        a.Origem == OrigemAgendamento.Google &&
                        a.LocacaoId == null &&
                        a.Inicio >= hoje)
            .OrderBy(a => a.Inicio)
            .ToList();
    }

    public (bool ok, string mensagem, Agendamento? reserva) ValidarReservaParaVincular(int agendamentoId, DateTime dataRetirada)
    {
        var reserva = _context.Agendamentos.Find(agendamentoId);

        if (reserva == null || reserva.Status != StatusAgendamento.Ativo)
            return (false, "Essa reserva do cliente foi cancelada (ou removida) no Google Agenda. Escolha outra reserva ou marque o horário manualmente.", null);

        if (reserva.LocacaoId != null)
            return (false, "Essa reserva já está ligada a outra locação.", null);

        if (reserva.Inicio.Date != dataRetirada.Date)
            return (false,
                $"O cliente reservou a retirada para {reserva.Inicio:dd/MM/yyyy} às {reserva.Inicio:HH\\:mm}. " +
                "A data de retirada da locação precisa ser a mesma.", null);

        return (true, "ok", reserva);
    }

    public void VincularReserva(int agendamentoId, int clienteId, int locacaoId)
    {
        var reserva = _context.Agendamentos.Find(agendamentoId);
        if (reserva == null) return;
        reserva.ClienteId = clienteId;
        reserva.LocacaoId = locacaoId;
        reserva.PrecisaSincronizar = true;
        _context.SaveChanges();
    }

    public Agendamento? PorLocacao(int locacaoId) =>
        _context.Agendamentos
            .Where(a => a.LocacaoId == locacaoId && a.Status == StatusAgendamento.Ativo)
            .OrderByDescending(a => a.Id)
            .FirstOrDefault();

    public (bool ok, string mensagem) Reagendar(int agendamentoId, DateTime novoInicio)
    {
        lock (TravaAgenda)
        {
            var agendamento = _context.Agendamentos.Find(agendamentoId);
            if (agendamento == null) return (false, "Agendamento não encontrado.");

            var (ok, mensagem) = ValidarHorario(novoInicio, agendamentoId);
            if (!ok) return (false, mensagem);

            agendamento.Inicio = novoInicio;
            agendamento.Fim = novoInicio + Duracao;
            agendamento.PrecisaSincronizar = true;
            _context.SaveChanges();
            return (true, "Agendamento remarcado.");
        }
    }

    public void Cancelar(int agendamentoId)
    {
        var agendamento = _context.Agendamentos.Find(agendamentoId);
        if (agendamento == null || agendamento.Status == StatusAgendamento.Cancelado) return;
        agendamento.Status = StatusAgendamento.Cancelado;
        agendamento.PrecisaSincronizar = true;
        _context.SaveChanges();
    }
}