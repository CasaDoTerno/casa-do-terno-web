import { useEffect, useState } from "react";
import api from "../Services/API";
import * as XLSX from "xlsx";

interface ComissaoConsultorDto {
  consultor: string;
  totalVendas: number;
  totalLocacoes: number;
  totalGeral: number;
}

type TipoFiltro = "ambos" | "venda" | "locacao";

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
  const [tipo, setTipo] = useState<TipoFiltro>("ambos");
  const [resultado, setResultado] = useState<ComissaoConsultorDto[]>([]);
  const [carregando, setCarregando] = useState(false);

  function buscar() {
    setCarregando(true);
    api
      .get<ComissaoConsultorDto[]>(
        `/Relatorios/comissao-consultor?dataInicio=${dataInicio}&dataFim=${dataFim}`
      )
      .then((r) => setResultado(r.data))
      .catch((erro) => console.error(erro))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    buscar();
  }, []);

  // decide qual valor "conta" pra comissão, de acordo com o filtro escolhido
  function baseComissao(item: ComissaoConsultorDto): number {
    if (tipo === "venda") return item.totalVendas;
    if (tipo === "locacao") return item.totalLocacoes;
    return item.totalGeral;
  }

  function exportarExcel() {
    const linhas = resultado.map((c) => ({
      Consultor: c.consultor,
      ...(tipo !== "locacao" && { "Total Vendas (R$)": c.totalVendas }),
      ...(tipo !== "venda" && { "Total Locações (R$)": c.totalLocacoes }),
      "Base da Comissão (R$)": baseComissao(c),
      "Comissão (R$)": baseComissao(c) * (percentual / 100),
    }));

    const planilha = XLSX.utils.json_to_sheet(linhas);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, "Comissão");

    const sufixo = tipo === "venda" ? "vendas" : tipo === "locacao" ? "locacoes" : "geral";
    const nomeArquivo = `comissao-consultor-${sufixo}_${dataInicio}_a_${dataFim}.xlsx`;
    XLSX.writeFile(livro, nomeArquivo);
  }

  const totalBaseComissaoPeriodo = resultado.reduce((soma, c) => soma + baseComissao(c), 0);
  const totalComissaoPeriodo = totalBaseComissaoPeriodo * (percentual / 100);

  const rotuloFiltro =
    tipo === "venda" ? "Somente Vendas" : tipo === "locacao" ? "Somente Locações" : "Vendas + Locações";

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
          <label>Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoFiltro)}>
            <option value="ambos">Vendas + Locações</option>
            <option value="venda">Somente Vendas</option>
            <option value="locacao">Somente Locações</option>
          </select>
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
                  Comissão: R$ {(baseComissao(c) * (percentual / 100)).toFixed(2)}
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
              {tipo !== "locacao" && (
                <div>
                  <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Vendas</div>
                  <div style={{ fontWeight: 600 }}>R$ {c.totalVendas.toFixed(2)}</div>
                </div>
              )}
              {tipo !== "venda" && (
                <div>
                  <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Locações</div>
                  <div style={{ fontWeight: 600 }}>R$ {c.totalLocacoes.toFixed(2)}</div>
                </div>
              )}
              {tipo === "ambos" && (
                <div>
                  <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Total geral</div>
                  <div style={{ fontWeight: 600 }}>R$ {c.totalGeral.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {resultado.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ margin: "4px 0" }}>
            Base da comissão ({rotuloFiltro}): <strong>R$ {totalBaseComissaoPeriodo.toFixed(2)}</strong>
          </p>
          <p style={{ margin: "4px 0", color: "var(--verde)" }}>
            Total de comissões ({percentual}% sobre {rotuloFiltro.toLowerCase()}):{" "}
            <strong>R$ {totalComissaoPeriodo.toFixed(2)}</strong>
          </p>
        </div>
      )}
    </div>
  );
}