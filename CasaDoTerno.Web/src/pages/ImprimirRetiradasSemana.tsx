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
  dataReserva: string | null;
  dataEvento: string;
  dataRetirada: string;
  dataRetiradaReal: string | null;
  itens: ItemLocacao[];
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
}

interface Produto {
  id: number;
  modelo: string;
  referencia: string | null;
  cor: string;
  tamanho: string;
}

type Modo = "semana" | "dia" | "novas";

function inicioDaSemana(data: Date): Date {
  const dia = data.getDay();
  const diferenca = dia === 0 ? -6 : 1 - dia;
  const inicio = new Date(data);
  inicio.setDate(data.getDate() + diferenca);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

// pega só "AAAA-MM-DD" de uma data da API (sem passar por Date, pra não mudar o dia por fuso)
function soData(valor: string | null | undefined): string {
  return valor ? valor.split("T")[0] : "";
}

function dataBR(valor: string | null | undefined): string {
  const [ano, mes, dia] = soData(valor).split("-");
  return ano ? `${dia}/${mes}/${ano}` : "—";
}

function hojeISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function ImprimirRetiradasSemana() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [dataReferencia, setDataReferencia] = useState(hojeISO);
  const [modo, setModo] = useState<Modo>("semana");
  const [novasDesde, setNovasDesde] = useState(hojeISO);

  useEffect(() => {
    api.get<Locacao[]>("/Locacoes").then((r) => setLocacoes(r.data));
    api.get<Cliente[]>("/Clientes").then((r) => setClientes(r.data));
    api.get<Produto[]>("/Produtos").then((r) => setProdutos(r.data));
  }, []);

  function nomeCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
  }

  function telefoneCliente(clienteId: number) {
    return clientes.find((c) => c.id === clienteId)?.telefone ?? "";
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

  // aplica o modo escolhido em cima da lista da semana
  const lista = locacoesDaSemana.filter((l) => {
    if (modo === "dia") return soData(l.dataEvento) === dataReferencia;
    if (modo === "novas") return soData(l.dataReserva) >= novasDesde;
    return true;
  });

  const subtitulo =
    modo === "dia"
      ? `Dia ${dataBR(dataReferencia)}`
      : `${inicio.toLocaleDateString("pt-BR")} a ${fim.toLocaleDateString("pt-BR")}`;

  const tituloPagina =
    modo === "dia"
      ? "Casa do Terno — Retiradas do Dia"
      : modo === "novas"
        ? "Casa do Terno — Novas Locações da Semana"
        : "Casa do Terno — Retiradas da Semana";

  return (
    <div className="conteudo">
      <div className="no-imprimir" style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
        <div className="campo">
          <label>{modo === "dia" ? "Dia" : "Semana de referência"}</label>
          <input
            type="date"
            value={dataReferencia}
            onChange={(e) => setDataReferencia(e.target.value)}
          />
        </div>
        <div className="campo">
          <label>O que imprimir</label>
          <select value={modo} onChange={(e) => setModo(e.target.value as Modo)}>
            <option value="semana">Semana inteira</option>
            <option value="dia">Só o dia escolhido</option>
            <option value="novas">Só as novas (lançadas desde…)</option>
          </select>
        </div>
        {modo === "novas" && (
          <div className="campo">
            <label>Lançadas a partir de</label>
            <input type="date" value={novasDesde} onChange={(e) => setNovasDesde(e.target.value)} />
          </div>
        )}
        <button onClick={() => window.print()}>Imprimir</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Logo tamanho="grande" />
      </div>
      <div className="recibo-titulo">{tituloPagina}</div>
      <div className="recibo-subtitulo">
        {subtitulo}
        {modo === "novas" && ` — lançadas desde ${dataBR(novasDesde)}`}
      </div>

      {lista.length === 0 && (
        <p>
          {modo === "dia"
            ? "Nenhuma locação com evento nesse dia."
            : modo === "novas"
              ? "Nenhuma locação nova nessa semana desde a data escolhida."
              : "Nenhuma retirada pendente nessa semana."}
        </p>
      )}

      {lista.map((locacao) => (
        <div key={locacao.id} className="recibo-card card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong style={{ fontSize: 16 }}>{nomeCliente(locacao.clienteId)}</strong>
            <span>{telefoneCliente(locacao.clienteId)}</span>
          </div>
          <div style={{ marginTop: 4 }}>
            Retirada: <strong>{new Date(locacao.dataRetirada).toLocaleDateString("pt-BR")}</strong>
            {" — "}Evento: {new Date(locacao.dataEvento).toLocaleDateString("pt-BR")}
            {" — "}
            <strong style={{ color: locacao.dataRetiradaReal !== null ? "#166534" : "#b91c1c" }}>
              {locacao.dataRetiradaReal !== null ? "✓ RETIRADO" : "○ PENDENTE"}
            </strong>
            {modo === "novas" && locacao.dataReserva && (
              <span> — lançada em {dataBR(locacao.dataReserva)}</span>
            )}
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
      ))}
    </div>
  );
}