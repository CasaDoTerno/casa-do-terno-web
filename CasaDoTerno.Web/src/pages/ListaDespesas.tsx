import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface Parcela {
  id: number;
  numeroParcela: number;
  valorParcela: number;
  formaPagamento: number;
  dataVencimento: string;
  dataPagamento: string | null;
}

interface Despesa {
  id: number;
  descricao: string;
  categoria: string | null;
  valor: number;
  dataLancamento: string;
  observacao: string | null;
  criadoPor: string | null;
  editadoPor: string | null;
  dataEdicao: string | null;
  despesaRecorrenteId: number | null;
  parcelas: Parcela[];
}

const nomesFormaPagamento = ["Dinheiro", "Cartão", "Pix", "Boleto"];

const nomesMeses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// data de hoje no fuso do navegador (toISOString usaria UTC e viraria o dia à noite)
function paraISO(data: Date): string {
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const dd = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mm}-${dd}`;
}

function parcelasDe(despesa: Despesa): Parcela[] {
  return despesa.parcelas ?? [];
}

function PagamentoParcela({
  parcela,
  onConfirmar,
}: {
  parcela: Parcela;
  onConfirmar: (forma: number, data: string) => void;
}) {
  const hojeISO = paraISO(new Date());
  const [forma, setForma] = useState(parcela.formaPagamento);
  const [data, setData] = useState(hojeISO);

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <select value={forma} onChange={(e) => setForma(Number(e.target.value))} style={{ width: "auto" }}>
        {nomesFormaPagamento.map((nome, index) => (
          <option key={index} value={index}>{nome}</option>
        ))}
      </select>
      <input
        type="date"
        value={data}
        max={hojeISO}
        onChange={(e) => setData(e.target.value)}
        style={{ width: "auto" }}
        title="Data do pagamento"
      />
      <button type="button" onClick={() => onConfirmar(forma, data)}>Registrar pagamento</button>
    </div>
  );
}

export function ListaDespesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mensagem, setMensagem] = useState("");

  function carregarDespesas() {
    api.get<Despesa[]>("/Despesas").then((r) => setDespesas(r.data));
  }

  useEffect(() => {
    carregarDespesas();
  }, []);

  const despesasDoMes = despesas.filter((d) => {
    const data = new Date(d.dataLancamento);
    return data.getMonth() + 1 === mes && data.getFullYear() === ano;
  });

  const despesasOrdenadas = [...despesasDoMes].sort(
    (a, b) => new Date(a.dataLancamento).getTime() - new Date(b.dataLancamento).getTime()
  );

  const totalDoMes = despesasDoMes.reduce((soma, d) => soma + d.valor, 0);

  const totalPendente = despesasDoMes.reduce(
    (soma, d) =>
      soma +
      parcelasDe(d)
        .filter((p) => p.dataPagamento === null)
        .reduce((s, p) => s + p.valorParcela, 0),
    0
  );

  const hojeISO = paraISO(new Date());
  const limite = new Date();
  limite.setDate(limite.getDate() + 3);
  const limiteISO = paraISO(limite);

  // o status vem das parcelas NÃO pagas: despesa já paga nunca aparece como vencida
  function statusDaDespesa(despesa: Despesa): { texto: string; cor: string } | null {
    const parcelas = parcelasDe(despesa);
    if (parcelas.length === 0) return null;

    const pendentes = parcelas.filter((p) => p.dataPagamento === null);
    if (pendentes.length === 0) return { texto: "Paga", cor: "var(--verde)" };

    const maisProxima = pendentes.map((p) => p.dataVencimento.split("T")[0]).sort()[0];
    if (maisProxima < hojeISO) return { texto: "Vencida", cor: "#f87171" };
    if (maisProxima <= limiteISO) return { texto: "Vence em breve", cor: "#facc15" };
    return { texto: "A pagar", cor: "var(--texto-suave)" };
  }

  async function registrarPagamento(parcelaId: number, forma: number, data: string) {
    const confirmar = window.confirm("Confirmar o PAGAMENTO dessa parcela?");
    if (!confirmar) return;

    try {
      await api.put(`/Parcelas/${parcelaId}/pagamento`, {
        formaPagamento: forma,
        dataPagamento: data,
      });
      setMensagem("Pagamento registrado com sucesso!");
      carregarDespesas();
    } catch (erro: any) {
      console.error(erro);
      const detalhe = erro.response?.data;
      setMensagem(typeof detalhe === "string" ? detalhe : "Erro ao registrar pagamento.");
    }
  }

  async function excluirDespesa(id: number) {
    const confirmar = window.confirm("Tem certeza que quer excluir essa despesa?");
    if (!confirmar) return;

    try {
      await api.delete(`/Despesas/${id}`);
      setMensagem("Despesa excluída com sucesso!");
      carregarDespesas();
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao excluir despesa.");
    }
  }

  return (
    <div>
      <h1>Despesas do Mês</h1>

      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div className="campo">
          <label>Mês</label>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {nomesMeses.map((nome, index) => (
              <option key={index} value={index + 1}>{nome}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label>Ano</label>
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            style={{ width: 100 }}
          />
        </div>
      </div>

      {mensagem && <p>{mensagem}</p>}

      <p style={{ color: "var(--texto-suave)" }}>
        {despesasDoMes.length} despesa(s) — Total do mês:{" "}
        <strong style={{ color: "var(--verde)" }}>R$ {totalDoMes.toFixed(2)}</strong>
        {totalPendente > 0 && (
          <>
            {" "}— Ainda a pagar:{" "}
            <strong style={{ color: "#facc15" }}>R$ {totalPendente.toFixed(2)}</strong>
          </>
        )}
      </p>

      {despesasOrdenadas.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nenhuma despesa nesse mês.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {despesasOrdenadas.map((despesa) => {
          const status = statusDaDespesa(despesa);
          const parcelas = parcelasDe(despesa);
          const destacar = status && (status.texto === "Vencida" || status.texto === "Vence em breve");

          return (
            <div
              key={despesa.id}
              className="card"
              style={destacar ? { borderLeft: `3px solid ${status!.cor}` } : undefined}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {despesa.descricao}
                    {despesa.despesaRecorrenteId !== null && (
                      <span style={{ fontSize: 11, color: "var(--texto-suave)", fontWeight: 400 }}>
                        [R] Recorrente
                      </span>
                    )}
                    {status && (
                      <span style={{ fontSize: 11, color: status.cor, fontWeight: 700 }}>
                        {status.texto}
                      </span>
                    )}
                  </div>
                  <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                    {despesa.categoria && `${despesa.categoria} · `}
                    Data: {new Date(despesa.dataLancamento).toLocaleDateString("pt-BR")}
                    {despesa.observacao && ` · ${despesa.observacao}`}
                  </div>
                  {despesa.criadoPor && (
                    <div style={{ color: "var(--texto-suave)", fontSize: 12, marginTop: 4 }}>
                      Criado por {despesa.criadoPor}
                      {despesa.editadoPor && ` · Editado por ${despesa.editadoPor} em ${new Date(despesa.dataEdicao!).toLocaleDateString("pt-BR")}`}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>R$ {despesa.valor.toFixed(2)}</div>
                  <Link to={`/despesas/editar/${despesa.id}`}>Editar</Link>
                  <button onClick={() => excluirDespesa(despesa.id)}>Excluir</button>
                </div>
              </div>

              {parcelas.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {parcelas.map((parcela) => (
                    <div
                      key={parcela.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                        padding: "8px 0",
                        borderTop: "1px solid var(--borda)",
                        fontSize: 13,
                      }}
                    >
                      <span>
                        {parcelas.length > 1 && `Parcela ${parcela.numeroParcela}/${parcelas.length} — `}
                        vence {new Date(parcela.dataVencimento).toLocaleDateString("pt-BR")} — R${" "}
                        {parcela.valorParcela.toFixed(2)}
                      </span>

                      {parcela.dataPagamento !== null ? (
                        <span style={{ color: "var(--verde)", fontWeight: 700 }}>
                          ✓ Pago em {new Date(parcela.dataPagamento).toLocaleDateString("pt-BR")} (
                          {nomesFormaPagamento[parcela.formaPagamento]})
                        </span>
                      ) : (
                        <PagamentoParcela
                          parcela={parcela}
                          onConfirmar={(forma, data) => registrarPagamento(parcela.id, forma, data)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}