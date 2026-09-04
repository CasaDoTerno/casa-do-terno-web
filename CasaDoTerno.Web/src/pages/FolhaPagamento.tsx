import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../Services/API";

interface Falta {
  id: number;
  data: string;
  motivo: string | null;
  abonada: boolean;
}

interface Folha {
  funcionarioId: number;
  nomeFuncionario: string;
  salarioBase: number;
  diasTrabalhados: number;
  salarioProporcional: number;
  quantidadeFaltas: number;
  quantidadeFaltasAbonadas: number;
  valorPorDia: number;
  valorDescontado: number;
  salarioLiquido: number;
}

export function FolhaPagamento() {
  const { id } = useParams();
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());

  const [folha, setFolha] = useState<Folha | null>(null);
  const [faltas, setFaltas] = useState<Falta[]>([]);

  const [novaData, setNovaData] = useState("");
  const [novoMotivo, setNovoMotivo] = useState("");
  const [novaAbonada, setNovaAbonada] = useState(false);
  const [mensagem, setMensagem] = useState("");

  function carregar() {
    api.get<Folha>(`/Funcionarios/${id}/folha-pagamento?mes=${mes}&ano=${ano}`).then((r) => setFolha(r.data));
    api.get<Falta[]>(`/Funcionarios/${id}/faltas?mes=${mes}&ano=${ano}`).then((r) => setFaltas(r.data));
  }

  useEffect(() => {
    carregar();
  }, [id, mes, ano]);

  async function registrarFalta(evento: React.FormEvent) {
    evento.preventDefault();
    if (!novaData) return;

    try {
      await api.post(`/Funcionarios/${id}/faltas`, {
        data: novaData,
        motivo: novoMotivo,
        abonada: novaAbonada,
      });
      setNovaData("");
      setNovoMotivo("");
      setNovaAbonada(false);
      carregar();
    } catch (erro: any) {
      setMensagem(erro.response?.data || "Erro ao registrar falta.");
    }
  }

  async function removerFalta(faltaId: number) {
    const confirmar = window.confirm("Remover essa falta?");
    if (!confirmar) return;
    await api.delete(`/Funcionarios/faltas/${faltaId}`);
    carregar();
  }

  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <div>
      <h1>Folha de Pagamento{folha && ` — ${folha.nomeFuncionario}`}</h1>

      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 16 }}>
        <div className="campo">
          <label>Mês</label>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {nomesMeses.map((nome, index) => (
              <option key={index} value={index + 1}>{nome}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label>Ano</label>
          <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} style={{ width: 100 }} />
        </div>
      </div>

{folha && (
  <div className="card" style={{ marginBottom: 20 }}>
    <p style={{ margin: "4px 0" }}>Salário base: <strong>R$ {folha.salarioBase.toFixed(2)}</strong></p>

    {folha.diasTrabalhados < 30 && (
      <p style={{ margin: "4px 0", color: "#facc15" }}>
        Dias trabalhados no mês: <strong>{folha.diasTrabalhados}/30</strong> — salário proporcional: R$ {folha.salarioProporcional.toFixed(2)}
      </p>
    )}

    <p style={{ margin: "4px 0" }}>Valor por dia: R$ {folha.valorPorDia.toFixed(2)}</p>
    <p style={{ margin: "4px 0" }}>
      Faltas no mês: <strong>{folha.quantidadeFaltas}</strong>
      {folha.quantidadeFaltasAbonadas > 0 && ` (+ ${folha.quantidadeFaltasAbonadas} abonada(s), sem desconto)`}
    </p>
    <p style={{ margin: "4px 0", color: "#f87171" }}>
      Desconto por faltas: -R$ {folha.valorDescontado.toFixed(2)}
    </p>
    <p style={{ fontSize: 20, fontWeight: 800, marginTop: 12, color: "var(--verde)" }}>
      Salário líquido: R$ {folha.salarioLiquido.toFixed(2)}
    </p>
  </div>
)}

      <h2>Registrar falta</h2>
      <form onSubmit={registrarFalta} className="card" style={{ marginBottom: 20, maxWidth: 480 }}>
        <div className="grid-2">
          <div>
            <label>Data</label>
            <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} required />
          </div>
          <div>
            <label>Motivo (opcional)</label>
            <input value={novoMotivo} onChange={(e) => setNovoMotivo(e.target.value)} placeholder="ex: Atestado médico" />
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontWeight: 400 }}>
          <input type="checkbox" checked={novaAbonada} onChange={(e) => setNovaAbonada(e.target.checked)} style={{ width: "auto" }} />
          Abonada (justificada, não desconta do salário)
        </label>
        <button type="submit" style={{ marginTop: 12 }}>Registrar falta</button>
      </form>

      {mensagem && <p>{mensagem}</p>}

      <h2>Faltas do mês</h2>
      {faltas.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nenhuma falta registrada nesse mês.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {faltas.map((falta) => (
          <div key={falta.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{falta.data.split("T")[0]}</strong>
              {falta.motivo && ` — ${falta.motivo}`}
              {falta.abonada && <span style={{ color: "var(--verde)", marginLeft: 8, fontSize: 12 }}>Abonada</span>}
            </div>
            <button type="button" onClick={() => removerFalta(falta.id)}>Remover</button>
          </div>
        ))}
      </div>
    </div>
  );
}