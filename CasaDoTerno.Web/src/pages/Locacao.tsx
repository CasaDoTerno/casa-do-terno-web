import { useEffect, useState } from "react";
import api from "../Services/API";
import { BuscaSelect } from "../components/BuscaSelect";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
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
  data: string;
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

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato", "Cinto", "Meia", "Relógio", "Gravata"];
const nomesTipoEvento = ["Casamento", "Formatura", "Aniversário"];

// No seu Cliente.cs as medidas são decimal? (número, opcionais) -> false.
const MEDIDAS_SAO_TEXTO = false;

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

export function Locacao() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [clienteId, setClienteId] = useState(0);
  const [dataEvento, setDataEvento] = useState("");
  const [dataRetirada, setDataRetirada] = useState("");
  const [dataDevolucaoPrevista, setDataDevolucaoPrevista] = useState("");
  const [consultor, setConsultor] = useState(localStorage.getItem("emailUsuario") ?? "");
  const [desconto, setDesconto] = useState(0);
  const [valorEntrada, setValorEntrada] = useState(0);
  const [formaPagamentoEntrada, setFormaPagamentoEntrada] = useState(0);
  const [eventoId, setEventoId] = useState(0);
  const [ehPrincipalDoEvento, setEhPrincipalDoEvento] = useState(false);

  const [mostrarNovoEvento, setMostrarNovoEvento] = useState(false);
  const [novoEventoTipo, setNovoEventoTipo] = useState(0);
  const [novoEventoNome, setNovoEventoNome] = useState("");
  const [novoEventoData, setNovoEventoData] = useState("");
  const [salvandoEvento, setSalvandoEvento] = useState(false);

  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteTelefone, setNovoClienteTelefone] = useState("");
  const [novoClienteCpf, setNovoClienteCpf] = useState("");
  const [novoClienteEmail, setNovoClienteEmail] = useState("");
  const [novoClienteEndereco, setNovoClienteEndereco] = useState("");
  const [novoClienteAbdomen, setNovoClienteAbdomen] = useState("");
  const [novoClienteBainha, setNovoClienteBainha] = useState("");
  const [novoClienteCintura, setNovoClienteCintura] = useState("");
  const [novoClienteManga, setNovoClienteManga] = useState("");
  const [novoClienteOmbro, setNovoClienteOmbro] = useState("");
  const [novoClientePanturrilha, setNovoClientePanturrilha] = useState("");
  const [novoClienteCoxa, setNovoClienteCoxa] = useState("");
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  // Hora da retirada (agenda)
  const [horaRetirada, setHoraRetirada] = useState("");
  const [horarios, setHorarios] = useState<HorarioAgenda[]>([]);
  const [agendaAberta, setAgendaAberta] = useState(true);
  const [agendaMensagem, setAgendaMensagem] = useState("");
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [mostrarModalHorarios, setMostrarModalHorarios] = useState(false);

  // Caixa de aviso no meio da tela
  const [aviso, setAviso] = useState<AvisoModal | null>(null);

  const [produtoSelecionado, setProdutoSelecionado] = useState(0);
  const [ajustesPeca, setAjustesPeca] = useState("");
  const [valorPeca, setValorPeca] = useState(0);
  const [pecas, setPecas] = useState<PecaCarrinho[]>([]);

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

  function buscarEventos() {
    api.get<Evento[]>("/Eventos").then((r) => setEventos(r.data));
  }

  function buscarClientes() {
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }

  useEffect(() => {
    buscarProdutos();
    buscarClientes();
    buscarEventos();
    api.get<Usuario[]>("/Usuarios/lista-simples").then((r) => setUsuarios(r.data));
  }, []);

  function buscarHorarios(data: string) {
    if (!data) {
      setHorarios([]);
      setAgendaMensagem("");
      setAgendaAberta(true);
      return Promise.resolve();
    }
    setCarregandoHorarios(true);
    return api
      .get("/Agendamentos/horarios", { params: { data } })
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

  useEffect(() => {
    setHoraRetirada("");
    buscarHorarios(dataRetirada);

    // abre a grade de horários assim que a data de retirada é preenchida
    // (espera um pouco pra não abrir enquanto a data ainda está sendo digitada)
    const agora = new Date();
    const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
    if (!dataRetirada || dataRetirada < hoje) return;

    const espera = setTimeout(() => setMostrarModalHorarios(true), 400);
    return () => clearTimeout(espera);
  }, [dataRetirada]);

  useEffect(() => {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (produto) {
      setValorPeca(produto.valorLocacao);
    }
  }, [produtoSelecionado, produtos]);

  const hojeISO = new Date().toISOString().split("T")[0];
  const eventosFuturos = eventos
    .filter((ev) => ev.data.split("T")[0] >= hojeISO)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  async function salvarNovoEvento() {
    if (!novoEventoNome || !novoEventoData) {
      setAviso({ titulo: "Dados do evento incompletos", mensagem: "Preencha nome e data do evento antes de salvar." });
      return;
    }

    setSalvandoEvento(true);
    try {
      const resposta = await api.post("/Eventos", {
        tipo: novoEventoTipo,
        nome: novoEventoNome,
        data: novoEventoData,
        observacao: "",
      });

      const eventoCriado: Evento = resposta.data;
      setEventos((atual) => [...atual, eventoCriado]);
      setEventoId(eventoCriado.id);

      setNovoEventoNome("");
      setNovoEventoData("");
      setNovoEventoTipo(0);
      setMostrarNovoEvento(false);
      setMensagem("Evento criado e já selecionado!");
    } catch (erro: any) {
      console.error(erro);
      setAviso({
        titulo: "Não foi possível criar o evento",
        mensagem: typeof erro.response?.data === "string" ? erro.response.data : "Erro ao criar evento.",
      });
    } finally {
      setSalvandoEvento(false);
    }
  }

  function medida(valor: string) {
    if (MEDIDAS_SAO_TEXTO) return valor;
    const n = Number(valor.replace(",", "."));
    return valor.trim() === "" || Number.isNaN(n) ? null : n;
  }

  async function salvarNovoCliente() {
    if (!novoClienteNome || !novoClienteTelefone || !novoClienteCpf) {
      setAviso({
        titulo: "Dados do cliente incompletos",
        mensagem: "Preencha nome, telefone e CPF antes de salvar o cliente.",
      });
      return;
    }

    setSalvandoCliente(true);
    try {
      const resposta = await api.post("/Clientes", {
        nome: novoClienteNome,
        telefone: novoClienteTelefone,
        cpf: novoClienteCpf,
        email: novoClienteEmail,
        endereco: novoClienteEndereco,
        abdomen: medida(novoClienteAbdomen),
        bainha: medida(novoClienteBainha),
        cintura: medida(novoClienteCintura),
        manga: medida(novoClienteManga),
        ombro: medida(novoClienteOmbro),
        panturrilha: medida(novoClientePanturrilha),
        coxa: medida(novoClienteCoxa),
      });

      const clienteCriado: Cliente = resposta.data;
      setClientes((atual) => [...atual, clienteCriado]);
      setClienteId(clienteCriado.id);

      setNovoClienteNome("");
      setNovoClienteTelefone("");
      setNovoClienteCpf("");
      setNovoClienteEmail("");
      setNovoClienteEndereco("");
      setNovoClienteAbdomen("");
      setNovoClienteBainha("");
      setNovoClienteCintura("");
      setNovoClienteManga("");
      setNovoClienteOmbro("");
      setNovoClientePanturrilha("");
      setNovoClienteCoxa("");
      setMostrarNovoCliente(false);
      setMensagem("Cliente cadastrado e já selecionado!");
    } catch (erro: any) {
      console.error(erro);
      setAviso({
        titulo: "Não foi possível cadastrar o cliente",
        mensagem: typeof erro.response?.data === "string" ? erro.response.data : "Erro ao cadastrar cliente.",
      });
    } finally {
      setSalvandoCliente(false);
    }
  }

  async function adicionarPeca() {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    if (!dataRetirada || !dataDevolucaoPrevista) {
      setAviso({
        titulo: "Faltam as datas",
        mensagem: "Preencha as datas de retirada e devolução antes de adicionar peças.",
      });
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
        setAviso({
          titulo: "Peça indisponível",
          mensagem: resposta.data.mensagem,
          dica: "Ajuste a data de retirada ou de devolução, ou escolha outra peça.",
        });
        return;
      }
    } catch (erro) {
      console.error(erro);
      setAviso({
        titulo: "Erro ao verificar a peça",
        mensagem: "Não foi possível verificar a disponibilidade dessa peça. Tente novamente.",
      });
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

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    if (pecas.length === 0) {
      setAviso({ titulo: "Faltam as peças", mensagem: "Adicione pelo menos uma peça antes de confirmar." });
      return;
    }

    if (dataRetirada > dataEvento) {
      setAviso({ titulo: "Data inválida", mensagem: "A data de retirada não pode ser depois da data do evento." });
      return;
    }

    if (dataDevolucaoPrevista < dataRetirada) {
      setAviso({ titulo: "Data inválida", mensagem: "A data de devolução não pode ser antes da data de retirada." });
      return;
    }

    const confirmar = window.confirm(
      `Confirmar a criação dessa locação?\n\nTotal: R$ ${valorTotal.toFixed(2)}\nPeças: ${pecas.length}` +
        (horaRetirada ? `\nRetirada às ${horaRetirada}` : "")
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
          ? `Locação criada com sucesso! Retirada agendada às ${horaRetirada}.`
          : "Locação criada com sucesso!"
      );
      setHoraRetirada("");
      buscarHorarios(dataRetirada);
      setPecas([]);
      setDesconto(0);
      setValorEntrada(0);
      setEventoId(0);
      setEhPrincipalDoEvento(false);
    } catch (erro: any) {
      console.error(erro);
      const texto = typeof erro.response?.data === "string" ? erro.response.data : "Erro ao criar locação.";
      if (erro.response?.status === 409) {
        setAviso({
          titulo: "Horário indisponível",
          mensagem: texto,
          dica: "Escolha outro horário de retirada. A locação NÃO foi criada.",
        });
        setHoraRetirada("");
        buscarHorarios(dataRetirada);
      } else {
        setAviso({ titulo: "Não foi possível criar a locação", mensagem: texto });
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
            <label>Cliente</label>
            <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <BuscaSelect
                  opcoes={clientes.map((c) => ({ id: c.id, label: c.nome }))}
                  valorSelecionado={clienteId}
                  onSelecionar={setClienteId}
                  onAbrir={buscarClientes}
                  placeholder="Buscar cliente..."
                />
              </div>
              <button
                type="button"
                onClick={() => setMostrarNovoCliente(!mostrarNovoCliente)}
                style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", flexShrink: 0 }}
              >
              <Plus size={16} /> Novo
              </button>
            </div>
          </div>

          {mostrarNovoCliente && (
            <div className="card" style={{ marginTop: 12, background: "var(--chumbo-input)" }}>
              <strong style={{ fontSize: 13 }}>Cadastro rápido de cliente</strong>
              <div className="grid-3" style={{ marginTop: 8 }}>
                <div>
                  <label>Nome</label>
                  <input
                    value={novoClienteNome}
                    onChange={(e) => setNovoClienteNome(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label>Telefone</label>
                  <input
                    value={novoClienteTelefone}
                    onChange={(e) => setNovoClienteTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label>CPF</label>
                  <input
                    value={novoClienteCpf}
                    onChange={(e) => setNovoClienteCpf(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              <div className="grid-2" style={{ marginTop: 8 }}>
                <div>
                  <label>E-mail</label>
                  <input
                    type="email"
                    value={novoClienteEmail}
                    onChange={(e) => setNovoClienteEmail(e.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div>
                  <label>Endereço</label>
                  <input
                    value={novoClienteEndereco}
                    onChange={(e) => setNovoClienteEndereco(e.target.value)}
                    placeholder="Rua, número, bairro"
                  />
                </div>
              </div>
              <strong style={{ fontSize: 13, display: "block", marginTop: 12 }}>Medidas (opcional)</strong>
              <div className="grid-3" style={{ marginTop: 8 }}>
                <div>
                  <label>Abdômen</label>
                  <input value={novoClienteAbdomen} onChange={(e) => setNovoClienteAbdomen(e.target.value)} />
                </div>
                <div>
                  <label>Bainha</label>
                  <input value={novoClienteBainha} onChange={(e) => setNovoClienteBainha(e.target.value)} />
                </div>
                <div>
                  <label>Cintura</label>
                  <input value={novoClienteCintura} onChange={(e) => setNovoClienteCintura(e.target.value)} />
                </div>
                <div>
                  <label>Manga</label>
                  <input value={novoClienteManga} onChange={(e) => setNovoClienteManga(e.target.value)} />
                </div>
                <div>
                  <label>Ombro</label>
                  <input value={novoClienteOmbro} onChange={(e) => setNovoClienteOmbro(e.target.value)} />
                </div>
                <div>
                  <label>Panturrilha</label>
                  <input value={novoClientePanturrilha} onChange={(e) => setNovoClientePanturrilha(e.target.value)} />
                </div>
                <div>
                  <label>Coxa</label>
                  <input value={novoClienteCoxa} onChange={(e) => setNovoClienteCoxa(e.target.value)} />
                </div>
              </div>
              <button
                type="button"
                onClick={salvarNovoCliente}
                disabled={salvandoCliente}
                style={{ marginTop: 8 }}
              >
                {salvandoCliente ? "Salvando..." : "Salvar cliente e selecionar"}
              </button>
            </div>
          )}

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
            <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <BuscaSelect
                  opcoes={eventosFuturos.map((ev) => ({
                    id: ev.id,
                    label: `${ev.nome} — ${new Date(ev.data).toLocaleDateString("pt-BR")}`,
                  }))}
                  valorSelecionado={eventoId}
                  onSelecionar={setEventoId}
                  onAbrir={buscarEventos}
                  placeholder="Buscar evento (opcional)..."
                />
              </div>
              <button
                type="button"
                onClick={() => setMostrarNovoEvento(!mostrarNovoEvento)}
                style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", flexShrink: 0 }}
              >
                <Plus size={16} /> Novo
              </button>
            </div>
          </div>

          {mostrarNovoEvento && (
            <div className="card" style={{ marginTop: 12, background: "var(--chumbo-input)" }}>
              <strong style={{ fontSize: 13 }}>Cadastro rápido de evento</strong>
              <div className="grid-3" style={{ marginTop: 8 }}>
                <div>
                  <label>Tipo</label>
                  <select value={novoEventoTipo} onChange={(e) => setNovoEventoTipo(Number(e.target.value))}>
                    {nomesTipoEvento.map((nome, index) => (
                      <option key={index} value={index}>{nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Nome</label>
                  <input
                    value={novoEventoNome}
                    onChange={(e) => setNovoEventoNome(e.target.value)}
                    placeholder="ex: Casamento João e Maria"
                  />
                </div>
                <div>
                  <label>Data</label>
                  <input
                    type="date"
                    value={novoEventoData}
                    onChange={(e) => setNovoEventoData(e.target.value)}
                    min={hojeISO}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={salvarNovoEvento}
                disabled={salvandoEvento}
                style={{ marginTop: 12 }}
              >
                {salvandoEvento ? "Salvando..." : "Salvar evento e selecionar"}
              </button>
            </div>
          )}

          {eventoId !== 0 && (
            <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
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
                    buscarHorarios(dataRetirada);
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
                  Sem horário marcado — a retirada não entra na agenda.
                </p>
              )}
            </div>
          )}
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
    </div>
  );
}