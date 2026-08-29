import { useEffect, useState } from "react";
import api from "../Services/API";
import { useNavigate } from "react-router-dom";
import { FileText, Pencil, Printer } from "lucide-react";

interface ItemLocacao {
  produtoId: number;
  ajustes: string | null;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataEvento: string;
  dataRetirada: string;
  dataRetiradaReal: string | null;
  dataCancelamento: string | null;
  valorTotal: number;
  valorEntrada: number;
  valorRestante: number;
  formaPagamentoRestante: number | null;
  pronta: boolean;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  cpf: string;
}

interface Produto {
  id: number;
  modelo: string;
  referencia: string | null;
  cor: string;
  tamanho: string;
}

function inicioDaSemana(data: Date): Date {
  const dia = data.getDay();
  const diferenca = dia === 0 ? -6 : 1 - dia;
  const inicio = new Date(data);
  inicio.setDate(data.getDate() + diferenca);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR");
}

export function Retiradas() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [dataReferencia, setDataReferencia] = useState(() => new Date().toISOString().split("T")[0]);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [busca, setBusca] = useState("");

function carregarLocacoes() {
  api.get<Locacao[]>("/Locacoes").then((resposta) => {
    const pendentes = resposta.data.filter(
      (l) =>
        l.dataCancelamento === null &&
        (l.dataRetiradaReal === null || l.formaPagamentoRestante === null)
    );
    setLocacoes(pendentes);
  });
}
function textoBuscavelDaLocacao(locacao: Locacao) {
  const cliente = clientes.find((c) => c.id === locacao.clienteId);
  if (!cliente) return "";
  return `${cliente.nome} ${cliente.cpf} ${cliente.telefone}`.toLowerCase();
}

  useEffect(() => {
    carregarLocacoes();
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, []);

  function nomeCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  function descricaoProduto(produtoId: number) {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return `Produto #${produtoId}`;
    const codigo = produto.referencia ? `${produto.referencia} — ` : "";
    return `${codigo}${produto.modelo} · ${produto.cor} · Tam. ${produto.tamanho}`;
  }

  async function registrarPagamento(id: number, formaPagamento: number) {
    const confirmar = window.confirm("Confirmar o PAGAMENTO do restante dessa locação?");
    if (!confirmar) return;
    try {
      await api.put(`/Locacoes/${id}/pagamento-restante`, { formaPagamento });
      setMensagem(`Pagamento da locação #${id} registrado com sucesso!`);
      carregarLocacoes();
    } catch (erro: any) {
      setMensagem(erro.response?.data || "Erro ao registrar pagamento.");
    }
  }

async function marcarPronta(id: number, pronta: boolean) {
  try {
    await api.put(`/Locacoes/${id}/pronta`, { pronta });
    carregarLocacoes();
  } catch (erro) {
    console.error(erro);
    setMensagem("Erro ao atualizar status de pronta.");
  }
}
  async function confirmarRetirada(id: number) {
    const confirmar = window.confirm("Confirmar a RETIRADA física dessa locação?");
    if (!confirmar) return;
    try {
      await api.put(`/Locacoes/${id}/retirada`);
      setMensagem(`Retirada da locação #${id} registrada com sucesso!`);
      carregarLocacoes();
    } catch (erro: any) {
      setMensagem(erro.response?.data || "Erro ao registrar retirada.");
    }
  }
  async function cancelarLocacao(id: number) {
  const confirmar = window.confirm(
    "Tem certeza que quer CANCELAR essa locação?\n\nIsso não pode ser desfeito. O valor de entrada já pago não é reembolsado."
  );
  if (!confirmar) return;
  try {
    await api.put(`/Locacoes/${id}/cancelar`);
    setMensagem(`Locação #${id} cancelada.`);
    carregarLocacoes();
  } catch (erro: any) {
    setMensagem(erro.response?.data || "Erro ao cancelar locação.");
  }
}

  const inicio = inicioDaSemana(new Date(dataReferencia + "T00:00:00"));
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);

  const locacoesDaSemana = mostrarTodas
    ? locacoes
    : locacoes.filter((l) => {
        const evento = new Date(l.dataEvento);
        return evento >= inicio && evento <= fim;
      });

const locacoesFiltradas = locacoesDaSemana.filter((locacao) => {
  if (!busca) return true;
  const palavras = busca.toLowerCase().split(" ").filter((p) => p.length > 0);
  const texto = textoBuscavelDaLocacao(locacao);
  return palavras.every((palavra) => texto.includes(palavra));
});

