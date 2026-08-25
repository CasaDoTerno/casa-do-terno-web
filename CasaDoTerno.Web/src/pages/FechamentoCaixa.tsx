import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import api from "../Services/API";

interface TotalPorFormaPagamento {
  formaPagamento: number;
  valor: number;
}

interface FechamentoCaixa {
  data: string;
  entradas: TotalPorFormaPagamento[];
  totalEntradas: number;
  saidas: TotalPorFormaPagamento[];
  totalSaidas: number;
  saldoLiquido: number;
}

const nomesFormaPagamento = ["Dinheiro", "Cartão", "Pix", "Boleto"];

export function FechamentoCaixa() {
  const [data, setData] = useState(() => new Date().toISOString().split("T")[0]); // hoje, por padrão
  const [resultado, setResultado] = useState<FechamentoCaixa | null>(null);
  const [carregando, setCarregando] = useState(false);

  function buscarFechamento() {
    setCarregando(true);
    api.get<FechamentoCaixa>(`/Relatorios/fechamento-caixa?data=${data}`)
      .then((r) => setResultado(r.data))
      .catch((erro) => console.error(erro))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    buscarFechamento();
  }, []); // busca uma vez, com a data de hoje, assim que a tela abre

  function exportarExcel() {
    if (!resultado) return;

    const linhasEntradas = resultado.entradas.map((e) => ({
      Tipo: "Entrada",
      "Forma de Pagamento": nomesFormaPagamento[e.formaPagamento],
      "Valor (R$)": e.valor,
    }));

    const linhasSaidas = resultado.saidas.map((s) => ({
      Tipo: "Saída",
      "Forma de Pagamento": nomesFormaPagamento[s.formaPagamento],
      "Valor (R$)": s.valor,
    }));

    const linhaTotal = [
      { Tipo: "", "Forma de Pagamento": "", "Valor (R$)": "" },
      { Tipo: "TOTAL ENTRADAS", "Forma de Pagamento": "", "Valor (R$)": resultado.totalEntradas },
      { Tipo: "TOTAL SAÍDAS", "Forma de Pagamento": "", "Valor (R$)": resultado.totalSaidas },
      { Tipo: "SALDO LÍQUIDO", "Forma de Pagamento": "", "Valor (R$)": resultado.saldoLiquido },
    ];

    const linhas = [...linhasEntradas, ...linhasSaidas, ...linhaTotal];

    const planilha = XLSX.utils.json_to_sheet(linhas);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, "Fechamento");

    const nomeArquivo = `fechamento-caixa_${data}.xlsx`;
    XLSX.writeFile(livro, nomeArquivo);
  }

  return (
    <div>
      <h1>Fechamento de Caixa</h1>

      <div className="no-imprimir">
        <label>Data: </label>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        <button onClick={buscarFechamento}>Buscar</button>
        <button onClick={exportarExcel} disabled={!resultado} style={{ marginLeft: 8 }}>
          Exportar Excel
        </button>
        <button onClick={() => window.print()} disabled={!resultado} style={{ marginLeft: 8 }}>
          Exportar PDF
        </button>
      </div>

      {carregando && <p>Carregando...</p>}

      {resultado && (
        <div>
          <h2>Entradas</h2>
          {resultado.entradas.length === 0 && <p>Nenhuma entrada nesse dia.</p>}
          <ul>
            {resultado.entradas.map((e) => (
              <li key={e.formaPagamento}>
                {nomesFormaPagamento[e.formaPagamento]}: R$ {e.valor.toFixed(2)}
              </li>
            ))}
          </ul>
          <p><strong>Total de entradas: R$ {resultado.totalEntradas.toFixed(2)}</strong></p>

          <h2>Saídas (compras)</h2>
          {resultado.saidas.length === 0 && <p>Nenhuma saída nesse dia.</p>}
          <ul>
            {resultado.saidas.map((s) => (
              <li key={s.formaPagamento}>
                {nomesFormaPagamento[s.formaPagamento]}: R$ {s.valor.toFixed(2)}
              </li>
            ))}
          </ul>
          <p><strong>Total de saídas: R$ {resultado.totalSaidas.toFixed(2)}</strong></p>

          <h2>Saldo líquido do dia: R$ {resultado.saldoLiquido.toFixed(2)}</h2>
        </div>
      )}
    </div>
  );
}