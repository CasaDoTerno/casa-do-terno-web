import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface ItemLocacao {
  produtoId: number;
  ajustes: string | null;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataEvento: string;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
  dataRetiradaReal: string | null;
  dataDevolucaoReal: string | null;
  dataCancelamento: string | null;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
}

interface Produto {
  id: number;
  modelo: string;
  categoria: number;
  referencia: string | null;
  cor: string;
  tamanho: string;
}

interface Alvo {
  tipo: "produto" | "cliente";
  id: number;
}

const nomesCategoria = ["Terno", "Calça", "Camisa", "Sapato", "Cinto", "Meia", "Relógio", "Gravata"];
const LIMITE_RESULTADOS = 15;

// data de hoje no fuso do navegador (toISOString usaria UTC e viraria o dia à noite)
function paraISO(data: Date): string {
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const dd = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mm}-${dd}`;
}

function dia(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}

// "João" e "joao" passam a ser a mesma coisa na busca
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function soDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

// Todas as palavras digitadas precisam aparecer. Palavras só com números (CPF, telefone)
// também são comparadas sem pontos, traços e parênteses, então "12345678900" acha "123.456.789-00".
function combina(texto: string, digitos: string, termo: string): boolean {
  const alvo = normalizar(texto);
  return normalizar(termo)
    .split(" ")
    .filter((palavra) => palavra.length > 0)
    .every((palavra) => {
      if (alvo.includes(palavra)) return true;
      const pareceNumero = /^[\d.\-()]+$/.test(palavra);
      const numeros = soDigitos(palavra);
      return pareceNumero && numeros.length > 0 && digitos.includes(numeros);
    });
}

function statusLocacao(l: Locacao, hojeISO: string): { texto: string; cor: string } {
  if (l.dataCancelamento !== null) return { texto: "Cancelada", cor: "#9ca3af" };
  if (l.dataDevolucaoReal !== null) {
    return { texto: `Devolvida em ${dia(l.dataDevolucaoReal)}`, cor: "var(--verde)" };
  }
  if (l.dataRetiradaReal !== null) {
    if (l.dataDevolucaoPrevista.split("T")[0] < hojeISO) {
      return { texto: "Atrasada (está com o cliente)", cor: "#f87171" };
    }
    return { texto: "Está com o cliente", cor: "#60a5fa" };
  }
  if (l.dataRetirada.split("T")[0] < hojeISO) {
    return { texto: "Retirada atrasada", cor: "#f87171" };
  }
  return { texto: "Aguardando retirada", cor: "#facc15" };
}

export function Rastreabilidade() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Alvo | null>(null);
  const [incluirCanceladas, setIncluirCanceladas] = useState(false);

  useEffect(() => {
    api.get<Locacao[]>("/Locacoes").then((r) => setLocacoes(r.data));
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, []);

  const hojeISO = paraISO(new Date());
  const termo = busca.trim();
  const buscaValida = termo.length >= 2;

  function rotuloProduto(p: Produto): string {
    const codigo = p.referencia ? `${p.referencia} — ` : "";
    return `${codigo}${nomesCategoria[p.categoria]} · ${p.modelo} · ${p.cor} · Tam. ${p.tamanho}`;
  }

  function descricaoProduto(produtoId: number): string {
    const p = produtos.find((x) => x.id === produtoId);
    return p ? rotuloProduto(p) : `Produto #${produtoId}`;
  }

  function nomeCliente(clienteId: number): string {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  function telefoneCliente(clienteId: number): string {
    return clientes.find((c) => c.id === clienteId)?.telefone ?? "";
  }

  function digitarBusca(valor: string) {
    setBusca(valor);
    setSelecionado(null);
  }

  // ---- o que a busca encontrou ----

  const produtosEncontrados = buscaValida
    ? produtos.filter((p) =>
        combina(
          `${p.referencia ?? ""} ${nomesCategoria[p.categoria]} ${p.modelo} ${p.cor} ${p.tamanho}`,
          "",
          termo
        )
      )
    : [];

  const clientesEncontrados = buscaValida
    ? clientes.filter((c) =>
        combina(`${c.nome} ${c.cpf} ${c.telefone}`, `${soDigitos(c.cpf)} ${soDigitos(c.telefone)}`, termo)
      )
    : [];

  // se só existe UM resultado no total, já abre o histórico dele, sem pedir pra clicar
  let unico: Alvo | null = null;
  if (produtosEncontrados.length + clientesEncontrados.length === 1) {
    unico =
      produtosEncontrados.length === 1
        ? { tipo: "produto", id: produtosEncontrados[0].id }
        : { tipo: "cliente", id: clientesEncontrados[0].id };
  }

  const alvo = selecionado ?? unico;

  const produtoAlvo = alvo?.tipo === "produto" ? produtos.find((p) => p.id === alvo.id) ?? null : null;
  const clienteAlvo = alvo?.tipo === "cliente" ? clientes.find((c) => c.id === alvo.id) ?? null : null;

  // ---- histórico, do mais antigo pro mais novo (pela data do evento) ----

  const locacoesOrdenadas = locacoes
    .filter((l) => incluirCanceladas || l.dataCancelamento === null)
    .sort((a, b) => {
      const porEvento = new Date(a.dataEvento).getTime() - new Date(b.dataEvento).getTime();
      if (porEvento !== 0) return porEvento;
      return new Date(a.dataRetirada).getTime() - new Date(b.dataRetirada).getTime();
    });

  const historicoProduto = produtoAlvo
    ? locacoesOrdenadas.filter((l) => l.itens.some((i) => i.produtoId === produtoAlvo.id))
    : [];

  const historicoCliente = clienteAlvo
    ? locacoesOrdenadas.filter((l) => l.clienteId === clienteAlvo.id)
    : [];

  const historico = produtoAlvo ? historicoProduto : historicoCliente;

  const indiceFuturo = historico.findIndex((l) => l.dataEvento.split("T")[0] >= hojeISO);
  const qtdPassadas = indiceFuturo === -1 ? historico.length : indiceFuturo;
  const qtdFuturas = historico.length - qtdPassadas;

  return (
    <div>
      <h1>Rastreabilidade</h1>
      <p style={{ color: "var(--texto-suave)" }}>
        Pesquise por uma peça (referência, nome, cor, tamanho) ou por um cliente (nome, CPF, telefone)
        pra ver o histórico completo de locações.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="campo">
          <label>Buscar</label>
          <input
            type="text"
            value={busca}
            onChange={(e) => digitarBusca(e.target.value)}
            placeholder="ex: CA003, preto 42, João, 123.456.789-00, (32) 99999-0000"
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, margin: "12px 0 0 0" }}>
          <input
            type="checkbox"
            checked={incluirCanceladas}
            onChange={(e) => setIncluirCanceladas(e.target.checked)}
            style={{ width: "auto" }}
          />
          Mostrar também as locações canceladas
        </label>
      </div>

      {!buscaValida && (
        <p style={{ color: "var(--texto-suave)" }}>Digite pelo menos 2 caracteres pra começar.</p>
      )}

      {/* ---- várias opções: escolher qual ver ---- */}
      {buscaValida && !alvo && (
        <>
          {produtosEncontrados.length === 0 && clientesEncontrados.length === 0 && (
            <p style={{ color: "var(--texto-suave)" }}>Nada encontrado para "{termo}".</p>
          )}

          {produtosEncontrados.length > 0 && (
            <>
              <h2>Peças encontradas ({produtosEncontrados.length})</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {produtosEncontrados.slice(0, LIMITE_RESULTADOS).map((p) => (
                  <div
                    key={p.id}
                    className="card"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                  >
                    <span>{rotuloProduto(p)}</span>
                    <button type="button" onClick={() => setSelecionado({ tipo: "produto", id: p.id })}>
                      Ver histórico
                    </button>
                  </div>
                ))}
                {produtosEncontrados.length > LIMITE_RESULTADOS && (
                  <p style={{ color: "var(--texto-suave)", fontSize: 13 }}>
                    Mostrando as {LIMITE_RESULTADOS} primeiras. Digite mais letras pra afinar a busca.
                  </p>
                )}
              </div>
            </>
          )}

          {clientesEncontrados.length > 0 && (
            <>
              <h2>Clientes encontrados ({clientesEncontrados.length})</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {clientesEncontrados.slice(0, LIMITE_RESULTADOS).map((c) => (
                  <div
                    key={c.id}
                    className="card"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                  >
                    <span>
                      <strong>{c.nome}</strong>
                      <span style={{ color: "var(--texto-suave)", fontSize: 13 }}>
                        {" "}· CPF {c.cpf} · Tel. {c.telefone}
                      </span>
                    </span>
                    <button type="button" onClick={() => setSelecionado({ tipo: "cliente", id: c.id })}>
                      Ver histórico
                    </button>
                  </div>
                ))}
                {clientesEncontrados.length > LIMITE_RESULTADOS && (
                  <p style={{ color: "var(--texto-suave)", fontSize: 13 }}>
                    Mostrando os {LIMITE_RESULTADOS} primeiros. Digite mais letras pra afinar a busca.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ---- histórico da peça ou do cliente ---- */}
      {(produtoAlvo || clienteAlvo) && (
        <div>
          {selecionado && (
            <button type="button" onClick={() => setSelecionado(null)} style={{ marginBottom: 12 }}>
              ← Voltar aos resultados
            </button>
          )}

          <div className="card" style={{ marginBottom: 16 }}>
            {produtoAlvo && (
              <>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{rotuloProduto(produtoAlvo)}</div>
                <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 4 }}>
                  Histórico de locações dessa peça
                </div>
              </>
            )}
            {clienteAlvo && (
              <>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{clienteAlvo.nome}</div>
                <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 4 }}>
                  CPF {clienteAlvo.cpf} · Tel. {clienteAlvo.telefone}
                </div>
              </>
            )}
            <div style={{ marginTop: 8 }}>
              {historico.length} locação(ões) — {qtdPassadas} já aconteceram, {qtdFuturas} por vir
            </div>
          </div>

          {historico.length === 0 && (
            <p style={{ color: "var(--texto-suave)" }}>Nenhuma locação encontrada.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {historico.map((l, index) => {
              const status = statusLocacao(l, hojeISO);
              const itensDaPeca = produtoAlvo ? l.itens.filter((i) => i.produtoId === produtoAlvo.id) : [];
              const ajustesDaPeca = itensDaPeca.filter((i) => i.ajustes).map((i) => i.ajustes);

              return (
                <Fragment key={l.id}>
                  {index === indiceFuturo && index > 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "var(--verde)",
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "6px 0",
                      }}
                    >
                      ── Hoje ({new Date().toLocaleDateString("pt-BR")}) · daqui pra frente ──
                    </div>
                  )}

                  <div className="card" style={{ borderLeft: `3px solid ${status.cor}` }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          Evento: {dia(l.dataEvento)} —{" "}
                          {produtoAlvo ? (
                            <Link to={`/locacoes/editar/${l.id}`}>{nomeCliente(l.clienteId)}</Link>
                          ) : (
                            <Link to={`/locacoes/editar/${l.id}`}>Locação #{l.id}</Link>
                          )}
                        </div>
                        <div style={{ color: "var(--texto-suave)", fontSize: 13, marginTop: 2 }}>
                          {produtoAlvo && telefoneCliente(l.clienteId) && `Tel. ${telefoneCliente(l.clienteId)} · `}
                          Retirada {dia(l.dataRetirada)} · Devolução prevista {dia(l.dataDevolucaoPrevista)}
                          {produtoAlvo && ` · Locação #${l.id}`}
                        </div>
                      </div>
                      <span style={{ color: status.cor, fontWeight: 700, fontSize: 13 }}>{status.texto}</span>
                    </div>

                    {produtoAlvo && (itensDaPeca.length > 1 || ajustesDaPeca.length > 0) && (
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        {itensDaPeca.length > 1 && `${itensDaPeca.length} unidades nessa locação`}
                        {itensDaPeca.length > 1 && ajustesDaPeca.length > 0 && " · "}
                        {ajustesDaPeca.length > 0 && `Ajustes: ${ajustesDaPeca.join("; ")}`}
                      </div>
                    )}

                    {clienteAlvo && (
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        {l.itens.map((item, i) => (
                          <div key={i}>
                            • {descricaoProduto(item.produtoId)}
                            {item.ajustes && ` — ${item.ajustes}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}