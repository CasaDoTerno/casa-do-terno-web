import { useEffect, useState } from "react";
import api from "../Services/API";
import * as XLSX from "xlsx";

interface ComissaoConsultor {
  consultor: string;
  totalVendas: number;
  totalLocacoes: number;
  totalGeral: number;
}

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split("T")[0];
}

function hojeISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function ComissaoConsultor() {
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMes());
  const [dataFim, setDataFim] = useState(hojeISO());
  const [percentual, setPercentual] = useState(5);
  const [resultado, setResultado] = useState<ComissaoConsultor[]>([]);
  const [carregando, setCarregando] = useState(false);

  function buscar() {
    setCarregando(true);
    api
      .get<ComissaoConsultor[]>(
        `/Relatorios/comissao-consultor?dataInicio=${dataInicio}&dataFim=${dataFim}`
      )
      .then((r) => setResultado(r.data))
      .catch((erro) => console.error(erro))
      .finally(() => setCarregando(false));
  }
  function exportarExcel() {
  const linhas = resultado.map((c) => ({
    Consultor: c.consultor,
    "Total Vendas (R$)": c.totalVendas,
    "Total Locações (R$)": c.totalLocacoes,
    "Total Geral (R$)": c.totalGeral,
    "Comissão (R$)": c.totalVendas * (percentual / 100),
  }));

  const planilha = XLSX.utils.json_to_sheet(linhas);
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, "Comissão");

  const nomeArquivo = `comissao-consultor_${dataInicio}_a_${dataFim}.xlsx`;
  XLSX.writeFile(livro, nomeArquivo);
}

  useEffect(() => {
    buscar();
  }, []);

  const totalGeralPeriodo = resultado.reduce((soma, c) => soma + c.totalGeral, 0);
  const totalVendasPeriodo = resultado.reduce((soma, c) => soma + c.totalVendas, 0);
  const totalComissaoPeriodo = totalVendasPeriodo * (percentual / 100);

  return (
    <div>
      <h1>Comissão por Consultor</h1>

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
          <label>Comissão (%)</label>
          <input
            type="number"
            value={percentual}
            onChange={(e) => setPercentual(Number(e.target.value))}
            style={{ width: 100 }}
          />
        </div>
        <div className="campo">
  <label style={{ visibility: "hidden" }}>.</label>
  <button onClick={buscar} disabled={carregando}>
    {carregando ? "Buscando..." : "Buscar"}
  </button>
</div>
<div className="campo">
  <label style={{ visibility: "hidden" }}>.</label>
  <button onClick={exportarExcel} disabled={resultado.length === 0} className="no-imprimir">
    Exportar Excel
  </button>
</div>
<div className="campo">
  <label style={{ visibility: "hidden" }}>.</label>
  <button onClick={() => window.print()} disabled={resultado.length === 0} className="no-imprimir">
    Exportar PDF
  </button>
</div>
      </div>

      {resultado.length === 0 && !carregando && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhuma venda ou locação nesse período.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {resultado.map((c) => (
          <div key={c.consultor} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{c.consultor}</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--verde)" }}>
                  Comissão: R$ {(c.totalVendas * (percentual / 100)).toFixed(2)}
                </div>
              </div>
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
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Vendas (com comissão)</div>
                <div style={{ fontWeight: 600 }}>R$ {c.totalVendas.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Locações (sem comissão)</div>
                <div style={{ fontWeight: 600 }}>R$ {c.totalLocacoes.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Total geral</div>
                <div style={{ fontWeight: 600 }}>R$ {c.totalGeral.toFixed(2)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {resultado.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ margin: "4px 0" }}>Total vendido no período: <strong>R$ {totalVendasPeriodo.toFixed(2)}</strong></p>
          <p style={{ margin: "4px 0", color: "var(--texto-suave)" }}>
            (Locações somaram R$ {(totalGeralPeriodo - totalVendasPeriodo).toFixed(2)}, mas não entram na comissão)
          </p>
          <p style={{ margin: "4px 0", color: "var(--verde)" }}>
            Total de comissões ({percentual}% sobre vendas): <strong>R$ {totalComissaoPeriodo.toFixed(2)}</strong>
          </p>
        </div>
      )}
    </div>
  );
}