import { useEffect, useState } from "react";
import api from "../Services/API";
import { Logo } from "../components/Logo";

interface ItemLocacao {
  produtoId: number;
  ajustes: string | null;
}

interface Locacao {
  id: number;
  clienteId: number;
  dataEvento: string;
  dataRetirada: string;
  dataRetiradaReal: string | null;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  ombro: number | null;
  manga: number | null;
  abdomen: number | null;
  bainha: number | null;
  cintura: number | null;
  panturrilha: number | null;
  coxa: number | null;
}

interface Produto {
  id: number;
  modelo: string;
  referencia: string | null;
  cor: string;
  tamanho: string;
}

function inicioDaSemana(data: Date): Date {
  const dia = data.getDay();
  const diferenca = dia === 0 ? -6 : 1 - dia;
  const inicio = new Date(data);
  inicio.setDate(data.getDate() + diferenca);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

export function ImprimirRetiradasSemana() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [dataReferencia, setDataReferencia] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    api.get<Locacao[]>("/Locacoes").then((r) => setLocacoes(r.data));
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, []);

  function cliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId);
  }

  function nomeCliente(clienteId: number) {
    return cliente(clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  function telefoneCliente(clienteId: number) {
    return cliente(clienteId)?.telefone ?? "";
  }

  function medidasCliente(clienteId: number): string {
    const c = cliente(clienteId);
    if (!c) return "";

    const partes: string[] = [];
    if (c.ombro != null) partes.push(`Ombro: ${c.ombro}`);
    if (c.manga != null) partes.push(`Manga: ${c.manga}`);
    if (c.abdomen != null) partes.push(`Abdômen: ${c.abdomen}`);
    if (c.bainha != null) partes.push(`Bainha: ${c.bainha}`);
    if (c.cintura != null) partes.push(`Cintura: ${c.cintura}`);
    if (c.panturrilha != null) partes.push(`Panturrilha: ${c.panturrilha}`);
    if (c.coxa != null) partes.push(`Coxa: ${c.coxa}`);

    return partes.join(" · ");
  }

  function descricaoProduto(produtoId: number) {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return `Produto #${produtoId}`;
    const codigo = produto.referencia ? `${produto.referencia} — ` : "";
    return `${codigo}${produto.modelo} · ${produto.cor} · Tam. ${produto.tamanho}`;
  }

  const inicio = inicioDaSemana(new Date(dataReferencia + "T00:00:00"));
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);

  const locacoesDaSemana = locacoes
    .filter((l) => {
      const evento = new Date(l.dataEvento);
      return evento >= inicio && evento <= fim;
    })
    .sort((a, b) => {
      const eventoA = new Date(a.dataEvento).getTime();
      const eventoB = new Date(b.dataEvento).getTime();
      if (eventoA !== eventoB) return eventoA - eventoB;
      return new Date(a.dataRetirada).getTime() - new Date(b.dataRetirada).getTime();
    });

  return (
    <div className="conteudo">
      <div className="no-imprimir" style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
        <div className="campo">
          <label>Semana de referência</label>
          <input
            type="date"
            value={dataReferencia}
            onChange={(e) => setDataReferencia(e.target.value)}
          />
        </div>
        <button onClick={() => window.print()}>Imprimir</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Logo tamanho="grande" />
      </div>
      <div className="recibo-titulo">Casa do Terno — Retiradas da Semana</div>
      <div className="recibo-subtitulo">
        {inicio.toLocaleDateString("pt-BR")} a {fim.toLocaleDateString("pt-BR")}
      </div>

      {locacoesDaSemana.length === 0 && <p>Nenhuma retirada pendente nessa semana.</p>}

      {locacoesDaSemana.map((locacao) => {
        const medidas = medidasCliente(locacao.clienteId);
        return (
          <div key={locacao.id} className="recibo-card card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 16 }}>{nomeCliente(locacao.clienteId)}</strong>
              <span>{telefoneCliente(locacao.clienteId)}</span>
            </div>

            {medidas && (
              <div style={{ marginTop: 4, fontSize: 13, color: "var(--texto-suave)" }}>
                Medidas: {medidas}
              </div>
            )}

            <div style={{ marginTop: 4 }}>
              Retirada: <strong>{new Date(locacao.dataRetirada).toLocaleDateString("pt-BR")}</strong>
              {" — "}Evento: {new Date(locacao.dataEvento).toLocaleDateString("pt-BR")}
              {" — "}
              <strong style={{ color: locacao.dataRetiradaReal !== null ? "#166534" : "#b91c1c" }}>
                {locacao.dataRetiradaReal !== null ? "✓ RETIRADO" : "○ PENDENTE"}
              </strong>
            </div>
            <div style={{ marginTop: 8 }}>
              {locacao.itens.map((item, index) => (
                <div key={index}>
                  • {descricaoProduto(item.produtoId)}
                  {item.ajustes && ` — ${item.ajustes}`}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}