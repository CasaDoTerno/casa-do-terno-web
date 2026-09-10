import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../Services/API";
import { Logo } from "../components/Logo";
import { imprimirNaRede, montarBytesImpressao, type LinhaImpressao } from "../Services/impressaoRede";

interface ItemLocacao {
  produtoId: number;
  ajustes: string | null;
  valorItem: number;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataEvento: string;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
  valorTotal: number;
  valorEntrada: number;
  valorRestante: number;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
}

interface Produto {
  id: number;
  modelo: string;
  referencia: string | null;
  valorVenda: number;
}

export function ContratoLocacao() {
  const { id } = useParams();
  const [locacao, setLocacao] = useState<Locacao | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [statusImpressao, setStatusImpressao] = useState("");

  useEffect(() => {
    document.body.classList.add("papel-termico");
    return () => document.body.classList.remove("papel-termico");
  }, []);

  useEffect(() => {
    api.get(`/Locacoes/${id}`).then((r) => setLocacao(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, [id]);

  useEffect(() => {
    if (locacao) {
      api.get(`/Clientes/${locacao.clienteId}`).then((r) => setCliente(r.data));
    }
  }, [locacao]);
async function imprimirNaTermicaDeRede() {
  if (!locacao || !cliente) return;

  const linhas: LinhaImpressao[] = [
    { texto: "CASA DO TERNO", negrito: true, centralizado: true },
    { texto: "Locacao & Venda de Ternos", centralizado: true },
    { texto: "------------------------------" },
    { texto: "CONTRATO DE LOCACAO", negrito: true },
    { texto: "" },
    { texto: `Locacao no: ${locacao.id}` },
    { texto: `Data: ${dataHoje}` },
    { texto: "" },
    { texto: "LOCATARIO(A)", negrito: true },
    { texto: `Nome: ${cliente.nome}` },
    { texto: `CPF: ${cliente.cpf}` },
    { texto: `Tel: ${cliente.telefone}` },
    { texto: "" },
    { texto: "DATAS", negrito: true },
    { texto: `Evento: ${new Date(locacao.dataEvento).toLocaleDateString("pt-BR")}` },
    { texto: `Retirada: ${new Date(locacao.dataRetirada).toLocaleDateString("pt-BR")}` },
    { texto: `Devolucao prevista: ${new Date(locacao.dataDevolucaoPrevista).toLocaleDateString("pt-BR")}` },
    { texto: "" },
    { texto: "PECAS LOCADAS", negrito: true },
  ];

  locacao.itens.forEach((item) => {
    const p = produto(item.produtoId);
    linhas.push({ texto: `${p?.referencia ? p.referencia + " - " : ""}${p?.modelo ?? "Produto"}` });
    if (item.ajustes) linhas.push({ texto: `  Ajustes: ${item.ajustes}` });
  });

  linhas.push(
    { texto: "" },
    { texto: "VALORES", negrito: true },
    { texto: `Total: R$ ${locacao.valorTotal.toFixed(2)}` },
    { texto: `Entrada paga: R$ ${locacao.valorEntrada.toFixed(2)}` },
    { texto: `Restante: R$ ${(locacao.valorTotal - locacao.valorEntrada).toFixed(2)}` },
    { texto: "" },
    { texto: "CLAUSULAS", negrito: true },
    { texto: "" },
    { texto: "1. O(A) LOCATARIO(A) compromete-se a devolver a(s) peca(s) descrita(s) acima ate a data prevista de devolucao informada neste contrato." },
    { texto: "" },
    { texto: "2. Em caso de atraso na devolucao, sera cobrada multa de R$ 50,00 (cinquenta reais) por dia de atraso, por peca nao devolvida." },
    { texto: "" },
    { texto: "3. Em caso de avaria, mancha, rasgo, queimadura ou qualquer dano que impossibilite a reutilizacao da peca, sera cobrado o valor integral de venda do produto, conforme tabela vigente da loja." },
    { texto: "" },
    { texto: "4. O(A) LOCATARIO(A) declara ter vistoriado a(s) peca(s) no ato da retirada e esta de acordo com o estado de conservacao apresentado." },
    { texto: "" },
    { texto: `5. O valor pago como entrada (R$ ${locacao.valorEntrada.toFixed(2)}) tem carater de sinal e garantia da reserva, nao sendo reembolsavel em caso de desistencia, cancelamento ou nao comparecimento do(a) LOCATARIO(A) para retirada da(s) peca(s) na data combinada.` },
    { texto: "" },
    { texto: `Visconde do Rio Branco/MG, ${dataHoje}.` },
    { texto: "" },
    { texto: "" },
    { texto: "_________________________", centralizado: true },
    { texto: "Assinatura Locatario(a)", centralizado: true },
    { texto: "" },
    { texto: "_________________________", centralizado: true },
    { texto: "Assinatura - Casa do Terno", centralizado: true }
  );

setStatusImpressao("Enviando...");
const bytes = await montarBytesImpressao(linhas);
const resultado = await imprimirNaRede(bytes);
setStatusImpressao(resultado.mensagem);
}
  function produto(produtoId: number) {
    return produtos.find((p) => p.id === produtoId);
  }

  if (!locacao || !cliente) return <p>Carregando...</p>;

  const dataHoje = new Date().toLocaleDateString("pt-BR");

  return (
    <div className="conteudo contrato-termico" style={{ maxWidth: 340, margin: "0 auto" }}>
<div className="no-imprimir" style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
  <button onClick={() => window.print()}>
    Imprimir (driver local)
  </button>
  <button onClick={imprimirNaTermicaDeRede}>
    Imprimir na Térmica (rede)
  </button>
</div>
{statusImpressao && <p className="no-imprimir">{statusImpressao}</p>}
      <div className="recibo-card card">
        <Logo tamanho="grande" />

        <h1>Contrato de Locação</h1>

        <p>
          <strong>Locação nº:</strong> {locacao.id}<br />
          <strong>Data:</strong> {dataHoje}
        </p>

        <h2>Locatário(a)</h2>
        <p>
          Nome: {cliente.nome}<br />
          CPF: {cliente.cpf}<br />
          Telefone: {cliente.telefone}
        </p>

        <h2>Datas</h2>
        <p>
          Evento: {new Date(locacao.dataEvento).toLocaleDateString("pt-BR")}<br />
          Retirada: {new Date(locacao.dataRetirada).toLocaleDateString("pt-BR")}<br />
          Devolução prevista: {new Date(locacao.dataDevolucaoPrevista).toLocaleDateString("pt-BR")}
        </p>

        <h2>Peças locadas</h2>
        {locacao.itens.map((item, index) => {
          const p = produto(item.produtoId);
          return (
            <p key={index} style={{ margin: "4px 0" }}>
              {p?.referencia ? `${p.referencia} — ` : ""}{p?.modelo ?? `Produto #${item.produtoId}`}
              {item.ajustes && <><br />Ajustes: {item.ajustes}</>}
            </p>
          );
        })}

        <h2>Valores</h2>
        <p>
          Total: R$ {locacao.valorTotal.toFixed(2)}<br />
          Entrada paga: R$ {locacao.valorEntrada.toFixed(2)}<br />
          Restante: R$ {(locacao.valorTotal - locacao.valorEntrada).toFixed(2)}
        </p>

        <h2>Cláusulas</h2>

        <p className="clausula">
          <strong>1.</strong> O(A) LOCATÁRIO(A) compromete-se a devolver a(s) peça(s) descrita(s)
          acima até a data prevista de devolução informada neste contrato.
        </p>

        <p className="clausula">
          <strong>2.</strong> Em caso de atraso na devolução, será cobrada multa de <strong>R$ 50,00
          (cinquenta reais) por dia de atraso, por peça</strong> não devolvida.
        </p>

          <p className="clausula">
            <strong>3.</strong> Em caso de avaria, mancha, rasgo, queimadura ou qualquer dano que
            impossibilite a reutilização da peça, será cobrado o <strong>valor integral de venda</strong>
            {" "}do produto, conforme tabela vigente da loja.
          </p>

        <p className="clausula">
          <strong>4.</strong> O(A) LOCATÁRIO(A) declara ter vistoriado a(s) peça(s) no ato da
          retirada e está de acordo com o estado de conservação apresentado.
        </p>
        <p className="clausula">
          <strong>5.</strong> O valor pago como entrada (R$ {locacao.valorEntrada.toFixed(2)}) tem caráter
          de sinal e garantia da reserva, <strong>não sendo reembolsável</strong> em caso de desistência,
          cancelamento ou não comparecimento do(a) LOCATÁRIO(A) para retirada da(s) peça(s) na data combinada.
        </p>

          <p style={{ marginTop: 24, fontSize: 12 }}>
            Visconde do Rio Branco/MG, {dataHoje}.
          </p>

          <div style={{ marginTop: 40, textAlign: "center" }}>
            <div className="assinatura-linha" style={{ paddingTop: 6, borderTop: "1px solid #000" }}>
              Assinatura do(a) Locatário(a)
            </div>
          </div>

        <div style={{ marginTop: 30, textAlign: "center" }}>
          <div className="assinatura-linha" style={{ paddingTop: 6, borderTop: "1px solid #000" }}>
            Assinatura — Casa do Terno
          </div>
        </div>
      </div>
    </div>
  );
}