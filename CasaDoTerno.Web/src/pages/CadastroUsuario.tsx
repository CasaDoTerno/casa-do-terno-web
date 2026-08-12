import { useState } from "react";
import api from "../Services/API";

export function CadastroUsuario() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState("Vendedor");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      await api.post("/Usuarios", { email, senha, papel });
      setMensagem("Usuário criado com sucesso!");
      setEmail("");
      setSenha("");
      setPapel("Vendedor");
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao criar usuário.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Cadastrar Usuário</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mín. 6 caracteres, com maiúscula, número e símbolo"
              required
            />
          </div>
          <div>
            <label>Papel</label>
            <select value={papel} onChange={(e) => setPapel(e.target.value)}>
              <option value="Vendedor">Vendedor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Cadastrar usuário"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}