const locacoesOrdenadas = [...locacoesFiltradas].sort((a, b) => {
    const eventoA = new Date(a.dataEvento).getTime();
    const eventoB = new Date(b.dataEvento).getTime();
    if (eventoA !== eventoB) return eventoA - eventoB;

    const retiradaA = new Date(a.dataRetirada).getTime();
    const retiradaB = new Date(b.dataRetirada).getTime();
    return retiradaA - retiradaB;
  });
  const navigate = useNavigate();
  return (
    <div>
      <h1>Retiradas e Pagamentos Pendentes</h1>

<div className="card" style={{ marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
  <div className="campo">
    <label>Buscar por nome, CPF ou telefone</label>
    <input
      type="text"
      placeholder="Digite pra buscar..."
      value={busca}
      onChange={(e) => setBusca(e.target.value)}
    />
  </div>
  <div className="campo">
    <label>Semana de referência</label>
          <input
            type="date"
            value={dataReferencia}
            onChange={(e) => setDataReferencia(e.target.value)}
            disabled={mostrarTodas}
          />
        </div>

        <div className="campo">
          <label style={{ visibility: "hidden" }}>.</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 38 }}>
            <input
              type="checkbox"
              id="mostrar-todas"
              checked={mostrarTodas}
              onChange={(e) => setMostrarTodas(e.target.checked)}
              style={{ width: "auto" }}
            />
            <label htmlFor="mostrar-todas" style={{ margin: 0 }}>Mostrar todas as pendências</label>
          </div>
        </div>
      </div>

      {!mostrarTodas && (
        <p style={{ color: "var(--texto-suave)", marginTop: -8, marginBottom: 20 }}>
          Semana de {formatarData(inicio)} a {formatarData(fim)} — eventos nesse período
        </p>
      )}

      {mensagem && <p>{mensagem}</p>}

      {locacoesOrdenadas.length === 0 && (
        <p style={{ color: "var(--texto-suave)" }}>Nada pendente nesse período.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {locacoesOrdenadas.map((locacao) => (
          <div key={locacao.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{nomeCliente(locacao.clienteId)}</div>
                <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                  Locação #{locacao.id} — evento em {locacao.dataEvento.split("T")[0]}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Retirada prevista</div>
                <div style={{ fontWeight: 600 }}>{locacao.dataRetirada.split("T")[0]}</div>
              </div>
            </div>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--borda)" }}>
              {locacao.itens.map((item, index) => (
                <div key={index} style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                  • {descricaoProduto(item.produtoId)}
                  {item.ajustes && ` — ${item.ajustes}`}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              {locacao.pronta ? (
                <>
                  <span style={{ color: "var(--verde)", fontSize: 13 }}>✓ Pronta pra retirada</span>
                  <button type="button" onClick={() => marcarPronta(locacao.id, false)} style={{ fontSize: 12 }}>
                    Desmarcar
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => marcarPronta(locacao.id, true)} style={{ fontSize: 12 }}>
                  Marcar como pronta
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid var(--borda)",
              }}
            >
              <div>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Total</div>
                <div style={{ fontWeight: 600 }}>R$ {locacao.valorTotal.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Entrada paga</div>
                <div style={{ fontWeight: 600 }}>R$ {locacao.valorEntrada.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Restante</div>
                <div style={{ fontWeight: 600, color: locacao.formaPagamentoRestante === null ? "#f87171" : "var(--verde)" }}>
                  R$ {locacao.valorRestante.toFixed(2)}
                  {locacao.formaPagamentoRestante !== null && " (pago)"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
              {locacao.formaPagamentoRestante === null && (
                <PagamentoInline onConfirmar={(forma) => registrarPagamento(locacao.id, forma)} />
              )}
              {locacao.dataRetiradaReal === null ? (
                <>
                  <button onClick={() => confirmarRetirada(locacao.id)}>Confirmar retirada</button>
                  <button
                    onClick={() => cancelarLocacao(locacao.id)}
                    style={{ background: "#7f1d1d", color: "#fecaca" }}
                  >
                    Cancelar locação
                  </button>
                </>
              ) : (
                <span style={{ color: "var(--verde)", fontSize: 13 }}>✔ Já retirado</span>
              )}
              <button
                type="button"
                onClick={() => navigate(`/locacoes/editar/${locacao.id}`)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Pencil size={16} /> Editar
              </button>
              <button
                type="button"
                onClick={() => navigate(`/locacoes/imprimir/${locacao.id}`)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Printer size={16} /> Imprimir
              </button>

              <button
                type="button"
                onClick={() => navigate(`/locacoes/contrato/${locacao.id}`)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <FileText size={16} /> Contrato
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PagamentoInline({ onConfirmar }: { onConfirmar: (forma: number) => void }) {
  const [forma, setForma] = useState(0);
  
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <select value={forma} onChange={(e) => setForma(Number(e.target.value))} style={{ width: "auto" }}>
        <option value={0}>Dinheiro</option>
        <option value={1}>Cartão</option>
        <option value={2}>Pix</option>
        <option value={3}>Boleto</option>
      </select>
      <button onClick={() => onConfirmar(forma)}>Registrar pagamento</button>
    </div>
  );
}