import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface Locacao {
  id: number;
  clienteId: number;
  dataEvento: string;
  dataRetirada: string;
  dataRetiradaReal: string | null;
  valorTotal: number;
  valorEntrada: number;
  valorRestante: number;
  formaPagamentoRestante: number | null;
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
}

// segunda-feira da semana que contém a data informada
function inicioDaSemana(data: Date): Date {
  const dia = data.getDay(); // domingo = 0, segunda = 1, ...
  const diferenca = dia === 0 ? -6 : 1 - dia;
  const inicio = new Date(data);
  inicio.setDate(data.getDate() + diferenca);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR");
}

export function Retiradas() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [dataReferencia, setDataReferencia] = useState(() => new Date().toISOString().split("T")[0]);
  const [mostrarTodas, setMostrarTodas] = useState(false);

  function carregarDados() {
    api.get<Locacao[]>("/Locacoes").then((resposta) => {
      const pendentes = resposta.data.filter(
        (l) => l.dataRetiradaReal === null || l.formaPagamentoRestante === null
      );
      setLocacoes(pendentes);
    });
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function nomeCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  async function registrarPagamento(id: number, formaPagamento: number) {
    const confirmar = window.confirm("Confirmar o PAGAMENTO do restante dessa locação?");
    if (!confirmar) return;
    try {
      await api.put(`/Locacoes/${id}/pagamento-restante`, { formaPagamento });
      setMensagem(`Pagamento da locação #${id} registrado com sucesso!`);
      carregarDados();
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
      carregarDados();
    } catch (erro: any) {
      setMensagem(erro.response?.data || "Erro ao registrar retirada.");
    }
  }

  // calcula o intervalo da semana (segunda a domingo) com base na data escolhida
  const inicio = inicioDaSemana(new Date(dataReferencia + "T00:00:00"));
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);

  const locacoesDaSemana = mostrarTodas
    ? locacoes
    : locacoes.filter((l) => {
        const evento = new Date(l.dataEvento);
        return evento >= inicio && evento <= fim;
      });

  // ordena: primeiro por data do evento, depois (empatando) por data de retirada
  const locacoesOrdenadas = [...locacoesDaSemana].sort((a, b) => {
    const eventoA = new Date(a.dataEvento).getTime();
    const eventoB = new Date(b.dataEvento).getTime();
    if (eventoA !== eventoB) return eventoA - eventoB;

    const retiradaA = new Date(a.dataRetirada).getTime();
    const retiradaB = new Date(b.dataRetirada).getTime();
    return retiradaA - retiradaB;
  });

  return (
    <div>
      <h1>Retiradas e Pagamentos Pendentes</h1>

  <div className="card" style={{ marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
  <div className="campo">
    <label>Semana de referência</label>
    <input
      type="date"
      value={dataReferencia}
      onChange={(e) => setDataReferencia(e.target.value)}
      disabled={mostrarTodas}
    />
  </div>

  <div className="campo">
    <label style={{ visibility: "hidden" }}>.</label>
    <div style={{ display: "flex", alignItems: "center", gap: 8, height: 38 }}>
      <input
        type="checkbox"
        id="mostrar-todas"
        checked={mostrarTodas}
        onChange={(e) => setMostrarTodas(e.target.checked)}
        style={{ width: "auto" }}
      />
      <label htmlFor="mostrar-todas" style={{ margin: 0 }}>Mostrar todas as pendências</label>
    </div>
  </div>
</div>

{!mostrarTodas && (
  <p style={{ color: "var(--texto-suave)", marginTop: -8, marginBottom: 20 }}>
    Semana de {formatarData(inicio)} a {formatarData(fim)} — eventos nesse período
  </p>
)}

      {!mostrarTodas && (
        <p style={{ color: "var(--texto-suave)", marginTop: -12 }}>
          Semana de {formatarData(inicio)} a {formatarData(fim)} — eventos nesse período
        </p>
      )}

      {mensagem && <p>{mensagem}</p>}

      {locacoesOrdenadas.length === 0 && (
        <p style={{ color: "var(--texto-suave)" }}>Nada pendente nesse período.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {locacoesOrdenadas.map((locacao) => (
          <div key={locacao.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{nomeCliente(locacao.clienteId)}</div>
                <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                  Locação #{locacao.id} — evento em {locacao.dataEvento.split("T")[0]}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Retirada prevista</div>
                <div style={{ fontWeight: 600 }}>{locacao.dataRetirada.split("T")[0]}</div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 16,
                paddingTop: 16,
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