import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../Services/API";
import { Logo } from "../components/Logo";

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

  function produto(produtoId: number) {
    return produtos.find((p) => p.id === produtoId);
  }

  if (!locacao || !cliente) return <p>Carregando...</p>;

  const dataHoje = new Date().toLocaleDateString("pt-BR");

  return (
    <div className="conteudo contrato-termico" style={{ maxWidth: 340, margin: "0 auto" }}>
      <button className="no-imprimir" onClick={() => window.print()} style={{ marginBottom: 16 }}>
        Imprimir
      </button>

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