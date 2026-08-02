import { useEffect, useState } from "react";
import api from "../Services/API";

interface Produto {
  id: number;
  modelo: string;
}

interface Fornecedor {
  id: number;
  nome: string;
}

interface ItemCarrinho {
  produtoId: number;
  modelo: string;
  quantidade: number;
  valorUnitario: number;
}

export function Compra() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorId, setFornecedorId] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState(0);
  const [observacao, setObservacao] = useState("");

  const [produtoSelecionado, setProdutoSelecionado] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState(0);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
    api.get<Fornecedor[]>("/Fornecedores").then((r) => setFornecedores(r.data));
  }, []);

  function adicionarAoCarrinho() {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    setCarrinho([
      ...carrinho,
      { produtoId: produto.id, modelo: produto.modelo, quantidade, valorUnitario },
    ]);
    setProdutoSelecionado(0);
    setQuantidade(1);
    setValorUnitario(0);
  }

  function removerDoCarrinho(index: number) {
    setCarrinho(carrinho.filter((_, i) => i !== index));
  }

  const totalCarrinho = carrinho.reduce(
    (soma, item) => soma + item.quantidade * item.valorUnitario,
    0
  );

  async function confirmarCompra() {
    if (carrinho.length === 0) {
      setMensagem("Adicione pelo menos um produto antes de confirmar.");
      return;
    }

    try {
      await api.post("/Compras", {
        fornecedorId,
        formaPagamento,
        observacao,
        itens: carrinho.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
        })),
      });
      setMensagem("Compra registrada com sucesso! Estoque atualizado.");
      setCarrinho([]);
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao registrar compra.");
    }
  }

  return (
    <div>
      <h1>Nova Compra (entrada de estoque)</h1>

      <div>
        <label>Fornecedor: </label>
        <select value={fornecedorId} onChange={(e) => setFornecedorId(Number(e.target.value))}>
          <option value={0}>Selecione...</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>{f.nome}</option>
          ))}
        </select>
      </div>

      <h2>Adicionar produto</h2>
      <div>
        <label>Produto: </label>
        <select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(Number(e.target.value))}>
          <option value={0}>Selecione...</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>{p.modelo}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Quantidade: </label>
        <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
      </div>
      <div>
        <label>Valor unitário (custo): </label>
        <input type="number" value={valorUnitario} onChange={(e) => setValorUnitario(Number(e.target.value))} />
      </div>
      <button onClick={adicionarAoCarrinho} disabled={produtoSelecionado === 0}>Adicionar</button>

      <h2>Itens da compra</h2>
      {carrinho.length === 0 && <p>Nenhum item adicionado ainda.</p>}
      <ul>
        {carrinho.map((item, index) => (
          <li key={index}>
            {item.quantidade}x {item.modelo} — R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
            {" "}
            <button onClick={() => removerDoCarrinho(index)}>Remover</button>
          </li>
        ))}
      </ul>

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
        <label>Observação: </label>
        <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
      </div>

      <p><strong>Total: R$ {totalCarrinho.toFixed(2)}</strong></p>

      <button onClick={confirmarCompra}>Confirmar compra</button>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}