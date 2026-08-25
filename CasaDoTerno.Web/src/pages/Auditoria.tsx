import { useEffect, useState } from "react";
import api from "../Services/API";

interface LogAuditoria {
  id: number;
  usuario: string;
  acao: string;
  entidade: string;
  entidadeId: number;
  detalhes: string | null;
  dataHora: string;
}

export function Auditoria() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [entidade, setEntidade] = useState("");
  const [entidadeId, setEntidadeId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [carregando, setCarregando] = useState(false);

  function buscar() {
    setCarregando(true);
    const params: Record<string, string> = {};
    if (entidade) params.entidade = entidade;
    if (entidadeId) params.entidadeId = entidadeId;
    if (dataInicio) params.dataInicio = dataInicio;
    if (dataFim) params.dataFim = dataFim;

    api.get<LogAuditoria[]>("/Auditoria", { params })
      .then((r) => setLogs(r.data))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    buscar();
  }, []);

  return (
    <div>
      <h1>Log de Auditoria</h1>

      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div className="campo">
          <label>Entidade</label>
          <select value={entidade} onChange={(e) => setEntidade(e.target.value)}>
            <option value="">Todas</option>
            <option value="Locacao">Locação</option>
            <option value="Venda">Venda</option>
            <option value="Compra">Compra</option>
          </select>
        </div>
        <div className="campo">
          <label>ID específico (opcional)</label>
          <input value={entidadeId} onChange={(e) => setEntidadeId(e.target.value)} style={{ width: 100 }} />
        </div>
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

      {logs.length === 0 && !carregando && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhum registro encontrado.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {logs.map((log) => (
          <div key={log.id} className="card" style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{log.usuario}</strong>
                <span style={{ color: "var(--texto-suave)" }}> {log.acao.toLowerCase()} </span>
                <strong>{log.entidade} #{log.entidadeId}</strong>
                {log.detalhes && (
                  <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                    {log.detalhes}
                  </div>
                )}
              </div>
              <div style={{ color: "var(--texto-suave)", fontSize: 12, whiteSpace: "nowrap" }}>
                {new Date(log.dataHora).toLocaleString("pt-BR")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}