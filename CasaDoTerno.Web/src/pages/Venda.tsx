import { useEffect, useState } from "react";
import api from "../Services/API";
import { BuscaSelect } from "../components/BuscaSelect";

interface Produto {
  id: number;
  modelo: string;
  categoria: number;
  referencia: string | null;
  cor: string;
  tamanho: string;
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

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato", "Cinto", "Meia", "Relógio", "Gravata"];

export function Venda() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [consultor, setConsultor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState(0);
  const [numeroParcelas, setNumeroParcelas] = useState(1);

  const [produtoSelecionado, setProdutoSelecionado] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  function buscarProdutos() {
    api.get<Produto[]>("/Produtos").then((r) =>
      setProdutos(r.data.filter((p) => p.disponivelParaVenda))
    );
  }

  useEffect(() => {
    buscarProdutos();
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }, []);

  function adicionarAoCarrinho() {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    setCarrinho([
      ...carrinho,
      { produtoId: produto.id, modelo: produto.modelo, quantidade, valorUnitario: produto.valorVenda },
    ]);
    setProdutoSelecionado(0);
    setQuantidade(1);
  }

  function removerDoCarrinho(index: number) {
    setCarrinho(carrinho.filter((_, i) => i !== index));
  }

  const totalCarrinho = carrinho.reduce((soma, item) => soma + item.quantidade * item.valorUnitario, 0);
  const totalComDesconto = totalCarrinho - desconto;

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    if (carrinho.length === 0) {
      setMensagem("Adicione pelo menos um produto antes de confirmar.");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/Vendas", {
        clienteId,
        desconto,
        consultor,
        formaPagamento,
        numeroParcelas,
        itens: carrinho.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
      });
      setMensagem("Venda registrada com sucesso!");
      setCarrinho([]);
      setDesconto(0);
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao registrar venda.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Nova Venda</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        <h2>Dados gerais</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Cliente</label>
            <BuscaSelect
              opcoes={clientes.map((c) => ({ id: c.id, label: c.nome }))}
              valorSelecionado={clienteId}
              onSelecionar={setClienteId}
              placeholder="Buscar cliente..."
            />
          </div>
          <div>
            <label>Consultor</label>
            <input value={consultor} onChange={(e) => setConsultor(e.target.value)} />
          </div>
        </div>

        <h2>Produtos</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Produto</label>
            <BuscaSelect
              opcoes={produtos.map((p) => ({
                id: p.id,
                label: `${p.referencia ? p.referencia + " · " : ""}${nomesCategoria[p.categoria]} · ${p.modelo} · ${p.cor} · ${p.tamanho} — R$ ${p.valorVenda}`,
              }))}
              valorSelecionado={produtoSelecionado}
              onSelecionar={setProdutoSelecionado}
              onAbrir={buscarProdutos}
              placeholder="Buscar produto..."
            />
          </div>
          <div style={{ maxWidth: 140 }}>
            <label>Quantidade</label>
            <input
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
            />
          </div>
          <button type="button" onClick={adicionarAoCarrinho} disabled={produtoSelecionado === 0}>
            + Adicionar
          </button>

          {carrinho.length > 0 && (
            <ul style={{ marginTop: 16 }}>
              {carrinho.map((item, index) => (
                <li key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>
                    {item.quantidade}x {item.modelo} — R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                  </span>
                  <button type="button" onClick={() => removerDoCarrinho(index)}>Remover</button>
                </li>
              ))}
            </ul>
          )}
          {carrinho.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nenhum item adicionado ainda.</p>}
        </div>

        <h2>Pagamento</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="grid-2">
            <div>
              <label>Desconto</label>
              <input type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} />
            </div>
            <div>
              <label>Número de parcelas</label>
              <input
                type="number"
                min={1}
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label>Forma de pagamento</label>
            <select value={formaPagamento} onChange={(e) => setFormaPagamento(Number(e.target.value))}>
              <option value={0}>Dinheiro</option>
              <option value={1}>Cartão</option>
              <option value={2}>Pix</option>
              <option value={3}>Boleto</option>
            </select>
          </div>

          <div style={{ borderTop: "1px solid var(--borda)", marginTop: 16, paddingTop: 16 }}>
            <p style={{ color: "var(--texto-suave)", margin: "4px 0" }}>Subtotal: R$ {totalCarrinho.toFixed(2)}</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "4px 0" }}>Total: R$ {totalComDesconto.toFixed(2)}</p>
          </div>
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Confirmar venda"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}