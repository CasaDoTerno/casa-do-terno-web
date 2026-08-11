import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface ItemLocacao {
  produtoId: number;
  ajustes: string | null;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataEvento: string;
  dataRetirada: string;
  dataRetiradaReal: string | null;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal: string | null;
  valorTotal: number;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
}

interface Produto {
  id: number;
  modelo: string;
  referencia: string | null;
  cor: string;
  tamanho: string;
}

function statusDaLocacao(locacao: Locacao): { texto: string; cor: string } {
  if (locacao.dataDevolucaoReal !== null) {
    return { texto: "Devolvida", cor: "var(--verde)" };
  }
  if (locacao.dataRetiradaReal !== null) {
    return { texto: "Retirada (aguardando devolução)", cor: "#facc15" };
  }
  return { texto: "Aguardando retirada", cor: "#f87171" };
}

export function Locacoes() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todas");

  useEffect(() => {
    api.get<Locacao[]>("/Locacoes").then((r) =>
      setLocacoes(r.data.sort((a, b) => new Date(b.dataEvento).getTime() - new Date(a.dataEvento).getTime()))
    );
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, []);

  function nomeCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  function descricaoProduto(produtoId: number) {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return `Produto #${produtoId}`;
    const codigo = produto.referencia ? `${produto.referencia} — ` : "";
    return `${codigo}${produto.modelo} · ${produto.cor} · Tam. ${produto.tamanho}`;
  }

  const locacoesFiltradas = locacoes.filter((locacao) => {
    const bateBusca = nomeCliente(locacao.clienteId).toLowerCase().includes(busca.toLowerCase());

    const status = statusDaLocacao(locacao);
    const bateStatus =
      filtroStatus === "todas" ||
      (filtroStatus === "aguardando-retirada" && status.texto === "Aguardando retirada") ||
      (filtroStatus === "aguardando-devolucao" && status.texto.startsWith("Retirada")) ||
      (filtroStatus === "devolvidas" && status.texto === "Devolvida");

    return bateBusca && bateStatus;
  });

  return (
    <div>
      <h1>Locações</h1>

      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div className="campo">
          <label>Buscar por cliente</label>
          <input
            type="text"
            placeholder="Nome do cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Status</label>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="aguardando-retirada">Aguardando retirada</option>
            <option value="aguardando-devolucao">Aguardando devolução</option>
            <option value="devolvidas">Devolvidas</option>
          </select>
        </div>
      </div>

      {locacoesFiltradas.length === 0 && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhuma locação encontrada.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {locacoesFiltradas.map((locacao) => {
          const status = statusDaLocacao(locacao);
          return (
            <div key={locacao.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{nomeCliente(locacao.clienteId)}</div>
                  <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                    Locação #{locacao.id} — evento em {locacao.dataEvento.split("T")[0]}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: status.cor, fontWeight: 700, fontSize: 13 }}>{status.texto}</span>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>R$ {locacao.valorTotal.toFixed(2)}</div>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--borda)" }}>
                {locacao.itens.map((item, index) => (
                  <div key={index} style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                    • {descricaoProduto(item.produtoId)}
                    {item.ajustes && ` — ${item.ajustes}`}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <Link to={`/locacoes/editar/${locacao.id}`}>Editar</Link>
                <Link to={`/locacoes/imprimir/${locacao.id}`}>Imprimir</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}