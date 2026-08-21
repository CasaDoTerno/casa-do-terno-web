import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Printer, FileText, AlertTriangle } from "lucide-react";
import api from "../Services/API";

interface ItemLocacao {
  produtoId: number;
  ajustes: string | null;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataRetiradaReal: string | null;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal: string | null;
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

export function Devolucoes() {
  const navigate = useNavigate();
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [mostrarNaoRetiradas, setMostrarNaoRetiradas] = useState(false);

function carregarLocacoes() {
  api.get<Locacao[]>("/Locacoes").then((r) => {
    const pendentes = r.data.filter((l) => {
      if (l.dataDevolucaoReal !== null) return false;
      if (mostrarNaoRetiradas) return true;
      return l.dataRetiradaReal !== null;
    });
    setLocacoes(pendentes);
  });
}

useEffect(() => {
  carregarLocacoes();
  api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
}, [mostrarNaoRetiradas]);

  function nomeCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  function descricaoProduto(produtoId: number) {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return `Produto #${produtoId}`;
    const codigo = produto.referencia ? `${produto.referencia} — ` : "";
    return `${codigo}${produto.modelo} · ${produto.cor} · Tam. ${produto.tamanho}`;
  }

async function confirmarDevolucao(id: number) {
    const confirmar = window.confirm("Confirmar a DEVOLUÇÃO dessa locação?");
    if (!confirmar) return;

    try {
      const resposta = await api.put(`/Locacoes/${id}/devolucao`);
      const multa = resposta.data.multa as number;

      if (multa > 0) {
        const formaTexto = window.prompt(
          `Essa devolução está atrasada — multa calculada: R$ ${multa.toFixed(2)}.\n\n` +
          `Digite a forma de pagamento:\n0 = Dinheiro\n1 = Cartão\n2 = Pix\n3 = Boleto\n\n` +
          `Ou digite ISENTAR pra não cobrar essa multa dessa vez.\n\n` +
          `(deixe em branco e clique OK se ainda não foi pago, mas continua cobrando depois)`
        );

        if (formaTexto !== null && formaTexto.trim() !== "") {
          const textoLimpo = formaTexto.trim().toUpperCase();

          if (textoLimpo === "ISENTAR") {
            await api.put(`/Locacoes/${id}/isentar-multa`);
          } else {
            await api.put(`/Locacoes/${id}/pagamento-multa`, { formaPagamento: Number(textoLimpo) });
          }
        }
      }

      setMensagem(
        `Devolução da locação #${id} registrada com sucesso!` +
        (multa > 0 ? ` Multa por atraso: R$ ${multa.toFixed(2)}.` : "")
      );
      carregarLocacoes();
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao registrar devolução.");
    }
  }
  async function confirmarRetirada(id: number) {
  const confirmar = window.confirm(
    "Confirmar a RETIRADA dessa locação agora? Use isso pra registrar uma retirada em atraso ou esquecida."
  );
  if (!confirmar) return;
  try {
    await api.put(`/Locacoes/${id}/retirada`);
    setMensagem(`Retirada da locação #${id} registrada com sucesso!`);
    carregarLocacoes();
  } catch (erro: any) {
    console.error(erro);
    setMensagem(erro.response?.data || "Erro ao registrar retirada.");
  }
}

  const hojeISO = new Date().toISOString().split("T")[0];

  const locacoesFiltradas = locacoes.filter((locacao) => {
    const textoCliente = nomeCliente(locacao.clienteId).toLowerCase();
    const textoPecas = locacao.itens.map((item) => descricaoProduto(item.produtoId)).join(" ").toLowerCase();
    const textoCompleto = `${textoCliente} ${textoPecas}`;

    const palavras = busca.toLowerCase().split(" ").filter((p) => p.length > 0);
    return palavras.every((palavra) => textoCompleto.includes(palavra));
  });

  const locacoesOrdenadas = [...locacoesFiltradas].sort(
    (a, b) => new Date(a.dataDevolucaoPrevista).getTime() - new Date(b.dataDevolucaoPrevista).getTime()
  );

  return (
    <div>
      <h1>Devoluções Pendentes</h1>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="campo">
          <label>Buscar por cliente ou peça</label>
          <input
            type="text"
            placeholder="Nome do cliente, descrição, código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            id="mostrar-nao-retiradas"
            checked={mostrarNaoRetiradas}
            onChange={(e) => setMostrarNaoRetiradas(e.target.checked)}
            style={{ width: "auto" }}
          />
          <label htmlFor="mostrar-nao-retiradas" style={{ margin: 0 }}>
            Mostrar também locações que nunca foram retiradas (mas já passaram da data)
          </label>
        </div>
      </div>

      {mensagem && <p>{mensagem}</p>}

      {locacoesOrdenadas.length === 0 && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhuma devolução pendente.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {locacoesOrdenadas.map((locacao) => {
          const atrasada = locacao.dataDevolucaoPrevista.split("T")[0] < hojeISO;
          const naoRetirada = locacao.dataRetiradaReal === null;
          return (
            <div
              key={locacao.id}
              className="card"
              style={atrasada ? { borderLeft: "3px solid #f87171" } : undefined}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{nomeCliente(locacao.clienteId)}</div>
                  <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                    Locação #{locacao.id}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Devolução prevista</div>
                  <div style={{ fontWeight: 600, color: atrasada ? "#f87171" : undefined }}>
                    {locacao.dataDevolucaoPrevista.split("T")[0]}
                  </div>
                  {atrasada && (
                    <div style={{ color: "#f87171", fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <AlertTriangle size={12} /> Atrasada
                    </div>
                  )}
                  {naoRetirada && (
                    <div style={{ color: "#facc15", fontSize: 12, marginTop: 2 }}>
                      Ainda não retirada
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--borda)" }}>
                {locacao.itens.map((item, index) => (
                  <div key={index} style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                    • {descricaoProduto(item.produtoId)}
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
                  <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Restante</div>
                  <div style={{ fontWeight: 600, color: locacao.formaPagamentoRestante === null ? "#f87171" : "var(--verde)" }}>
                    R$ {locacao.valorRestante.toFixed(2)}
                    {locacao.formaPagamentoRestante !== null && " (pago)"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
                {naoRetirada ? (
                  <>
                    <button type="button" onClick={() => confirmarRetirada(locacao.id)}>
                      Confirmar retirada (atrasada)
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/locacoes/editar/${locacao.id}`)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Pencil size={16} /> Editar
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => confirmarDevolucao(locacao.id)}>
                    Confirmar devolução
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/locacoes/editar/${locacao.id}`)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Pencil size={16} /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/locacoes/imprimir/${locacao.id}`)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Printer size={16} /> Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/locacoes/contrato/${locacao.id}`)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <FileText size={16} /> Contrato
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}