import { useEffect, useState } from "react";
import api from "../Services/API";

interface Produto {
  id: number;
  modelo: string;
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

  useEffect(() => {
    api.get<Produto[]>("/Produtos").then((r) =>
      setProdutos(r.data.filter((p) => p.disponivelParaLocacao))
    );
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }, []);

  function adicionarPeca() {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    setPecas([
      ...pecas,
      {
        produtoId: produto.id,
        modelo: produto.modelo,
        ajustes: ajustesPeca,
        valorLocacao: produto.valorLocacao,
      },
    ]);
    setProdutoSelecionado(0);
    setAjustesPeca("");
  }

  function removerPeca(index: number) {
    setPecas(pecas.filter((_, i) => i !== index));
  }

  // total calculado ao vivo: soma das peças, menos o desconto
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
        itens: pecas.map((p) => ({ produtoId: p.produtoId, ajustes: p.ajustes })),
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
      <form onSubmit={handleSubmit}>
        <div>
          <label>Cliente: </label>
          <select value={clienteId} onChange={(e) => setClienteId(Number(e.target.value))} required>
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
          <label>Data do evento: </label>
          <input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} required />
        </div>
        <div>
          <label>Data de retirada: </label>
          <input type="date" value={dataRetirada} onChange={(e) => setDataRetirada(e.target.value)} required />
        </div>
        <div>
          <label>Data de devolução prevista: </label>
          <input
            type="date"
            value={dataDevolucaoPrevista}
            onChange={(e) => setDataDevolucaoPrevista(e.target.value)}
            required
          />
        </div>

        <h2>Adicionar peça</h2>
        <div>
          <label>Produto: </label>
          <select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(Number(e.target.value))}>
            <option value={0}>Selecione...</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>{p.modelo} — R$ {p.valorLocacao}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Ajustes (opcional): </label>
          <input
            value={ajustesPeca}
            onChange={(e) => setAjustesPeca(e.target.value)}
            placeholder="ex: Bainha -2cm, Manga -1cm"
          />
        </div>
        <button type="button" onClick={adicionarPeca} disabled={produtoSelecionado === 0}>
          Adicionar peça
        </button>

        <h2>Peças da locação</h2>
        {pecas.length === 0 && <p>Nenhuma peça adicionada ainda.</p>}
        <ul>
          {pecas.map((peca, index) => (
            <li key={index}>
              {peca.modelo} — R$ {peca.valorLocacao} {peca.ajustes && `— ${peca.ajustes}`}
              {" "}
              <button type="button" onClick={() => removerPeca(index)}>Remover</button>
            </li>
          ))}
        </ul>

        <h2>Pagamento</h2>
        <div>
          <label>Desconto (combo): </label>
          <input type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} />
        </div>

        <p>Subtotal: R$ {subtotal.toFixed(2)}</p>
        <p><strong>Total (com desconto): R$ {valorTotal.toFixed(2)}</strong></p>

        <div>
          <label>Valor de entrada: </label>
          <input type="number" value={valorEntrada} onChange={(e) => setValorEntrada(Number(e.target.value))} />
        </div>
        <div>
          <label>Forma de pagamento da entrada: </label>
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

        <p>Restante a pagar (na retirada): R$ {valorRestante.toFixed(2)}</p>

        <button type="submit">Confirmar locação</button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}