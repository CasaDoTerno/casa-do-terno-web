import { useEffect, useState } from "react";
import api from "../Services/API";
import { Logo } from "../components/Logo";

export function Dashboard() {
  const [vendasHoje, setVendasHoje] = useState(0);
  const [locacoesAbertas, setLocacoesAbertas] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [estoqueBaixo, setEstoqueBaixo] = useState(0);

  useEffect(() => {
    const hoje = new Date().toISOString().split("T")[0];

    api.get(`/Relatorios/fechamento-caixa?data=${hoje}`)
      .then((r) => setVendasHoje(r.data.totalEntradas))
      .catch(() => setVendasHoje(0));

    api.get("/Locacoes").then((r) => {
      const abertas = r.data.filter((l: any) => l.dataDevolucaoReal === null);
      setLocacoesAbertas(abertas.length);
    });

    api.get("/Produtos").then((r) => setTotalProdutos(r.data.length));

    api.get("/Produtos/estoque-baixo").then((r) => setEstoqueBaixo(r.data.length));
  }, []);

  return (
    <div>
        <div
        style={{
            background: "var(--chumbo-card)",
            border: "1px solid var(--borda)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            }}
        >
    <Logo tamanho="grande" />
    </div>
      <h1>Dashboard</h1>
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-titulo">Entradas de caixa hoje</div>
          <div className="card-valor">R$ {vendasHoje.toFixed(2)}</div>
        </div>

        <div className="card">
          <div className="card-titulo">Locações em aberto</div>
          <div className="card-valor">{locacoesAbertas}</div>
        </div>

        <div className="card">
          <div className="card-titulo">Produtos cadastrados</div>
          <div className="card-valor">{totalProdutos}</div>
        </div>

        <div className={`card ${estoqueBaixo > 0 ? "card-alerta" : ""}`}>
          <div className="card-titulo">Estoque baixo</div>
          <div className="card-valor">{estoqueBaixo}</div>
        </div>
      </div>
    </div>
  );
}