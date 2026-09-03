import { useEffect, useState } from "react";
import api from "../Services/API";

interface PagamentoDetalhado {
  descricao: string;
  valor: number;
  data: string;
}

interface GrupoPagamento {
  tipoPagamento: string;
  itens: PagamentoDetalhado[];
  totalDoTipo: number;
}

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split("T")[0];
}

function hojeISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function RelatorioPagamentos() {
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMes());
  const [dataFim, setDataFim] = useState(hojeISO());
  const [grupos, setGrupos] = useState<GrupoPagamento[]>([]);
  const [carregando, setCarregando] = useState(false);

  function buscar() {
    setCarregando(true);
    api
      .get<GrupoPagamento[]>(`/Relatorios/pagamentos-por-tipo?dataInicio=${dataInicio}&dataFim=${dataFim}`)
      .then((r) => setGrupos(r.data))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    buscar();
  }, []);

  const totalGeral = grupos.reduce((soma, g) => soma + g.totalDoTipo, 0);

  return (
    <div>
      <h1>Relatório de Pagamentos por Tipo</h1>

      <div className="no-imprimir card" style={{ marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div className="campo">
          <label>De</label>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div className="campo">
          <label>Até</label>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
        <div className="campo">
          <label style={{ visibility: "hidden" }}>.</label>
          <button onClick={buscar} disabled={carregando}>
            {carregando ? "Buscando..." : "Buscar"}
          </button>
        </div>
        <div className="campo">
          <label style={{ visibility: "hidden" }}>.</label>
          <button onClick={() => window.print()} disabled={grupos.length === 0}>
            Imprimir
          </button>
        </div>
      </div>

      <p style={{ color: "var(--texto-suave)" }}>
        Período: {new Date(dataInicio).toLocaleDateString("pt-BR")} a {new Date(dataFim).toLocaleDateString("pt-BR")}
      </p>

      {grupos.length === 0 && !carregando && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhum pagamento nesse período.</p>
      )}

      {grupos.map((grupo) => (
        <div key={grupo.tipoPagamento} className="recibo-card card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>{grupo.tipoPagamento}</h2>
            <strong style={{ color: "var(--verde)", fontSize: 18 }}>R$ {grupo.totalDoTipo.toFixed(2)}</strong>
          </div>

          <div style={{ marginTop: 12 }}>
            {grupo.itens.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--borda)",
                  fontSize: 13,
                }}
              >
                <span>
                  {item.descricao}
                  <span style={{ color: "var(--texto-suave)" }}> — {new Date(item.data).toLocaleDateString("pt-BR")}</span>
                </span>
                <strong>R$ {item.valor.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </div>
      ))}

      {grupos.length > 0 && (
        <div className="card" style={{ marginTop: 20, borderTop: "2px solid var(--verde)" }}>
          <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
            Total geral do período: <span style={{ color: "var(--verde)" }}>R$ {totalGeral.toFixed(2)}</span>
          </p>
        </div>
      )}
    </div>
  );
}