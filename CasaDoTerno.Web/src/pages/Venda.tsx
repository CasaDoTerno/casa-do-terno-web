import { useEffect, useState } from "react";
import api from "../Services/API";

interface Produto {
  id: number;
  modelo: string;
  valorVenda: number;
  disponivelParaVenda: boolean;
}

interface Cliente {
  id: number;
  nome: string;
}

interface ItemCarrinho {
  produtoId: number;
  modelo: string;
  quantidade: number;
  valorUnitario: number;
}

export function Venda() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [consultor, setConsultor] = useState("");
const [formaPagamento, setFormaPagamento] = useState(0);
  const [clienteId, setClienteId] = useState(0);
  const [desconto, setDesconto] = useState(0);

  const [produtoSelecionado, setProdutoSelecionado] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    api.get<Produto[]>("/Produtos").then((r) =>
      setProdutos(r.data.filter((p) => p.disponivelParaVenda))
    );
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }, []);

  function adicionarAoCarrinho() {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    setCarrinho([
      ...carrinho,
      {
        produtoId: produto.id,
        modelo: produto.modelo,
        quantidade,
        valorUnitario: produto.valorVenda,
      },
    ]);

    // reseta a seleção pra facilitar adicionar o próximo item
    setProdutoSelecionado(0);
    setQuantidade(1);
  }

  function removerDoCarrinho(index: number) {
    setCarrinho(carrinho.filter((_, i) => i !== index));
  }

  const totalCarrinho = carrinho.reduce(
    (soma, item) => soma + item.quantidade * item.valorUnitario,
    0
  );

  async function confirmarVenda() {
    if (carrinho.length === 0) {
      setMensagem("Adicione pelo menos um produto antes de confirmar.");
      return;
    }

    try {
await api.post("/Vendas", {
  clienteId,
  desconto,
  consultor,
  formaPagamento,
  itens: carrinho.map((item) => ({
    produtoId: item.produtoId,
    quantidade: item.quantidade,
  })),
});
      setMensagem("Venda registrada com sucesso!");
      setCarrinho([]);
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao registrar venda.");
    }
  }

  return (
    <div>
      <h1>Nova Venda</h1>

      <div>
        <label>Cliente: </label>
        <select value={clienteId} onChange={(e) => setClienteId(Number(e.target.value))}>
          <option value={0}>Selecione...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>
<div>
  <label>Consultor: </label>
  <input value={consultor} onChange={(e) => setConsultor(e.target.value)} />
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
      <h2>Adicionar produto</h2>
      <div>
        <label>Produto: </label>
        <select
          value={produtoSelecionado}
          onChange={(e) => setProdutoSelecionado(Number(e.target.value))}
        >
          <option value={0}>Selecione...</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>{p.modelo} — R$ {p.valorVenda}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Quantidade: </label>
        <input
          type="number"
          min={1}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
        />
      </div>
      <button onClick={adicionarAoCarrinho} disabled={produtoSelecionado === 0}>
        Adicionar
      </button>

      <h2>Itens da venda</h2>
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
        <label>Desconto: </label>
        <input
          type="number"
          value={desconto}
          onChange={(e) => setDesconto(Number(e.target.value))}
        />
      </div>

      <p><strong>Total: R$ {(totalCarrinho - desconto).toFixed(2)}</strong></p>

      <button onClick={confirmarVenda}>Confirmar venda</button>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}