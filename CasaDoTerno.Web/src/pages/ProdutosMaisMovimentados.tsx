import { useEffect, useState } from "react";
import api from "../Services/API";

interface ProdutoMovimentado {
  produtoId: number;
  modelo: string;
  referencia: string | null;
  quantidadeLocacoes: number;
  quantidadeVendida: number;
  totalMovimentacoes: number;
}

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split("T")[0];
}

function hojeISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function ProdutosMaisMovimentados() {
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMes());
  const [dataFim, setDataFim] = useState(hojeISO());
  const [resultado, setResultado] = useState<ProdutoMovimentado[]>([]);
  const [carregando, setCarregando] = useState(false);

  function buscar() {
    setCarregando(true);
    api
      .get<ProdutoMovimentado[]>(
        `/Relatorios/produtos-mais-movimentados?dataInicio=${dataInicio}&dataFim=${dataFim}`
      )
      .then((r) => setResultado(r.data))
      .catch((erro) => console.error(erro))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    buscar();
  }, []);

  const maiorTotal = Math.max(...resultado.map((p) => p.totalMovimentacoes), 1);

  return (
    <div>
      <h1>Produtos Mais Alugados/Vendidos</h1>

      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
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
      </div>

      {resultado.length === 0 && !carregando && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhuma movimentação nesse período.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {resultado.map((produto, index) => (
          <div key={produto.produtoId} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: "var(--texto-suave)", fontWeight: 700, marginRight: 8 }}>
                  #{index + 1}
                </span>
                <strong>{produto.referencia ? `${produto.referencia} — ` : ""}{produto.modelo}</strong>
              </div>
              <div style={{ fontWeight: 700, color: "var(--verde)" }}>
                {produto.totalMovimentacoes} movimentações
              </div>
            </div>

            <div style={{ marginTop: 8, background: "var(--chumbo-input)", borderRadius: 6, height: 8, overflow: "hidden" }}>
              <div
                style={{
                  width: `${(produto.totalMovimentacoes / maiorTotal) * 100}%`,
                  background: "var(--verde)",
                  height: "100%",
                }}
              />
            </div>

            <div style={{ marginTop: 8, fontSize: 13, color: "var(--texto-suave)" }}>
              {produto.quantidadeLocacoes} locações · {produto.quantidadeVendida} vendidos
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}