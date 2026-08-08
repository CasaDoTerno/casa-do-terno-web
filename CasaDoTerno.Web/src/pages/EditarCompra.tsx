import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Services/API";
import { BuscaSelect } from "../components/BuscaSelect";

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato","Acessorio"];


interface Produto {
  id: number;
  modelo: string;
  categoria: number;
  referencia: string | null;
  cor: string;
  tamanho: string;
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

export function EditarCompra() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorId, setFornecedorId] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState(0);
  const [observacao, setObservacao] = useState("");

  const [produtoSelecionado, setProdutoSelecionado] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState(0);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
    api.get<Fornecedor[]>("/Fornecedores").then((r) => setFornecedores(r.data));

    api.get(`/Compras/${id}`).then((resposta) => {
      const c = resposta.data;
      setFornecedorId(c.fornecedorId);
      setFormaPagamento(c.formaPagamento);
      setObservacao(c.observacao ?? "");
      setCarrinho(
        c.itens.map((item: any) => ({
          produtoId: item.produtoId,
          modelo: "Carregando...",
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
        }))
      );
      setCarregado(true);
    });
  }, [id]);

  useEffect(() => {
    if (!carregado || produtos.length === 0) return;
    setCarrinho((atual) =>
      atual.map((item) => {
        const produto = produtos.find((p) => p.id === item.produtoId);
        return produto ? { ...item, modelo: produto.modelo } : item;
      })
    );
  }, [produtos, carregado]);

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

  const totalCarrinho = carrinho.reduce((soma, item) => soma + item.quantidade * item.valorUnitario, 0);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    if (carrinho.length === 0) {
      setMensagem("A compra precisa ter pelo menos um item.");
      return;
    }

    setEnviando(true);
    try {
      await api.put(`/Compras/${id}`, {
        fornecedorId,
        formaPagamento,
        observacao,
        itens: carrinho.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
        })),
      });
      setMensagem("Compra atualizada com sucesso!");
      navigate("/compras/listagem");
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao atualizar compra.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Editar Compra #{id}</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>

        <h2>Dados gerais</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Fornecedor</label>
            <BuscaSelect
              opcoes={fornecedores.map((f) => ({ id: f.id, label: f.nome }))}
              valorSelecionado={fornecedorId}
              onSelecionar={setFornecedorId}
              placeholder="Buscar fornecedor..."
            />
          </div>
          <div>
            <label>Observação</label>
            <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
        </div>

        <h2>Produtos</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Adicionar produto</label>
              <BuscaSelect
                opcoes={produtos.map((p) => ({
                  id: p.id,
                  label: `${p.referencia ? p.referencia + " · " : ""}${nomesCategoria[p.categoria]} · ${p.modelo} · ${p.cor} · ${p.tamanho}`,
                }))}
              valorSelecionado={produtoSelecionado}
              onSelecionar={setProdutoSelecionado}
              placeholder="Buscar produto..."
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label>Quantidade</label>
              <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
            </div>
            <div>
              <label>Valor unitário (custo)</label>
              <input type="number" value={valorUnitario} onChange={(e) => setValorUnitario(Number(e.target.value))} />
            </div>
          </div>
          <button type="button" onClick={adicionarAoCarrinho} disabled={produtoSelecionado === 0}>
            + Adicionar
          </button>

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
        </div>

        <h2>Pagamento</h2>
        <div className="card" style={{ marginBottom: 20 }}>
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
            <p style={{ fontSize: 18, fontWeight: 700, margin: "4px 0" }}>Total: R$ {totalCarrinho.toFixed(2)}</p>
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