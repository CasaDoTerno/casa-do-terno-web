import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Services/API";

export function EditarDespesa() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState(0);
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    api.get(`/Despesas/${id}`).then((resposta) => {
      const d = resposta.data;
      setDescricao(d.descricao);
      setCategoria(d.categoria ?? "");
      setValor(d.valor);
      setObservacao(d.observacao ?? "");
    });
  }, [id]);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      await api.put(`/Despesas/${id}`, { descricao, categoria, valor, observacao });
      setMensagem("Despesa atualizada com sucesso!");
      navigate("/despesas/listagem");
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao atualizar despesa.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Editar Despesa</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Descrição</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
          </div>
          <div>
            <label>Categoria</label>
            <input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          </div>
          <div>
            <label>Valor</label>
            <input type="number" value={valor} onChange={(e) => setValor(Number(e.target.value))} />
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