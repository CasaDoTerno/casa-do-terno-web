import { useEffect, useState } from "react";
import api from "../Services/API";

interface Categoria {
  id: number;
  nome: string;
}

interface ItemCompra {
  id: number;
  categoriaCompraId: number;
  descricao: string;
  tamanho: string | null;
  cor: string | null;
  quantidade: number;
  valorEstimado: number;
  comprado: boolean;
  dataCompra: string | null;
  mes: string;
  produtoId: number | null;
  deMesAnterior: boolean;
}

interface Sugestao {
  produtoId: number;
  modelo: string;
  referencia: string | null;
  cor: string | null;
  tamanho: string | null;
  categoria: number;
  quantidade: number;
  estoqueMinimo: number;
  sugerido: number;
  valorCusto: number;
}

type Filtro = "todos" | "pendentes" | "comprados";

const nomesCategoriaProduto = ["Terno", "Calça", "Camisa", "Sapato", "Cinto", "Meia", "Relógio", "Gravata"];

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function dinheiro(valor: number): string {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function mesAtualISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nomeDoMes(mes: string): string {
  const [ano, m] = mes.split("-");
  const nomes = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${nomes[Number(m) - 1] ?? m} de ${ano}`;
}

function dataBR(valor: string | null): string {
  if (!valor) return "";
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function ListaCompras() {
  const [mes, setMes] = useState(mesAtualISO());
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [itens, setItens] = useState<ItemCompra[]>([]);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [mensagem, setMensagem] = useState("");

  // formulário de item
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [categoriaId, setCategoriaId] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [cor, setCor] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valor, setValor] = useState(0);

  // categoria nova
  const [novaCategoria, setNovaCategoria] = useState("");

  // categoria escolhida em cada sugestão (produtoId -> categoriaId)
  const [escolhaSugestao, setEscolhaSugestao] = useState<Record<number, number>>({});

  function carregarCategorias() {
    api
      .get<Categoria[]>("/ListaCompras/categorias")
      .then((r) => {
        setCategorias(r.data);
        setCategoriaId((atual) => (atual === 0 && r.data.length > 0 ? r.data[0].id : atual));
      })
      .catch((erro) => console.error(erro));
  }

  function carregarItens() {
    api
      .get<ItemCompra[]>("/ListaCompras/itens", { params: { mes } })
      .then((r) => setItens(r.data))
      .catch((erro) => console.error(erro));
  }

  function carregarSugestoes() {
    api
      .get<Sugestao[]>("/ListaCompras/sugestoes")
      .then((r) => setSugestoes(r.data))
      .catch((erro) => console.error(erro));
  }

  useEffect(() => {
    carregarCategorias();
    carregarSugestoes();
  }, []);

  useEffect(() => {
    carregarItens();
  }, [mes]);

  function mostrarErro(erro: any, padrao: string) {
    const dado = erro?.response?.data;
    setMensagem(typeof dado === "string" && dado ? dado : padrao);
  }

  // ---------- categorias ----------
  async function adicionarCategoria() {
    if (!novaCategoria.trim()) return;
    try {
      await api.post("/ListaCompras/categorias", { nome: novaCategoria });
      setNovaCategoria("");
      setMensagem("");
      carregarCategorias();
    } catch (erro) {
      mostrarErro(erro, "Erro ao criar categoria.");
    }
  }

  async function renomearCategoria(c: Categoria) {
    const nome = window.prompt("Novo nome da categoria:", c.nome);
    if (!nome || !nome.trim() || nome.trim() === c.nome) return;
    try {
      await api.put(`/ListaCompras/categorias/${c.id}`, { nome });
      setMensagem("");
      carregarCategorias();
    } catch (erro) {
      mostrarErro(erro, "Erro ao renomear categoria.");
    }
  }

  async function removerCategoria(c: Categoria) {
    if (!window.confirm(`Remover a categoria "${c.nome}"?`)) return;
    try {
      await api.delete(`/ListaCompras/categorias/${c.id}`);
      setMensagem("");
      carregarCategorias();
    } catch (erro) {
      mostrarErro(erro, "Erro ao remover categoria.");
    }
  }

  // ---------- itens ----------
  function limparFormulario() {
    setEditandoId(null);
    setDescricao("");
    setTamanho("");
    setCor("");
    setQuantidade(1);
    setValor(0);
  }

  async function salvarItem(e: React.FormEvent) {
    e.preventDefault();
    const corpo = {
      categoriaCompraId: categoriaId,
      descricao,
      tamanho: tamanho || null,
      cor: cor || null,
      quantidade,
      valorEstimado: valor,
      mes,
    };
    try {
      if (editandoId !== null) {
        await api.put(`/ListaCompras/itens/${editandoId}`, corpo);
      } else {
        await api.post("/ListaCompras/itens", corpo);
      }
      limparFormulario();
      setMensagem("");
      carregarItens();
    } catch (erro) {
      mostrarErro(erro, "Erro ao salvar o item.");
    }
  }

  function editarItem(item: ItemCompra) {
    setEditandoId(item.id);
    setCategoriaId(item.categoriaCompraId);
    setDescricao(item.descricao);
    setTamanho(item.tamanho ?? "");
    setCor(item.cor ?? "");
    setQuantidade(item.quantidade);
    setValor(item.valorEstimado);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function alternarComprado(item: ItemCompra) {
    try {
      await api.put(`/ListaCompras/itens/${item.id}/comprado`, { comprado: !item.comprado });
      carregarItens();
      carregarSugestoes();
    } catch (erro) {
      mostrarErro(erro, "Erro ao atualizar o item.");
    }
  }

  async function removerItem(item: ItemCompra) {
    if (!window.confirm(`Remover "${item.descricao}" da lista?`)) return;
    try {
      await api.delete(`/ListaCompras/itens/${item.id}`);
      carregarItens();
      carregarSugestoes();
    } catch (erro) {
      mostrarErro(erro, "Erro ao remover o item.");
    }
  }

  // ---------- sugestões do estoque ----------
  function categoriaPadraoDaSugestao(s: Sugestao): number {
    const alvo = s.categoria === 2 ? "camisa" : s.categoria === 1 ? "calca" : "";
    const achada = alvo ? categorias.find((c) => normalizar(c.nome).includes(alvo)) : undefined;
    return achada?.id ?? categorias[0]?.id ?? 0;
  }

  async function adicionarSugestao(s: Sugestao) {
    const catId = escolhaSugestao[s.produtoId] ?? categoriaPadraoDaSugestao(s);
    const nome = `${s.referencia ? s.referencia + " — " : ""}${nomesCategoriaProduto[s.categoria] ?? ""} ${s.modelo}`.trim();
    try {
      await api.post("/ListaCompras/itens", {
        categoriaCompraId: catId,
        descricao: nome,
        tamanho: s.tamanho || null,
        cor: s.cor || null,
        quantidade: s.sugerido,
        valorEstimado: s.valorCusto,
        mes,
        produtoId: s.produtoId,
      });
      setMensagem("");
      carregarItens();
      carregarSugestoes();
    } catch (erro) {
      mostrarErro(erro, "Erro ao adicionar a sugestão.");
    }
  }

  // ---------- agrupamento ----------
  const itensFiltrados = itens.filter((i) => {
    if (filtro === "pendentes") return !i.comprado;
    if (filtro === "comprados") return i.comprado;
    return true;
  });

  const grupos = categorias
    .map((c) => ({ categoria: c, lista: itensFiltrados.filter((i) => i.categoriaCompraId === c.id) }))
    .filter((g) => g.lista.length > 0);

  const totalPendente = itens.filter((i) => !i.comprado).reduce((s, i) => s + i.quantidade * i.valorEstimado, 0);
  const totalComprado = itens.filter((i) => i.comprado).reduce((s, i) => s + i.quantidade * i.valorEstimado, 0);
  const qtdPendentes = itens.filter((i) => !i.comprado).length;

  return (
    <div className="conteudo">
      <div className="no-imprimir">
        <h1>Lista de Compras</h1>

        <div className="card" style={{ marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="campo">
            <label>Mês</label>
            <input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} />
          </div>
          <div className="campo">
            <label>Mostrar</label>
            <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
              <option value="todos">Todos</option>
              <option value="pendentes">Só o que falta comprar</option>
              <option value="comprados">Só comprados</option>
            </select>
          </div>
          <div className="campo">
            <label style={{ visibility: "hidden" }}>.</label>
            <button onClick={() => window.print()} disabled={itensFiltrados.length === 0}>
              Fechar mês / Gerar PDF
            </button>
          </div>
        </div>

        {mensagem && <p style={{ color: "#dc2626" }}>{mensagem}</p>}

        {/* sugestões automáticas do estoque */}
        {sugestoes.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ marginTop: 0 }}>Sugestões do estoque ({sugestoes.length})</h2>
            <p style={{ color: "var(--texto-suave)", marginTop: 0, fontSize: 13 }}>
              Produtos no estoque mínimo ou abaixo. A quantidade sugerida é o que falta para chegar no mínimo.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sugestoes.map((s) => (
                <div
                  key={s.produtoId}
                  style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid var(--borda)", paddingTop: 8 }}
                >
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <strong>
                      {s.referencia ? `${s.referencia} — ` : ""}
                      {nomesCategoriaProduto[s.categoria] ?? ""} {s.modelo}
                    </strong>
                    <div style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                      {s.cor ?? ""} {s.tamanho ? `· Tam. ${s.tamanho}` : ""} · estoque {s.quantidade} (mín. {s.estoqueMinimo}) · comprar {s.sugerido}
                    </div>
                  </div>
                  <select
                    value={escolhaSugestao[s.produtoId] ?? categoriaPadraoDaSugestao(s)}
                    onChange={(e) => setEscolhaSugestao({ ...escolhaSugestao, [s.produtoId]: Number(e.target.value) })}
                    style={{ width: "auto" }}
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => adicionarSugestao(s)}>
                    Adicionar à lista
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* formulário de item */}
        <form onSubmit={salvarItem} className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>{editandoId !== null ? "Editar item" : "Adicionar item"}</h2>
          <div className="grid-3">
            <div className="campo">
              <label>Categoria</label>
              <select value={categoriaId} onChange={(e) => setCategoriaId(Number(e.target.value))}>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Descrição</label>
              <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="ex: Camisa social slim, Detergente" required />
            </div>
            <div className="campo">
              <label>Quantidade</label>
              <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
            </div>
            <div className="campo">
              <label>Tamanho</label>
              <input value={tamanho} onChange={(e) => setTamanho(e.target.value)} placeholder="ex: M, 42" />
            </div>
            <div className="campo">
              <label>Cor</label>
              <input value={cor} onChange={(e) => setCor(e.target.value)} placeholder="ex: Azul claro" />
            </div>
            <div className="campo">
              <label>Valor estimado (unidade)</label>
              <input type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit">{editandoId !== null ? "Salvar alterações" : "Adicionar à lista"}</button>
            {editandoId !== null && (
              <button type="button" onClick={limparFormulario}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        {/* categorias */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>Categorias</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {categorias.map((c) => (
              <span
                key={c.id}
                style={{ border: "1px solid var(--borda)", borderRadius: 999, padding: "4px 10px", display: "inline-flex", gap: 8, alignItems: "center" }}
              >
                {c.nome}
                <button type="button" onClick={() => renomearCategoria(c)} title="Renomear">
                  Renomear
                </button>
                <button type="button" onClick={() => removerCategoria(c)} title="Remover">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              placeholder="Nova categoria (ex: Cintos, Embalagens)"
              style={{ maxWidth: 320 }}
            />
            <button type="button" onClick={adicionarCategoria}>
              Criar categoria
            </button>
          </div>
        </div>
      </div>

      {/* esta parte aparece na tela E no PDF */}
      <div className="recibo-titulo" style={{ fontSize: 20, fontWeight: 700 }}>
        Casa do Terno — Lista de Compras
      </div>
      <div className="recibo-subtitulo" style={{ marginBottom: 12 }}>
        {nomeDoMes(mes)}
        {filtro === "pendentes" && " — o que falta comprar"}
        {filtro === "comprados" && " — já comprados"}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Itens a comprar</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#ca8a04" }}>{qtdPendentes}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Previsto a gastar</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{dinheiro(totalPendente)}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--texto-suave)" }}>Já comprado</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a" }}>{dinheiro(totalComprado)}</div>
        </div>
      </div>

      {grupos.length === 0 && <p style={{ color: "var(--texto-suave)" }}>Nenhum item na lista desse mês.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {grupos.map(({ categoria, lista }) => {
          const totalGrupo = lista.filter((i) => !i.comprado).reduce((s, i) => s + i.quantidade * i.valorEstimado, 0);
          return (
            <div key={categoria.id} className="card" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <strong style={{ fontSize: 17 }}>{categoria.nome}</strong>
                <span style={{ color: "var(--texto-suave)", fontSize: 13 }}>
                  {lista.length} {lista.length === 1 ? "item" : "itens"} · a comprar: {dinheiro(totalGrupo)}
                </span>
              </div>
              {lista.map((item) => (
                <div
                  key={item.id}
                  style={{ display: "flex", gap: 10, alignItems: "center", borderTop: "1px solid var(--borda)", padding: "6px 0" }}
                >
                  <input
                    type="checkbox"
                    checked={item.comprado}
                    onChange={() => alternarComprado(item)}
                    title="Marcar como comprado"
                    style={{ width: "auto", margin: 0 }}
                  />
                  <div style={{ flex: 1, textDecoration: item.comprado ? "line-through" : "none", opacity: item.comprado ? 0.6 : 1 }}>
                    <strong>{item.quantidade}x</strong> {item.descricao}
                    {item.tamanho && <> · Tam. {item.tamanho}</>}
                    {item.cor && <> · {item.cor}</>}
                    {item.deMesAnterior && (
                      <span style={{ color: "#dc2626", fontSize: 12 }}> · pendente de {nomeDoMes(item.mes)}</span>
                    )}
                    {item.comprado && item.dataCompra && (
                      <span style={{ fontSize: 12 }}> · comprado em {dataBR(item.dataCompra)}</span>
                    )}
                  </div>
                  <div style={{ whiteSpace: "nowrap" }}>{dinheiro(item.quantidade * item.valorEstimado)}</div>
                  <div className="no-imprimir" style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => editarItem(item)}>
                      Editar
                    </button>
                    <button type="button" onClick={() => removerItem(item)}>
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}