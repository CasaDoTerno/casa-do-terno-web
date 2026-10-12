import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Services/API";
import { BuscaSelect } from "../components/BuscaSelect";
import { ModalAviso } from "../components/ModalAviso";
import { ModalHorarios } from "../components/ModalHorarios";

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
  locacaoPrincipalId: number | null;
}

interface Cliente {
  id: number;
  nome: string;
}

interface ClienteDetalhe {
  id: number;
  nome: string;
  telefone: string | null;
  cpf: string | null;
  email: string | null;
  endereco: string | null;
  ombro: number | string | null;
  manga: number | string | null;
  abdomen: number | string | null;
  cintura: number | string | null;
  bainha: number | string | null;
  coxa: number | string | null;
  panturrilha: number | string | null;
}

// medidas do cadastro do cliente que estão preenchidas
function medidasDoCliente(c: ClienteDetalhe | null): { nome: string; valor: string }[] {
  if (!c) return [];
  const todas: [string, number | string | null][] = [
    ["Ombro", c.ombro],
    ["Manga", c.manga],
    ["Abdômen", c.abdomen],
    ["Cintura", c.cintura],
    ["Bainha", c.bainha],
    ["Coxa", c.coxa],
    ["Panturrilha", c.panturrilha],
  ];
  return todas
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([nome, v]) => ({ nome, valor: `${v} cm` }));
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

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato", "Acessorio"];

interface HorarioAgenda {
  hora: string;
  vagasRestantes: number;
  disponivel: boolean;
  motivo: string | null;
}

interface AvisoModal {
  titulo: string;
  mensagem: string;
  dica?: string;
}

