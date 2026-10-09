import { useEffect, useState } from "react";
import api from "../Services/API";

interface Produto {
  id: number;
  modelo: string;
  referencia: string | null;
  cor: string;
  tamanho: string;
}

interface ItemLocacao {
  produtoId: number;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataEvento: string;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal: string | null;
  dataCancelamento?: string | null;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
}

interface Reserva {
  clienteNome: string;
  dataEvento: string;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
}

// "2026-09-18" vira "18/09/2026" (sem passar por new Date, que erraria o dia por causa do fuso)
function formatarData(iso: string): string {
  return iso.split("-").reverse().join("/");
}

export function Disponibilidade() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [busca, setBusca] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");

  const [atualizando, setAtualizando] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [erroCarga, setErroCarga] = useState("");

  function carregar() {
    setAtualizando(true);

    Promise.all([
      api.get<Produto[]>("/Produtos"),
      api.get<Locacao[]>("/Locacoes"),
      api.get<Cliente[]>("/Clientes"),
    ])
      .then(([resProdutos, resLocacoes, resClientes]) => {
        // só troca os dados se as TRÊS buscas deram certo
        setProdutos(resProdutos.data);
        setLocacoes(resLocacoes.data.filter((l) => l.dataDevolucaoReal === null && !l.dataCancelamento));
        setClientes(resClientes.data);
        setErroCarga("");
        setAtualizadoEm(new Date());
      })
      .catch((erro: any) => {
        console.error(erro);
        // sem dados confiáveis, a lista some: melhor mostrar o erro do que mostrar "Livre" sem saber
        setAtualizadoEm(null);
        setErroCarga(
          erro.response?.status === 401
            ? "Sua sessão expirou. Saia do sistema e entre de novo."
            : "Não foi possível carregar as reservas."
        );
      })
      .finally(() => setAtualizando(false));
  }

  useEffect(() => {
    carregar();

    // ao voltar pra essa aba (ex: tablet que ficou aberto), busca de novo
    function aoVoltarParaAba() {
      if (document.visibilityState === "visible") carregar();
    }
    document.addEventListener("visibilitychange", aoVoltarParaAba);
    return () => document.removeEventListener("visibilitychange", aoVoltarParaAba);
  }, []);

  function nomeCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  // monta, pra cada produto, a lista de reservas ativas (não devolvidas), em ordem de data do evento
  function reservasDoProduto(produtoId: number): Reserva[] {
    return locacoes
      .filter((l) => l.itens.some((item) => item.produtoId === produtoId))
      .map((l) => ({
        clienteNome: nomeCliente(l.clienteId),
        dataEvento: l.dataEvento.split("T")[0],
        dataRetirada: l.dataRetirada.split("T")[0],
        dataDevolucaoPrevista: l.dataDevolucaoPrevista.split("T")[0],
      }))
      .sort((a, b) => a.dataEvento.localeCompare(b.dataEvento));
  }

  const produtosComReservas = produtos.map((p) => ({
    produto: p,
    reservas: reservasDoProduto(p.id),
  }));

  const produtosFiltrados = produtosComReservas.filter(({ produto, reservas }) => {
    // filtro de texto (referência, descrição, cor, tamanho)
    const textoProduto = `${produto.modelo} ${produto.tamanho} ${produto.cor} ${produto.referencia ?? ""}`.toLowerCase();
    const palavras = busca.toLowerCase().split(" ").filter((p) => p.length > 0);
    const bateBusca = palavras.every((palavra) => textoProduto.includes(palavra));

    // filtro de data: só produtos que estão fora da loja nessa data (da retirada até a devolução)
    const bateData =
      !filtroData ||
      reservas.some((r) => filtroData >= r.dataRetirada && filtroData <= r.dataDevolucaoPrevista);

    // filtro de cliente: só produtos com alguma reserva daquele cliente
    const bateCliente =
      !filtroCliente ||
      reservas.some((r) => r.clienteNome.toLowerCase().includes(filtroCliente.toLowerCase()));

    return bateBusca && bateData && bateCliente;
  });

  return (
    <div>
      <h1>Disponibilidade de Produtos</h1>

      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div className="campo" style={{ flex: 1, minWidth: 220 }}>
          <label>Buscar (código, descrição, tamanho, cor)</label>
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="campo">
          <label>Ver reservas nessa data</label>
          <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />
        </div>
        <div className="campo">
          <label>Filtrar por cliente</label>
          <input type="text" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} />
        </div>
      </div>

      {/* ---- falhou: não mostra NENHUMA peça como livre ---- */}
      {erroCarga && (
        <div className="card" style={{ marginBottom: 16, borderLeft: "3px solid #f87171" }}>
          <p style={{ color: "#f87171", fontWeight: 700, margin: "0 0 6px 0" }}>{erroCarga}</p>
          <p style={{ color: "var(--texto-suave)", fontSize: 13, margin: "0 0 12px 0" }}>
            Sem as reservas, essa tela não consegue dizer se uma peça está livre. Não use ela agora
            pra decidir nada.
          </p>
          <button type="button" onClick={carregar} disabled={atualizando}>
            {atualizando ? "Tentando..." : "Tentar de novo"}
          </button>
        </div>
      )}

      {/* ---- primeira carga ---- */}
      {!erroCarga && atualizadoEm === null && (
        <p style={{ color: "var(--texto-suave)" }}>Carregando reservas...</p>
      )}

      {/* ---- carregou: lista normal ---- */}
      {!erroCarga && atualizadoEm !== null && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ color: "var(--texto-suave)", fontSize: 13 }}>
              Atualizado às {atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button type="button" onClick={carregar} disabled={atualizando} style={{ fontSize: 12 }}>
              {atualizando ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {produtosFiltrados.map(({ produto, reservas }) => (
              <div key={produto.id} className="card">
                <strong>
                  {produto.referencia ? `${produto.referencia} — ` : ""}{produto.modelo} — {produto.cor} — Tam. {produto.tamanho}
                </strong>

                {reservas.length === 0 ? (
                  <p style={{ color: "var(--verde)", margin: "6px 0 0 0" }}>Livre — sem reservas ativas</p>
                ) : (
                  <div style={{ marginTop: 6 }}>
                    {reservas.map((r, index) => {
                      const foraNaDataEscolhida =
                        filtroData !== "" && filtroData >= r.dataRetirada && filtroData <= r.dataDevolucaoPrevista;

                      return (
                        <div key={index} style={{ fontSize: 13, color: "var(--texto-suave)" }}>
                          Locado com <strong>{r.clienteNome}</strong> — evento em{" "}
                          <strong>{formatarData(r.dataEvento)}</strong>
                          {foraNaDataEscolhida && (
                            <span style={{ color: "#facc15", marginLeft: 6 }}>
                              (peça fora da loja de {formatarData(r.dataRetirada)} a {formatarData(r.dataDevolucaoPrevista)})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}