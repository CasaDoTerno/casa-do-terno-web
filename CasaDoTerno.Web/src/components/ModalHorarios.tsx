import { useEffect } from "react";

export interface HorarioAgenda {
  hora: string;
  vagasRestantes: number;
  disponivel: boolean;
  motivo: string | null;
}

interface ModalHorariosProps {
  data: string; // yyyy-MM-dd
  horarios: HorarioAgenda[];
  carregando: boolean;
  agendaAberta: boolean;
  mensagem: string;
  horaSelecionada: string;
  onEscolher: (hora: string) => void; // "" = sem horário
  onFechar: () => void;
}

// Grade de horários da retirada: só os livres aparecem; o atendente clica e a caixa fecha
export function ModalHorarios({
  data,
  horarios,
  carregando,
  agendaAberta,
  mensagem,
  horaSelecionada,
  onEscolher,
  onFechar,
}: ModalHorariosProps) {
  useEffect(() => {
    function aoApertarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoApertarTecla);
    return () => window.removeEventListener("keydown", aoApertarTecla);
  }, [onFechar]);

  const livres = horarios.filter((h) => h.disponivel);

  const diaTexto = new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-horarios-titulo"
      onClick={onFechar}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 900,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 560,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        <h2 id="modal-horarios-titulo" style={{ marginTop: 0 }}>
          Horário da retirada
        </h2>
        <p style={{ textTransform: "capitalize", margin: "0 0 4px 0", fontWeight: 600 }}>{diaTexto}</p>
        <p style={{ color: "var(--texto-suave)", fontSize: 13, margin: "0 0 16px 0" }}>
          Cada horário atende até 2 clientes. Clique no horário para agendar.
        </p>

        {carregando && <p style={{ color: "var(--texto-suave)" }}>Consultando horários...</p>}

        {!carregando && !agendaAberta && (
          <p style={{ color: "#f87171", fontWeight: 600 }}>{mensagem || "A loja não atende nesse dia."}</p>
        )}

        {!carregando && agendaAberta && horarios.length === 0 && (
          <p style={{ color: "#fbbf24" }}>
            {mensagem || "O servidor não devolveu nenhum horário para esse dia. Feche e tente novamente."}
          </p>
        )}

        {!carregando && agendaAberta && horarios.length > 0 && livres.length === 0 && (
          <p style={{ color: "#fbbf24", fontWeight: 600 }}>
            Não há horário livre nesse dia (lotado ou já passou). Feche e escolha outra data de retirada.
          </p>
        )}

        {!carregando && agendaAberta && livres.length > 0 && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 8,
              }}
            >
              {livres.map((h) => {
                const selecionado = h.hora === horaSelecionada;
                const ultimaVaga = h.vagasRestantes === 1;

                return (
                  <button
                    key={h.hora}
                    type="button"
                    onClick={() => onEscolher(h.hora)}
                    title={ultimaVaga ? "Última vaga deste horário" : `${h.vagasRestantes} vagas`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0,
                      padding: "8px 6px",
                      borderRadius: 999,
                      background: selecionado ? "var(--verde)" : "transparent",
                      color: selecionado ? "#0b1f14" : "var(--verde)",
                      border: "1px solid var(--verde)",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{h.hora}</span>
                    {ultimaVaga && (
                      <span style={{ fontSize: 11, color: selecionado ? "#0b1f14" : "#fbbf24" }}>última vaga</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p style={{ color: "var(--texto-suave)", fontSize: 12, margin: "12px 0 0 0" }}>
              Só aparecem os horários livres. Horários lotados ou que já passaram ficam escondidos.
            </p>
          </>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <button type="button" onClick={() => onEscolher("")} style={{ background: "var(--chumbo-input)", color: "#e5e7eb" }}>
            Sem horário (não agendar)
          </button>
          <button type="button" onClick={onFechar} style={{ background: "var(--chumbo-input)", color: "#e5e7eb" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}