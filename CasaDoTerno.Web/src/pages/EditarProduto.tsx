import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Services/API";

export function EditarProduto() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(0);
  const [tamanho, setTamanho] = useState("");
  const [cor, setCor] = useState("");
  const [referencia, setReferencia] = useState("");
  const [valorCusto, setValorCusto] = useState(0);
  const [valorVenda, setValorVenda] = useState(0);
  const [valorLocacao, setValorLocacao] = useState(0);
  const [controlaEstoque, setControlaEstoque] = useState(true);
  const [quantidade, setQuantidade] = useState(0);
  const [estoqueMinimo, setEstoqueMinimo] = useState(0);
  const [observacao, setObservacao] = useState("");
  const [disponivelParaVenda, setDisponivelParaVenda] = useState(true);
  const [disponivelParaLocacao, setDisponivelParaLocacao] = useState(true);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    api.get(`/Produtos/${id}`).then((resposta) => {
      const p = resposta.data;
      setDescricao(p.modelo);
      setCategoria(p.categoria);
      setTamanho(p.tamanho);
      setCor(p.cor);
      setReferencia(p.referencia ?? "");
      setValorCusto(p.valorCusto);
      setValorVenda(p.valorVenda);
      setValorLocacao(p.valorLocacao);
      setControlaEstoque(p.controlaEstoque);
      setQuantidade(p.quantidade);
      setEstoqueMinimo(p.estoqueMinimo);
      setObservacao(p.observacao ?? "");
      setDisponivelParaVenda(p.disponivelParaVenda);
      setDisponivelParaLocacao(p.disponivelParaLocacao);
    });
  }, [id]);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    try {
      await api.put(`/Produtos/${id}`, {
        modelo: descricao,
        categoria,
        tamanho,
        cor,
        referencia,
        valorCusto,
        valorVenda,
        valorLocacao,
        controlaEstoque,
        quantidade,
        estoqueMinimo,
        observacao,
        disponivelParaVenda,
        disponivelParaLocacao,
      });
      setMensagem("Produto atualizado com sucesso!");
      navigate("/produtos");
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao atualizar produto.");
    }
  }

  return (
    <div>
      <h1>Editar Produto</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>

        <h2>Dados do produto</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Descrição</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label>Categoria</label>
              <select value={categoria} onChange={(e) => setCategoria(Number(e.target.value))}>
                <option value={0}>Terno</option>
                <option value={1}>Calça</option>
                <option value={2}>Camisa</option>
                <option value={3}>Sapato</option>
                <option value={4}>Acessorio</option>
              </select>
            </div>
            <div>
              <label>Referência</label>
              <input value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label>Tamanho</label>
              <input value={tamanho} onChange={(e) => setTamanho(e.target.value)} required />
            </div>
            <div>
              <label>Cor</label>
              <input value={cor} onChange={(e) => setCor(e.target.value)} required />
            </div>
          </div>
          <div>
            <label>Observação</label>
            <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
        </div>

        <h2>Valores</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label>Custo</label>
              <input type="number" value={valorCusto} onChange={(e) => setValorCusto(Number(e.target.value))} />
            </div>
            <div>
              <label>Venda</label>
              <input type="number" value={valorVenda} onChange={(e) => setValorVenda(Number(e.target.value))} />
            </div>
            <div>
              <label>Locação</label>
              <input type="number" value={valorLocacao} onChange={(e) => setValorLocacao(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <h2>Estoque e disponibilidade</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={controlaEstoque}
              onChange={(e) => setControlaEstoque(e.target.checked)}
              style={{ width: "auto" }}
              id="controla-estoque"
            />
            <label htmlFor="controla-estoque" style={{ margin: 0 }}>Controlar estoque</label>
          </div>

          {controlaEstoque && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div>
                <label>Quantidade em estoque</label>
                <input type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
              </div>
              <div>
                <label>Estoque mínimo</label>
                <input type="number" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(Number(e.target.value))} />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 20, marginTop: 16, flexDirection: "row" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={disponivelParaVenda}
                onChange={(e) => setDisponivelParaVenda(e.target.checked)}
                style={{ width: "auto" }}
                id="disp-venda"
              />
              <label htmlFor="disp-venda" style={{ margin: 0 }}>Disponível para venda</label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={disponivelParaLocacao}
                onChange={(e) => setDisponivelParaLocacao(e.target.checked)}
                style={{ width: "auto" }}
                id="disp-locacao"
              />
              <label htmlFor="disp-locacao" style={{ margin: 0 }}>Disponível para locação</label>
            </div>
          </div>
        </div>

        <button type="submit">Salvar alterações</button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}