import { useEffect, useState } from "react";
import api from "../Services/API";
import { BuscaSelect } from "../components/BuscaSelect";
import { ModalAviso } from "../components/ModalAviso";
import { ModalNovoCliente } from "../components/ModalNovoCliente";
import { useNavigate } from "react-router-dom";

interface Produto {
  id: number;
  modelo: string;
  categoria: number;
  referencia: string | null;
  cor: string;
  tamanho: string;
  valorLocacao: number;
  disponivelParaLocacao: boolean;
}

interface Evento {
  id: number;
  nome: string;
}

interface Cliente {
  id: number;
  nome: string;
}

interface Usuario {
  id: string;
  email: string;
}

interface PecaCarrinho {
  produtoId: number;
  modelo: string;
  referencia: string | null;
  cor: string;
  tamanho: string;
  ajustes: string;
  valorLocacao: number;
}

interface HorarioAgenda {
  hora: string;
  vagasRestantes: number;
  disponivel: boolean;
  motivo: string | null;
}

interface AvisoTela {
  titulo: string;
  mensagem: string;
  dica?: string;
}

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato", "Cinto", "Meia", "Relógio", "Gravata"];

function textoDoErro(erro: any, padrao: string): string {
  const dados = erro?.response?.data;
  return typeof dados === "string" && dados ? dados : padrao;
}

