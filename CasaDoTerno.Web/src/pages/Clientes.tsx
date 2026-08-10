import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../Services/API";

interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
}

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");

  function carregarClientes() {
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  async function excluirCliente(id: number) {
    const confirmar = window.confirm("Tem certeza que quer excluir esse cliente?");
    if (!confirmar) return;

    try {
      await api.delete(`/Clientes/${id}`);
      carregarClientes();
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível excluir. Ele pode estar vinculado a uma locação ou venda.");
    }
  }

  const clientesFiltrados = clientes.filter((c) => {
    const textoCliente = `${c.nome} ${c.telefone} ${c.cpf}`.toLowerCase();
    const palavras = busca.toLowerCase().split(" ").filter((palavra) => palavra.length > 0);
    return palavras.every((palavra) => textoCliente.includes(palavra));
  });

  return (
    <div>
      <h1>Clientes</h1>

      <div style={{ position: "relative", maxWidth: 320, marginTop: 4, marginBottom: 24 }}>
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
          placeholder="Buscar por nome, telefone ou CPF..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      <ul>
        {clientesFiltrados.map((cliente) => (
          <li key={cliente.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{cliente.nome}</strong>
                <div style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                  {cliente.telefone} · CPF: {cliente.cpf}
                </div>
              </div>
              <div>
                <Link to={`/clientes/editar/${cliente.id}`}>Editar</Link>
                {" | "}
                <button onClick={() => excluirCliente(cliente.id)}>Excluir</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {clientesFiltrados.length === 0 && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhum cliente encontrado.</p>
      )}
    </div>
  );
}