import { useEffect, useState } from "react";
import api from "../Services/API";
import * as XLSX from "xlsx";

interface Produto {
  id: number;
  modelo: string;
  referencia: string | null;
  categoria: number;
  cor: string | null;
  tamanho: string | null;
  quantidade: number;
  disponivelParaLocacao?: boolean;
}

interface ItemLocacao {
  produtoId: number;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataRetirada: string;
  dataRetiradaReal: string | null;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal: string | null;
  dataCancelamento: string | null;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
}

interface Alocacao {
  locacaoId: number;
  cliente: string;
  retirada: string;
  devolucao: string;
  comCliente: boolean;
}

type Situacao = "livre" | "comCliente" | "reservado";
type FiltroSituacao = "todos" | Situacao;

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato", "Cinto", "Meia", "Relógio", "Gravata"];

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function soData(valor: string | null | undefined): string {
  return valor ? valor.split("T")[0] : "";
}

function dataBR(valor: string | null | undefined): string {
  const [ano, mes, dia] = soData(valor).split("-");
  return ano ? `${dia}/${mes}/${ano}` : "—";
}

function paraISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function somarDias(iso: string, dias: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

function segundaDaSemana(iso: string): string {
  const dia = new Date(iso + "T12:00:00").getDay();
  return somarDias(iso, dia === 0 ? -6 : 1 - dia);
}

const ESTILO_SITUACAO: Record<Situacao, { texto: string; cor: string }> = {
  livre: { texto: "LIVRE", cor: "#166534" },
  comCliente: { texto: "COM CLIENTE", cor: "#b91c1c" },
  reservado: { texto: "RESERVADO NA SEMANA", cor: "#a16207" },
};

interface Linha {
  produto: Produto;
  descricao: string;
  situacao: Situacao;
  detalhes: string[];
  proxima: string;
}

export function ConferenciaEstoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [filtroSituacao, setFiltroSituacao] = useState<FiltroSituacao>("todos");
  const [somenteLocacao, setSomenteLocacao] = useState(true);
  const [dataReferencia, setDataReferencia] = useState(() => paraISO(new Date()));
  const [conferidos, setConferidos] = useState<number[]>([]);

  useEffect(() => {
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
    api.get<Locacao[]>("/Locacoes").then((r) => setLocacoes(r.data));
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
  }, []);

  const inicio = segundaDaSemana(dataReferencia);
  const fim = somarDias(inicio, 6);

  function nomeCliente(id: number): string {
    return clientes.find((c) => c.id === id)?.nome ?? `Cliente #${id}`;
  }

  // alocações abertas (não devolvidas, não canceladas) por produto
  const porProduto = new Map<number, Alocacao[]>();
  locacoes
    .filter((l) => !l.dataCancelamento && !l.dataDevolucaoReal)
    .forEach((l) => {
      l.itens.forEach((item) => {
        const lista = porProduto.get(item.produtoId) ?? [];
        lista.push({
          locacaoId: l.id,
          cliente: nomeCliente(l.clienteId),
          retirada: soData(l.dataRetirada),
          devolucao: soData(l.dataDevolucaoPrevista),
          comCliente: l.dataRetiradaReal !== null,
        });
        porProduto.set(item.produtoId, lista);
      });
    });

  function montarLinha(p: Produto): Linha {
    const todas = porProduto.get(p.id) ?? [];
    const fora = todas.filter((a) => a.comCliente);
    const naSemana = todas.filter((a) => !a.comCliente && a.retirada <= fim && a.devolucao >= inicio);
    const futuras = todas
      .filter((a) => !a.comCliente && a.retirada > fim)
      .sort((a, b) => a.retirada.localeCompare(b.retirada));

    const detalhes: string[] = [];
    fora.forEach((a) =>
      detalhes.push(`Com ${a.cliente} (loc. #${a.locacaoId}) — devolve em ${dataBR(a.devolucao)}`)
    );
    naSemana.forEach((a) =>
      detalhes.push(`Retira ${dataBR(a.retirada)}: ${a.cliente} (loc. #${a.locacaoId}) — devolve em ${dataBR(a.devolucao)}`)
    );

    let situacao: Situacao = "livre";
    if (fora.length > 0) situacao = "comCliente";
    else if (naSemana.length > 0) situacao = "reservado";

    const proxima =
      futuras.length > 0 && situacao === "livre"
        ? `Próxima reserva: ${dataBR(futuras[0].retirada)} — ${futuras[0].cliente}`
        : "";

    const partes = [nomesCategoria[p.categoria] ?? "", p.modelo].filter((x) => x);
    return { produto: p, descricao: partes.join(" "), situacao, detalhes, proxima };
  }

  // pesquisa inteligente: todas as palavras digitadas precisam aparecer (código, categoria, nome, cor ou tamanho)
  const palavras = normalizar(busca).split(/\s+/).filter((x) => x);

  const linhas = produtos
    .filter((p) => (somenteLocacao ? p.disponivelParaLocacao !== false : true))
    .filter((p) => categoria === "todas" || String(p.categoria) === categoria)
    .filter((p) => {
      if (palavras.length === 0) return true;
      const palheiro = normalizar(
        [p.referencia ?? "", nomesCategoria[p.categoria] ?? "", p.modelo, p.cor ?? "", p.tamanho ?? ""].join(" ")
      );
      return palavras.every((w) => palheiro.includes(w));
    })
    .map(montarLinha)
    .filter((l) => filtroSituacao === "todos" || l.situacao === filtroSituacao)
    .sort(
      (a, b) =>
        a.descricao.localeCompare(b.descricao) ||
        (a.produto.cor ?? "").localeCompare(b.produto.cor ?? "") ||
        (a.produto.tamanho ?? "").localeCompare(b.produto.tamanho ?? "", undefined, { numeric: true })
    );

  const qtdLivres = linhas.filter((l) => l.situacao === "livre").length;
  const qtdComCliente = linhas.filter((l) => l.situacao === "comCliente").length;
  const qtdReservados = linhas.filter((l) => l.situacao === "reservado").length;

  function alternarConferido(id: number) {
    setConferidos((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  function exportarExcel() {
    const dados = linhas.map((l) => ({
      Código: l.produto.referencia ?? "",
      Descrição: l.descricao,
      Tamanho: l.produto.tamanho ?? "",
      Cor: l.produto.cor ?? "",
      "Qtd. em estoque": l.produto.quantidade,
      Situação: ESTILO_SITUACAO[l.situacao].texto,
      Detalhes: [...l.detalhes, l.proxima].filter((x) => x).join(" | "),
    }));
    const planilha = XLSX.utils.json_to_sheet(dados);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, "Conferência");
    XLSX.writeFile(livro, `conferencia-estoque_${paraISO(new Date())}.xlsx`);
  }

  return (
    <div className="conteudo">
      <div className="no-imprimir">
        <h1>Conferência de Estoque</h1>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="grid-3">
            <div className="campo">
              <label>Pesquisar (código, nome, cor, tamanho…)</label>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="ex: paletó cinza médio"
                autoFocus
              />
            </div>
            <div className="campo">
              <label>Categoria</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="todas">Todas</option>
                {nomesCategoria.map((nome, i) => (
                  <option key={nome} value={String(i)}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Situação</label>
              <select value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value as FiltroSituacao)}>
                <option value="todos">Todas</option>
                <option value="livre">Livres</option>
                <option value="comCliente">Com cliente</option>
                <option value="reservado">Reservados na semana</option>
              </select>
            </div>
            <div className="campo">
              <label>Semana de referência</label>
              <input type="date" value={dataReferencia} onChange={(e) => setDataReferencia(e.target.value)} />
            </div>
            <div className="campo">
              <label style={{ visibility: "hidden" }}>.</label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, fontWeight: 400, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={somenteLocacao}
                  onChange={(e) => setSomenteLocacao(e.target.checked)}
                  style={{ width: "auto", margin: 0 }}
                />
                Somente itens de locação
              </label>
            </div>
            <div className="campo">
              <label style={{ visibility: "hidden" }}>.</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => window.print()} disabled={linhas.length === 0}>
                  Gerar relatório (PDF)
                </button>
                <button onClick={exportarExcel} disabled={linhas.length === 0}>
                  Exportar Excel
                </button>
                <button type="button" onClick={() => setConferidos([])} disabled={conferidos.length === 0}>
                  Limpar conferência
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* aparece na tela E no PDF */}
      <div className="recibo-titulo" style={{ fontSize: 20, fontWeight: 700 }}>
        Casa do Terno — Conferência de Estoque
      </div>
      <div className="recibo-subtitulo" style={{ marginBottom: 12 }}>
        Semana {dataBR(inicio)} a {dataBR(fim)}
        {busca.trim() && ` — busca: "${busca.trim()}"`}
        {categoria !== "todas" && ` — ${nomesCategoria[Number(categoria)]}`}
        {filtroSituacao !== "todos" && ` — ${ESTILO_SITUACAO[filtroSituacao].texto.toLowerCase()}`}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Itens listados</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{linhas.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Livres</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a" }}>{qtdLivres}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Com cliente</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#dc2626" }}>{qtdComCliente}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Reservados na semana</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#ca8a04" }}>{qtdReservados}</div>
        </div>
      </div>

      {linhas.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nenhum item encontrado.</p>}

      {linhas.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--borda)" }}>
              <th style={{ padding: "6px 8px", width: 36 }}>Conf.</th>
              <th style={{ padding: "6px 8px" }}>Código</th>
              <th style={{ padding: "6px 8px" }}>Descrição</th>
              <th style={{ padding: "6px 8px" }}>Tam.</th>
              <th style={{ padding: "6px 8px" }}>Cor</th>
              <th style={{ padding: "6px 8px" }}>Qtd.</th>
              <th style={{ padding: "6px 8px" }}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const estilo = ESTILO_SITUACAO[l.situacao];
              return (
                <tr key={l.produto.id} style={{ borderBottom: "1px solid var(--borda)", breakInside: "avoid", pageBreakInside: "avoid" }}>
                  <td style={{ padding: "6px 8px", verticalAlign: "top" }}>
                    <input
                      type="checkbox"
                      checked={conferidos.includes(l.produto.id)}
                      onChange={() => alternarConferido(l.produto.id)}
                      style={{ width: "auto", margin: 0 }}
                    />
                  </td>
                  <td style={{ padding: "6px 8px", verticalAlign: "top", whiteSpace: "nowrap" }}>
                    <strong>{l.produto.referencia || "—"}</strong>
                  </td>
                  <td style={{ padding: "6px 8px", verticalAlign: "top" }}>{l.descricao}</td>
                  <td style={{ padding: "6px 8px", verticalAlign: "top" }}>{l.produto.tamanho || "—"}</td>
                  <td style={{ padding: "6px 8px", verticalAlign: "top" }}>{l.produto.cor || "—"}</td>
                  <td style={{ padding: "6px 8px", verticalAlign: "top" }}>{l.produto.quantidade}</td>
                  <td style={{ padding: "6px 8px", verticalAlign: "top" }}>
                    <strong style={{ color: estilo.cor }}>{estilo.texto}</strong>
                    {l.detalhes.map((d, i) => (
                      <div key={i} style={{ fontSize: 13 }}>
                        {d}
                      </div>
                    ))}
                    {l.proxima && <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>{l.proxima}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}