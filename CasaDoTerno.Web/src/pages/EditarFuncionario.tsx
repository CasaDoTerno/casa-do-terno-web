import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Services/API";

export function EditarFuncionario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [salarioBase, setSalarioBase] = useState(0);
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    api.get(`/Funcionarios/${id}`).then((resposta) => {
      const f = resposta.data;
      setNome(f.nome);
      setCargo(f.cargo ?? "");
      setTelefone(f.telefone ?? "");
      setCpf(f.cpf ?? "");
      setSalarioBase(f.salarioBase);
      setDataAdmissao(f.dataAdmissao.split("T")[0]);
    });
  }, [id]);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      await api.put(`/Funcionarios/${id}`, { nome, cargo, telefone, cpf, salarioBase, dataAdmissao });
      setMensagem("Funcionário atualizado com sucesso!");
      navigate("/funcionarios");
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao atualizar funcionário.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Editar Funcionário</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="grid-2">
            <div>
              <label>Cargo</label>
              <input value={cargo} onChange={(e) => setCargo(e.target.value)} />
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
          {enviando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}