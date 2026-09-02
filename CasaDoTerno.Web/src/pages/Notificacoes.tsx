import { useState } from "react";
import api from "../Services/API";

export function Notificacoes() {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  async function enviar(tipo: "lembrete-retirada" | "lembrete-devolucao") {
    setEnviando(true);
    setResultado(null);
    try {
      const resposta = await api.post(`/Notificacoes/${tipo}`);
      setResultado(resposta.data);
    } catch (erro) {
      console.error(erro);
      setResultado({ erro: "Falha ao enviar. Veja o console (F12)." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Notificações por E-mail</h1>
      <p style={{ color: "var(--texto-suave)" }}>
        Normalmente isso roda sozinho, todo dia às 9h. Use os botões abaixo só pra testar
        ou disparar manualmente fora do horário programado.
      </p>

      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 12 }}>
        <button onClick={() => enviar("lembrete-retirada")} disabled={enviando}>
          Enviar lembretes de retirada (amanhã)
        </button>
        <button onClick={() => enviar("lembrete-devolucao")} disabled={enviando}>
          Enviar lembretes de devolução (amanhã)
        </button>
      </div>

      {resultado && (
        <div className="card">
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(resultado, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}