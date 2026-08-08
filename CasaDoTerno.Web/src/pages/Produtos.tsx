import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";
import { Search } from "lucide-react";

interface Produto {
  id: number;
  modelo: string;
  tamanho: string;
  cor: string;
  valorVenda: number;
  valorLocacao: number;
  quantidade: number;
  estoqueMinimo: number;
  controlaEstoque: boolean;
}

export function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  function carregarProdutos() {
    setCarregando(true);
    api.get<Produto[]>("/Produtos")
      .then((resposta) => setProdutos(resposta.data))
      .catch((erro) => console.error("Erro ao buscar produtos:", erro))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function excluirProduto(id: number) {
    const confirmar = window.confirm("Tem certeza que quer excluir esse produto?");
    if (!confirmar) return;

    try {
      await api.delete(`/Produtos/${id}`);
      carregarProdutos();
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível excluir. Ele pode estar vinculado a uma locação ou venda.");
    }
  }

  if (carregando) return <p>Carregando produtos...</p>;
    const produtosFiltrados = produtos.filter((p) => {
    const textoProduto = `${p.modelo} ${p.tamanho} ${p.cor}`.toLowerCase();
    const palavras = busca.toLowerCase().split(" ").filter((palavra) => palavra.length > 0);
    return palavras.every((palavra) => textoProduto.includes(palavra));
  });
  return (
    <div>
      <h1>Produtos</h1>

      <div style={{ position: "relative", maxWidth: 520, marginTop: 4, marginBottom: 24 }}>
        <Search
          size={16}
          style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--texto-suave)",
        }}
        />
        <input
        type="text"
        placeholder="Buscar por descrição..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ paddingLeft: 36 }}
        />
      </div>
      <ul>
      {produtosFiltrados.map((produto) => {
          const estoqueBaixo = produto.controlaEstoque && produto.quantidade <= produto.estoqueMinimo;
          return (
            <li key={produto.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{produto.modelo}</strong> — Tam. {produto.tamanho} — {produto.cor}
                  <div style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                    Venda R$ {produto.valorVenda} · Locação R$ {produto.valorLocacao}
                    {produto.controlaEstoque && (
                      <span style={{ color: estoqueBaixo ? "#f87171" : "var(--texto-suave)" }}>
                        {" "}· Estoque: {produto.quantidade}{estoqueBaixo && " (baixo)"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Link to={`/produtos/editar/${produto.id}`}>Editar</Link>
                  {" | "}
                  <button onClick={() => excluirProduto(produto.id)}>Excluir</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}