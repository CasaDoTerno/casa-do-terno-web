import { useEffect, useState } from "react";
import api from "../Services/API";

interface Agendamento {
  id: number;
  locacaoId: number | null;
  inicio: string;
  fim: string;
  cancelado: boolean;
  origem: "google" | "sistema";
  cliente: string;
  clienteCadastrado: boolean;
  telefone: string | null;
  email: string | null;
  noGoogle: boolean;
  observacaoSync: string | null;
}

const CHAVE_LINK = "linkAgendamentoGoogle";

function hojeISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function somarDias(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function lerLink() {
  try {
    return localStorage.getItem(CHAVE_LINK) ?? "";
  } catch {
    return "";
  }
}

export function Agendamentos() {
  const [de, setDe] = useState(hojeISO());
  const [ate, setAte] = useState(somarDias(hojeISO(), 30));
  const [incluirCancelados, setIncluirCancelados] = useState(false);
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [link, setLink] = useState(lerLink());

  function carregar() {
    setCarregando(true);
    setErro("");
    api
      .get<Agendamento[]>("/Agendamentos", { params: { de, ate, incluirCancelados } })
      .then((r) => setLista(r.data))
      .catch((e) => {
        console.error(e);
        setErro("Não foi possível carregar os agendamentos. Tente atualizar.");
      })
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
  }, [de, ate, incluirCancelados]);

  async function atualizarAgenda() {
    setMensagem("Consultando o Google Agenda...");
    try {
      const r = await api.post("/Agendamentos/sincronizar");
      const d = r.data;
      setMensagem(
        `Agenda atualizada. Novas reservas: ${d.importados}. Remarcados: ${d.remarcados}. Cancelados: ${d.cancelados}.`
      );
      carregar();
    } catch (e) {
      console.error(e);
      setMensagem("Não foi possível atualizar a agenda agora.");
    }
  }

  async function cancelar(a: Agendamento) {
    const aviso = a.locacaoId
      ? `Cancelar o agendamento de ${a.cliente}? A locação #${a.locacaoId} continua; só o horário é liberado e o evento some do Google Agenda.`
      : `Cancelar o agendamento de ${a.cliente}? O evento some do Google Agenda.`;
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

  function salvarLink(valor: string) {
    setLink(valor);
    try {
      localStorage.setItem(CHAVE_LINK, valor);
    } catch {
      // sem armazenamento: o campo continua funcionando nesta sessão
    }
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(link);
      setMensagem("Link copiado!");
    } catch {
      setMensagem("Não consegui copiar. Selecione o link e copie manualmente.");
    }
  }

  const textoWhats = encodeURIComponent(
    `Olá! Para agendar a retirada do seu terno na Casa do Terno, escolha o melhor dia e horário aqui: ${link}`
  );

  // agrupa por dia
  const porDia = new Map<string, Agendamento[]>();
  for (const a of lista) {
    const dia = a.inicio.split("T")[0];
    porDia.set(dia, [...(porDia.get(dia) ?? []), a]);
  }

  return (
    <div>
      <h1>Agendamentos</h1>

      <h2>Link para o cliente agendar</h2>
      <div className="card" style={{ marginBottom: 20, maxWidth: 720 }}>
        <label>Link da sua página de agendamento do Google Agenda</label>
        <input
          value={link}
          onChange={(e) => salvarLink(e.target.value)}
          placeholder="Cole aqui o link que o Google Agenda gerou"
        />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <button type="button" onClick={copiarLink} disabled={!link}>
            Copiar link
          </button>
          <a
            href={link ? `https://wa.me/?text=${textoWhats}` : undefined}
            target="_blank"
            rel="noreferrer"
            style={{ pointerEvents: link ? "auto" : "none", opacity: link ? 1 : 0.4 }}
          >
            <button type="button" disabled={!link}>
              Enviar por WhatsApp
            </button>
          </a>
        </div>
        <p style={{ color: "var(--texto-suave)", fontSize: 13, margin: "8px 0 0 0" }}>
          O cliente escolhe o horário, recebe a confirmação por e-mail e pode remarcar ou cancelar pelo próprio Google.
          Tudo aparece aqui e na sua agenda.
        </p>
      </div>

      <h2>Consulta</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="grid-3">
          <div>
            <label>De</label>
            <input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div>
            <label>Até</label>
            <input type="date" value={ate} min={de} onChange={(e) => setAte(e.target.value)} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <button type="button" onClick={atualizarAgenda}>
              Atualizar agenda
            </button>
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

      {mensagem && <p>{mensagem}</p>}
      {erro && <p style={{ color: "#f87171" }}>{erro}</p>}
      {carregando && <p style={{ color: "var(--texto-suave)" }}>Carregando...</p>}
      {!carregando && !erro && lista.length === 0 && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhum agendamento nesse período.</p>
      )}

      {[...porDia.entries()].map(([dia, itens]) => (
        <div key={dia} style={{ marginBottom: 20 }}>
          <h2>
            {new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </h2>
          {itens.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{
                marginBottom: 8,
                opacity: a.cancelado ? 0.55 : 1,
                borderLeft: `3px solid ${a.cancelado ? "#f87171" : a.locacaoId ? "var(--verde)" : "#fbbf24"}`,
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
                    {a.cancelado
                      ? "Cancelado"
                      : a.locacaoId
                      ? `Locação #${a.locacaoId}`
                      : "Ainda sem locação — crie a locação e escolha esta reserva"}
                    {" · "}
                    {a.origem === "google" ? "Marcado pelo cliente (link do Google)" : "Marcado pelo atendente"}
                    {!a.cancelado && !a.noGoogle && " · ainda não enviado ao Google"}
                    {a.origem === "google" && !a.clienteCadastrado && " · cliente sem cadastro"}
                  </p>
                  {a.observacaoSync && (
                    <p style={{ color: "#fbbf24", fontSize: 13, margin: "6px 0 0 0" }}>⚠ {a.observacaoSync}</p>
                  )}
                </div>
                {!a.cancelado && (
                  <div>
                    <button type="button" onClick={() => cancelar(a)}>
                      Cancelar agendamento
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}