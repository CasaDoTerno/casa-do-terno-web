import { useState } from "react";
import api from "../Services/API";

export function CadastroProduto() {
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
  const [disponivelParaVenda, setDisponivelParaVenda] = useState(true);
  const [disponivelParaLocacao, setDisponivelParaLocacao] = useState(true);
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

 async function handleSubmit(evento: React.FormEvent) {
  evento.preventDefault();
  if (enviando) return;

  setEnviando(true);
  try {
    await api.post("/Produtos", {
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
    setMensagem("Produto cadastrado com sucesso!");
    setDescricao("");
    setTamanho("");
    setCor("");
    setReferencia("");
    setValorCusto(0);
    setValorVenda(0);
    setValorLocacao(0);
    setQuantidade(0);
    setEstoqueMinimo(0);
    setObservacao("");
  } catch (erro) {
    console.error(erro);
    setMensagem("Erro ao cadastrar produto. Veja o console (F12).");
  } finally {
    setEnviando(false);
  }
}
  return (
    <div>
      <h1>Cadastrar Produto</h1>
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
              </select>
            </div>
            <div>
              <label>Referência</label>
              <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="código interno" />
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
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={controlaEstoque}
                onChange={(e) => setControlaEstoque(e.target.checked)}
                style={{ width: "auto" }}
              />
              Controlar estoque
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={disponivelParaVenda}
                onChange={(e) => setDisponivelParaVenda(e.target.checked)}
                style={{ width: "auto" }}
              />
              Disponível para venda
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={disponivelParaLocacao}
                onChange={(e) => setDisponivelParaLocacao(e.target.checked)}
                style={{ width: "auto" }}
              />
              Disponível para locação
            </label>
          </div>

          {controlaEstoque && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              <div>
                <label>Quantidade em estoque</label>
                <input type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
              </div>
              <div>
                <label>Estoque mínimo</label>
                <input
                  type="number"
                  value={estoqueMinimo}
                  onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>

       <button type="submit" disabled={enviando}>
  {enviando ? "Salvando..." : "Cadastrar"}
</button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}