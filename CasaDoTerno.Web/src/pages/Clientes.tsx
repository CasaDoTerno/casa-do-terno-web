import { useEffect, useState } from "react";
import api from "../Services/API";
import { Link } from "react-router-dom";

interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
}

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

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

  return (
    <div>
      <h1>Clientes</h1>
      <ul>
        {clientes.map((cliente) => (
          <li key={cliente.id}>
                {cliente.nome} — {cliente.telefone} {" "}
                 <Link to={`/clientes/editar/${cliente.id}`}>Editar</Link> {" | "}
                 <button onClick={() => excluirCliente(cliente.id)}>Excluir</button>
            </li>
        ))}
      </ul>
    </div>
  );
}