import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Services/API";

export function EditarProduto() {
  const { id } = useParams(); // pega o :id que veio da URL
  const navigate = useNavigate(); // pra redirecionar depois de salvar

  const [modelo, setModelo] = useState("");
  const [categoria, setCategoria] = useState(0);
  const [tamanho, setTamanho] = useState("");
  const [cor, setCor] = useState("");
  const [valorVenda, setValorVenda] = useState(0);
  const [valorLocacao, setValorLocacao] = useState(0);
  const [mensagem, setMensagem] = useState("");

  // ao abrir a tela, busca os dados atuais desse produto
  useEffect(() => {
    api.get(`/Produtos/${id}`).then((resposta) => {
      const p = resposta.data;
      setModelo(p.modelo);
      setCategoria(p.categoria);
      setTamanho(p.tamanho);
      setCor(p.cor);
      setValorVenda(p.valorVenda);
      setValorLocacao(p.valorLocacao);
    });
  }, [id]);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    try {
      await api.put(`/Produtos/${id}`, {
        modelo,
        categoria,
        tamanho,
        cor,
        valorVenda,
        valorLocacao,
        disponivelParaVenda: true,
        disponivelParaLocacao: true,
      });
      setMensagem("Produto atualizado com sucesso!");
      navigate("/produtos"); // volta pra listagem automaticamente
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao atualizar produto.");
    }
  }

  return (
    <div>
      <h1>Editar Produto</h1>
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
          <input type="number" value={valorVenda} onChange={(e) => setValorVenda(Number(e.target.value))} />
        </div>
        <div>
          <label>Valor de locação: </label>
          <input type="number" value={valorLocacao} onChange={(e) => setValorLocacao(Number(e.target.value))} />
        </div>
        <button type="submit">Salvar alterações</button>
      </form>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}