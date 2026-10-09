import { useEffect } from "react";

interface ModalAvisoProps {
  titulo: string;
  mensagem: string;
  dica?: string;
  onFechar: () => void;
}

// Caixa de mensagem no meio da tela: o atendente precisa clicar em "Entendi" pra continuar
export function ModalAviso({ titulo, mensagem, dica, onFechar }: ModalAvisoProps) {
  useEffect(() => {
    function aoApertarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoApertarTecla);
    return () => window.removeEventListener("keydown", aoApertarTecla);
  }, [onFechar]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="modal-aviso-titulo"
      onClick={onFechar}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: "100%",
          borderLeft: "4px solid #f87171",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        <h2 id="modal-aviso-titulo" style={{ marginTop: 0, color: "#f87171" }}>
          {titulo}
        </h2>
        <p style={{ whiteSpace: "pre-wrap", fontSize: 16, margin: "0 0 12px 0" }}>{mensagem}</p>
        {dica && <p style={{ color: "var(--texto-suave)", margin: "0 0 16px 0" }}>{dica}</p>}
        <button type="button" autoFocus onClick={onFechar}>
          Entendi
        </button>
      </div>
    </div>
  );
}