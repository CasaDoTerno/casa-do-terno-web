import { useEffect, useState } from "react";
import api from "../Services/API";

interface Produto {
  id: number;
  modelo: string;
  disponivelParaVenda: boolean;
}

interface Cliente {
  id: number;
  nome: string;
}

export function Venda() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtoId, setProdutoId] = useState(0);
  const [clienteId, setClienteId] = useState(0);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    api.get<Produto[]>("/Produtos").then((r) =>
      setProdutos(r.data.filter((p) => p.disponivelParaVenda))
    );
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }, []);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    try {
      await api.post("/Vendas", { produtoId, clienteId });
      setMensagem("Venda registrada com sucesso!");
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao registrar venda.");
    }
  }

  return (
    <div>
      <h1>Nova Venda</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Produto: </label>
          <select value={produtoId} onChange={(e) => setProdutoId(Number(e.target.value))} required>
            <option value={0}>Selecione...</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>{p.modelo}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Cliente: </label>
          <select value={clienteId} onChange={(e) => setClienteId(Number(e.target.value))} required>
            <option value={0}>Selecione...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <button type="submit">Vender</button>
      </form>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}