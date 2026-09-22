import { useEffect, useState } from "react";
import api from "../Services/API";
import * as XLSX from "xlsx";

interface Produto {
  id: number;
  modelo: string;
  categoria: number;
  referencia: string | null;
  cor: string;
  tamanho: string;
  quantidade: number;
  estoqueMinimo: number;
  controlaEstoque: boolean;
  disponivelParaVenda: boolean;
  disponivelParaLocacao: boolean;
}

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato", "Cinto", "Meia", "Relógio", "Gravata"];

export function EstoqueBaixo() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [filtroCategoria, setFiltroCategoria] = useState(-1);
  const [filtroReferencia, setFiltroReferencia] = useState("");
  const [filtroDescricao, setFiltroDescricao] = useState("");
  const [filtroTamanho, setFiltroTamanho] = useState("");
  const [filtroCor, setFiltroCor] = useState("");
  const [filtroDisponibilidade, setFiltroDisponibilidade] = useState("todos"); // todos | locacao | venda
  const [mostrarTodos, setMostrarTodos] = useState(false);

  useEffect(() => {
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data.filter((p) => p.controlaEstoque)));
  }, []);

  function sugestaoCompra(produto: Produto): number {
    return Math.max(produto.estoqueMinimo - produto.quantidade, 0);
  }

  const produtosFiltrados = produtos
    .filter((p) => (mostrarTodos ? true : p.quantidade <= p.estoqueMinimo))
    .filter((p) => (filtroCategoria === -1 ? true : p.categoria === filtroCategoria))
    .filter((p) =>
      filtroReferencia ? (p.referencia ?? "").toLowerCase().includes(filtroReferencia.toLowerCase()) : true
    )
    .filter((p) => (filtroDescricao ? p.modelo.toLowerCase().includes(filtroDescricao.toLowerCase()) : true))
    .filter((p) => (filtroTamanho ? p.tamanho.toLowerCase().includes(filtroTamanho.toLowerCase()) : true))
    .filter((p) => (filtroCor ? p.cor.toLowerCase().includes(filtroCor.toLowerCase()) : true))
    .filter((p) => {
      if (filtroDisponibilidade === "locacao") return p.disponivelParaLocacao;
      if (filtroDisponibilidade === "venda") return p.disponivelParaVenda;
      return true;
    })
    .sort((a, b) => sugestaoCompra(b) - sugestaoCompra(a));

  function limparFiltros() {
    setFiltroCategoria(-1);
    setFiltroReferencia("");
    setFiltroDescricao("");
    setFiltroTamanho("");
    setFiltroCor("");
    setFiltroDisponibilidade("todos");
  }

  function exportarExcel() {
    const linhas = produtosFiltrados.map((p) => ({
      Referência: p.referencia ?? "",
      Descrição: p.modelo,
      Categoria: nomesCategoria[p.categoria],
      Cor: p.cor,
      Tamanho: p.tamanho,
      "Estoque Mínimo": p.estoqueMinimo,
      "Estoque Real": p.quantidade,
      "Sugestão de Compra": sugestaoCompra(p),
    }));

    const planilha = XLSX.utils.json_to_sheet(linhas);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, "Estoque");

    XLSX.writeFile(livro, `relatorio-estoque_${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  return (
    <div>
      <h1>Relatório de Estoque</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="grid-3">
          <div className="campo">
            <label>Categoria</label>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(Number(e.target.value))}>
              <option value={-1}>Todas</option>
              {nomesCategoria.map((nome, index) => (
                <option key={index} value={index}>{nome}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Referência</label>
            <input value={filtroReferencia} onChange={(e) => setFiltroReferencia(e.target.value)} placeholder="ex: CA003" />
          </div>
          <div className="campo">
            <label>Descrição</label>
            <input value={filtroDescricao} onChange={(e) => setFiltroDescricao(e.target.value)} placeholder="ex: Camisa Aluguel" />
          </div>
        </div>

        <div className="grid-3" style={{ marginTop: 12 }}>
          <div className="campo">
            <label>Tamanho</label>
            <input value={filtroTamanho} onChange={(e) => setFiltroTamanho(e.target.value)} placeholder="ex: M, 42" />
          </div>
          <div className="campo">
            <label>Cor</label>
            <input value={filtroCor} onChange={(e) => setFiltroCor(e.target.value)} placeholder="ex: Preta" />
          </div>
          <div className="campo">
            <label>Disponibilidade</label>
            <select value={filtroDisponibilidade} onChange={(e) => setFiltroDisponibilidade(e.target.value)}>
              <option value="todos">Locação e Venda</option>
              <option value="locacao">Só Locação</option>
              <option value="venda">Só Venda</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, margin: 0 }}>
            <input
              type="checkbox"
              checked={mostrarTodos}
              onChange={(e) => setMostrarTodos(e.target.checked)}
              style={{ width: "auto" }}
            />
            Mostrar todos os produtos (não só os com estoque baixo)
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={limparFiltros}>Limpar filtros</button>
            <button type="button" onClick={exportarExcel} disabled={produtosFiltrados.length === 0}>
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      <p style={{ color: "var(--texto-suave)" }}>{produtosFiltrados.length} produto(s) encontrado(s)</p>

      {produtosFiltrados.length === 0 && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhum produto encontrado com esses filtros.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {produtosFiltrados.map((produto) => {
          const sugestao = sugestaoCompra(produto);
          const critico = produto.quantidade <= produto.estoqueMinimo;
          return (
            <div
              key={produto.id}
              className="card"
              style={critico ? { borderLeft: "3px solid #f87171" } : undefined}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <strong>
                    {produto.referencia ? `${produto.referencia} — ` : ""}{produto.modelo}
                  </strong>
                  <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                    {nomesCategoria[produto.categoria]} · {produto.cor} · Tam. {produto.tamanho}
                    {produto.disponivelParaLocacao && " · Locação"}
                    {produto.disponivelParaVenda && " · Venda"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 24, textAlign: "right" }}>
                  <div>
                    <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Mínimo</div>
                    <div style={{ fontWeight: 600 }}>{produto.estoqueMinimo}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Estoque real</div>
                    <div style={{ fontWeight: 600, color: critico ? "#f87171" : "var(--verde)" }}>
                      {produto.quantidade}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--texto-suave)", fontSize: 12 }}>Sugestão de compra</div>
                    <div style={{ fontWeight: 700, color: sugestao > 0 ? "#facc15" : "var(--texto-suave)" }}>
                      {sugestao > 0 ? sugestao : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}