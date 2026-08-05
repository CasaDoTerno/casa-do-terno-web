import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../Services/API";

interface ProdutoPlanilha {
  Referência?: string;
  Descrição?: string;
  Categoria?: string;
  Tamanho?: string;
  Cor?: string;
  Custo?: number;
  Venda?: number;
  Locação?: number;
  "Controla Estoque"?: string | number | boolean;
  Quantidade?: number;
  "Estoque Mínimo"?: number;
  "Disponível Venda"?: string | number | boolean;
  "Disponível Locação"?: string | number | boolean;
  Observação?: string;
}

interface ProdutoPronto {
  modelo: string;
  categoria: number;
  tamanho: string;
  cor: string;
  referencia: string;
  valorCusto: number;
  valorVenda: number;
  valorLocacao: number;
  controlaEstoque: boolean;
  quantidade: number;
  estoqueMinimo: number;
  disponivelParaVenda: boolean;
  disponivelParaLocacao: boolean;
  observacao: string;
}

const mapaCategoria: Record<string, number> = {
  terno: 0,
  calça: 1,
  calca: 1,
  camisa: 2,
  sapato: 3,
};

function converterCategoria(valor: string | undefined): number {
  if (!valor) return 0;
  return mapaCategoria[valor.trim().toLowerCase()] ?? 0;
}

function converterBooleano(valor: string | number | boolean | undefined): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;
  if (typeof valor === "string") {
    const texto = valor.trim().toLowerCase();
    return texto === "sim" || texto === "verdadeiro" || texto === "1" || texto === "true";
  }
  return false;
}

export function ImportarProdutos() {
  const [produtos, setProdutos] = useState<ProdutoPronto[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState({ feito: 0, total: 0 });
  const [mensagem, setMensagem] = useState("");

  function handleArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    setNomeArquivo(arquivo.name);
    setMensagem("");

    const leitor = new FileReader();
    leitor.onload = (e) => {
      const dados = e.target?.result;
      const pasta = XLSX.read(dados, { type: "binary" });
      const primeiraAba = pasta.Sheets[pasta.SheetNames[0]];
      const linhas = XLSX.utils.sheet_to_json<ProdutoPlanilha>(primeiraAba);

      const convertidos: ProdutoPronto[] = linhas.map((linha) => ({
        modelo: linha["Descrição"] ?? "",
        categoria: converterCategoria(linha["Categoria"]),
        tamanho: linha["Tamanho"] ?? "",
        cor: linha["Cor"] ?? "",
        referencia: linha["Referência"] ?? "",
        valorCusto: Number(linha["Custo"] ?? 0),
        valorVenda: Number(linha["Venda"] ?? 0),
        valorLocacao: Number(linha["Locação"] ?? 0),
        controlaEstoque: converterBooleano(linha["Controla Estoque"]),
        quantidade: Number(linha["Quantidade"] ?? 0),
        estoqueMinimo: Number(linha["Estoque Mínimo"] ?? 0),
        disponivelParaVenda: converterBooleano(linha["Disponível Venda"]),
        disponivelParaLocacao: converterBooleano(linha["Disponível Locação"]),
        observacao: linha["Observação"] ?? "",
      }));

      setProdutos(convertidos);
    };
    leitor.readAsBinaryString(arquivo);
  }

  async function confirmarImportacao() {
    if (produtos.length === 0) return;
    setImportando(true);
    setMensagem("");

    const TAMANHO_LOTE = 100;
    const lotes: ProdutoPronto[][] = [];
    for (let i = 0; i < produtos.length; i += TAMANHO_LOTE) {
      lotes.push(produtos.slice(i, i + TAMANHO_LOTE));
    }

    setProgresso({ feito: 0, total: produtos.length });
    let totalImportado = 0;

    try {
      for (const lote of lotes) {
        await api.post("/Produtos/importar", { produtos: lote });
        totalImportado += lote.length;
        setProgresso({ feito: totalImportado, total: produtos.length });
      }
      setMensagem(`${totalImportado} produtos importados com sucesso!`);
      setProdutos([]);
      setNomeArquivo("");
    } catch (erro) {
      console.error(erro);
      setMensagem(
        `Erro durante a importação. ${totalImportado} de ${produtos.length} produtos foram importados antes do erro.`
      );
    } finally {
      setImportando(false);
    }
  }

  return (
    <div>
      <h1>Importar Produtos</h1>

      <div className="card" style={{ marginBottom: 20, maxWidth: 640 }}>
        <div>
          <label>Selecione a planilha (.xlsx)</label>
          <input type="file" accept=".xlsx, .xls" onChange={handleArquivo} />
        </div>
        {nomeArquivo && (
          <p style={{ color: "var(--texto-suave)", marginTop: 8 }}>
            Arquivo: {nomeArquivo} — {produtos.length} produtos encontrados
          </p>
        )}
      </div>

      {produtos.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2>Prévia (primeiros 10)</h2>
          <ul>
            {produtos.slice(0, 10).map((p, i) => (
              <li key={i}>
                {p.referencia && `${p.referencia} · `}
                {p.modelo} · {p.cor} · {p.tamanho} — Custo R$ {p.valorCusto} / Venda R$ {p.valorVenda}
                {p.valorLocacao > 0 && ` / Locação R$ ${p.valorLocacao}`}
                {" — Qtd: "}{p.quantidade}
                {" — "}
                {p.disponivelParaVenda ? "✔ Venda" : "✘ Venda"}
                {" / "}
                {p.disponivelParaLocacao ? "✔ Locação" : "✘ Locação"}
              </li>
            ))}
          </ul>
          {produtos.length > 10 && (
            <p style={{ color: "var(--texto-suave)" }}>... e mais {produtos.length - 10} produtos.</p>
          )}

          <button onClick={confirmarImportacao} disabled={importando}>
            {importando
              ? `Importando... ${progresso.feito}/${progresso.total}`
              : `Confirmar importação de ${produtos.length} produtos`}
          </button>
        </div>
      )}

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}