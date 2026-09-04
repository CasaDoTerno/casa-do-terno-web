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

interface Usuario {
  id: string;
  email: string;
}

interface ItemCarrinho {
  produtoId: number;
  modelo: string;
  referencia: string | null;
  cor: string;
  tamanho: string;
  quantidade: number;
  valorUnitario: number;
  ajustes: string;
}

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato", "Cinto", "Meia", "Relógio", "Gravata"];

export function EditarVenda() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clienteId, setClienteId] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [consultor, setConsultor] = useState("");

  const [precisaAjuste, setPrecisaAjuste] = useState(false);
  const [dataRetiradaAjuste, setDataRetiradaAjuste] = useState("");
  const [pagamentoPendente, setPagamentoPendente] = useState(false);

  const [produtoSelecionado, setProdutoSelecionado] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState(0);
  const [ajustesPeca, setAjustesPeca] = useState("");
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
    api.get<Usuario[]>("/Usuarios/lista-simples").then((r) => setUsuarios(r.data));

    api.get(`/Vendas/${id}`).then((resposta) => {
      const v = resposta.data;
      setClienteId(v.clienteId);
      setDesconto(v.desconto);
      setConsultor(v.consultor ?? "");
      setPrecisaAjuste(v.precisaAjuste ?? false);
      setDataRetiradaAjuste(v.dataRetiradaAjuste ? v.dataRetiradaAjuste.split("T")[0] : "");
      setPagamentoPendente(v.pagamentoPendente ?? false);
      setCarrinho(
        v.itens.map((item: any) => ({
          produtoId: item.produtoId,
          modelo: "Carregando...",
          referencia: null,
          cor: "",
          tamanho: "",
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          ajustes: item.ajustes ?? "",
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
        return produto
          ? { ...item, modelo: produto.modelo, referencia: produto.referencia, cor: produto.cor, tamanho: produto.tamanho }
          : item;
      })
    );
  }, [produtos, carregado]);

  useEffect(() => {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (produto) {
      setValorUnitario(produto.valorVenda);
    }
  }, [produtoSelecionado, produtos]);

  function adicionarAoCarrinho() {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    setCarrinho([
      ...carrinho,
      {
        produtoId: produto.id,
        modelo: produto.modelo,
        referencia: produto.referencia,
        cor: produto.cor,
        tamanho: produto.tamanho,
        quantidade,
        valorUnitario,
        ajustes: ajustesPeca,
      },
    ]);
    setProdutoSelecionado(0);
    setQuantidade(1);
    setValorUnitario(0);
    setAjustesPeca("");
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

    if (precisaAjuste && !dataRetiradaAjuste) {
      setMensagem("Informe a data de retirada, já que essa venda precisa de ajuste.");
      return;
    }

    const confirmar = window.confirm("Confirmar as alterações dessa venda?");
    if (!confirmar) return;

    setEnviando(true);
    try {
      await api.put(`/Vendas/${id}`, {
        clienteId,
        desconto,
        consultor,
        itens: carrinho.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          ajustes: item.ajustes,
        })),
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

      {(precisaAjuste || pagamentoPendente) && (
        <div className="card" style={{ marginBottom: 20, borderLeft: "3px solid #facc15" }}>
          <strong>Situação atual:</strong>
          {precisaAjuste && (
            <p style={{ margin: "6px 0", fontSize: 13 }}>
              Precisa de ajuste — retirada prevista: {dataRetiradaAjuste || "não informada"}
            </p>
          )}
          {pagamentoPendente && (
            <p style={{ margin: "6px 0", fontSize: 13, color: "#f87171" }}>
              ⚠ Pagamento pendente — vá em "Vendas Pendentes" pra registrar o pagamento quando o cliente vier buscar.
            </p>
          )}
        </div>
      )}

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
            <select value={consultor} onChange={(e) => setConsultor(e.target.value)}>
              <option value="">Selecione...</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.email}>{u.email}</option>
              ))}
            </select>
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
          <div className="grid-2" style={{ maxWidth: 320 }}>
            <div>
              <label>Quantidade</label>
              <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
            </div>
            <div>
              <label>Valor unitário</label>
              <input type="number" value={valorUnitario} onChange={(e) => setValorUnitario(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Ajustes (opcional)</label>
            <input
              value={ajustesPeca}
              onChange={(e) => setAjustesPeca(e.target.value)}
              placeholder="ex: Bainha -2cm, ajustar manga"
            />
          </div>
          <button type="button" onClick={adicionarAoCarrinho} disabled={produtoSelecionado === 0} style={{ marginTop: 12 }}>
            + Adicionar
          </button>

          <ul style={{ marginTop: 16 }}>
            {carrinho.map((item, index) => (
              <li key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  {item.quantidade}x {item.referencia ? `${item.referencia} — ` : ""}{item.modelo} · {item.cor} · Tam. {item.tamanho} — R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                  {item.ajustes && ` — ${item.ajustes}`}
                </span>
                <button type="button" onClick={() => removerDoCarrinho(index)}>Remover</button>
              </li>
            ))}
          </ul>
        </div>

        <h2>Ajuste</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, margin: 0 }}>
            <input
              type="checkbox"
              checked={precisaAjuste}
              onChange={(e) => setPrecisaAjuste(e.target.checked)}
              style={{ width: "auto" }}
            />
            Essa peça precisa de ajuste
          </label>

          {precisaAjuste && (
            <div style={{ marginTop: 12, maxWidth: 240 }}>
              <label>Data de retirada</label>
              <input
                type="date"
                value={dataRetiradaAjuste}
                onChange={(e) => setDataRetiradaAjuste(e.target.value)}
                required
              />
            </div>
          )}

          <p style={{ fontSize: 12, color: "var(--texto-suave)", marginTop: 8 }}>
            Nota: essa tela ainda não salva mudanças de ajuste/pagamento pendente — use isso só como conferência.
            Pra alterar de verdade, use a tela "Vendas Pendentes".
          </p>
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