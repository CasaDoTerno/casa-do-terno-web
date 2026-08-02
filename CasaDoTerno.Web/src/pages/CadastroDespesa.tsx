import { useState } from "react";
import api from "../Services/API";

export function CadastroDespesa() {
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState(0);
  const [observacao, setObservacao] = useState("");
  const [formaPagamento, setFormaPagamento] = useState(0);
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    try {
      await api.post("/Despesas", {
        descricao,
        categoria,
        valor,
        observacao,
        formaPagamento,
        numeroParcelas,
      });
      setMensagem("Despesa lançada com sucesso!");
      setDescricao("");
      setCategoria("");
      setValor(0);
      setObservacao("");
      setNumeroParcelas(1);
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao lançar despesa.");
    }
  }

  return (
    <div>
      <h1>Lançar Despesa</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Descrição: </label>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="ex: Material de limpeza"
            required
          />
        </div>
        <div>
          <label>Categoria: </label>
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="ex: Limpeza, Aluguel, Manutenção"
          />
        </div>
        <div>
          <label>Valor: </label>
          <input type="number" value={valor} onChange={(e) => setValor(Number(e.target.value))} required />
        </div>
        <div>
          <label>Forma de pagamento: </label>
          <select value={formaPagamento} onChange={(e) => setFormaPagamento(Number(e.target.value))}>
            <option value={0}>Dinheiro</option>
            <option value={1}>Cartão</option>
            <option value={2}>Pix</option>
            <option value={3}>Boleto</option>
          </select>
        </div>
        <div>
          <label>Número de parcelas: </label>
          <input
            type="number"
            min={1}
            value={numeroParcelas}
            onChange={(e) => setNumeroParcelas(Number(e.target.value))}
          />
        </div>
        <div>
          <label>Observação: </label>
          <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </div>
        <button type="submit">Lançar despesa</button>
      </form>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}