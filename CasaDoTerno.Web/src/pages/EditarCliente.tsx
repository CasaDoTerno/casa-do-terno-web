import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Services/API";

export function EditarCliente() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    api.get(`/Clientes/${id}`).then((resposta) => {
      const c = resposta.data;
      setNome(c.nome);
      setCpf(c.cpf);
      setTelefone(c.telefone);
    });
  }, [id]);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    try {
      await api.put(`/Clientes/${id}`, { nome, cpf, telefone });
      setMensagem("Cliente atualizado com sucesso!");
      navigate("/clientes");
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao atualizar cliente.");
    }
  }

  return (
    <div>
      <h1>Editar Cliente</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome: </label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div>
          <label>CPF: </label>
          <input value={cpf} onChange={(e) => setCpf(e.target.value)} required />
        </div>
        <div>
          <label>Telefone: </label>
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
        </div>
        <button type="submit">Salvar alterações</button>
      </form>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}