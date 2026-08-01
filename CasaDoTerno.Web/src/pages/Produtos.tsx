import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface Produto {
  id: number;
  modelo: string;
  cor: string;
  valorLocacao: number;
}

export function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

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
      carregarProdutos(); // atualiza a lista sem o item excluído
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível excluir. Ele pode estar vinculado a uma locação ou venda.");
    }
  }

  if (carregando) return <p>Carregando produtos...</p>;

  return (
    <div>
      <h1>Produtos</h1>
      <ul>
        {produtos.map((produto) => (
          <li key={produto.id}>
            {produto.modelo} — {produto.cor} — R$ {produto.valorLocacao}
            {" "}
            <Link to={`/produtos/editar/${produto.id}`}>Editar</Link>
            {" | "}
            <button onClick={() => excluirProduto(produto.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}