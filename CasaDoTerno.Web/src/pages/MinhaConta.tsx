import { useState } from "react";
import axios from "axios";

export function MinhaConta() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    if (novaSenha !== confirmacao) {
      setMensagem("A nova senha e a confirmação não são iguais.");
      return;
    }

    setEnviando(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL.replace("/api", "");
      const token = localStorage.getItem("token");

      await axios.post(
        `${baseUrl}/manage/info`,
        { oldPassword: senhaAtual, newPassword: novaSenha },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMensagem("Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
    } catch (erro: any) {
      console.error(erro);
      setMensagem("Erro ao trocar a senha. Confirme se a senha atual está certa e se a nova atende aos requisitos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Minha Conta</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Senha atual</label>
            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required />
          </div>
          <div>
            <label>Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mín. 6 caracteres, com maiúscula, número e símbolo"
              required
            />
          </div>
          <div>
            <label>Confirmar nova senha</label>
            <input type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} required />
          </div>
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Trocar senha"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}