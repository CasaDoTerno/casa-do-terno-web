import { useEffect, useState } from "react";
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
    api.get<Locacao[]>("/Locacoes").then((r) =>
      setLocacoes(r.data.filter((l) => l.dataRetiradaReal === null))
    );
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

      <div className="recibo-titulo">Casa do Terno — Retiradas da Semana</div>
      <div className="recibo-subtitulo">
        {inicio.toLocaleDateString("pt-BR")} a {fim.toLocaleDateString("pt-BR")}
      </div>

      {locacoesDaSemana.length === 0 && <p>Nenhuma retirada pendente nessa semana.</p>}

      {locacoesDaSemana.map((locacao) => (
        <div key={locacao.id} className="recibo-card card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong style={{ fontSize: 16 }}>{nomeCliente(locacao.clienteId)}</strong>
            <span>{telefoneCliente(locacao.clienteId)}</span>
          </div>
          <div style={{ marginTop: 4 }}>
            Retirada: <strong>{new Date(locacao.dataRetirada).toLocaleDateString("pt-BR")}</strong>
            {" — "}Evento: {new Date(locacao.dataEvento).toLocaleDateString("pt-BR")}
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