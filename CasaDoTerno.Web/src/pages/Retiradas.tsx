import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface ItemLocacao {
  produtoId: number;
  ajustes: string | null;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataRetirada: string;
  dataRetiradaReal: string | null;
  valorTotal: number;
  valorEntrada: number;
  valorRestante: number;
  formaPagamentoRestante: number | null;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
}

interface Produto {
  id: number;
  modelo: string;
  referencia: string | null;
  cor: string;
  tamanho: string;
}

export function Retiradas() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [mensagem, setMensagem] = useState("");

  function carregarLocacoes() {
    api.get<Locacao[]>("/Locacoes").then((resposta) => {
      const pendentes = resposta.data.filter(
        (l) => l.dataRetiradaReal === null || l.formaPagamentoRestante === null
      );
      setLocacoes(pendentes);
    });
  }

  useEffect(() => {
    carregarLocacoes();
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, []);

  function nomeCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  function descricaoProduto(produtoId: number) {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return `Produto #${produtoId}`;
    const codigo = produto.referencia ? `${produto.referencia} — ` : "";
    return `${codigo}${produto.modelo} · ${produto.cor} · Tam. ${produto.tamanho}`;
  }

  async function registrarPagamento(id: number, formaPagamento: number) {
    const confirmar = window.confirm("Confirmar o PAGAMENTO do restante dessa locação?");
    if (!confirmar) return;
    try {
      await api.put(`/Locacoes/${id}/pagamento-restante`, { formaPagamento });
      setMensagem(`Pagamento da locação #${id} registrado com sucesso!`);
      carregarLocacoes();
    } catch (erro: any) {
      setMensagem(erro.response?.data || "Erro ao registrar pagamento.");
    }
  }

  async function confirmarRetirada(id: number) {
    const confirmar = window.confirm("Confirmar a RETIRADA física dessa locação?");
    if (!confirmar) return;
    try {
      await api.put(`/Locacoes/${id}/retirada`);
      setMensagem(`Retirada da locação #${id} registrada com sucesso!`);
      carregarLocacoes();
    } catch (erro: any) {
      setMensagem(erro.response?.data || "Erro ao registrar retirada.");
    }
  }

  return (
    <div>
      <h1>Retiradas e Pagamentos Pendentes</h1>
      {mensagem && <p>{mensagem}</p>}

      {locacoes.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nada pendente no momento.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {locacoes.map((locacao) => (
          <div key={locacao.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{nomeCliente(locacao.clienteId)}</div>
                <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                  Locação #{locacao.id} — retirada prevista em {locacao.dataRetirada.split("T")[0]}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--borda)" }}>
              {locacao.itens.map((item, index) => (
                <div key={index} style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                  • {descricaoProduto(item.produtoId)}
                  {item.ajustes && ` — ${item.ajustes}`}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid var(--borda)",
              }}
            >
              <div>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Total</div>
                <div style={{ fontWeight: 600 }}>R$ {locacao.valorTotal.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Entrada paga</div>
                <div style={{ fontWeight: 600 }}>R$ {locacao.valorEntrada.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Restante</div>
                <div style={{ fontWeight: 600, color: locacao.formaPagamentoRestante === null ? "#f87171" : "var(--verde)" }}>
                  R$ {locacao.valorRestante.toFixed(2)}
                  {locacao.formaPagamentoRestante !== null && " (pago)"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
              {locacao.formaPagamentoRestante === null && (
                <PagamentoInline onConfirmar={(forma) => registrarPagamento(locacao.id, forma)} />
              )}

              {locacao.dataRetiradaReal === null ? (
                <button onClick={() => confirmarRetirada(locacao.id)}>Confirmar retirada</button>
              ) : (
                <span style={{ color: "var(--verde)", fontSize: 13 }}>✔ Já retirado</span>
              )}

              <Link to={`/locacoes/editar/${locacao.id}`}>Editar</Link>
              <Link to={`/locacoes/imprimir/${locacao.id}`}>Imprimir</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PagamentoInline({ onConfirmar }: { onConfirmar: (forma: number) => void }) {
  const [forma, setForma] = useState(0);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <select value={forma} onChange={(e) => setForma(Number(e.target.value))} style={{ width: "auto" }}>
        <option value={0}>Dinheiro</option>
        <option value={1}>Cartão</option>
        <option value={2}>Pix</option>
        <option value={3}>Boleto</option>
      </select>
      <button onClick={() => onConfirmar(forma)}>Registrar pagamento</button>
    </div>
  );
}