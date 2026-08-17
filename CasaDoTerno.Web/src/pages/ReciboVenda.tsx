import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../Services/API";
import { Logo } from "../components/Logo";

interface ItemVenda {
  produtoId: number;
  quantidade: number;
  valorUnitario: number;
}

interface Venda {
  id: number;
  clienteId: number;
  dataVenda: string;
  desconto: number;
  valorTotal: number;
  consultor: string | null;
  formaPagamento: number;
  itens: ItemVenda[];
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

export function ReciboVenda() {
  const { id } = useParams();
  const [venda, setVenda] = useState<Venda | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    api.get(`/Vendas/${id}`).then((r) => setVenda(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, [id]);

  useEffect(() => {
    if (venda) {
      api.get(`/Clientes/${venda.clienteId}`).then((r) => setCliente(r.data));
    }
  }, [venda]);

  function nomeProduto(produtoId: number) {
    return produtos.find((p) => p.id === produtoId)?.modelo ?? `Produto #${produtoId}`;
  }

  if (!venda || !cliente) return <p>Carregando...</p>;

  const subtotal = venda.itens.reduce((soma, item) => soma + item.quantidade * item.valorUnitario, 0);

  return (
    <div className="conteudo" style={{ maxWidth: 700, margin: "0 auto" }}>
      <button className="no-imprimir" onClick={() => window.print()} style={{ marginBottom: 20 }}>
        Imprimir
      </button>

      <div className="recibo-card card">
        <div style={{ marginBottom: 16 }}>
          <Logo tamanho="grande" />
        </div>
        <div className="recibo-titulo">Casa do Terno</div>
        <div className="recibo-subtitulo">Recibo de Venda #{venda.id}</div>

        <div className="recibo-linha">
          <span>Cliente</span>
          <strong>{cliente.nome}</strong>
        </div>
        <div className="recibo-linha">
          <span>Telefone</span>
          <span>{cliente.telefone}</span>
        </div>
        <div className="recibo-linha">
          <span>Data</span>
          <span>{new Date(venda.dataVenda).toLocaleDateString("pt-BR")}</span>
        </div>
        {venda.consultor && (
          <div className="recibo-linha">
            <span>Consultor</span>
            <span>{venda.consultor}</span>
          </div>
        )}

        <h2 style={{ marginTop: 24 }}>Itens</h2>
          <table className="recibo-tabela" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--borda)" }}>Produto</th>
                <th style={{ textAlign: "center", padding: 8, borderBottom: "1px solid var(--borda)" }}>Qtd.</th>
                <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid var(--borda)" }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {venda.itens.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--borda)" }}>{nomeProduto(item.produtoId)}</td>
                  <td style={{ padding: 8, textAlign: "center", borderBottom: "1px solid var(--borda)" }}>{item.quantidade}</td>
                  <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--borda)" }}>
                    R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        <div className="recibo-linha" style={{ marginTop: 16 }}>
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
        <div className="recibo-linha">
          <span>Desconto</span>
          <span>R$ {venda.desconto.toFixed(2)}</span>
        </div>
        <div className="recibo-linha" style={{ fontWeight: 800, fontSize: 18, border: "none" }}>
          <span>Total</span>
          <span>R$ {venda.valorTotal.toFixed(2)}</span>
        </div>
        <div className="recibo-linha" style={{ border: "none" }}>
          <span>Forma de pagamento</span>
          <span>{nomesFormaPagamento[venda.formaPagamento]}</span>
        </div>
        <div className="assinatura-linha" style={{ marginTop: 60, paddingTop: 8, textAlign: "center", borderTop: "1px solid var(--borda)", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
          Assinatura do Cliente
        </div>
      </div>
    </div>
  );
}