import { useState } from "react";
import api from "../Services/API";

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato", "Cinto", "Meia", "Relógio", "Gravata"];

interface Resultado {
  referencia: string;
  sucesso: boolean;
  mensagem: string;
}

const PRESETS_TAMANHO: { label: string; valores: string }[] = [
  { label: "PP, P, M, G, GG", valores: "PP, P, M, G, GG" },
  { label: "Calçado adulto (36-44)", valores: "36, 37, 38, 39, 40, 41, 42, 43, 44" },
  { label: "Infantil (2-16)", valores: "2, 4, 6, 8, 10, 12, 14, 16" },
];

export function CadastroVariacoes() {
  const [categoria, setCategoria] = useState(0);
  const [modelo, setModelo] = useState("");
  const [codigoBase, setCodigoBase] = useState("");
  const [tamanhosTexto, setTamanhosTexto] = useState("");
  const [coresTexto, setCoresTexto] = useState("");

  const [inicioSequencia, setInicioSequencia] = useState(44);
  const [fimSequencia, setFimSequencia] = useState(60);
  const [intervaloSequencia, setIntervaloSequencia] = useState(2);

  const [valorCusto, setValorCusto] = useState(0);
  const [valorVenda, setValorVenda] = useState(0);
  const [valorLocacao, setValorLocacao] = useState(0);
  const [controlaEstoque, setControlaEstoque] = useState(true);
  const [quantidadePorVariacao, setQuantidadePorVariacao] = useState(1);
  const [estoqueMinimo, setEstoqueMinimo] = useState(0);
  const [disponivelParaVenda, setDisponivelParaVenda] = useState(true);
  const [disponivelParaLocacao, setDisponivelParaLocacao] = useState(true);

  const [gerando, setGerando] = useState(false);
  const [resultados, setResultados] = useState<Resultado[]>([]);

  function gerarSequenciaDeTamanhos() {
    const numeros: number[] = [];
    for (let n = inicioSequencia; n <= fimSequencia; n += intervaloSequencia) {
      numeros.push(n);
    }
    setTamanhosTexto(numeros.join(", "));
  }

  function listaLimpa(texto: string): string[] {
    return texto
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  const tamanhos = listaLimpa(tamanhosTexto);
  const cores = listaLimpa(coresTexto);
  const totalCombinacoes = tamanhos.length * cores.length;

  async function handleGerar() {
    if (!modelo || tamanhos.length === 0 || cores.length === 0) {
      alert("Preencha a descrição, pelo menos um tamanho e pelo menos uma cor.");
      return;
    }

    const confirmar = window.confirm(
      `Isso vai criar ${totalCombinacoes} produto(s) — um para cada combinação de tamanho e cor. Confirmar?`
    );
    if (!confirmar) return;

    setGerando(true);
    setResultados([]);
    const novosResultados: Resultado[] = [];

    for (const tamanho of tamanhos) {
      for (const cor of cores) {
        const referencia = `${codigoBase}-${tamanho}-${cor.slice(0, 3).toUpperCase()}`;

        try {
          await api.post("/Produtos", {
            modelo,
            categoria,
            tamanho,
            cor,
            referencia,
            valorCusto,
            valorVenda,
            valorLocacao,
            controlaEstoque,
            quantidade: quantidadePorVariacao,
            estoqueMinimo,
            observacao: "",
            disponivelParaVenda,
            disponivelParaLocacao,
          });
          novosResultados.push({ referencia, sucesso: true, mensagem: "Criado com sucesso." });
        } catch (erro: any) {
          novosResultados.push({
            referencia,
            sucesso: false,
            mensagem: erro.response?.data || "Erro ao criar.",
          });
        }
      }
    }

    setResultados(novosResultados);
    setGerando(false);
  }

  return (
    <div>
      <h1>Cadastro com Variações</h1>
      <p style={{ color: "var(--texto-suave)" }}>
        Preenche os dados comuns uma vez, informa os tamanhos e/ou cores, e o sistema cria um produto
        pra cada combinação automaticamente.
      </p>

      <h2>Dados comuns</h2>
      <div className="card" style={{ marginBottom: 20, maxWidth: 640 }}>
        <div className="campo">
          <label>Descrição</label>
          <input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="ex: Terno Marinho" required />
        </div>
        <div className="grid-2">
          <div className="campo">
            <label>Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(Number(e.target.value))}>
              {nomesCategoria.map((nome, index) => (
                <option key={index} value={index}>{nome}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Código base</label>
            <input value={codigoBase} onChange={(e) => setCodigoBase(e.target.value)} placeholder="ex: TM01" />
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--texto-suave)", marginTop: 8 }}>
          O código de cada peça vai ficar assim: <strong>{codigoBase || "CODIGO"}-TAMANHO-COR</strong> (ex: TM01-46-MAR)
        </p>
      </div>

      <h2>Tamanhos</h2>
      <div className="card" style={{ marginBottom: 20, maxWidth: 640 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Atalhos rápidos</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {PRESETS_TAMANHO.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setTamanhosTexto(preset.valores)}
              style={{ fontSize: 13, background: "var(--chumbo-input)" }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <label style={{ display: "block", marginBottom: 8 }}>Ou gerar uma sequência numérica (ex: ternos)</label>
        <div className="grid-3">
          <div className="campo">
            <label>De</label>
            <input type="number" value={inicioSequencia} onChange={(e) => setInicioSequencia(Number(e.target.value))} />
          </div>
          <div className="campo">
            <label>Até</label>
            <input type="number" value={fimSequencia} onChange={(e) => setFimSequencia(Number(e.target.value))} />
          </div>
          <div className="campo">
            <label>De quanto em quanto</label>
            <input type="number" value={intervaloSequencia} onChange={(e) => setIntervaloSequencia(Number(e.target.value))} />
          </div>
        </div>
        <button type="button" onClick={gerarSequenciaDeTamanhos} style={{ marginTop: 8 }}>
          Gerar sequência
        </button>

        <div className="campo" style={{ marginTop: 20 }}>
          <label>Tamanhos (separados por vírgula — edite livremente se precisar)</label>
          <input
            value={tamanhosTexto}
            onChange={(e) => setTamanhosTexto(e.target.value)}
            placeholder="ex: 44, 46, 48, 50, 52, 54, 56, 58, 60"
          />
        </div>
        <p style={{ fontSize: 12, color: "var(--texto-suave)" }}>
          {tamanhos.length} tamanho(s): {tamanhos.join(", ") || "nenhum ainda"}
        </p>
      </div>

      <h2>Cores</h2>
      <div className="card" style={{ marginBottom: 20, maxWidth: 640 }}>
        <div className="campo">
          <label>Cores (separadas por vírgula)</label>
          <input
            value={coresTexto}
            onChange={(e) => setCoresTexto(e.target.value)}
            placeholder="ex: Preta, Branca, Rosa (ou só uma cor, se não variar)"
          />
        </div>
        <p style={{ fontSize: 12, color: "var(--texto-suave)" }}>
          {cores.length} cor(es): {cores.join(", ") || "nenhuma ainda"}
        </p>
      </div>

      <h2>Valores e estoque (aplicados a todas as variações)</h2>
      <div className="card" style={{ marginBottom: 20, maxWidth: 640 }}>
        <div className="grid-3">
          <div className="campo">
            <label>Custo</label>
            <input type="number" value={valorCusto} onChange={(e) => setValorCusto(Number(e.target.value))} />
          </div>
          <div className="campo">
            <label>Venda</label>
            <input type="number" value={valorVenda} onChange={(e) => setValorVenda(Number(e.target.value))} />
          </div>
          <div className="campo">
            <label>Locação</label>
            <input type="number" value={valorLocacao} onChange={(e) => setValorLocacao(Number(e.target.value))} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, margin: 0 }}>
            <input type="checkbox" checked={controlaEstoque} onChange={(e) => setControlaEstoque(e.target.checked)} style={{ width: "auto" }} />
            Controlar estoque
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, margin: 0 }}>
            <input type="checkbox" checked={disponivelParaVenda} onChange={(e) => setDisponivelParaVenda(e.target.checked)} style={{ width: "auto" }} />
            Disponível para venda
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, margin: 0 }}>
            <input type="checkbox" checked={disponivelParaLocacao} onChange={(e) => setDisponivelParaLocacao(e.target.checked)} style={{ width: "auto" }} />
            Disponível para locação
          </label>
        </div>

        {controlaEstoque && (
          <div className="grid-2" style={{ marginTop: 20 }}>
            <div className="campo">
              <label>Quantidade (por variação)</label>
              <input type="number" value={quantidadePorVariacao} onChange={(e) => setQuantidadePorVariacao(Number(e.target.value))} />
            </div>
            <div className="campo">
              <label>Estoque mínimo</label>
              <input type="number" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(Number(e.target.value))} />
            </div>
          </div>
        )}
      </div>

      {totalCombinacoes > 0 && (
        <p style={{ fontWeight: 700, marginBottom: 12 }}>
          Isso vai criar <span style={{ color: "var(--verde)" }}>{totalCombinacoes} produto(s)</span>.
        </p>
      )}

      <button type="button" onClick={handleGerar} disabled={gerando || totalCombinacoes === 0}>
        {gerando ? "Gerando..." : `Gerar ${totalCombinacoes || ""} produto(s)`}
      </button>

      {resultados.length > 0 && (
        <div className="card" style={{ marginTop: 20, maxWidth: 640 }}>
          <strong>Resultado:</strong>
          <p style={{ margin: "8px 0" }}>
            {resultados.filter((r) => r.sucesso).length} criado(s) com sucesso ·{" "}
            {resultados.filter((r) => !r.sucesso).length} com erro
          </p>
          {resultados.map((r, index) => (
            <div key={index} style={{ fontSize: 13, color: r.sucesso ? "var(--verde)" : "#f87171" }}>
              {r.referencia}: {r.mensagem}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}