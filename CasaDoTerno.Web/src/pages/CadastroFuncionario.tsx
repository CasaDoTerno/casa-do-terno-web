import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Services/API";

export function CadastroFuncionario() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [salarioBase, setSalarioBase] = useState(0);
  const [dataAdmissao, setDataAdmissao] = useState(() => new Date().toISOString().split("T")[0]);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      await api.post("/Funcionarios", { nome, cargo, telefone, cpf, salarioBase, dataAdmissao });
      setMensagem("Funcionário cadastrado com sucesso!");
      navigate("/funcionarios");
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao cadastrar funcionário.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Cadastrar Funcionário</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="grid-2">
            <div>
              <label>Cargo</label>
              <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="ex: Vendedora, Consultor" />
            </div>
            <div>
              <label>Telefone</label>
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
          </div>
          <div className="grid-2">
            <div>
              <label>CPF</label>
              <input value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </div>
            <div>
              <label>Data de admissão</label>
              <input type="date" value={dataAdmissao} onChange={(e) => setDataAdmissao(e.target.value)} required />
            </div>
          </div>
          <div>
            <label>Salário base (mensal)</label>
            <input type="number" value={salarioBase} onChange={(e) => setSalarioBase(Number(e.target.value))} required />
          </div>
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Cadastrar"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}