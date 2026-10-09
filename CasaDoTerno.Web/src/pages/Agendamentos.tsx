import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Services/API";

interface Agendamento {
  id: number;
  locacaoId: number | null;
  inicio: string;
  fim: string;
  cancelado?: boolean;
  cliente: string;
  telefone: string | null;
  email: string | null;
}

interface DiaSemAtendimento {
  id: number;
  dataInicio: string; // yyyy-MM-dd
  dataFim: string;
  motivo: string;
}

// feriados nacionais que ainda faltam em 2026 (feriado municipal você cadastra manualmente)
const FERIADOS_NACIONAIS_2026: [string, string][] = [
  ["2026-10-12", "Nossa Senhora Aparecida"],
  ["2026-11-02", "Finados"],
  ["2026-11-15", "Proclamação da República"],
  ["2026-11-20", "Consciência Negra"],
  ["2026-12-25", "Natal"],
];

function dataBR(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function paraISO(d: Date) {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function somarDias(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

function linkWhatsApp(telefone: string | null) {
  if (!telefone) return null;
  let digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  if (digitos.length <= 11) digitos = "55" + digitos;
  return `https://wa.me/${digitos}`;
}

export function Agendamentos() {
  const hoje = paraISO(new Date());
  const [de, setDe] = useState(hoje);
  const [ate, setAte] = useState(somarDias(hoje, 7));
  const [incluirCancelados, setIncluirCancelados] = useState(false);
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();

  // dias sem atendimento
  const [bloqueios, setBloqueios] = useState<DiaSemAtendimento[]>([]);
  const [bloqueioInicio, setBloqueioInicio] = useState("");
  const [bloqueioFim, setBloqueioFim] = useState("");
  const [bloqueioMotivo, setBloqueioMotivo] = useState("");
  const [mensagemBloqueio, setMensagemBloqueio] = useState("");
  const [salvandoBloqueio, setSalvandoBloqueio] = useState(false);

  function carregarBloqueios() {
    api
      .get<DiaSemAtendimento[]>("/DiasSemAtendimento")
      .then((r) => setBloqueios(r.data))
      .catch((e) => {
        console.error(e);
        setMensagemBloqueio("Não foi possível carregar os dias sem atendimento.");
      });
  }

  useEffect(() => {
    carregarBloqueios();
  }, []);

  async function adicionarBloqueio() {
    if (!bloqueioInicio) {
      setMensagemBloqueio("Escolha a data (ou a data inicial).");
      return;
    }
    setSalvandoBloqueio(true);
    try {
      const r = await api.post("/DiasSemAtendimento", {
        dataInicio: bloqueioInicio,
        dataFim: bloqueioFim || null,
        motivo: bloqueioMotivo,
      });
      const afetados: number = r.data.agendamentosNoPeriodo ?? 0;
      setMensagemBloqueio(
        afetados > 0
          ? `Salvo. ATENÇÃO: já existem ${afetados} agendamento(s) nesse período. Eles NÃO foram cancelados — avise os clientes e cancele ou remarque.`
          : "Dia sem atendimento salvo."
      );
      setBloqueioInicio("");
      setBloqueioFim("");
      setBloqueioMotivo("");
      carregarBloqueios();
      carregar();
    } catch (e: any) {
      console.error(e);
      setMensagemBloqueio(typeof e.response?.data === "string" ? e.response.data : "Não foi possível salvar.");
    } finally {
      setSalvandoBloqueio(false);
    }
  }

  async function removerBloqueio(b: DiaSemAtendimento) {
    const texto = b.dataInicio === b.dataFim ? dataBR(b.dataInicio) : `${dataBR(b.dataInicio)} a ${dataBR(b.dataFim)}`;
    if (!window.confirm(`Voltar a atender em ${texto} (${b.motivo})?`)) return;
    try {
      await api.delete(`/DiasSemAtendimento/${b.id}`);
      setMensagemBloqueio("Removido. Esse período volta a oferecer horários.");
      carregarBloqueios();
    } catch (e) {
      console.error(e);
      setMensagemBloqueio("Não foi possível remover.");
    }
  }

  async function adicionarFeriadosNacionais() {
    const hojeIso = paraISO(new Date());
    const jaCadastrados = new Set(bloqueios.filter((b) => b.dataInicio === b.dataFim).map((b) => b.dataInicio));
    const novos = FERIADOS_NACIONAIS_2026.filter(([data]) => data >= hojeIso && !jaCadastrados.has(data));

    if (novos.length === 0) {
      setMensagemBloqueio("Os feriados nacionais que faltam em 2026 já estão cadastrados.");
      return;
    }
    if (!window.confirm(`Cadastrar ${novos.length} feriado(s) nacional(is) de 2026 como sem atendimento?`)) return;

    try {
      for (const [data, motivo] of novos) {
        await api.post("/DiasSemAtendimento", { dataInicio: data, dataFim: null, motivo: `Feriado — ${motivo}` });
      }
      setMensagemBloqueio(`${novos.length} feriado(s) cadastrado(s).`);
      carregarBloqueios();
    } catch (e) {
      console.error(e);
      setMensagemBloqueio("Não foi possível cadastrar todos. Confira a lista.");
      carregarBloqueios();
    }
  }

  function carregar() {
    setCarregando(true);
    setErro("");
    api
      .get<Agendamento[]>("/Agendamentos", { params: { de, ate, incluirCancelados } })
      .then((r) => setLista(r.data))
      .catch((e) => {
        console.error(e);
        setErro("Não foi possível carregar os agendamentos. Tente novamente.");
      })
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
  }, [de, ate, incluirCancelados]);

  function periodo(dias: number, inicio = hoje) {
    setDe(inicio);
    setAte(somarDias(inicio, dias));
  }

  async function cancelar(a: Agendamento) {
    const aviso = a.locacaoId
      ? `Cancelar o agendamento de ${a.cliente}? A locação #${a.locacaoId} continua; só o horário é liberado.`
      : `Cancelar o agendamento de ${a.cliente}? O horário é liberado.`;
    if (!window.confirm(aviso)) return;

    try {
      await api.post(`/Agendamentos/${a.id}/cancelar`);
      setMensagem("Agendamento cancelado.");
      carregar();
    } catch (e) {
      console.error(e);
      setMensagem("Não foi possível cancelar.");
    }
  }

  const ativos = lista.filter((a) => !a.cancelado);

  // agrupa por dia
  const porDia = new Map<string, Agendamento[]>();
  for (const a of lista) {
    const dia = a.inicio.split("T")[0];
    porDia.set(dia, [...(porDia.get(dia) ?? []), a]);
  }

  return (
    <div>
      <h1>Agendamentos</h1>

      <h2>Dias sem atendimento</h2>
      <div className="card" style={{ marginBottom: 20, maxWidth: 720 }}>
        <p style={{ color: "var(--texto-suave)", fontSize: 13, margin: "0 0 12px 0" }}>
          Feriados, férias e dias em que a loja não abre. Nesses dias o sistema não oferece horário de retirada.
        </p>
        <div className="grid-3">
          <div>
            <label>Data (ou início)</label>
            <input type="date" value={bloqueioInicio} onChange={(e) => setBloqueioInicio(e.target.value)} />
          </div>
          <div>
            <label>Até (opcional)</label>
            <input
              type="date"
              value={bloqueioFim}
              min={bloqueioInicio || undefined}
              onChange={(e) => setBloqueioFim(e.target.value)}
            />
          </div>
          <div>
            <label>Motivo</label>
            <input
              value={bloqueioMotivo}
              onChange={(e) => setBloqueioMotivo(e.target.value)}
              placeholder="ex: Feriado — Natal"
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <button type="button" onClick={adicionarBloqueio} disabled={salvandoBloqueio}>
            {salvandoBloqueio ? "Salvando..." : "Adicionar dia sem atendimento"}
          </button>
          <button
            type="button"
            onClick={adicionarFeriadosNacionais}
            style={{ background: "var(--chumbo-input)", color: "#e5e7eb" }}
          >
            Cadastrar feriados nacionais de 2026
          </button>
        </div>
        {mensagemBloqueio && <p style={{ margin: "12px 0 0 0" }}>{mensagemBloqueio}</p>}

        {bloqueios.length > 0 && (
          <ul style={{ marginTop: 16, paddingLeft: 0, listStyle: "none" }}>
            {bloqueios.map((b) => (
              <li
                key={b.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "6px 0",
                  borderTop: "1px solid var(--borda)",
                }}
              >
                <span>
                  <strong>
                    {b.dataInicio === b.dataFim
                      ? dataBR(b.dataInicio)
                      : `${dataBR(b.dataInicio)} a ${dataBR(b.dataFim)}`}
                  </strong>{" "}
                  — {b.motivo}
                </span>
                <button type="button" onClick={() => removerBloqueio(b)}>
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
        {bloqueios.length === 0 && (
          <p style={{ color: "var(--texto-suave)", fontSize: 13, margin: "12px 0 0 0" }}>
            Nenhum dia sem atendimento cadastrado.
          </p>
        )}
      </div>

      <h2>Retiradas agendadas</h2>
      <div className="card" style={{ marginBottom: 20, maxWidth: 720 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button type="button" onClick={() => periodo(0)}>Hoje</button>
          <button type="button" onClick={() => periodo(0, somarDias(hoje, 1))}>Amanhã</button>
          <button type="button" onClick={() => periodo(7)}>Próximos 7 dias</button>
          <button type="button" onClick={() => periodo(30)}>Próximos 30 dias</button>
        </div>
        <div className="grid-2">
          <div>
            <label>De</label>
            <input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div>
            <label>Até</label>
            <input type="date" value={ate} min={de} onChange={(e) => setAte(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
          <input
            type="checkbox"
            id="ver-cancelados"
            checked={incluirCancelados}
            onChange={(e) => setIncluirCancelados(e.target.checked)}
            style={{ width: "auto" }}
          />
          <label htmlFor="ver-cancelados" style={{ margin: 0 }}>
            Mostrar também os cancelados
          </label>
        </div>
      </div>

      {!carregando && !erro && (
        <p style={{ fontWeight: 600 }}>
          {ativos.length} retirada{ativos.length === 1 ? "" : "s"} agendada{ativos.length === 1 ? "" : "s"} no período
        </p>
      )}
      {mensagem && <p>{mensagem}</p>}
      {erro && <p style={{ color: "#f87171" }}>{erro}</p>}
      {carregando && <p style={{ color: "var(--texto-suave)" }}>Carregando...</p>}
      {!carregando && !erro && lista.length === 0 && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhum agendamento nesse período.</p>
      )}

      {[...porDia.entries()].map(([dia, itens]) => (
        <div key={dia} style={{ marginBottom: 20 }}>
          <h2 style={{ textTransform: "capitalize" }}>
            {new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </h2>
          {itens.map((a) => {
            const whats = linkWhatsApp(a.telefone);
            return (
              <div
                key={a.id}
                className="card"
                style={{
                  marginBottom: 8,
                  maxWidth: 720,
                  opacity: a.cancelado ? 0.55 : 1,
                  borderLeft: `3px solid ${a.cancelado ? "#f87171" : "var(--verde)"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                      {a.inicio.split("T")[1].slice(0, 5)} — {a.cliente}
                    </p>
                    <p style={{ color: "var(--texto-suave)", margin: "4px 0 0 0" }}>
                      {[a.telefone, a.email].filter(Boolean).join(" · ") || "Sem contato informado"}
                    </p>
                    <p style={{ margin: "6px 0 0 0", fontSize: 13 }}>
                      {a.cancelado ? "Cancelado" : a.locacaoId ? `Locação #${a.locacaoId}` : "Sem locação ligada"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                    {whats && (
                      <a href={whats} target="_blank" rel="noreferrer">
                        <button type="button">WhatsApp</button>
                      </a>
                    )}
                    {a.locacaoId && !a.cancelado && (
                      <button type="button" onClick={() => navigate(`/locacoes/contrato/${a.locacaoId}`)}>
                        Ver contrato
                      </button>
                    )}
                    {!a.cancelado && (
                      <button type="button" onClick={() => cancelar(a)}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}