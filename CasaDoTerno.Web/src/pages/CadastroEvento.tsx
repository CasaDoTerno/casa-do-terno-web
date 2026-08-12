import { useState } from "react";
import api from "../Services/API";

export function CadastroEvento() {
  const [tipo, setTipo] = useState(0);
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      await api.post("/Eventos", { tipo, nome, data, observacao });
      setMensagem("Evento cadastrado com sucesso! Já pode vincular locações a ele.");
      setNome("");
      setData("");
      setObservacao("");
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao cadastrar evento.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Cadastrar Evento</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(Number(e.target.value))}>
              <option value={0}>Casamento</option>
              <option value={1}>Formatura</option>
              <option value={2}>Aniversário</option>
            </select>
          </div>
          <div>
            <label>Nome do evento</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex: Casamento João e Maria"
              required
            />
          </div>
          <div>
            <label>Data do evento</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </div>
          <div>
            <label>Observação</label>
            <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Cadastrar evento"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}