import { useEffect, useState } from "react";
import api from "../Services/API";

interface ItemLocacao {
  produtoId: number;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataRetirada: string;
  dataRetiradaReal: string | null;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal: string | null;
  dataCancelamento: string | null;
  multaAtraso: number | null;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string | null;
}

interface Produto {
  id: number;
  modelo: string;
  referencia: string | null;
  cor: string;
  tamanho: string;
}

type Situacao = "devolvido" | "atrasado" | "aguardando" | "naoRetirado";
type Filtro = "todos" | "devolvidos" | "pendentes";

// ---------- datas como texto "AAAA-MM-DD" (evita erro de fuso) ----------
function soData(valor: string | null | undefined): string {
  return valor ? valor.split("T")[0] : "";
}

function dataBR(valor: string | null | undefined): string {
  const [ano, mes, dia] = soData(valor).split("-");
  return ano ? `${dia}/${mes}/${ano}` : "—";
}

function paraISO(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function somarDias(iso: string, dias: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

function segundaDaSemana(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const dia = d.getDay();
  return somarDias(iso, dia === 0 ? -6 : 1 - dia);
}

const ESTILO_SITUACAO: Record<Situacao, { texto: string; cor: string }> = {
  devolvido: { texto: "✓ DEVOLVIDO", cor: "#166534" },
  atrasado: { texto: "! ATRASADO", cor: "#b91c1c" },
  aguardando: { texto: "○ AGUARDANDO", cor: "#a16207" },
  naoRetirado: { texto: "– NÃO RETIRADO", cor: "#6b7280" },
};

export function DevolvidosSemana() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [dataReferencia, setDataReferencia] = useState(() => paraISO(new Date()));
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [incluirAtrasados, setIncluirAtrasados] = useState(true);

  useEffect(() => {
    api.get<Locacao[]>("/Locacoes").then((r) => setLocacoes(r.data));
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, []);

  const hoje = paraISO(new Date());
  const inicio = segundaDaSemana(dataReferencia);
  const fim = somarDias(inicio, 6);

  function situacao(l: Locacao): Situacao {
    if (l.dataDevolucaoReal) return "devolvido";
    if (!l.dataRetiradaReal) return "naoRetirado";
    if (soData(l.dataDevolucaoPrevista) < hoje) return "atrasado";
    return "aguardando";
  }

  function nomeCliente(id: number) {
    return clientes.find((c) => c.id === id)?.nome ?? `Cliente #${id}`;
  }

  function telefoneCliente(id: number) {
    return clientes.find((c) => c.id === id)?.telefone ?? "";
  }

  function descricaoProduto(produtoId: number) {
    const p = produtos.find((x) => x.id === produtoId);
    if (!p) return `Produto #${produtoId}`;
    return `${p.referencia ? p.referencia + " — " : ""}${p.modelo} · ${p.cor} · Tam. ${p.tamanho}`;
  }

  // locações canceladas não entram
  const ativas = locacoes.filter((l) => !l.dataCancelamento);

  // da semana: devolução prevista na semana OU devolvida de fato na semana
  const daSemana = ativas.filter((l) => {
    const prevista = soData(l.dataDevolucaoPrevista);
    const real = soData(l.dataDevolucaoReal);
    return (prevista >= inicio && prevista <= fim) || (real !== "" && real >= inicio && real <= fim);
  });

  // atrasados de semanas anteriores (retirados, não devolvidos)
  const atrasadosAntigos = incluirAtrasados
    ? ativas.filter(
        (l) =>
          !daSemana.includes(l) &&
          l.dataRetiradaReal !== null &&
          !l.dataDevolucaoReal &&
          soData(l.dataDevolucaoPrevista) < inicio
      )
    : [];

  const todas = [...atrasadosAntigos, ...daSemana].sort((a, b) =>
    soData(a.dataDevolucaoPrevista).localeCompare(soData(b.dataDevolucaoPrevista))
  );

  const lista = todas.filter((l) => {
    const s = situacao(l);
    if (filtro === "devolvidos") return s === "devolvido";
    if (filtro === "pendentes") return s !== "devolvido";
    return true;
  });

  const qtdDevolvidos = todas.filter((l) => situacao(l) === "devolvido").length;
  const qtdAtrasados = todas.filter((l) => situacao(l) === "atrasado").length;
  const qtdPendentes = todas.length - qtdDevolvidos;
  const totalMultas = todas.reduce((soma, l) => soma + (l.multaAtraso ?? 0), 0);

  return (
    <div className="conteudo">
      <div className="no-imprimir">
        <h1>Ternos Devolvidos</h1>

        <div className="card" style={{ marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="campo">
            <label>Semana de referência</label>
            <input type="date" value={dataReferencia} onChange={(e) => setDataReferencia(e.target.value)} />
          </div>
          <div className="campo">
            <label style={{ visibility: "hidden" }}>.</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setDataReferencia(somarDias(dataReferencia, -7))}>
                ← Semana anterior
              </button>
              <button type="button" onClick={() => setDataReferencia(paraISO(new Date()))}>
                Esta semana
              </button>
              <button type="button" onClick={() => setDataReferencia(somarDias(dataReferencia, 7))}>
                Próxima →
              </button>
            </div>
          </div>
          <div className="campo">
            <label>Mostrar</label>
            <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
              <option value="todos">Todos</option>
              <option value="devolvidos">Só devolvidos</option>
              <option value="pendentes">Só pendentes</option>
            </select>
          </div>
          <div className="campo">
            <label style={{ visibility: "hidden" }}>.</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, fontWeight: 400, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={incluirAtrasados}
                onChange={(e) => setIncluirAtrasados(e.target.checked)}
                style={{ width: "auto", margin: 0 }}
              />
              Incluir atrasados de semanas anteriores
            </label>
          </div>
          <div className="campo">
            <label style={{ visibility: "hidden" }}>.</label>
            <button onClick={() => window.print()} disabled={lista.length === 0}>
              Gerar PDF / Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* esta parte aparece na tela E no PDF */}
      <div className="recibo-titulo" style={{ fontSize: 20, fontWeight: 700 }}>
        Casa do Terno — Devoluções da Semana
      </div>
      <div className="recibo-subtitulo" style={{ marginBottom: 12 }}>
        {dataBR(inicio)} a {dataBR(fim)}
        {filtro === "devolvidos" && " — somente devolvidos"}
        {filtro === "pendentes" && " — somente pendentes"}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Total da semana</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{todas.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Devolvidos</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a" }}>{qtdDevolvidos}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Pendentes</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#ca8a04" }}>{qtdPendentes}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Atrasados</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#dc2626" }}>{qtdAtrasados}</div>
        </div>
        {totalMultas > 0 && (
          <div>
            <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Multas</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>R$ {totalMultas.toFixed(2).replace(".", ",")}</div>
          </div>
        )}
      </div>

      {lista.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nenhuma devolução encontrada nessa semana.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map((l) => {
          const s = situacao(l);
          const estilo = ESTILO_SITUACAO[s];
          return (
            <div key={l.id} className="card" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong style={{ fontSize: 16 }}>{nomeCliente(l.clienteId)}</strong>
                  <span style={{ color: "var(--texto-suave)" }}> · Locação #{l.id}</span>
                  {telefoneCliente(l.clienteId) && (
                    <span style={{ color: "var(--texto-suave)" }}> · {telefoneCliente(l.clienteId)}</span>
                  )}
                </div>
                <strong style={{ color: estilo.cor }}>{estilo.texto}</strong>
              </div>
              <div style={{ marginTop: 4, fontSize: 14 }}>
                Devolução prevista: <strong>{dataBR(l.dataDevolucaoPrevista)}</strong>
                {l.dataDevolucaoReal && (
                  <>
                    {" — "}Devolvido em: <strong>{dataBR(l.dataDevolucaoReal)}</strong>
                  </>
                )}
                {l.dataRetiradaReal && (
                  <>
                    {" — "}Retirado em: {dataBR(l.dataRetiradaReal)}
                  </>
                )}
                {l.multaAtraso !== null && l.multaAtraso > 0 && (
                  <>
                    {" — "}Multa: <strong>R$ {l.multaAtraso.toFixed(2).replace(".", ",")}</strong>
                  </>
                )}
              </div>
              <div style={{ marginTop: 6, fontSize: 14 }}>
                {l.itens.map((item, i) => (
                  <div key={i}>• {descricaoProduto(item.produtoId)}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}