import { useEffect, useState } from "react";
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
  valorLocacao: number;
  disponivelParaLocacao: boolean;
}

interface Cliente {
  id: number;
  nome: string;
}

interface PecaCarrinho {
  produtoId: number;
  modelo: string;
  ajustes: string;
  valorLocacao: number;
}


export function Locacao() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState(0);
  const [dataEvento, setDataEvento] = useState("");
  const [dataRetirada, setDataRetirada] = useState("");
  const [dataDevolucaoPrevista, setDataDevolucaoPrevista] = useState("");
  const [consultor, setConsultor] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [valorEntrada, setValorEntrada] = useState(0);
  const [formaPagamentoEntrada, setFormaPagamentoEntrada] = useState(0);
  const [produtoSelecionado, setProdutoSelecionado] = useState(0);
  const [ajustesPeca, setAjustesPeca] = useState("");
  const [pecas, setPecas] = useState<PecaCarrinho[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [valorPeca, setValorPeca] = useState(0);


function buscarProdutos() {
  api.get<Produto[]>("/Produtos").then((r) =>
    setProdutos(r.data.filter((p) => p.disponivelParaLocacao))
  );
}

useEffect(() => {
  const produto = produtos.find((p) => p.id === produtoSelecionado);
  if (produto) {
    setValorPeca(produto.valorLocacao);
  }
}, [produtoSelecionado, produtos]);

  function adicionarPeca() {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    setPecas([
      ...pecas,
      {
        produtoId: produto.id,
        modelo: produto.modelo,
        ajustes: ajustesPeca,
        valorLocacao: valorPeca,
      },
    ]);
    setProdutoSelecionado(0);
    setAjustesPeca("");
    setValorPeca(0);
  }

  function removerPeca(index: number) {
    setPecas(pecas.filter((_, i) => i !== index));
  }

  const subtotal = pecas.reduce((soma, peca) => soma + peca.valorLocacao, 0);
  const valorTotal = subtotal - desconto;
  const valorRestante = valorTotal - valorEntrada;

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();

    if (pecas.length === 0) {
      setMensagem("Adicione pelo menos uma peça antes de confirmar.");
      return;
    }

    try {
      await api.post("/Locacoes", {
        clienteId,
        dataEvento,
        dataRetirada,
        dataDevolucaoPrevista,
        consultor,
        desconto,
        valorEntrada,
        formaPagamentoEntrada,
        itens: pecas.map((p) => ({ produtoId: p.produtoId, ajustes: p.ajustes, valorItem: p.valorLocacao })),
});
      setMensagem("Locação criada com sucesso!");
      setPecas([]);
      setDesconto(0);
      setValorEntrada(0);
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao criar locação.");
    }
  }

  return (
    <div>
      <h1>Nova Locação</h1>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label>Data do evento</label>
              <input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} required />
            </div>
            <div>
              <label>Retirada</label>
              <input type="date" value={dataRetirada} onChange={(e) => setDataRetirada(e.target.value)} required />
            </div>
            <div>
              <label>Devolução prevista</label>
              <input
                type="date"
                value={dataDevolucaoPrevista}
                onChange={(e) => setDataDevolucaoPrevista(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <h2>Peças</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Produto</label>
              <BuscaSelect
                opcoes={produtos.map((p) => ({
                  id: p.id,
                  label: `${p.referencia ? p.referencia + " · " : ""}${nomesCategoria[p.categoria]} · ${p.modelo} · ${p.cor} · ${p.tamanho} — R$ ${p.valorLocacao}`,
                }))}
                valorSelecionado={produtoSelecionado}
                onSelecionar={setProdutoSelecionado}
                onAbrir={buscarProdutos}
                placeholder="Buscar peça..."
              />
          </div>
          <div>
            <label>Ajustes (opcional)</label>
            <input
              value={ajustesPeca}
              onChange={(e) => setAjustesPeca(e.target.value)}
              placeholder="ex: Bainha -2cm, Manga -1cm"
            />
          </div>
          <div>
          <label>Valor dessa peça</label>
          <input
            type="number"
            value={valorPeca}
            onChange={(e) => setValorPeca(Number(e.target.value))}
          />
        </div>
          <button type="button" onClick={adicionarPeca} disabled={produtoSelecionado === 0}>
            + Adicionar peça
          </button>

          {pecas.length > 0 && (
            <ul style={{ marginTop: 16 }}>
              {pecas.map((peca, index) => (
                <li key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>
                    {peca.modelo} — R$ {peca.valorLocacao} {peca.ajustes && `— ${peca.ajustes}`}
                  </span>
                  <button type="button" onClick={() => removerPeca(index)}>Remover</button>
                </li>
              ))}
            </ul>
          )}
          {pecas.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nenhuma peça adicionada ainda.</p>}
        </div>

        <h2>Pagamento</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label>Desconto (combo)</label>
              <input type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} />
            </div>
            <div>
              <label>Valor de entrada</label>
              <input type="number" value={valorEntrada} onChange={(e) => setValorEntrada(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label>Forma de pagamento da entrada</label>
            <select
              value={formaPagamentoEntrada}
              onChange={(e) => setFormaPagamentoEntrada(Number(e.target.value))}
            >
              <option value={0}>Dinheiro</option>
              <option value={1}>Cartão</option>
              <option value={2}>Pix</option>
              <option value={3}>Boleto</option>
            </select>
          </div>

          <div style={{ borderTop: "1px solid var(--borda)", marginTop: 16, paddingTop: 16 }}>
            <p style={{ color: "var(--texto-suave)", margin: "4px 0" }}>Subtotal: R$ {subtotal.toFixed(2)}</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "4px 0" }}>Total: R$ {valorTotal.toFixed(2)}</p>
            <p style={{ color: "var(--verde)", fontWeight: 600, margin: "4px 0" }}>
              Restante (na retirada): R$ {valorRestante.toFixed(2)}
            </p>
          </div>
        </div>

        <button type="submit">Confirmar locação</button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}