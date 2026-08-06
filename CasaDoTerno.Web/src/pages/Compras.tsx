import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface ItemCompra {
  produtoId: number;
  quantidade: number;
  valorUnitario: number;
}

interface Compra {
  id: number;
  fornecedorId: number;
  dataCompra: string;
  valorTotal: number;
  formaPagamento: number;
  observacao: string | null;
  itens: ItemCompra[];
}

interface Fornecedor {
  id: number;
  nome: string;
}

interface Produto {
  id: number;
  modelo: string;
}

const nomesFormaPagamento = ["Dinheiro", "Cartão", "Pix", "Boleto"];

export function Compras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    api.get<Compra[]>("/Compras").then((r) =>
      setCompras(r.data.sort((a, b) => new Date(b.dataCompra).getTime() - new Date(a.dataCompra).getTime()))
    );
    api.get<Fornecedor[]>("/Fornecedores").then((r) => setFornecedores(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, []);

  function nomeFornecedor(fornecedorId: number) {
    return fornecedores.find((f) => f.id === fornecedorId)?.nome ?? `Fornecedor #${fornecedorId}`;
  }

  function nomeProduto(produtoId: number) {
    return produtos.find((p) => p.id === produtoId)?.modelo ?? `Produto #${produtoId}`;
  }

  const comprasFiltradas = compras.filter((c) =>
    nomeFornecedor(c.fornecedorId).toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <h1>Compras</h1>

      <input
        type="text"
        placeholder="Buscar por fornecedor..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 20 }}
      />

      {comprasFiltradas.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nenhuma compra encontrada.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {comprasFiltradas.map((compra) => (
          <div key={compra.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{nomeFornecedor(compra.fornecedorId)}</div>
                <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                  Compra #{compra.id} — {new Date(compra.dataCompra).toLocaleDateString("pt-BR")}
                  {compra.observacao && ` — ${compra.observacao}`}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--verde)" }}>
                  R$ {compra.valorTotal.toFixed(2)}
                </div>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>
                  {nomesFormaPagamento[compra.formaPagamento]}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--borda)" }}>
              {compra.itens.map((item, index) => (
                <div key={index} style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                  {item.quantidade}x {nomeProduto(item.produtoId)} — R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <Link to={`/compras/editar/${compra.id}`}>Editar</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}