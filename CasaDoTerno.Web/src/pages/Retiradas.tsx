import { useEffect, useState } from "react";
import api from "../Services/API";

interface Locacao {
  id: number;
  dataRetirada: string;
  dataRetiradaReal: string | null;
  dataDevolucaoReal: string | null;
  valorTotal: number;
  valorEntrada: number;
  valorRestante: number;
  formaPagamentoRestante: number | null;
}

export function Retiradas() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [mensagem, setMensagem] = useState("");

  function carregarLocacoes() {
    api.get<Locacao[]>("/Locacoes").then((resposta) => {
      // locações que ainda não foram retiradas OU ainda não foram pagas por completo
      const pendentes = resposta.data.filter(
        (l) => l.dataRetiradaReal === null || l.formaPagamentoRestante === null
      );
      setLocacoes(pendentes);
    });
  }

  useEffect(() => {
    carregarLocacoes();
  }, []);

  async function registrarPagamento(id: number, formaPagamento: number) {
    const confirmar = window.confirm("Confirmar o PAGAMENTO do restante dessa locação?");
    if (!confirmar) return;

    try {
      await api.put(`/Locacoes/${id}/pagamento-restante`, { formaPagamento });
      setMensagem(`Pagamento da locação #${id} registrado com sucesso!`);
      carregarLocacoes();
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao registrar pagamento.");
    }
  }

  async function confirmarRetirada(id: number) {
    const confirmar = window.confirm("Confirmar a RETIRADA física dessa locação?");
    if (!confirmar) return;

    try {
      await api.put(`/Locacoes/${id}/retirada`);
      setMensagem(`Retirada da locação #${id} registrada com sucesso!`);
      carregarLocacoes();
    } catch (erro: any) {
      console.error(erro);
      // aqui pode vir a mensagem "ainda está com outro cliente", vinda do backend
      setMensagem(erro.response?.data || "Erro ao registrar retirada.");
    }
  }

  return (
    <div>
      <h1>Retiradas e Pagamentos Pendentes</h1>
      {locacoes.length === 0 && <p>Nada pendente no momento.</p>}
      <ul>
        {locacoes.map((locacao) => (
          <li key={locacao.id}>
            <p>
              Locação #{locacao.id} — retirada prevista em {locacao.dataRetirada.split("T")[0]}
            </p>
            <p>
              Total: R$ {locacao.valorTotal} — Entrada: R$ {locacao.valorEntrada} —
              Restante: R$ {locacao.valorRestante}
              {locacao.formaPagamentoRestante !== null && " (já pago)"}
            </p>

            {locacao.formaPagamentoRestante === null && (
              <PagamentoForm onConfirmar={(forma) => registrarPagamento(locacao.id, forma)} />
            )}

            {locacao.dataRetiradaReal === null ? (
              <button onClick={() => confirmarRetirada(locacao.id)}>Confirmar retirada</button>
            ) : (
              <p><em>Já retirado.</em></p>
            )}
          </li>
        ))}
      </ul>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}

function PagamentoForm({ onConfirmar }: { onConfirmar: (forma: number) => void }) {
  const [forma, setForma] = useState(0);

  return (
    <div>
      <label>Forma de pagamento do restante: </label>
      <select value={forma} onChange={(e) => setForma(Number(e.target.value))}>
        <option value={0}>Dinheiro</option>
        <option value={1}>Cartão</option>
        <option value={2}>Pix</option>
        <option value={3}>Boleto</option>
      </select>
      <button onClick={() => onConfirmar(forma)}>Registrar pagamento</button>
    </div>
  );
}