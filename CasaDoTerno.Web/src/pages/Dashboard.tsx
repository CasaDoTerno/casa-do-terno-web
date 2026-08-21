import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, AlertTriangle, DollarSign, Clock } from "lucide-react";
import api from "../Services/API";
import { ehAdmin } from "../Services/permissoes";

interface EntradaDiaria {
  data: string;
  total: number;
}

interface ProdutoMovimentado {
  produtoId: number;
  modelo: string;
  referencia: string | null;
  totalMovimentacoes: number;
}

interface ItemLocacao {
  produtoId: number;
  ajustes: string | null;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataRetirada: string;
  dataRetiradaReal: string | null;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal: string | null;
  pronta: boolean;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
}

interface Produto {
  id: number;
  disponivelParaLocacao: boolean;
}

interface ResumoEstoque {
  disponiveis: number;
  emLocacao: number;
  reservadosAguardandoRetirada: number;
  estoqueBaixo: number;
}

function inicioDoMes(data: Date): string {
  return new Date(data.getFullYear(), data.getMonth(), 1).toISOString().split("T")[0];
}
function fimDoMesAnterior(data: Date): string {
  return new Date(data.getFullYear(), data.getMonth(), 0).toISOString().split("T")[0];
}
function inicioDoMesAnterior(data: Date): string {
  const anterior = new Date(data.getFullYear(), data.getMonth() - 1, 1);
  return anterior.toISOString().split("T")[0];
}

