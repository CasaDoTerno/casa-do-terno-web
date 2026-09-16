import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface Despesa {
  id: number;
  descricao: string;
  categoria: string | null;
  valor: number;
  dataLancamento: string;
  observacao: string | null;
  criadoPor: string | null;
  editadoPor: string | null;
  dataEdicao: string | null;
  despesaRecorrenteId: number | null;
}

export function ListaDespesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mensagem, setMensagem] = useState("");

  function carregarDespesas() {
    api.get<Despesa[]>("/Despesas").then((r) => setDespesas(r.data));
  }

  useEffect(() => {
    carregarDespesas();
  }, []);

  const despesasDoMes = despesas.filter((d) => {
    const data = new Date(d.dataLancamento);
    return data.getMonth() + 1 === mes && data.getFullYear() === ano;
  });

  const despesasOrdenadas = [...despesasDoMes].sort(
    (a, b) => new Date(a.dataLancamento).getTime() - new Date(b.dataLancamento).getTime()
  );

  const totalDoMes = despesasDoMes.reduce((soma, d) => soma + d.valor, 0);

  async function excluirDespesa(id: number) {
    const confirmar = window.confirm("Tem certeza que quer excluir essa despesa?");
    if (!confirmar) return;

    try {
      await api.delete(`/Despesas/${id}`);
      setMensagem("Despesa excluída com sucesso!");
      carregarDespesas();
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao excluir despesa.");
    }
  }

  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const hojeISO = hoje.toISOString().split("T")[0];
  const emTresDias = new Date();
  emTresDias.setDate(hoje.getDate() + 3);
  const emTresDiasISO = emTresDias.toISOString().split("T")[0];

  function statusVencimento(dataLancamento: string): { texto: string; cor: string } | null {
    const dataISO = dataLancamento.split("T")[0];
    if (dataISO < hojeISO) return { texto: "Vencida", cor: "#f87171" };
    if (dataISO <= emTresDiasISO) return { texto: "Vence em breve", cor: "#facc15" };
    return null;
  }

  return (
    <div>
      <h1>Despesas do Mês</h1>

      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
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
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            style={{ width: 100 }}
          />
        </div>
      </div>

      {mensagem && <p>{mensagem}</p>}

      <p style={{ color: "var(--texto-suave)" }}>
        {despesasDoMes.length} despesa(s) — Total do mês: <strong style={{ color: "var(--verde)" }}>R$ {totalDoMes.toFixed(2)}</strong>
      </p>

      {despesasOrdenadas.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nenhuma despesa nesse mês.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {despesasOrdenadas.map((despesa) => {
          const status = statusVencimento(despesa.dataLancamento);
          return (
            <div
              key={despesa.id}
              className="card"
              style={status ? { borderLeft: `3px solid ${status.cor}` } : undefined}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    {despesa.descricao}
                    {despesa.despesaRecorrenteId !== null && (
                      <span style={{ fontSize: 11, color: "var(--texto-suave)", fontWeight: 400 }}>
                        🔁 Recorrente
                      </span>
                    )}
                    {status && (
                      <span style={{ fontSize: 11, color: status.cor, fontWeight: 700 }}>
                        {status.texto}
                      </span>
                    )}
                  </div>
                  <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                    {despesa.categoria && `${despesa.categoria} · `}
                    Vencimento: {new Date(despesa.dataLancamento).toLocaleDateString("pt-BR")}
                    {despesa.observacao && ` · ${despesa.observacao}`}
                  </div>
                  {despesa.criadoPor && (
                    <div style={{ color: "var(--texto-suave)", fontSize: 12, marginTop: 4 }}>
                      Criado por {despesa.criadoPor}
                      {despesa.editadoPor && ` · Editado por ${despesa.editadoPor} em ${new Date(despesa.dataEdicao!).toLocaleDateString("pt-BR")}`}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>R$ {despesa.valor.toFixed(2)}</div>
                  <Link to={`/despesas/editar/${despesa.id}`}>Editar</Link>
                  <button onClick={() => excluirDespesa(despesa.id)}>Excluir</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}