export function Locacao() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [clienteId, setClienteId] = useState(0);
  const [dataEvento, setDataEvento] = useState("");
  const [dataRetirada, setDataRetirada] = useState("");
  const [horaRetirada, setHoraRetirada] = useState("");
  const [dataDevolucaoPrevista, setDataDevolucaoPrevista] = useState("");
  const [consultor, setConsultor] = useState(localStorage.getItem("emailUsuario") ?? "");
  const [desconto, setDesconto] = useState(0);
  const [valorEntrada, setValorEntrada] = useState(0);
  const [formaPagamentoEntrada, setFormaPagamentoEntrada] = useState(0);
  const [eventoId, setEventoId] = useState(0);
  const [ehPrincipalDoEvento, setEhPrincipalDoEvento] = useState(false);

  const [produtoSelecionado, setProdutoSelecionado] = useState(0);
  const [ajustesPeca, setAjustesPeca] = useState("");
  const [valorPeca, setValorPeca] = useState(0);
  const [pecas, setPecas] = useState<PecaCarrinho[]>([]);

  const [horarios, setHorarios] = useState<HorarioAgenda[]>([]);
  const [agendaAberta, setAgendaAberta] = useState(true);
  const [agendaMensagem, setAgendaMensagem] = useState("");
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  const [aviso, setAviso] = useState<AvisoTela | null>(null);
  const [novoClienteAberto, setNovoClienteAberto] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [locacaoCriadaId, setLocacaoCriadaId] = useState<number | null>(null);
  const navigate = useNavigate();

  function buscarProdutos() {
    api.get<Produto[]>("/Produtos").then((r) => {
      const disponiveis = r.data
        .filter((p) => p.disponivelParaLocacao)
        .sort((a, b) => (a.referencia || "").localeCompare(b.referencia || ""));
      setProdutos(disponiveis);
    });
  }

  function buscarClientes() {
    return api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }

  useEffect(() => {
    buscarProdutos();
    buscarClientes();
    api.get<Evento[]>("/Eventos").then((r) => setEventos(r.data));
    api.get<Usuario[]>("/Usuarios/lista-simples").then((r) => setUsuarios(r.data));
  }, []);

  useEffect(() => {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (produto) {
      setValorPeca(produto.valorLocacao);
    }
  }, [produtoSelecionado, produtos]);

  // ---- horários da agenda: recarrega quando a data de retirada muda ----

  function buscarHorarios(data: string) {
    if (!data) {
      setHorarios([]);
      return;
    }
    setCarregandoHorarios(true);
    api
      .get<{ aberto: boolean; mensagem: string | null; horarios: HorarioAgenda[] }>("/Agendamentos/horarios", {
        params: { data },
      })
      .then((r) => {
        setAgendaAberta(r.data.aberto);
        setAgendaMensagem(r.data.mensagem ?? "");
        setHorarios(r.data.horarios);
        // se o horário que estava escolhido ficou lotado, limpa
        setHoraRetirada((atual) => {
          const h = r.data.horarios.find((x) => x.hora === atual);
          return h && h.disponivel ? atual : "";
        });
      })
      .catch(() => {
        setHorarios([]);
        setAgendaAberta(true);
        setAgendaMensagem("Não foi possível consultar a agenda agora. Você pode salvar sem horário marcado.");
      })
      .finally(() => setCarregandoHorarios(false));
  }

  useEffect(() => {
    setHoraRetirada("");
    buscarHorarios(dataRetirada);
  }, [dataRetirada]);

  function avisar(titulo: string, texto: string, dica?: string) {
    setAviso({ titulo, mensagem: texto, dica });
  }

  async function adicionarPeca() {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    if (!dataRetirada || !dataDevolucaoPrevista) {
      avisar(
        "Faltam as datas",
        "Preencha as datas de retirada e devolução antes de adicionar peças.",
        "A disponibilidade da peça depende desse período."
      );
      return;
    }

    const unidadesJaNoCarrinho = pecas.filter((p) => p.produtoId === produto.id).length;

    try {
      const resposta = await api.get("/Locacoes/verificar-disponibilidade", {
        params: {
          produtoId: produto.id,
          dataRetirada,
          dataDevolucaoPrevista,
          unidadesJaNoCarrinho,
        },
      });

      if (!resposta.data.disponivel) {
        avisar(
          "Peça indisponível",
          resposta.data.mensagem,
          "Ajuste a data de retirada ou de devolução, ou escolha outra peça."
        );
        return;
      }
    } catch (erro) {
      console.error(erro);
      avisar("Erro ao verificar a peça", "Não foi possível verificar a disponibilidade dessa peça.", "Tente de novo.");
      return;
    }

    setMensagem("");
    setPecas([
      ...pecas,
      {
        produtoId: produto.id,
        modelo: produto.modelo,
        referencia: produto.referencia,
        cor: produto.cor,
        tamanho: produto.tamanho,
        ajustes: ajustesPeca,
        valorLocacao: valorPeca,
      },
    ]);
    setProdutoSelecionado(0);
    setAjustesPeca("");
    setValorPeca(0);
  }

  function removerPeca(index: number) {
    setPecas(pecas.filter((_, i) => i !== index));
  }

  async function clienteCriado(novoId: number) {
    try {
      await buscarClientes();
    } catch (erro) {
      console.error(erro);
    }
    setClienteId(novoId);
    setNovoClienteAberto(false);
  }

  const subtotal = pecas.reduce((soma, peca) => soma + peca.valorLocacao, 0);
  const valorTotal = subtotal - desconto;
  const valorRestante = valorTotal - valorEntrada;

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    if (clienteId === 0) {
      avisar("Falta o cliente", "Escolha um cliente ou clique em \"+ Novo cliente\" para cadastrar.");
      return;
    }

    if (pecas.length === 0) {
      avisar("Nenhuma peça", "Adicione pelo menos uma peça antes de confirmar.");
      return;
    }

    if (dataRetirada > dataEvento) {
      avisar("Datas incorretas", "A data de retirada não pode ser depois da data do evento.");
      return;
    }

    if (dataDevolucaoPrevista < dataRetirada) {
      avisar("Datas incorretas", "A data de devolução não pode ser antes da data de retirada.");
      return;
    }

    const textoHora = horaRetirada ? `\nRetirada: ${horaRetirada} (vai para a agenda)` : "\nSem horário marcado na agenda";
    const confirmar = window.confirm(
      `Confirmar a criação dessa locação?\n\nTotal: R$ ${valorTotal.toFixed(2)}\nPeças: ${pecas.length}${textoHora}`
    );
    if (!confirmar) return;

    setEnviando(true);
    try {
      const resposta = await api.post("/Locacoes", {
        clienteId,
        dataEvento,
        dataRetirada,
        horaRetirada: horaRetirada || null,
        dataDevolucaoPrevista,
        consultor,
        desconto,
        valorEntrada,
        formaPagamentoEntrada,
        eventoId: eventoId === 0 ? null : eventoId,
        ehLocacaoPrincipalDoEvento: ehPrincipalDoEvento,
        itens: pecas.map((p) => ({
          produtoId: p.produtoId,
          ajustes: p.ajustes,
          valorItem: p.valorLocacao,
        })),
      });
      setLocacaoCriadaId(resposta.data.id);
      setMensagem(
        horaRetirada
          ? `Locação criada com sucesso! Retirada agendada para ${horaRetirada}.`
          : "Locação criada com sucesso!"
      );
      setPecas([]);
      setDesconto(0);
      setValorEntrada(0);
      setEventoId(0);
      setEhPrincipalDoEvento(false);
      setHoraRetirada("");
      buscarHorarios(dataRetirada);
    } catch (erro: any) {
      console.error(erro);
      if (erro.response?.status === 409) {
        // horário da agenda lotado ou fora do expediente
        avisar(
          "Horário indisponível",
          textoDoErro(erro, "Esse horário não está disponível."),
          "Escolha outro horário de retirada e confirme de novo."
        );
        setHoraRetirada("");
        buscarHorarios(dataRetirada);
      } else {
        avisar("Não foi possível salvar a locação", textoDoErro(erro, "Erro ao criar locação."));
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Nova Locação</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>

        <h2>Dados gerais</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <label style={{ margin: 0 }}>Cliente</label>
              <button type="button" onClick={() => setNovoClienteAberto(true)}>
                + Novo cliente
              </button>
            </div>
            <BuscaSelect
              opcoes={clientes.map((c) => ({ id: c.id, label: c.nome }))}
              valorSelecionado={clienteId}
              onSelecionar={setClienteId}
              placeholder="Buscar cliente..."
            />
          </div>
          <div>
            <label>Consultor</label>
            <select value={consultor} onChange={(e) => setConsultor(e.target.value)}>
              <option value="">Selecione...</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.email}>{u.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Evento (opcional)</label>
            <select value={eventoId} onChange={(e) => setEventoId(Number(e.target.value))}>
              <option value={0}>Nenhum</option>
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.nome}</option>
              ))}
            </select>
          </div>

          {eventoId !== 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <input
                type="checkbox"
                checked={ehPrincipalDoEvento}
                onChange={(e) => setEhPrincipalDoEvento(e.target.checked)}
                style={{ width: "auto" }}
                id="peca-principal"
              />
              <label htmlFor="peca-principal" style={{ margin: 0 }}>
                Essa é a peça principal do evento (recebe o desconto acumulado — ex: o terno do noivo)
              </label>
            </div>
          )}

          {eventoId !== 0 && (
            <p style={{ color: "var(--texto-suave)", fontSize: 13, margin: "8px 0 0 0" }}>
              Vinculado a um evento — a peça marcada como "principal" ganha R$ 10 de desconto a cada
              nova locação que se vincular ao mesmo evento. Confira o valor atualizado na listagem de Locações.
            </p>
          )}

          <div className="grid-3" style={{ marginTop: 12 }}>
            <div>
              <label>Data do evento</label>
              <input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} required />
            </div>
            <div>
              <label>Retirada (dia)</label>
              <input
                type="date"
                value={dataRetirada}
                onChange={(e) => setDataRetirada(e.target.value)}
                max={dataEvento || undefined}
                required
              />
            </div>
            <div>
              <label>Devolução prevista</label>
              <input
                type="date"
                value={dataDevolucaoPrevista}
                onChange={(e) => setDataDevolucaoPrevista(e.target.value)}
                min={dataRetirada || undefined}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Hora da retirada (agenda da loja)</label>
            <select
              value={horaRetirada}
              onChange={(e) => setHoraRetirada(e.target.value)}
              onFocus={() => buscarHorarios(dataRetirada)}
              disabled={!dataRetirada || carregandoHorarios || !agendaAberta}
            >
              <option value="">
                {!dataRetirada
                  ? "Escolha o dia da retirada primeiro"
                  : carregandoHorarios
                  ? "Consultando agenda..."
                  : "Sem horário marcado (não vai para a agenda)"}
              </option>
              {horarios.map((h) => (
                <option key={h.hora} value={h.hora} disabled={!h.disponivel}>
                  {h.hora}
                  {h.disponivel
                    ? ` — ${h.vagasRestantes} ${h.vagasRestantes === 1 ? "vaga" : "vagas"}`
                    : h.motivo === "passou"
                    ? " — já passou"
                    : " — lotado"}
                </option>
              ))}
            </select>
            {agendaMensagem && (
              <p style={{ color: agendaAberta ? "var(--texto-suave)" : "#f87171", fontSize: 13, margin: "6px 0 0 0" }}>
                {agendaMensagem}
              </p>
            )}
            {horaRetirada && (
              <p style={{ color: "var(--verde)", fontSize: 13, margin: "6px 0 0 0" }}>
                Vai para a agenda com nome, telefone e e-mail do cliente. Cada horário aceita até 2 clientes.
              </p>
            )}
          </div>
        </div>

        <h2>Peças</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Produto</label>
            <BuscaSelect
              opcoes={produtos.map((p) => ({
                id: p.id,
                label: `${p.referencia ? p.referencia + " · " : ""}${nomesCategoria[p.categoria]} · ${p.modelo} · ${p.cor} · ${p.tamanho} — R$ ${p.valorLocacao}`,
              }))}
              valorSelecionado={produtoSelecionado}
              onSelecionar={setProdutoSelecionado}
              onAbrir={buscarProdutos}
              placeholder="Buscar peça..."
            />
          </div>
          <div className="grid-2">
            <div>
              <label>Ajustes (opcional)</label>
              <input
                value={ajustesPeca}
                onChange={(e) => setAjustesPeca(e.target.value)}
                placeholder="ex: Bainha -2cm, Manga -1cm"
              />
            </div>
            <div>
              <label>Valor dessa peça</label>
              <input
                type="number"
                value={valorPeca}
                onChange={(e) => setValorPeca(Number(e.target.value))}
              />
            </div>
          </div>
          <button type="button" onClick={adicionarPeca} disabled={produtoSelecionado === 0}>
            + Adicionar peça
          </button>

          {pecas.length > 0 && (
            <ul style={{ marginTop: 16 }}>
              {pecas.map((peca, index) => (
                <li key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>
                    {peca.referencia ? `${peca.referencia} — ` : ""}{peca.modelo} · {peca.cor} · Tam. {peca.tamanho} — R$ {peca.valorLocacao}
                    {peca.ajustes && ` — ${peca.ajustes}`}
                  </span>
                  <button type="button" onClick={() => removerPeca(index)}>Remover</button>
                </li>
              ))}
            </ul>
          )}
          {pecas.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nenhuma peça adicionada ainda.</p>}
        </div>

        <h2>Pagamento</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="grid-2">
            <div>
              <label>Desconto (combo)</label>
              <input type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} />
            </div>
            <div>
              <label>Valor de entrada</label>
              <input type="number" value={valorEntrada} onChange={(e) => setValorEntrada(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label>Forma de pagamento da entrada</label>
            <select
              value={formaPagamentoEntrada}
              onChange={(e) => setFormaPagamentoEntrada(Number(e.target.value))}
            >
              <option value={0}>Dinheiro</option>
              <option value={1}>Cartão</option>
              <option value={2}>Pix</option>
              <option value={3}>Boleto</option>
            </select>
          </div>

          <div style={{ borderTop: "1px solid var(--borda)", marginTop: 16, paddingTop: 16 }}>
            <p style={{ color: "var(--texto-suave)", margin: "4px 0" }}>Subtotal: R$ {subtotal.toFixed(2)}</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "4px 0" }}>Total: R$ {valorTotal.toFixed(2)}</p>
            <p style={{ color: "var(--verde)", fontWeight: 600, margin: "4px 0" }}>
              Restante (na retirada): R$ {valorRestante.toFixed(2)}
            </p>
          </div>
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Confirmar locação"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}

      {locacaoCriadaId && (
        <div className="card" style={{ marginTop: 20, borderLeft: "3px solid var(--verde)" }}>
          <p style={{ fontWeight: 700, marginBottom: 12 }}>
            Locação #{locacaoCriadaId} criada! Imprima o contrato agora pra colher a assinatura do cliente:
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => navigate(`/locacoes/contrato/${locacaoCriadaId}`)}>
              Ver Contrato (assinar agora)
            </button>
            <button type="button" onClick={() => navigate(`/locacoes/imprimir/${locacaoCriadaId}`)}>
              Ver Recibo
            </button>
            <button type="button" onClick={() => setLocacaoCriadaId(null)} style={{ background: "var(--chumbo-input)" }}>
              Fazer nova locação
            </button>
          </div>
        </div>
      )}

      {/* os dois pop-ups ficam FORA do <form>, senão o Enter dentro deles enviaria a locação */}
      {novoClienteAberto && (
        <ModalNovoCliente onFechar={() => setNovoClienteAberto(false)} onCriado={clienteCriado} />
      )}

      {aviso && (
        <ModalAviso
          titulo={aviso.titulo}
          mensagem={aviso.mensagem}
          dica={aviso.dica}
          onFechar={() => setAviso(null)}
        />
      )}
    </div>
  );
}