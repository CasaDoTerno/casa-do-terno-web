import { useEffect, useState } from "react";
import api from "../Services/API";

interface Produto {
  id: number;
  modelo: string;
}

interface Cliente {
  id: number;
  nome: string;
}

export function Locacao() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [produtoId, setProdutoId] = useState(0);
  const [clienteId, setClienteId] = useState(0);
  const [dataRetirada, setDataRetirada] = useState("");
  const [dataDevolucaoPrevista, setDataDevolucaoPrevista] = useState("");
  const [mensagem, setMensagem] = useState("");

  // busca as listas de produtos e clientes assim que a tela abre,
  // pra preencher os dois <select> abaixo
  useEffect(() => {
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }, []);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    try {
      await api.post("/Locacoes", {
        produtoId,
        clienteId,
        dataRetirada,
        dataDevolucaoPrevista,
      });
      setMensagem("Locação criada com sucesso!");
    } catch (erro: any) {
      console.error(erro);
      // o backend manda uma mensagem específica (ex: "Produto já está reservado nesse período.")
      const mensagemBackend = erro.response?.data;
      setMensagem(mensagemBackend || "Erro ao criar locação.");
    }
  }

  return (
    <div>
      <h1>Nova Locação</h1>
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

        <div>
          <label>Data de retirada: </label>
          <input
            type="date"
            value={dataRetirada}
            onChange={(e) => setDataRetirada(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Data de devolução prevista: </label>
          <input
            type="date"
            value={dataDevolucaoPrevista}
            onChange={(e) => setDataDevolucaoPrevista(e.target.value)}
            required
          />
        </div>

        <button type="submit">Alugar</button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}