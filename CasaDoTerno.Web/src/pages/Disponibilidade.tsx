import { useEffect, useState } from "react";
import api from "../Services/API";

interface Produto {
  id: number;
  modelo: string;
  referencia: string | null;
  cor: string;
  tamanho: string;
}

interface ItemLocacao {
  produtoId: number;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataEvento: string;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal: string | null;
  dataCancelamento?: string | null;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
}

interface Reserva {
  clienteNome: string;
  dataEvento: string;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
}

// "2026-09-18" vira "18/09/2026" (sem passar por new Date, que erraria o dia por causa do fuso)
function formatarData(iso: string): string {
  return iso.split("-").reverse().join("/");
}

export function Disponibilidade() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [busca, setBusca] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");

  useEffect(() => {
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
    api.get<Locacao[]>("/Locacoes").then((r) =>
      setLocacoes(r.data.filter((l) => l.dataDevolucaoReal === null && !l.dataCancelamento))
    );
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }, []);

  function nomeCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  // monta, pra cada produto, a lista de reservas ativas (não devolvidas), em ordem de data do evento
  function reservasDoProduto(produtoId: number): Reserva[] {
    return locacoes
      .filter((l) => l.itens.some((item) => item.produtoId === produtoId))
      .map((l) => ({
        clienteNome: nomeCliente(l.clienteId),
        dataEvento: l.dataEvento.split("T")[0],
        dataRetirada: l.dataRetirada.split("T")[0],
        dataDevolucaoPrevista: l.dataDevolucaoPrevista.split("T")[0],
      }))
      .sort((a, b) => a.dataEvento.localeCompare(b.dataEvento));
  }

  const produtosComReservas = produtos.map((p) => ({
    produto: p,
    reservas: reservasDoProduto(p.id),
  }));

  const produtosFiltrados = produtosComReservas.filter(({ produto, reservas }) => {
    // filtro de texto (referência, descrição, cor, tamanho)
    const textoProduto = `${produto.modelo} ${produto.tamanho} ${produto.cor} ${produto.referencia ?? ""}`.toLowerCase();
    const palavras = busca.toLowerCase().split(" ").filter((p) => p.length > 0);
    const bateBusca = palavras.every((palavra) => textoProduto.includes(palavra));

    // filtro de data: só produtos que estão fora da loja nessa data (da retirada até a devolução)
    const bateData =
      !filtroData ||
      reservas.some((r) => filtroData >= r.dataRetirada && filtroData <= r.dataDevolucaoPrevista);

    // filtro de cliente: só produtos com alguma reserva daquele cliente
    const bateCliente =
      !filtroCliente ||
      reservas.some((r) => r.clienteNome.toLowerCase().includes(filtroCliente.toLowerCase()));

    return bateBusca && bateData && bateCliente;
  });

  return (
    <div>
      <h1>Disponibilidade de Produtos</h1>

      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div className="campo" style={{ flex: 1, minWidth: 220 }}>
          <label>Buscar (código, descrição, tamanho, cor)</label>
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="campo">
          <label>Ver reservas nessa data</label>
          <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />
        </div>
        <div className="campo">
          <label>Filtrar por cliente</label>
          <input type="text" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {produtosFiltrados.map(({ produto, reservas }) => (
          <div key={produto.id} className="card">
            <strong>
              {produto.referencia ? `${produto.referencia} — ` : ""}{produto.modelo} — {produto.cor} — Tam. {produto.tamanho}
            </strong>

            {reservas.length === 0 ? (
              <p style={{ color: "var(--verde)", margin: "6px 0 0 0" }}>Livre — sem reservas ativas</p>
            ) : (
              <div style={{ marginTop: 6 }}>
                {reservas.map((r, index) => {
                  const foraNaDataEscolhida =
                    filtroData !== "" && filtroData >= r.dataRetirada && filtroData <= r.dataDevolucaoPrevista;

                  return (
                    <div key={index} style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                      Locado com <strong>{r.clienteNome}</strong> — evento em{" "}
                      <strong>{formatarData(r.dataEvento)}</strong>
                      {foraNaDataEscolhida && (
                        <span style={{ color: "#facc15", marginLeft: 6 }}>
                          (peça fora da loja de {formatarData(r.dataRetirada)} a {formatarData(r.dataDevolucaoPrevista)})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}