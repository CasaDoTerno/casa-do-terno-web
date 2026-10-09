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