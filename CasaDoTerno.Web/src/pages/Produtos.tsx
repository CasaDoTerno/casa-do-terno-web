import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";
import { Search } from "lucide-react";

interface Produto {
  id: number;
  modelo: string;
  referencia: string | null;
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
  const [pagina, setPagina] = useState(1);
  const ITENS_POR_PAGINA = 50;

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
  const textoProduto = `${p.modelo} ${p.tamanho} ${p.cor} ${p.referencia ?? ""}`.toLowerCase();
  const palavras = busca.toLowerCase().split(" ").filter((palavra) => palavra.length > 0);
  return palavras.every((palavra) => textoProduto.includes(palavra));
  
});
const totalPaginas = Math.max(Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA), 1);
  const produtosDaPagina = produtosFiltrados.slice(
  (pagina - 1) * ITENS_POR_PAGINA,
  pagina * ITENS_POR_PAGINA
);
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
        onChange={(e) => {
          setBusca(e.target.value);
          setPagina(1);
        }}
        style={{ paddingLeft: 36 }}
      />
      </div>
      <ul>
       {produtosDaPagina.map((produto) => {
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
      {produtosFiltrados.length > 0 && (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 20 }}>
        <button
          type="button"
          onClick={() => setPagina((p) => Math.max(p - 1, 1))}
          disabled={pagina === 1}
        >
          ← Anterior
        </button>
        <span style={{ color: "var(--texto-suave)", fontSize: 13 }}>
          Página {pagina} de {totalPaginas} ({produtosFiltrados.length} produtos)
        </span>
        <button
          type="button"
          onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
          disabled={pagina === totalPaginas}
        >
          Próxima →
        </button>
      </div>
    )}
    </div>
  );
}