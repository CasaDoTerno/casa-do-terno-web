import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../Services/API";
import logoImagem from "../assets/Logo.png";
import { imprimirNaRede, montarBytesImpressao, type LinhaImpressao } from "../Services/impressaoRede";

interface ItemLocacao {
  produtoId: number;
  ajustes: string | null;
  valorItem: number;
}

interface Locacao {
  id: number;
  clienteId: number;
  eventoId: number | null;
  dataReserva: string | null;
  dataEvento: string;
  dataRetirada: string;
  dataRetiradaReal: string | null;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal: string | null;
  consultor: string | null;
  valorTotal: number;
  valorEntrada: number;
  formaPagamentoEntrada: number;
  dataPagamentoEntrada: string | null;
  formaPagamentoRestante: number | null;
  dataPagamentoRestante: string | null;
  multaAtraso: number | null;
  formaPagamentoMulta: number | null;
  dataPagamentoMulta: string | null;
  observacao?: string | null;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  ombro: number | string | null;
  manga: number | string | null;
  abdomen: number | string | null;
  cintura: number | string | null;
  bainha: number | string | null;
  coxa: number | string | null;
  panturrilha: number | string | null;
}

interface Produto {
  id: number;
  modelo: string;
  categoria: number;
  referencia: string | null;
  cor: string;
  tamanho: string;
}

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato", "Cinto", "Meia", "Relógio", "Gravata"];
const nomesFormaPagamento = ["Dinheiro", "Cartão", "Pix", "Boleto"];

// "2026-10-14T00:00:00" -> "14/10/2026" (sem passar por Date, pra não mudar o dia por fuso)
function dataBR(valor: string | null | undefined) {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}
// a térmica não imprime acento direito: tira acentos e cedilha
function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function dinheiro(valor: number) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function forma(codigo: number | null | undefined) {
  if (codigo === null || codigo === undefined) return "—";
  return nomesFormaPagamento[codigo] ?? "—";
}

const ESTILO = `
  .rc-folha {
    background: #fff;
    color: #000;
    width: 194mm;
    max-width: 100%;
    margin: 0 auto;
    padding: 6mm 7mm;
    box-sizing: border-box;
    border: 1px solid #000;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    line-height: 1.3;
  }
  .rc-folha * { color: #000; box-sizing: border-box; }
  .rc-topo { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 6px; }
  .rc-loja { font-size: 17px; font-weight: 800; letter-spacing: 1px; }
  .rc-sub { font-size: 10px; }
  .rc-titulo { text-align: right; font-weight: 800; font-size: 13px; }
  .rc-titulo div { font-weight: 400; font-size: 11px; }
  .rc-secao { font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #000; margin: 7px 0 3px 0; }
  .rc-grade { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px 14px; }
  .rc-grade2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 14px; }
  .rc-campo b { font-weight: 700; }
  .rc-tabela { width: 100%; border-collapse: collapse; }
  .rc-tabela th { text-align: left; font-size: 10px; border-bottom: 1px solid #000; padding: 2px 4px; }
  .rc-tabela td { padding: 2px 4px; border-bottom: 1px solid #bbb; vertical-align: top; }
  .rc-dir { text-align: right !important; white-space: nowrap; }
  .rc-obs { border: 1px solid #000; padding: 3px 5px; white-space: pre-line; }
  .rc-totais { margin-left: auto; width: 62mm; margin-top: 4px; }
  .rc-totais div { display: flex; justify-content: space-between; padding: 1px 0; }
  .rc-totais .rc-forte { font-weight: 800; font-size: 13px; border-top: 1px solid #000; margin-top: 2px; padding-top: 2px; }
  .rc-assinaturas { display: flex; justify-content: space-around; margin-top: 16px; }
  .rc-assinaturas div { width: 70mm; text-align: center; border-top: 1px solid #000; padding-top: 2px; font-size: 10px; }

  @page { size: A4 portrait; margin: 8mm; }

  @media print {
    html, body { background: #fff !important; }
    body * { visibility: hidden !important; }
    .rc-folha, .rc-folha * { visibility: visible !important; }
    .rc-folha { position: fixed; top: 0; left: 0; width: 194mm; margin: 0; }
  }
`;

