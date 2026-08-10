import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../Services/API";

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
        {venda.itens.map((item, index) => (
          <div className="recibo-linha" key={index}>
            <span>{item.quantidade}x {nomeProduto(item.produtoId)}</span>
            <span>R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</span>
          </div>
        ))}

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
      </div>
    </div>
  );
}