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
  consultor: string | null;
  desconto: number;
  valorTotal: number;
  valorEntrada: number;
  formaPagamentoEntrada: number;
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
}

const nomesFormaPagamento = ["Dinheiro", "Cartão", "Pix", "Boleto"];

export function ReciboLocacao() {
  const { id } = useParams();
  const [locacao, setLocacao] = useState<Locacao | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [statusImpressao, setStatusImpressao] = useState("");

  useEffect(() => {
    api.get(`/Locacoes/${id}`).then((r) => setLocacao(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, [id]);

  useEffect(() => {
    if (locacao) {
      api.get(`/Clientes/${locacao.clienteId}`).then((r) => setCliente(r.data));
    }
  }, [locacao]);

  function nomeProduto(produtoId: number) {
    return produtos.find((p) => p.id === produtoId)?.modelo ?? `Produto #${produtoId}`;
  }

  async function imprimirNaTermicaDeRede() {
    if (!locacao || !cliente) return;

    const restanteCalc = locacao.valorTotal - locacao.valorEntrada;

    const linhas: LinhaImpressao[] = [
      { texto: "CASA DO TERNO", negrito: true, centralizado: true },
      { texto: "Locacao & Venda de Ternos", centralizado: true },
      { texto: "------------------------------" },
      { texto: `RECIBO DE LOCACAO #${locacao.id}`, negrito: true },
      { texto: "" },
      { texto: `Cliente: ${cliente.nome}` },
      { texto: `Telefone: ${cliente.telefone}` },
      { texto: `Data do evento: ${new Date(locacao.dataEvento).toLocaleDateString("pt-BR")}` },
      { texto: `Retirada: ${new Date(locacao.dataRetirada).toLocaleDateString("pt-BR")}` },
      { texto: `Devolucao prevista: ${new Date(locacao.dataDevolucaoPrevista).toLocaleDateString("pt-BR")}` },
    ];

    if (locacao.consultor) {
      linhas.push({ texto: `Consultor: ${locacao.consultor}` });
    }

    linhas.push({ texto: "" }, { texto: "PECAS", negrito: true });

    locacao.itens.forEach((item) => {
      linhas.push({ texto: `${nomeProduto(item.produtoId)} - R$ ${item.valorItem.toFixed(2)}` });
      if (item.ajustes) linhas.push({ texto: `  Ajustes: ${item.ajustes}` });
    });

    linhas.push(
      { texto: "" },
      { texto: `Desconto: R$ ${locacao.desconto.toFixed(2)}` },
      { texto: `TOTAL: R$ ${locacao.valorTotal.toFixed(2)}`, negrito: true },
      { texto: `Entrada (${nomesFormaPagamento[locacao.formaPagamentoEntrada]}): R$ ${locacao.valorEntrada.toFixed(2)}` },
      { texto: `RESTANTE (na retirada): R$ ${restanteCalc.toFixed(2)}`, negrito: true },
      { texto: "" },
      { texto: "O cliente declara estar ciente de que a(s) peca(s) deve(m) ser devolvida(s) ate a data prevista, em bom estado, sendo responsavel por qualquer dano, extravio ou atraso na devolucao." },
      { texto: "" },
      { texto: "" },
      { texto: "_________________________", centralizado: true },
      { texto: "Assinatura do Cliente", centralizado: true }
    );

    setStatusImpressao("Enviando...");
    const bytes = await montarBytesImpressao(linhas);
    const resultado = await imprimirNaRede(bytes);
    setStatusImpressao(resultado.mensagem);
  }

  if (!locacao || !cliente) return <p>Carregando...</p>;

  const restante = locacao.valorTotal - locacao.valorEntrada;

  return (
    <div className="conteudo" style={{ maxWidth: 700, margin: "0 auto" }}>
      <div className="no-imprimir" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => window.print()}>Imprimir (driver local)</button>
        <button onClick={imprimirNaTermicaDeRede}>Imprimir na Térmica (rede)</button>
      </div>
      {statusImpressao && <p className="no-imprimir">{statusImpressao}</p>}

      <div className="recibo-card card">
        <div style={{ marginBottom: 16 }}>
          <Logo tamanho="grande" />
        </div>
        <div className="recibo-titulo">Casa do Terno</div>
        <div className="recibo-subtitulo">Recibo de Locação #{locacao.id}</div>

        <div className="recibo-linha">
          <span>Cliente</span>
          <strong>{cliente.nome}</strong>
        </div>
        <div className="recibo-linha">
          <span>Telefone</span>
          <span>{cliente.telefone}</span>
        </div>
        <div className="recibo-linha">
          <span>Data do evento</span>
          <span>{new Date(locacao.dataEvento).toLocaleDateString("pt-BR")}</span>
        </div>
        <div className="recibo-linha">
          <span>Retirada</span>
          <span>{new Date(locacao.dataRetirada).toLocaleDateString("pt-BR")}</span>
        </div>
        <div className="recibo-linha">
          <span>Devolução prevista</span>
          <span>{new Date(locacao.dataDevolucaoPrevista).toLocaleDateString("pt-BR")}</span>
        </div>
        {locacao.consultor && (
          <div className="recibo-linha">
            <span>Consultor</span>
            <span>{locacao.consultor}</span>
          </div>
        )}

        <h2 style={{ marginTop: 24 }}>Peças</h2>
        <table className="recibo-tabela" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--borda)" }}>Peça</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--borda)" }}>Ajustes</th>
              <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid var(--borda)" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {locacao.itens.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: 8, borderBottom: "1px solid var(--borda)" }}>{nomeProduto(item.produtoId)}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--borda)" }}>{item.ajustes || "—"}</td>
                <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--borda)" }}>
                  R$ {item.valorItem.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="recibo-linha" style={{ marginTop: 16 }}>
          <span>Desconto</span>
          <span>R$ {locacao.desconto.toFixed(2)}</span>
        </div>
        <div className="recibo-linha" style={{ fontWeight: 800, fontSize: 18 }}>
          <span>Total</span>
          <span>R$ {locacao.valorTotal.toFixed(2)}</span>
        </div>
        <div className="recibo-linha">
          <span>Entrada ({nomesFormaPagamento[locacao.formaPagamentoEntrada]})</span>
          <span>R$ {locacao.valorEntrada.toFixed(2)}</span>
        </div>
        <div className="recibo-linha" style={{ border: "none", fontWeight: 700, color: "var(--verde)" }}>
          <span>Restante (na retirada)</span>
          <span>R$ {restante.toFixed(2)}</span>
        </div>
        <p style={{ fontSize: 11, color: "var(--texto-suave)", marginTop: 24 }}>
          O cliente declara estar ciente de que a(s) peça(s) deve(m) ser devolvida(s) até a data prevista,
          em bom estado, sendo responsável por qualquer dano, extravio ou atraso na devolução.
        </p>
        <div className="assinatura-linha" style={{ marginTop: 40, paddingTop: 8, textAlign: "center", borderTop: "1px solid var(--borda)", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
          Assinatura do Cliente
        </div>
      </div>
    </div>
  );
}