export function ReciboLocacao() {
  const { id } = useParams();
  const [locacao, setLocacao] = useState<Locacao | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [nomeEvento, setNomeEvento] = useState("");
  const [horaRetirada, setHoraRetirada] = useState("");
  const [statusImpressao, setStatusImpressao] = useState("");

  useEffect(() => {
    api.get(`/Locacoes/${id}`).then((r) => setLocacao(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
    // hora marcada na agenda (404 = sem horário marcado)
    api
      .get(`/Agendamentos/por-locacao/${id}`)
      .then((r) => setHoraRetirada(r.data.hora ?? ""))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!locacao) return;
    api.get(`/Clientes/${locacao.clienteId}`).then((r) => setCliente(r.data));
    if (locacao.eventoId) {
      api
        .get(`/Eventos/${locacao.eventoId}`)
        .then((r) => setNomeEvento(r.data.nome ?? ""))
        .catch(() => {});
    }
  }, [locacao]);

  if (!locacao || !cliente) return <p>Carregando...</p>;

  function produto(produtoId: number) {
    return produtos.find((p) => p.id === produtoId);
  }

  const subtotal = locacao.itens.reduce((soma, item) => soma + item.valorItem, 0);
  const desconto = Math.max(0, subtotal - locacao.valorTotal);
  const restantePago = locacao.dataPagamentoRestante !== null;
  const restante = Math.max(0, locacao.valorTotal - locacao.valorEntrada);
  const multa = locacao.multaAtraso ?? 0;
  const multaPaga = multa > 0 && locacao.dataPagamentoMulta !== null;

  const totalPago = locacao.valorEntrada + (restantePago ? restante : 0) + (multaPaga ? multa : 0);
  const saldoAPagar = (restantePago ? 0 : restante) + (multa > 0 && !multaPaga ? multa : 0);

  const medidas: [string, number | string | null][] = [
    ["Ombro", cliente.ombro],
    ["Manga", cliente.manga],
    ["Abdômen", cliente.abdomen],
    ["Cintura", cliente.cintura],
    ["Bainha", cliente.bainha],
    ["Coxa", cliente.coxa],
    ["Panturrilha", cliente.panturrilha],
  ];
  const medidasPreenchidas = medidas.filter(([, v]) => v !== null && v !== "" && v !== undefined);
  // recibo compacto pra térmica de rede (comprovante de pagamento pro cliente)
async function imprimirNaTermicaDeRede() {
  if (!locacao || !cliente) return;

  const linhas: LinhaImpressao[] = [
    { texto: "CASA DO TERNO", negrito: true, centralizado: true },
    { texto: "Locacao & Venda de Ternos", centralizado: true },
    { texto: "------------------------------" },
    { texto: "RECIBO DE PAGAMENTO", negrito: true, centralizado: true },
    { texto: "" },
    { texto: `Locacao no: ${locacao.id}` },
    { texto: `Data: ${dataBR(locacao.dataReserva ?? locacao.dataPagamentoEntrada)}` },
    { texto: `Cliente: ${semAcento(cliente.nome)}` },
    { texto: `Retirada: ${dataBR(locacao.dataRetirada)}${horaRetirada ? " " + horaRetirada : ""}` },
    { texto: `Devolucao: ${dataBR(locacao.dataDevolucaoPrevista)}` },
    { texto: "------------------------------" },
    { texto: "PECAS", negrito: true },
  ];

  locacao.itens.forEach((item) => {
    const p = produto(item.produtoId);
    const nome = p ? `${p.referencia ? p.referencia + " - " : ""}${p.modelo}` : `Produto ${item.produtoId}`;
    linhas.push({ texto: semAcento(nome) });
  });

  linhas.push(
    { texto: "------------------------------" },
    { texto: "PAGAMENTOS", negrito: true },
    { texto: `Entrada ${dataBR(locacao.dataPagamentoEntrada)}` },
    { texto: `  ${semAcento(forma(locacao.formaPagamentoEntrada))}: ${dinheiro(locacao.valorEntrada)}` }
  );

  if (restantePago) {
    linhas.push(
      { texto: `Restante ${dataBR(locacao.dataPagamentoRestante)}` },
      { texto: `  ${semAcento(forma(locacao.formaPagamentoRestante))}: ${dinheiro(restante)}` }
    );
  }

  if (multaPaga) {
    linhas.push(
      { texto: `Multa ${dataBR(locacao.dataPagamentoMulta)}` },
      { texto: `  ${semAcento(forma(locacao.formaPagamentoMulta))}: ${dinheiro(multa)}` }
    );
  }

  linhas.push(
    { texto: "------------------------------" },
    { texto: `Total: ${dinheiro(locacao.valorTotal)}` },
    { texto: `Total pago: ${dinheiro(totalPago)}`, negrito: true },
    { texto: `Saldo a pagar: ${dinheiro(saldoAPagar)}`, negrito: true },
    { texto: "" },
    { texto: "Obrigado pela preferencia!", centralizado: true },
    { texto: "" }
  );

  setStatusImpressao("Enviando...");
  const bytes = await montarBytesImpressao(linhas, logoImagem);
  const resultado = await imprimirNaRede(bytes);
  setStatusImpressao(resultado.mensagem);
}

  return (
    <div className="conteudo" style={{ maxWidth: 760, margin: "0 auto" }}>
      <style>{ESTILO}</style>

      <div className="no-imprimir" style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => window.print()}>Imprimir (A4 — meia folha)</button>
        <button onClick={imprimirNaTermicaDeRede}>Imprimir na Térmica (rede)</button>
        <span style={{ color: "var(--texto-suave)", fontSize: 13 }}>
          Sai na metade de cima de uma folha A4 (papel A4, escala 100%).
        </span>
      </div>
      {statusImpressao && <p className="no-imprimir">{statusImpressao}</p>}
      <div className="rc-folha">
        <div className="rc-topo">
          <div>
            <div className="rc-loja">CASA DO TERNO</div>
            <div className="rc-sub">Locação e venda de ternos — Visconde do Rio Branco/MG</div>
          </div>
          <div className="rc-titulo">
            RECIBO DE LOCAÇÃO Nº {locacao.id}
            <div>Data da locação: <b>{dataBR(locacao.dataReserva ?? locacao.dataPagamentoEntrada)}</b></div>
          </div>
        </div>

        <div className="rc-secao" style={{ marginTop: 0 }}>Cliente</div>
        <div className="rc-grade">
          <div className="rc-campo">Nome: <b>{cliente.nome}</b></div>
          <div className="rc-campo">CPF: <b>{cliente.cpf || "—"}</b></div>
          <div className="rc-campo">Telefone: <b>{cliente.telefone || "—"}</b></div>
        </div>
        <div className="rc-grade2">
          <div className="rc-campo">E-mail: <b>{cliente.email || "—"}</b></div>
          <div className="rc-campo">Endereço: <b>{cliente.endereco || "—"}</b></div>
        </div>
        {medidasPreenchidas.length > 0 && (
          <div className="rc-campo" style={{ marginTop: 1 }}>
            Medidas:{" "}
            {medidasPreenchidas.map(([nome, valor], i) => (
              <span key={nome}>
                {i > 0 && " · "}
                {nome} <b>{valor}</b>
              </span>
            ))}
          </div>
        )}

        <div className="rc-secao">Datas</div>
        <div className="rc-grade">
          <div className="rc-campo">
            Evento: <b>{dataBR(locacao.dataEvento)}</b>
            {nomeEvento && <> ({nomeEvento})</>}
          </div>
          <div className="rc-campo">
            Retirada: <b>{dataBR(locacao.dataRetirada)}{horaRetirada && ` às ${horaRetirada}`}</b>
          </div>
          <div className="rc-campo">
            Devolução prevista: <b>{dataBR(locacao.dataDevolucaoPrevista)}</b>
          </div>
          {locacao.dataRetiradaReal && (
            <div className="rc-campo">Retirada realizada: <b>{dataBR(locacao.dataRetiradaReal)}</b></div>
          )}
          {locacao.dataDevolucaoReal && (
            <div className="rc-campo">Devolvido em: <b>{dataBR(locacao.dataDevolucaoReal)}</b></div>
          )}
          {locacao.consultor && <div className="rc-campo">Consultor: <b>{locacao.consultor}</b></div>}
        </div>

        <div className="rc-secao">Peças e ajustes</div>
        <table className="rc-tabela">
          <thead>
            <tr>
              <th>Peça</th>
              <th>Ajustes</th>
              <th className="rc-dir">Valor</th>
            </tr>
          </thead>
          <tbody>
            {locacao.itens.map((item, index) => {
              const p = produto(item.produtoId);
              return (
                <tr key={index}>
                  <td>
                    {p ? (
                      <>
                        {p.referencia ? `${p.referencia} — ` : ""}
                        {nomesCategoria[p.categoria] ?? ""} {p.modelo} · {p.cor} · Tam. {p.tamanho}
                      </>
                    ) : (
                      `Produto #${item.produtoId}`
                    )}
                  </td>
                  <td>{item.ajustes || "—"}</td>
                  <td className="rc-dir">{dinheiro(item.valorItem)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {locacao.observacao && (
          <>
            <div className="rc-secao">Observações / ajustes gerais</div>
            <div className="rc-obs">{locacao.observacao}</div>
          </>
        )}

        <div className="rc-secao">Pagamentos</div>
        <table className="rc-tabela">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Forma</th>
              <th>Data</th>
              <th className="rc-dir">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Entrada</td>
              <td>{forma(locacao.formaPagamentoEntrada)}</td>
              <td>{dataBR(locacao.dataPagamentoEntrada)}</td>
              <td className="rc-dir">{dinheiro(locacao.valorEntrada)}</td>
            </tr>
            <tr>
              <td>Restante (na retirada)</td>
              <td>{restantePago ? forma(locacao.formaPagamentoRestante) : "—"}</td>
              <td>{restantePago ? dataBR(locacao.dataPagamentoRestante) : "Pendente"}</td>
              <td className="rc-dir">{dinheiro(restante)}</td>
            </tr>
            {multa > 0 && (
              <tr>
                <td>Multa por atraso</td>
                <td>{multaPaga ? forma(locacao.formaPagamentoMulta) : "—"}</td>
                <td>{multaPaga ? dataBR(locacao.dataPagamentoMulta) : "Pendente"}</td>
                <td className="rc-dir">{dinheiro(multa)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="rc-totais">
          <div><span>Subtotal</span><span>{dinheiro(subtotal)}</span></div>
          {desconto > 0.005 && <div><span>Desconto</span><span>- {dinheiro(desconto)}</span></div>}
          <div className="rc-forte"><span>Total</span><span>{dinheiro(locacao.valorTotal)}</span></div>
          {multa > 0 && <div><span>Multa por atraso</span><span>{dinheiro(multa)}</span></div>}
          <div><span>Total pago</span><span>{dinheiro(totalPago)}</span></div>
          <div><span>Saldo a pagar</span><span><b>{dinheiro(saldoAPagar)}</b></span></div>
        </div>

        <div className="rc-assinaturas">
          <div>Assinatura do cliente</div>
          <div>Casa do Terno</div>
        </div>
      </div>
    </div>
  );
}