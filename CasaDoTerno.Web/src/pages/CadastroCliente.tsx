import { useState } from "react";
import api from "../Services/API";

export function CadastroCliente() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    try {
      await api.post("/Clientes", { nome, cpf, telefone });
      setMensagem("Cliente cadastrado com sucesso!");
      setNome("");
      setCpf("");
      setTelefone("");
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao cadastrar cliente. Veja o console (F12).");
    }
  }

  return (
    <div>
      <h1>Cadastrar Cliente</h1>
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
        <button type="submit">Cadastrar</button>
      </form>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}