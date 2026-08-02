import { useEffect, useState } from "react";
import api from "../Services/API";

interface Produto {
  id: number;
  modelo: string;
  quantidade: number;
  estoqueMinimo: number;
}

export function EstoqueBaixo() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    api.get<Produto[]>("/Produtos/estoque-baixo").then((r) => setProdutos(r.data));
  }, []);

  return (
    <div>
      <h1>Estoque Baixo — O que pedir</h1>
      {produtos.length === 0 && <p>Nenhum produto abaixo do estoque mínimo. 🎉</p>}
      <ul>
        {produtos.map((p) => (
          <li key={p.id}>
            {p.modelo} — em estoque: {p.quantidade} (mínimo: {p.estoqueMinimo})
          </li>
        ))}
      </ul>
    </div>
  );
}