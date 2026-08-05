import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface ItemVenda {
  produtoId: number;
  quantidade: number;
  valorUnitario: number;
}

interface Venda {
  id: number;
  clienteId: number;
  dataVenda: string;
  desconto: number;
  valorTotal: number;
  consultor: string | null;
  formaPagamento: number;
  itens: ItemVenda[];
}

interface Cliente {
  id: number;
  nome: string;
}

interface Produto {
  id: number;
  modelo: string;
}

const nomesFormaPagamento = ["Dinheiro", "Cartão", "Pix", "Boleto"];

export function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    api.get<Venda[]>("/Vendas").then((r) =>
      setVendas(r.data.sort((a, b) => new Date(b.dataVenda).getTime() - new Date(a.dataVenda).getTime()))
    );
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, []);

  function nomeCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  function nomeProduto(produtoId: number) {
    return produtos.find((p) => p.id === produtoId)?.modelo ?? `Produto #${produtoId}`;
  }

  const vendasFiltradas = vendas.filter((v) =>
    nomeCliente(v.clienteId).toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <h1>Vendas</h1>

      <input
        type="text"
        placeholder="Buscar por cliente..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 20 }}
      />

      {vendasFiltradas.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nenhuma venda encontrada.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {vendasFiltradas.map((venda) => (
          <div key={venda.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{nomeCliente(venda.clienteId)}</div>
                <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                  Venda #{venda.id} — {new Date(venda.dataVenda).toLocaleDateString("pt-BR")}
                  {venda.consultor && ` — Consultor: ${venda.consultor}`}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--verde)" }}>
                  R$ {venda.valorTotal.toFixed(2)}
                </div>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>
                  {nomesFormaPagamento[venda.formaPagamento]}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--borda)" }}>
              {venda.itens.map((item, index) => (
                <div key={index} style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                  {item.quantidade}x {nomeProduto(item.produtoId)} — R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <Link to={`/vendas/editar/${venda.id}`}>Editar</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}