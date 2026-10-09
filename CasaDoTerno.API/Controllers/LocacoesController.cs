using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasaDoTerno.Domain.Entities;
using CasaDoTerno.Application.Services;
using CasaDoTerno.Infrastructure.Data;

namespace CasaDoTerno.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocacoesController : ControllerBase
{
    private readonly CasaDoTernoContext _context;
    private readonly LocacaoService _locacaoService;
    private readonly AgendaService _agenda;
    private readonly AgendaSincronizacao _sync;

    public LocacoesController(
        CasaDoTernoContext context, LocacaoService locacaoService,
        AgendaService agenda, AgendaSincronizacao sync)
    {
        _context = context;
        _locacaoService = locacaoService;
        _agenda = agenda;
        _sync = sync;
    }

    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Locacoes.Select(l => new
        {
            l.Id,
            l.ClienteId,
            l.DataReserva,
            l.DataEvento,
            l.DataRetirada,
            l.DataRetiradaReal,
            l.DataDevolucaoPrevista,
            l.DataDevolucaoReal,
            l.Consultor,
            l.Desconto,
            l.DescontoEvento,
            l.ValorTotal,
            l.ValorEntrada,
            l.FormaPagamentoEntrada,
            l.DataPagamentoEntrada,
            l.FormaPagamentoRestante,
            l.DataPagamentoRestante,
            l.ValorRestante,
            l.MultaAtraso,
            l.FormaPagamentoMulta,
            l.DataPagamentoMulta,
            l.Pronta,
            l.DataCancelamento,
            l.EventoId,
            l.CriadoPor,
            l.EditadoPor,
            l.DataEdicao,
            Itens = l.Itens
        }).ToList());
    }

    public class NovaLocacaoRequest
    {
        public int ClienteId { get; set; }
        public DateTime DataEvento { get; set; }
        public DateTime DataRetirada { get; set; }
        public string? HoraRetirada { get; set; }   // "14:30". Vazio/nulo = não agenda.
        public int? AgendamentoId { get; set; }     // reserva que o cliente fez pelo link do Google (já traz data e hora)
        public DateTime DataDevolucaoPrevista { get; set; }
        public string? Consultor { get; set; }
        public decimal Desconto { get; set; }
        public decimal ValorEntrada { get; set; }
        public FormaPagamento FormaPagamentoEntrada { get; set; }
        public List<LocacaoService.ItemLocacaoEntrada> Itens { get; set; } = new();
        public int? EventoId { get; set; }
        public bool EhLocacaoPrincipalDoEvento { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] NovaLocacaoRequest request)
    {
        Agendamento? agendamento = null;   // horário reservado agora (se a locação falhar, a vaga é devolvida)
        int? reservaDoClienteId = null;    // reserva do link do Google (nunca é descartada por aqui)

        if (request.AgendamentoId.HasValue)
        {
            // traz o que o cliente mexeu no Google antes de conferir
            await _sync.SincronizarAsync();

            var (okReserva, mensagemReserva, _) = _agenda.ValidarReservaParaVincular(request.AgendamentoId.Value, request.DataRetirada);
            if (!okReserva)
                return Conflict(mensagemReserva);

            reservaDoClienteId = request.AgendamentoId.Value;
        }
        else if (!string.IsNullOrWhiteSpace(request.HoraRetirada))
        {
            if (!TimeSpan.TryParse(request.HoraRetirada, out var hora))
                return BadRequest("Hora de retirada inválida.");

            // traz o que foi mexido direto no Google Agenda antes de conferir a vaga
            await _sync.SincronizarAsync();

            var inicio = request.DataRetirada.Date + hora;
            var (okHorario, mensagemHorario, reservado) = _agenda.Reservar(request.ClienteId, inicio, User.Identity?.Name);
            if (!okHorario)
                return Conflict(mensagemHorario); // 409 = horário indisponível (a tela mostra a caixa de aviso)

            agendamento = reservado;
        }

        (bool sucesso, string mensagem, Locacao? locacao) resultado;
        try
        {
            resultado = _locacaoService.CriarLocacao(
                request.ClienteId, request.DataEvento, request.DataRetirada, request.DataDevolucaoPrevista,
                request.Consultor, request.Desconto, request.ValorEntrada, request.FormaPagamentoEntrada,
                request.EventoId, request.EhLocacaoPrincipalDoEvento, request.Itens);
        }
        catch
        {
            if (agendamento != null) _agenda.Descartar(agendamento.Id);
            throw;
        }

        if (!resultado.sucesso)
        {
            if (agendamento != null) _agenda.Descartar(agendamento.Id); // devolve a vaga
            return BadRequest(resultado.mensagem);
        }

        var locacao = resultado.locacao!;
        locacao.CriadoPor = User.Identity?.Name;
        _context.SaveChanges();

        if (reservaDoClienteId.HasValue)
        {
            _agenda.VincularReserva(reservaDoClienteId.Value, locacao.ClienteId, locacao.Id);
            await _sync.PublicarAsync(reservaDoClienteId.Value); // escreve os dados da locação no evento do cliente
        }
        else if (agendamento != null)
        {
            _agenda.VincularLocacao(agendamento.Id, locacao.Id);
            await _sync.PublicarAsync(agendamento.Id); // cria o evento no Google; se falhar, a rotina tenta de novo
        }

        return Ok(locacao);
    }

    public class MarcarProntaRequest
    {
        public bool Pronta { get; set; }
    }

    [HttpPut("{id}/pronta")]
    public IActionResult MarcarPronta(int id, [FromBody] MarcarProntaRequest request)
    {
        var locacao = _context.Locacoes.Find(id);
        if (locacao == null) return NotFound();

        locacao.Pronta = request.Pronta;
        _context.SaveChanges();
        return Ok(locacao);
    }

    [HttpGet("verificar-disponibilidade")]
    public IActionResult VerificarDisponibilidade(
        [FromQuery] int produtoId,
        [FromQuery] DateTime dataRetirada,
        [FromQuery] DateTime dataDevolucaoPrevista,
        [FromQuery] int? locacaoIdExcluir,
        [FromQuery] int unidadesJaNoCarrinho = 0)
    {
        var (disponivel, mensagem, unidadesDisponiveis) = _locacaoService.VerificarDisponibilidade(
            produtoId, dataRetirada, dataDevolucaoPrevista, locacaoIdExcluir, unidadesJaNoCarrinho);

        return Ok(new { disponivel, mensagem, unidadesDisponiveis });
    }

    [HttpGet("{id}")]
    public IActionResult BuscarPorId(int id)
    {
        var locacao = _context.Locacoes
            .Where(l => l.Id == id)
            .Select(l => new
            {
                l.Id,
                l.ClienteId,
                l.DataReserva,
                l.DataEvento,
                l.DataRetirada,
                l.DataDevolucaoPrevista,
                l.DataRetiradaReal,
                l.DataDevolucaoReal,
                l.Consultor,
                l.Desconto,
                l.DescontoEvento,
                l.ValorTotal,
                l.ValorEntrada,
                l.FormaPagamentoEntrada,
                l.DataPagamentoEntrada,
                l.FormaPagamentoRestante,
                l.DataPagamentoRestante,
                l.MultaAtraso,
                l.FormaPagamentoMulta,
                l.DataPagamentoMulta,
                l.Pronta,
                l.DataCancelamento,
                l.EventoId,
                l.CriadoPor,
                l.EditadoPor,
                l.DataEdicao,
                Itens = l.Itens
            })
            .FirstOrDefault();

        if (locacao == null)
            return NotFound();

        return Ok(locacao);
    }

    public class EditarLocacaoRequest
    {
        public int ClienteId { get; set; }
        public DateTime DataEvento { get; set; }
        public DateTime DataRetirada { get; set; }
        public string? HoraRetirada { get; set; }   // nulo = não mexe na agenda; "" = tirar da agenda
        public DateTime DataDevolucaoPrevista { get; set; }
        public string? Consultor { get; set; }
        public decimal Desconto { get; set; }
        public decimal ValorEntrada { get; set; }
        public FormaPagamento FormaPagamentoEntrada { get; set; }
        public List<LocacaoService.ItemLocacaoEntrada> Itens { get; set; } = new();
        public int? EventoId { get; set; }
        public bool EhLocacaoPrincipalDoEvento { get; set; }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] EditarLocacaoRequest request)
    {
        var atual = _agenda.PorLocacao(id);
        DateTime? novoInicio = null;
        bool tirarDaAgenda = false;

        if (request.HoraRetirada != null)
        {
            if (request.HoraRetirada.Trim() == "")
                tirarDaAgenda = true;
            else if (TimeSpan.TryParse(request.HoraRetirada, out var hora))
                novoInicio = request.DataRetirada.Date + hora;
            else
                return BadRequest("Hora de retirada inválida.");
        }
        else if (atual != null && atual.Inicio.Date != request.DataRetirada.Date)
        {
            // trocou só o dia da retirada: o agendamento acompanha, mantendo a mesma hora
            novoInicio = request.DataRetirada.Date + atual.Inicio.TimeOfDay;
        }

        bool mudouHorario = novoInicio.HasValue && (atual == null || atual.Inicio != novoInicio.Value);

        if (mudouHorario)
        {
            await _sync.SincronizarAsync();
            var (okHorario, mensagemHorario) = _agenda.ValidarHorario(novoInicio!.Value, atual?.Id);
            if (!okHorario)
                return Conflict(mensagemHorario);
        }

        var (sucesso, mensagem, locacao) = _locacaoService.AtualizarLocacao(
            id, request.ClienteId, request.DataEvento, request.DataRetirada, request.DataDevolucaoPrevista,
            request.Consultor, request.Desconto, request.ValorEntrada, request.FormaPagamentoEntrada,
            request.EventoId, request.EhLocacaoPrincipalDoEvento, request.Itens);

        if (!sucesso)
            return BadRequest(mensagem);

        locacao!.EditadoPor = User.Identity?.Name;
        locacao.DataEdicao = DateTime.Now;
        _context.SaveChanges();

        // agenda acompanha a locação
        int? agendamentoId = atual?.Id;

        if (tirarDaAgenda && atual != null)
        {
            _agenda.Cancelar(atual.Id);
        }
        else if (mudouHorario && atual != null)
        {
            _agenda.Reagendar(atual.Id, novoInicio!.Value);
        }
        else if (mudouHorario && atual == null)
        {
            var (okNovo, _, criado) = _agenda.Reservar(locacao.ClienteId, novoInicio!.Value, User.Identity?.Name);
            if (okNovo && criado != null)
            {
                _agenda.VincularLocacao(criado.Id, locacao.Id);
                agendamentoId = criado.Id;
            }
        }

        // reescreve o evento com os dados novos (cliente, datas, peças)
        if (agendamentoId.HasValue)
            await _sync.PublicarAsync(agendamentoId.Value);

        return Ok(locacao);
    }

    public class PagamentoRestanteRequest
    {
        public FormaPagamento FormaPagamento { get; set; }
    }

    [HttpPut("{id}/pagamento-restante")]
    public IActionResult RegistrarPagamentoRestante(int id, [FromBody] PagamentoRestanteRequest request)
    {
        var (sucesso, mensagem) = _locacaoService.RegistrarPagamentoRestante(id, request.FormaPagamento);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(mensagem);
    }

    [HttpPut("{id}/retirada")]
    public IActionResult RegistrarRetirada(int id)
    {
        var (sucesso, mensagem) = _locacaoService.RegistrarRetirada(id);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(mensagem);
    }

    [HttpPut("{id}/desfazer-retirada")]
    public IActionResult DesfazerRetirada(int id)
    {
        var (sucesso, mensagem) = _locacaoService.DesfazerRetirada(id);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(new { mensagem });
    }

    [HttpPut("{id}/devolucao")]
    public IActionResult RegistrarDevolucao(int id)
    {
        var (sucesso, mensagem, multa) = _locacaoService.RegistrarDevolucao(id);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(new { mensagem, multa });
    }

    [HttpPut("{id}/desfazer-devolucao")]
    public IActionResult DesfazerDevolucao(int id)
    {
        var (sucesso, mensagem) = _locacaoService.DesfazerDevolucao(id);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(new { mensagem });
    }

    [HttpPut("{id}/cancelar")]
    public IActionResult Cancelar(int id)
    {
        var (sucesso, mensagem) = _locacaoService.CancelarLocacao(id);

        if (!sucesso)
            return BadRequest(mensagem);

        // o agendamento da agenda é cancelado e o evento some do Google na próxima rotina (até 3 min)
        return Ok(new { mensagem });
    }

    [HttpPut("{id}/isentar-multa")]
    public IActionResult IsentarMulta(int id)
    {
        var (sucesso, mensagem) = _locacaoService.IsentarMulta(id);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(new { mensagem });
    }

    public class PagamentoMultaRequest
    {
        public FormaPagamento FormaPagamento { get; set; }
    }

    [HttpPut("{id}/pagamento-multa")]
    public IActionResult RegistrarPagamentoMulta(int id, [FromBody] PagamentoMultaRequest request)
    {
        var (sucesso, mensagem) = _locacaoService.RegistrarPagamentoMulta(id, request.FormaPagamento);

        if (!sucesso)
            return BadRequest(mensagem);

        return Ok(new { mensagem });
    }
}