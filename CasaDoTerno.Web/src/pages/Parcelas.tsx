import { useEffect, useState } from "react";
import api from "../Services/API";

interface Parcela {
  id: number;
  origem: number; // 0 = Venda, 1 = Compra
  origemId: number;
  numeroParcela: number;
  valorParcela: number;
  formaPagamento: number;
  dataVencimento: string;
  dataPagamento: string | null;
}

const nomesOrigem = ["Venda", "Compra"];
const nomesFormaPagamento = ["Dinheiro", "Cartão", "Pix", "Boleto"];

export function Parcelas() {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [mensagem, setMensagem] = useState("");

  function carregarParcelas() {
    api.get<Parcela[]>("/Parcelas/em-aberto").then((r) => setParcelas(r.data));
  }

  useEffect(() => {
    carregarParcelas();
  }, []);

  async function pagarParcela(id: number) {
    const confirmar = window.confirm("Confirmar o pagamento dessa parcela?");
    if (!confirmar) return;

    try {
      await api.put(`/Parcelas/${id}/pagamento`);
      setMensagem(`Parcela #${id} paga com sucesso!`);
      carregarParcelas();
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao registrar pagamento.");
    }
  }

  const hoje = new Date().toISOString().split("T")[0];

  return (
    <div>
      <h1>Parcelas em Aberto</h1>
      {parcelas.length === 0 && <p>Nenhuma parcela em aberto no momento.</p>}
      <ul>
        {parcelas.map((parcela) => {
          const vencida = parcela.dataVencimento.split("T")[0] < hoje;
          return (
            <li key={parcela.id}>
              {nomesOrigem[parcela.origem]} #{parcela.origemId} — parcela {parcela.numeroParcela} —
              R$ {parcela.valorParcela.toFixed(2)} — {nomesFormaPagamento[parcela.formaPagamento]} —
              vencimento {parcela.dataVencimento.split("T")[0]}
              {vencida && <strong style={{ color: "red" }}> (VENCIDA)</strong>}
              {" "}
              <button onClick={() => pagarParcela(parcela.id)}>Registrar pagamento</button>
            </li>
          );
        })}
      </ul>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}