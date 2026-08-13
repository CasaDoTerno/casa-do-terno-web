import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Services/API";

export function EditarEvento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tipo, setTipo] = useState(0);
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    api.get(`/Eventos/${id}`).then((resposta) => {
      const ev = resposta.data;
      setTipo(ev.tipo);
      setNome(ev.nome);
      setData(ev.data.split("T")[0]);
      setObservacao(ev.observacao ?? "");
    });
  }, [id]);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      await api.put(`/Eventos/${id}`, { tipo, nome, data, observacao });
      setMensagem("Evento atualizado com sucesso!");
      navigate("/eventos");
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao atualizar evento.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Editar Evento</h1>
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
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
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
          {enviando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}