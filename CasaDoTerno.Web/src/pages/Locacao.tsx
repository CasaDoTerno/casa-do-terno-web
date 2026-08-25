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
  valorLocacao: number;
  disponivelParaLocacao: boolean;
}

interface Evento {
  id: number;
  nome: string;
}

interface Cliente {
  id: number;
  nome: string;
}

interface PecaCarrinho {
  produtoId: number;
  modelo: string;
  referencia: string | null;
  cor: string;
  tamanho: string;
  ajustes: string;
  valorLocacao: number;
}

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato", "Acessorio"];

export function Locacao() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

  const [clienteId, setClienteId] = useState(0);
  const [dataEvento, setDataEvento] = useState("");
  const [dataRetirada, setDataRetirada] = useState("");
  const [dataDevolucaoPrevista, setDataDevolucaoPrevista] = useState("");
  const [consultor, setConsultor] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [valorEntrada, setValorEntrada] = useState(0);
  const [formaPagamentoEntrada, setFormaPagamentoEntrada] = useState(0);
  const [eventoId, setEventoId] = useState(0);
  const [ehPrincipalDoEvento, setEhPrincipalDoEvento] = useState(false);

  const [produtoSelecionado, setProdutoSelecionado] = useState(0);
  const [ajustesPeca, setAjustesPeca] = useState("");
  const [valorPeca, setValorPeca] = useState(0);
  const [pecas, setPecas] = useState<PecaCarrinho[]>([]);

  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

function buscarProdutos() {
  api.get<Produto[]>("/Produtos").then((r) => {
    const disponiveis = r.data
      .filter((p) => p.disponivelParaLocacao)
      .sort((a, b) => (a.referencia || "").localeCompare(b.referencia || ""));
    setProdutos(disponiveis);
  });
}
  useEffect(() => {
    buscarProdutos();
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
    api.get<Evento[]>("/Eventos").then((r) => setEventos(r.data));
  }, []);

  useEffect(() => {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (produto) {
      setValorPeca(produto.valorLocacao);
    }
  }, [produtoSelecionado, produtos]);

  async function adicionarPeca() {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    if (!dataRetirada || !dataDevolucaoPrevista) {
      setMensagem("Preencha as datas de retirada e devolução antes de adicionar peças.");
      return;
    }

    const unidadesJaNoCarrinho = pecas.filter((p) => p.produtoId === produto.id).length;

    try {
      const resposta = await api.get("/Locacoes/verificar-disponibilidade", {
        params: {
          produtoId: produto.id,
          dataRetirada,
          dataDevolucaoPrevista,
          unidadesJaNoCarrinho,
        },
      });

      if (!resposta.data.disponivel) {
        setMensagem(resposta.data.mensagem);
        return;
      }
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao verificar disponibilidade dessa peça.");
      return;
    }

    setMensagem("");
  setPecas([
    ...pecas,
    {
      produtoId: produto.id,
      modelo: produto.modelo,
      referencia: produto.referencia,
      cor: produto.cor,
      tamanho: produto.tamanho,
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
    if (enviando) return;

    if (pecas.length === 0) {
      setMensagem("Adicione pelo menos uma peça antes de confirmar.");
      return;
    }

    setEnviando(true);
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
        eventoId: eventoId === 0 ? null : eventoId,
        ehLocacaoPrincipalDoEvento: ehPrincipalDoEvento,
        itens: pecas.map((p) => ({
          produtoId: p.produtoId,
          ajustes: p.ajustes,
          valorItem: p.valorLocacao,
        })),
      });
      setMensagem("Locação criada com sucesso!");
      setPecas([]);
      setDesconto(0);
      setValorEntrada(0);
      setEventoId(0);
      setEhPrincipalDoEvento(false);
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao criar locação.");
    } finally {
      setEnviando(false);
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

          <div>
            <label>Evento (opcional)</label>
            <select value={eventoId} onChange={(e) => setEventoId(Number(e.target.value))}>
              <option value={0}>Nenhum</option>
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.nome}</option>
              ))}
            </select>
          </div>

          {eventoId !== 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <input
                type="checkbox"
                checked={ehPrincipalDoEvento}
                onChange={(e) => setEhPrincipalDoEvento(e.target.checked)}
                style={{ width: "auto" }}
                id="peca-principal"
              />
              <label htmlFor="peca-principal" style={{ margin: 0 }}>
                Essa é a peça principal do evento (recebe o desconto acumulado — ex: o terno do noivo)
              </label>
            </div>
          )}

          {eventoId !== 0 && (
            <p style={{ color: "var(--texto-suave)", fontSize: 13, margin: "8px 0 0 0" }}>
              Vinculado a um evento — a peça marcada como "principal" ganha R$ 10 de desconto a cada
              nova locação que se vincular ao mesmo evento. Confira o valor atualizado na listagem de Locações.
            </p>
          )}

          <div className="grid-3" style={{ marginTop: 12 }}>
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
          <div className="grid-2">
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
          </div>
          <button type="button" onClick={adicionarPeca} disabled={produtoSelecionado === 0}>
            + Adicionar peça
          </button>

          {pecas.length > 0 && (
            <ul style={{ marginTop: 16 }}>
              {pecas.map((peca, index) => (
                <li key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>
                    {peca.referencia ? `${peca.referencia} — ` : ""}{peca.modelo} · {peca.cor} · Tam. {peca.tamanho} — R$ {peca.valorLocacao}
                    {peca.ajustes && ` — ${peca.ajustes}`}
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
          <div className="grid-2">
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

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Confirmar locação"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}