import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export function EditarVenda() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [consultor, setConsultor] = useState("");

  const [produtoSelecionado, setProdutoSelecionado] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [carregado, setCarregado] = useState(false);

  function buscarProdutos() {
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }

  useEffect(() => {
    buscarProdutos();
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));

    api.get(`/Vendas/${id}`).then((resposta) => {
      const v = resposta.data;
      setClienteId(v.clienteId);
      setDesconto(v.desconto);
      setConsultor(v.consultor ?? "");
      setCarrinho(
        v.itens.map((item: any) => ({
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
      setMensagem("A venda precisa ter pelo menos um item.");
      return;
    }

    setEnviando(true);
    try {
      await api.put(`/Vendas/${id}`, {
        clienteId,
        desconto,
        consultor,
        itens: carrinho.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
      });
      setMensagem("Venda atualizada com sucesso!");
      navigate("/vendas/listagem");
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao atualizar venda.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Editar Venda #{id}</h1>
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
            <label>Adicionar produto</label>
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
            <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
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
            <label>Desconto</label>
            <input type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} />
          </div>
          <div style={{ borderTop: "1px solid var(--borda)", marginTop: 16, paddingTop: 16 }}>
            <p style={{ color: "var(--texto-suave)", margin: "4px 0" }}>Subtotal: R$ {totalCarrinho.toFixed(2)}</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "4px 0" }}>Total: R$ {totalComDesconto.toFixed(2)}</p>
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