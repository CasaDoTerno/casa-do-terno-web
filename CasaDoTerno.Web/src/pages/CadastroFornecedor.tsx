import { useState } from "react";
import api from "../Services/API";

export function CadastroFornecedor() {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    try {
      await api.post("/Fornecedores", { nome, cnpj, telefone });
      setMensagem("Fornecedor cadastrado com sucesso!");
      setNome("");
      setCnpj("");
      setTelefone("");
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao cadastrar fornecedor.");
    }
  }

  return (
    <div>
      <h1>Cadastrar Fornecedor</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome: </label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div>
          <label>CNPJ: </label>
          <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
        </div>
        <div>
          <label>Telefone: </label>
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
        <button type="submit">Cadastrar</button>
      </form>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}