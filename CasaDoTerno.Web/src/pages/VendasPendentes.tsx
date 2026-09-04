import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Services/API";

interface ItemVenda {
  produtoId: number;
  quantidade: number;
}

interface Venda {
  id: number;
  clienteId: number;
  dataVenda: string;
  valorTotal: number;
  precisaAjuste: boolean;
  dataRetiradaAjuste: string | null;
  dataRetiradaRealizada: string | null;
  pagamentoPendente: boolean;
  itens: ItemVenda[];
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  cpf: string;
}

export function VendasPendentes() {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");

  function carregar() {
    api.get<Venda[]>("/Vendas").then((r) => {
      const pendentes = r.data.filter(
        (v) => v.pagamentoPendente || (v.precisaAjuste && v.dataRetiradaRealizada === null)
      );
      setVendas(pendentes);
    });
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }

  useEffect(() => {
    carregar();
  }, []);

  function nomeCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  async function confirmarRetirada(id: number) {
    const confirmar = window.confirm("Confirmar a retirada dessa venda?");
    if (!confirmar) return;
    try {
      await api.put(`/Vendas/${id}/confirmar-retirada`);
      setMensagem(`Retirada da venda #${id} confirmada.`);
      carregar();
    } catch (erro: any) {
      setMensagem(erro.response?.data || "Erro ao confirmar retirada.");
    }
  }

  const vendasFiltradas = vendas.filter((venda) => {
    if (!busca) return true;
    const cliente = clientes.find((c) => c.id === venda.clienteId);
    const texto = `${cliente?.nome ?? ""} ${cliente?.cpf ?? ""} ${cliente?.telefone ?? ""}`.toLowerCase();
    const palavras = busca.toLowerCase().split(" ").filter((p) => p.length > 0);
    return palavras.every((palavra) => texto.includes(palavra));
  });

  return (
    <div>
      <h1>Vendas Pendentes</h1>
      <p style={{ color: "var(--texto-suave)" }}>
        Vendas com pagamento a receber e/ou peça ainda não retirada.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="campo">
          <label>Buscar por nome, CPF ou telefone</label>
          <input
            type="text"
            placeholder="Digite pra buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {mensagem && <p>{mensagem}</p>}

      {vendasFiltradas.length === 0 && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhuma venda pendente encontrada.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {vendasFiltradas.map((venda) => (
          <div key={venda.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{nomeCliente(venda.clienteId)}</div>
                <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                  Venda #{venda.id} — {new Date(venda.dataVenda).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>R$ {venda.valorTotal.toFixed(2)}</div>
            </div>

            {venda.precisaAjuste && (
              <div style={{ marginTop: 8, fontSize: 13, color: "var(--texto-suave)" }}>
                Ajuste — retirada prevista: {venda.dataRetiradaAjuste ? new Date(venda.dataRetiradaAjuste).toLocaleDateString("pt-BR") : "—"}
                {venda.dataRetiradaRealizada === null ? (
                  <span style={{ color: "#facc15", marginLeft: 8 }}>○ Não retirada ainda</span>
                ) : (
                  <span style={{ color: "var(--verde)", marginLeft: 8 }}>✓ Retirada confirmada</span>
                )}
              </div>
            )}

            {venda.pagamentoPendente && (
              <div style={{ marginTop: 4, fontSize: 13, color: "#f87171" }}>
                ⚠ Pagamento pendente
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
              {venda.pagamentoPendente && (
                <PagamentoInline
                  onConfirmar={(forma, parcelas) => registrarPagamento(venda.id, forma, parcelas, carregar, setMensagem)}
                />
              )}

              {venda.precisaAjuste && venda.dataRetiradaRealizada === null && (
                <button type="button" onClick={() => confirmarRetirada(venda.id)}>
                  Confirmar retirada
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate(`/vendas/imprimir/${venda.id}`)}
              >
                Ver Recibo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function registrarPagamento(
  vendaId: number,
  formaPagamento: number,
  numeroParcelas: number,
  carregar: () => void,
  setMensagem: (m: string) => void
) {
  const confirmar = window.confirm("Confirmar o PAGAMENTO dessa venda?");
  if (!confirmar) return;
  try {
    await api.put(`/Vendas/${vendaId}/registrar-pagamento`, { formaPagamento, numeroParcelas });
    setMensagem(`Pagamento da venda #${vendaId} registrado com sucesso!`);
    carregar();
  } catch (erro: any) {
    setMensagem(erro.response?.data || "Erro ao registrar pagamento.");
  }
}

function PagamentoInline({ onConfirmar }: { onConfirmar: (forma: number, parcelas: number) => void }) {
  const [forma, setForma] = useState(0);
  const [parcelas, setParcelas] = useState(1);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <select value={forma} onChange={(e) => setForma(Number(e.target.value))} style={{ width: "auto" }}>
        <option value={0}>Dinheiro</option>
        <option value={1}>Cartão</option>
        <option value={2}>Pix</option>
        <option value={3}>Boleto</option>
      </select>
      <input
        type="number"
        min={1}
        value={parcelas}
        onChange={(e) => setParcelas(Number(e.target.value))}
        style={{ width: 70 }}
        title="Número de parcelas"
      />
      <button onClick={() => onConfirmar(forma, parcelas)}>Registrar pagamento</button>
    </div>
  );
}