export function Dashboard() {
  const admin = ehAdmin();
  const hoje = new Date();
  const hojeISO = hoje.toISOString().split("T")[0];

  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [resumoEstoque, setResumoEstoque] = useState<ResumoEstoque | null>(null);
  const [entradasMesAtual, setEntradasMesAtual] = useState<EntradaDiaria[]>([]);
  const [totalMesAnterior, setTotalMesAnterior] = useState(0);
  const [meta, setMeta] = useState(0);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [novaMeta, setNovaMeta] = useState("0");
  const [maisMovimentados, setMaisMovimentados] = useState<ProdutoMovimentado[]>([]);

  function carregarLocacoes() {
    api.get<Locacao[]>("/Locacoes").then((r) => setLocacoes(r.data));
  }

  useEffect(() => {
    carregarLocacoes();
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
    api.get<ResumoEstoque>("/Produtos/resumo-estoque").then((r) => setResumoEstoque(r.data));

    api.get(`/Relatorios/entradas-por-dia?dataInicio=${inicioDoMes(hoje)}&dataFim=${hojeISO}`)
      .then((r) => setEntradasMesAtual(r.data));

    api.get(`/Relatorios/entradas-por-dia?dataInicio=${inicioDoMesAnterior(hoje)}&dataFim=${fimDoMesAnterior(hoje)}`)
      .then((r) => {
        const total = r.data.reduce((soma: number, e: EntradaDiaria) => soma + e.total, 0);
        setTotalMesAnterior(total);
      });

    api.get("/Metas/atual").then((r) => {
      setMeta(r.data.valor);
      setNovaMeta(String(r.data.valor));
    });

    api.get(`/Relatorios/produtos-mais-movimentados?dataInicio=${inicioDoMes(hoje)}&dataFim=${hojeISO}`)
      .then((r) => setMaisMovimentados(r.data.slice(0, 5)));
  }, []);

  function nomeCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  async function salvarMeta() {
    await api.put("/Metas/atual", { valor: Number(novaMeta) });
    setMeta(Number(novaMeta));
    setEditandoMeta(false);
  }

  async function confirmarRetiradaAtrasada(id: number) {
    const confirmar = window.confirm("Confirmar a RETIRADA dessa locação atrasada agora?");
    if (!confirmar) return;
    try {
      await api.put(`/Locacoes/${id}/retirada`);
      carregarLocacoes();
    } catch (erro: any) {
      console.error(erro);
      alert(erro.response?.data || "Erro ao registrar retirada.");
    }
  }

  async function confirmarDevolucaoAtrasada(id: number) {
    const confirmar = window.confirm("Confirmar a DEVOLUÇÃO dessa locação atrasada agora?");
    if (!confirmar) return;
    try {
      await api.put(`/Locacoes/${id}/devolucao`);
      carregarLocacoes();
    } catch (erro: any) {
      console.error(erro);
      alert(erro.response?.data || "Erro ao registrar devolução.");
    }
  }

  async function marcarPronta(id: number, pronta: boolean) {
    await api.put(`/Locacoes/${id}/pronta`, pronta);
    carregarLocacoes();
  }



  // ---- cálculos derivados ----

  const totalMesAtual = entradasMesAtual.reduce((soma, e) => soma + e.total, 0);
  const variacaoPercentual =
    totalMesAnterior > 0 ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100 : 0;
  const progressoMeta = meta > 0 ? Math.min((totalMesAtual / meta) * 100, 100) : 0;

  const entradaHoje = entradasMesAtual.find((e) => e.data.split("T")[0] === hojeISO)?.total ?? 0;
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(hoje.getDate() - 6);
  const totalSemana = entradasMesAtual
    .filter((e) => new Date(e.data) >= seteDiasAtras)
    .reduce((soma, e) => soma + e.total, 0);

  const locacoesAbertas = locacoes.filter((l) => l.dataDevolucaoReal === null);

  const retiradasHoje = locacoesAbertas.filter(
    (l) => l.dataRetirada.split("T")[0] === hojeISO && l.dataRetiradaReal === null
  );
  const devolucoesHoje = locacoesAbertas.filter(
    (l) => l.dataDevolucaoPrevista.split("T")[0] === hojeISO
  );

  const ternosSemDisponibilidade = produtos.filter((p) => !p.disponivelParaLocacao).length;

  const ajustesPendentes = locacoesAbertas
    .filter((l) => l.dataRetiradaReal === null)
    .reduce((soma, l) => soma + l.itens.filter((i) => i.ajustes && i.ajustes.trim() !== "").length, 0);

  const atrasadas = locacoesAbertas
    .filter((l) => l.dataDevolucaoPrevista.split("T")[0] < hojeISO)
    .map((l) => {
      const diasAtraso = Math.floor(
        (hoje.getTime() - new Date(l.dataDevolucaoPrevista).getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...l, diasAtraso, multaEstimada: diasAtraso * 50 * l.itens.length };
    })
    .sort((a, b) => b.diasAtraso - a.diasAtraso);

  return (
    <div>
      <h1>Dashboard</h1>

      {/* DESEMPENHO */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <TrendingUp size={20} color="var(--verde)" />
          <strong>Desempenho</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: "var(--texto-suave)", fontSize: 13 }}>Este mês</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>R$ {totalMesAtual.toFixed(2)}</div>
            <div style={{ color: variacaoPercentual >= 0 ? "var(--verde)" : "#f87171", fontSize: 13, fontWeight: 600 }}>
              {variacaoPercentual >= 0 ? "↑" : "↓"} {Math.abs(variacaoPercentual).toFixed(1)}% em relação ao mês passado
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--texto-suave)" }}>
            <span>Meta mensal</span>
            {admin && !editandoMeta && (
              <button
                type="button"
                onClick={() => setEditandoMeta(true)}
                style={{ background: "none", padding: 0, color: "var(--verde)", fontSize: 12 }}
              >
                Editar
              </button>
            )}
          </div>

          {editandoMeta ? (
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input type="number" value={novaMeta} onChange={(e) => setNovaMeta(e.target.value)} />
              <button type="button" onClick={salvarMeta}>Salvar</button>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 700, marginTop: 4 }}>R$ {meta.toFixed(2)}</div>
              <div style={{ background: "var(--chumbo-input)", borderRadius: 6, height: 10, marginTop: 6, overflow: "hidden" }}>
                <div style={{ width: `${progressoMeta}%`, background: "var(--verde)", height: "100%" }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--texto-suave)", marginTop: 4 }}>
                {progressoMeta.toFixed(0)}% da meta atingida
              </div>
            </>
          )}
        </div>
      </div>

      {/* ESTOQUE + FINANCEIRO */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="grid-2">
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={18} color="#f87171" />
            <strong>Estoque</strong>
          </div>
          <p style={{ margin: "6px 0" }}>{resumoEstoque?.estoqueBaixo ?? 0} itens críticos (estoque baixo)</p>
          <p style={{ margin: "6px 0" }}>{ternosSemDisponibilidade} produtos sem disponibilidade</p>
          <p style={{ margin: "6px 0" }}>{ajustesPendentes} ajustes pendentes</p>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <DollarSign size={18} color="var(--verde)" />
            <strong>Resumo Financeiro</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
            <span style={{ color: "var(--texto-suave)" }}>Hoje</span>
            <strong>R$ {entradaHoje.toFixed(2)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
            <span style={{ color: "var(--texto-suave)" }}>Últimos 7 dias</span>
            <strong>R$ {totalSemana.toFixed(2)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
            <span style={{ color: "var(--texto-suave)" }}>Mês</span>
            <strong>R$ {totalMesAtual.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* AGENDA DE HOJE */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Clock size={18} color="var(--verde)" />
          <strong>Agenda de Hoje</strong>
        </div>

        {retiradasHoje.length === 0 && devolucoesHoje.length === 0 && (
          <p style={{ color: "var(--texto-suave)" }}>Nada previsto pra hoje.</p>
        )}

        {retiradasHoje.map((l) => {
          const temAjuste = l.itens.some((i) => i.ajustes && i.ajustes.trim() !== "");
          return (
            <div key={`r-${l.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--borda)" }}>
              <div>
                <Link to={`/locacoes/editar/${l.id}`}>{nomeCliente(l.clienteId)}</Link>
                <span style={{ color: "var(--texto-suave)", fontSize: 13 }}> — Retirada — {l.itens.length} peça(s)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {l.pronta ? (
                  <span style={{ color: "var(--verde)", fontSize: 13 }}>✓ Pronto</span>
                ) : temAjuste ? (
                  <span style={{ color: "#facc15", fontSize: 13 }}>⚠ Ajuste</span>
                ) : (
                  <span style={{ color: "var(--texto-suave)", fontSize: 13 }}>○ Pendente</span>
                )}
                {!l.pronta && (
                  <button type="button" onClick={() => marcarPronta(l.id, true)} style={{ fontSize: 12 }}>
                    Marcar pronto
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {devolucoesHoje.map((l) => (
          <div key={`d-${l.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--borda)" }}>
            <div>
              {nomeCliente(l.clienteId)}
              <span style={{ color: "var(--texto-suave)", fontSize: 13 }}> — Devolução — {l.itens.length} peça(s)</span>
            </div>
          </div>
        ))}
      </div>

      {/* ATRASADOS */}
      {atrasadas.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: "3px solid #f87171" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={18} color="#f87171" />
            <strong>Atrasados ({atrasadas.length})</strong>
          </div>
         {atrasadas.map((l) => {
  const naoRetirada = l.dataRetiradaReal === null;
  return (
    <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--borda)", flexWrap: "wrap", gap: 8 }}>
      <div>
        <Link to={`/locacoes/editar/${l.id}`}>{nomeCliente(l.clienteId)}</Link>
        <span style={{ color: "var(--texto-suave)", fontSize: 13 }}>
          {" "}— {l.itens.length} peça(s) — {l.diasAtraso} dia(s) de atraso
          {naoRetirada && " — nunca retirada"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "#f87171", fontWeight: 700, fontSize: 13 }}>
          Multa estimada: R$ {l.multaEstimada.toFixed(2)}
        </span>
        {naoRetirada ? (
          <button type="button" onClick={() => confirmarRetiradaAtrasada(l.id)} style={{ fontSize: 12 }}>
            Confirmar retirada
          </button>
        ) : (
          <button type="button" onClick={() => confirmarDevolucaoAtrasada(l.id)} style={{ fontSize: 12 }}>
            Confirmar devolução
          </button>
        )}
      </div>
    </div>
  );
})}
        </div>
      )}

      {/* ESTOQUE POR SITUAÇÃO */}
      <h2>Estoque por Situação</h2>
      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div className="card">
          <div style={{ color: "var(--verde)", fontSize: 12 }}>🟢 Disponíveis</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{resumoEstoque?.disponiveis ?? 0}</div>
        </div>
        <div className="card">
          <div style={{ color: "#60a5fa", fontSize: 12 }}>🔵 Em locação</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{resumoEstoque?.emLocacao ?? 0}</div>
        </div>
        <div className="card">
          <div style={{ color: "#facc15", fontSize: 12 }}>🟡 Aguardando retirada</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{resumoEstoque?.reservadosAguardandoRetirada ?? 0}</div>
        </div>
        <div className="card">
          <div style={{ color: "#f87171", fontSize: 12 }}>🔴 Estoque baixo</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{resumoEstoque?.estoqueBaixo ?? 0}</div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <h2>Entradas do mês</h2>
      <div className="card" style={{ height: 240, marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={entradasMesAtual.map((e) => ({ ...e, data: new Date(e.data).toLocaleDateString("pt-BR", { day: "2-digit" }) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--borda)" />
            <XAxis dataKey="data" stroke="var(--texto-suave)" fontSize={12} />
            <YAxis stroke="var(--texto-suave)" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "var(--chumbo-card)", border: "1px solid var(--borda)" }}
              formatter={(valor: any) => [`R$ ${Number(valor ?? 0).toFixed(2)}`, "Entradas"]}
            />
            <Line type="monotone" dataKey="total" stroke="var(--verde)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2>Produtos mais movimentados (mês)</h2>
      <div className="card" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={maisMovimentados} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--borda)" />
            <XAxis type="number" stroke="var(--texto-suave)" fontSize={12} />
            <YAxis type="category" dataKey="modelo" stroke="var(--texto-suave)" fontSize={12} width={120} />
            <Tooltip contentStyle={{ background: "var(--chumbo-card)", border: "1px solid var(--borda)" }} />
            <Bar dataKey="totalMovimentacoes" fill="var(--verde)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}