export function EditarLocacao() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [clienteId, setClienteId] = useState(0);
  const [dataEvento, setDataEvento] = useState("");
  const [dataRetirada, setDataRetirada] = useState("");
  const [dataDevolucaoPrevista, setDataDevolucaoPrevista] = useState("");
  const [consultor, setConsultor] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [valorEntrada, setValorEntrada] = useState(0);
  const [formaPagamentoEntrada, setFormaPagamentoEntrada] = useState(0);
  const [eventoId, setEventoId] = useState(0);
  const [ehPrincipalDoEvento, setEhPrincipalDoEvento] = useState(false);

  const [produtoSelecionado, setProdutoSelecionado] = useState(0);
  const [ajustesPeca, setAjustesPeca] = useState("");
  const [valorPeca, setValorPeca] = useState(0);
  const [pecas, setPecas] = useState<PecaCarrinho[]>([]);

  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [carregado, setCarregado] = useState(false);
  const [jaRetirada, setJaRetirada] = useState(false);

  // observações gerais da locação (ex: manga = 57 cm / bainha = 90 cm)
  const [clienteDetalhe, setClienteDetalhe] = useState<ClienteDetalhe | null>(null);
  const [observacaoSalva, setObservacaoSalva] = useState("");

  // Hora da retirada (agenda)
  const [dataOriginal, setDataOriginal] = useState("");
  const [agendamentoId, setAgendamentoId] = useState<number | null>(null);
  const [horaOriginal, setHoraOriginal] = useState("");
  const [horaRetirada, setHoraRetirada] = useState("");
  const [horarios, setHorarios] = useState<HorarioAgenda[]>([]);
  const [agendaAberta, setAgendaAberta] = useState(true);
  const [agendaMensagem, setAgendaMensagem] = useState("");
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [mostrarModalHorarios, setMostrarModalHorarios] = useState(false);

  // Caixa de aviso no meio da tela
  const [aviso, setAviso] = useState<AvisoModal | null>(null);

  function buscarProdutos() {
    api.get<Produto[]>("/Produtos").then((r) => {
      const disponiveis = r.data
        .filter((p) => p.disponivelParaLocacao)
        .sort((a, b) => (a.referencia || "").localeCompare(b.referencia || ""));
      setProdutos(disponiveis);
    });
  }

  useEffect(() => {
    buscarProdutos();
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
    api.get<Evento[]>("/Eventos").then((r) => setEventos(r.data));
    api.get<Usuario[]>("/Usuarios/lista-simples").then((r) => setUsuarios(r.data));

    api.get(`/Locacoes/${id}`).then((resposta) => {
      const l = resposta.data;
      setClienteId(l.clienteId);
      setDataEvento(l.dataEvento.split("T")[0]);
      setDataRetirada(l.dataRetirada.split("T")[0]);
      setDataOriginal(l.dataRetirada.split("T")[0]);
      setObservacaoSalva(l.observacao ?? "");
      setDataDevolucaoPrevista(l.dataDevolucaoPrevista.split("T")[0]);
      setConsultor(l.consultor ?? "");
      setDesconto(l.desconto);
      setValorEntrada(l.valorEntrada);
      setFormaPagamentoEntrada(l.formaPagamentoEntrada);
      setEventoId(l.eventoId ?? 0);
      setJaRetirada(l.dataRetiradaReal !== null);
      setPecas(
        l.itens.map((item: any) => ({
          produtoId: item.produtoId,
          modelo: "Carregando...",
          referencia: null,
          cor: "",
          tamanho: "",
          ajustes: item.ajustes ?? "",
          valorLocacao: item.valorItem,
        }))
      );

      // hora de retirada já marcada na agenda (404 = locação sem horário marcado)
      api
        .get(`/Agendamentos/por-locacao/${l.id}`)
        .then((agenda) => {
          setAgendamentoId(agenda.data.id);
          setHoraOriginal(agenda.data.hora);
          setHoraRetirada(agenda.data.hora);
        })
        .catch(() => {});

      if (l.eventoId) {
        api.get(`/Eventos/${l.eventoId}`).then((eventoResposta) => {
          setEhPrincipalDoEvento(eventoResposta.data.locacaoPrincipalId === l.id);
        });
      }

      setCarregado(true);
    });
  }, [id]);

  useEffect(() => {
    if (!carregado || produtos.length === 0) return;
    setPecas((atual) =>
      atual.map((peca) => {
        const produto = produtos.find((p) => p.id === peca.produtoId);
        return produto
          ? { ...peca, modelo: produto.modelo, referencia: produto.referencia, cor: produto.cor, tamanho: produto.tamanho }
          : peca;
      })
    );
  }, [produtos, carregado]);

  // carrega o cadastro completo do cliente escolhido (somente leitura)
  useEffect(() => {
    if (!clienteId) {
      setClienteDetalhe(null);
      return;
    }
    api
      .get<ClienteDetalhe>(`/Clientes/${clienteId}`)
      .then((r) => setClienteDetalhe(r.data))
      .catch((erro) => {
        console.error(erro);
        setClienteDetalhe(null);
      });
  }, [clienteId]);

  function buscarHorarios(data: string, ignorarAgendamentoId: number | null) {
    if (!data) {
      setHorarios([]);
      setAgendaMensagem("");
      setAgendaAberta(true);
      return Promise.resolve();
    }
    setCarregandoHorarios(true);
    return api
      .get("/Agendamentos/horarios", {
        params: { data, agendamentoIdIgnorar: ignorarAgendamentoId ?? undefined },
      })
      .then((r) => {
        setHorarios(r.data.horarios ?? []);
        setAgendaAberta(r.data.aberto !== false);
        setAgendaMensagem(r.data.mensagem ?? "");
      })
      .catch((erro) => {
        console.error(erro);
        setHorarios([]);
        setAgendaAberta(true);
        setAgendaMensagem("Não foi possível consultar a agenda agora.");
      })
      .finally(() => setCarregandoHorarios(false));
  }

  // quando a data de retirada é trocada, mostra a grade de horários daquele dia
  useEffect(() => {
    if (!carregado || !dataRetirada) return;
    buscarHorarios(dataRetirada, agendamentoId);

    const agora = new Date();
    const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
    if (dataRetirada === dataOriginal || dataRetirada < hoje) return;

    const espera = setTimeout(() => setMostrarModalHorarios(true), 400);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRetirada, carregado]);

  useEffect(() => {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (produto) {
      setValorPeca(produto.valorLocacao);
    }
  }, [produtoSelecionado, produtos]);

  async function adicionarPeca() {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    if (!dataRetirada || !dataDevolucaoPrevista) {
      setMensagem("Preencha as datas de retirada e devolução antes de adicionar peças.");
      return;
    }

    const unidadesJaNoCarrinho = pecas.filter((p) => p.produtoId === produto.id).length;

    try {
      const resposta = await api.get("/Locacoes/verificar-disponibilidade", {
        params: {
          produtoId: produto.id,
          dataRetirada,
          dataDevolucaoPrevista,
          locacaoIdExcluir: id,
          unidadesJaNoCarrinho,
        },
      });

      if (!resposta.data.disponivel) {
        setMensagem(resposta.data.mensagem);
        return;
      }
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao verificar disponibilidade dessa peça.");
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

  const subtotal = pecas.reduce((soma, peca) => soma + peca.valorLocacao, 0);
  const valorTotal = subtotal - desconto;
  const valorRestante = valorTotal - valorEntrada;

  // medidas do cadastro viram a observação da locação (fica salva e sai no recibo)
  const medidasCliente = medidasDoCliente(clienteDetalhe);
  const observacao = medidasCliente.map((m) => `${m.nome} = ${m.valor}`).join("\n");

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    if (pecas.length === 0) {
      setMensagem("A locação precisa ter pelo menos uma peça.");
      return;
    }

    const confirmar = window.confirm(
      "Confirmar as alterações dessa locação?" + (horaRetirada ? `\n\nRetirada às ${horaRetirada}` : "")
    );
    if (!confirmar) return;

    setEnviando(true);
    try {
      await api.put(`/Locacoes/${id}`, {
        clienteId,
        dataEvento,
        dataRetirada,
        // null = não mexe na agenda; "" = tira da agenda; "HH:mm" = marca/remarca
        horaRetirada: dataRetirada === dataOriginal && horaRetirada === horaOriginal ? null : horaRetirada,
        // se o cadastro não carregou, mantém a observação que já estava salva
        observacao: clienteDetalhe ? observacao || null : observacaoSalva || null,
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
      setMensagem("Locação atualizada com sucesso!");
      navigate("/retiradas");
    } catch (erro: any) {
      console.error(erro);
      const texto = typeof erro.response?.data === "string" ? erro.response.data : "Erro ao atualizar locação.";
      if (erro.response?.status === 409) {
        setAviso({
          titulo: "Horário indisponível",
          mensagem: texto,
          dica: "Escolha outro horário de retirada. As alterações NÃO foram salvas.",
        });
        setHoraRetirada(dataRetirada === dataOriginal ? horaOriginal : "");
        buscarHorarios(dataRetirada, agendamentoId);
      } else {
        setMensagem(texto);
      }
    } finally {
      setEnviando(false);
    }
  }

  if (jaRetirada) {
    return (
      <div>
        <h1>Editar Locação #{id}</h1>
        <p style={{ color: "#f87171" }}>
          Essa locação já foi retirada e não pode mais ser editada por aqui.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Editar Locação #{id}</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>

        <h2>Dados gerais</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Cliente</label>
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
              <label>Retirada</label>
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

          {dataRetirada && (
            <div style={{ marginTop: 12 }}>
              <label>Hora da retirada (agenda)</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    buscarHorarios(dataRetirada, agendamentoId);
                    setMostrarModalHorarios(true);
                  }}
                >
                  {horaRetirada ? `Retirada às ${horaRetirada} — alterar` : "Escolher horário"}
                </button>
                {horaRetirada && (
                  <button
                    type="button"
                    onClick={() => setHoraRetirada("")}
                    style={{ background: "var(--chumbo-input)" }}
                  >
                    Remover horário
                  </button>
                )}
              </div>
              {!horaRetirada && (
                <p style={{ color: "var(--texto-suave)", fontSize: 13, margin: "4px 0 0 0" }}>
                  {horaOriginal
                    ? "Sem horário — ao salvar, a retirada sai da agenda."
                    : "Sem horário marcado — a retirada não entra na agenda."}
                </p>
              )}
            </div>
          )}
        </div>

        <h2>Peças</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Adicionar peça</label>
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
              <input value={ajustesPeca} onChange={(e) => setAjustesPeca(e.target.value)} />
            </div>
            <div>
              <label>Valor dessa peça</label>
              <input type="number" value={valorPeca} onChange={(e) => setValorPeca(Number(e.target.value))} />
            </div>
          </div>
          <button type="button" onClick={adicionarPeca} disabled={produtoSelecionado === 0}>
            + Adicionar peça
          </button>

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

          <div className="campo" style={{ marginTop: 16 }}>
            <label>Observações gerais (ajustes do cliente)</label>
            <input
              type="text"
              value={medidasCliente.map((m) => `${m.nome} = ${m.valor}`).join("  /  ")}
              placeholder={
                !clienteDetalhe
                  ? "Selecione um cliente para carregar as medidas"
                  : "Cliente sem medidas cadastradas"
              }
              disabled
              readOnly
              style={{ cursor: "not-allowed", opacity: 0.85 }}
            />
          </div>
        </div>

        <h2>Pagamento</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="grid-2">
            <div>
              <label>Desconto</label>
              <input type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} />
            </div>
            <div>
              <label>Valor de entrada</label>
              <input type="number" value={valorEntrada} onChange={(e) => setValorEntrada(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label>Forma de pagamento da entrada</label>
            <select value={formaPagamentoEntrada} onChange={(e) => setFormaPagamentoEntrada(Number(e.target.value))}>
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
              Restante: R$ {valorRestante.toFixed(2)}
            </p>
          </div>
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}

      {mostrarModalHorarios && dataRetirada && (
        <ModalHorarios
          data={dataRetirada}
          horarios={horarios}
          carregando={carregandoHorarios}
          agendaAberta={agendaAberta}
          mensagem={agendaMensagem}
          horaSelecionada={horaRetirada}
          onEscolher={(hora) => {
            setHoraRetirada(hora);
            setMostrarModalHorarios(false);
          }}
          onFechar={() => setMostrarModalHorarios(false)}
        />
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