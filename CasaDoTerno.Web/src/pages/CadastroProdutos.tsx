import { useState } from "react";
import api from "../Services/API";

export function CadastroProduto() {
  const [modelo, setModelo] = useState("");
  const [categoria, setCategoria] = useState(0);
  const [tamanho, setTamanho] = useState("");
  const [cor, setCor] = useState("");
  const [valorVenda, setValorVenda] = useState(0);
  const [valorLocacao, setValorLocacao] = useState(0);
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault(); // impede a página de recarregar sozinha

    try {
      await api.post("/Produtos", {
        modelo,
        categoria,
        tamanho,
        cor,
        valorVenda,
        valorLocacao,
        disponivelParaVenda: true,
        disponivelParaLocacao: true,
      });
      setMensagem("Produto cadastrado com sucesso!");
      // limpa o formulário
      setModelo("");
      setTamanho("");
      setCor("");
      setValorVenda(0);
      setValorLocacao(0);
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao cadastrar produto. Veja o console (F12).");
    }
  }

  return (
    <div>
      <h1>Cadastrar Produto</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Modelo: </label>
          <input value={modelo} onChange={(e) => setModelo(e.target.value)} required />
        </div>

        <div>
          <label>Categoria: </label>
          <select value={categoria} onChange={(e) => setCategoria(Number(e.target.value))}>
            <option value={0}>Terno</option>
            <option value={1}>Calça</option>
            <option value={2}>Camisa</option>
            <option value={3}>Sapato</option>
          </select>
        </div>

        <div>
          <label>Tamanho: </label>
          <input value={tamanho} onChange={(e) => setTamanho(e.target.value)} required />
        </div>

        <div>
          <label>Cor: </label>
          <input value={cor} onChange={(e) => setCor(e.target.value)} required />
        </div>

        <div>
          <label>Valor de venda: </label>
          <input
            type="number"
            value={valorVenda}
            onChange={(e) => setValorVenda(Number(e.target.value))}
          />
        </div>

        <div>
          <label>Valor de locação: </label>
          <input
            type="number"
            value={valorLocacao}
            onChange={(e) => setValorLocacao(Number(e.target.value))}
          />
        </div>

        <button type="submit">Cadastrar</button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}