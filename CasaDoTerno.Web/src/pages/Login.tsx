import { useState } from "react";
import axios from "axios";
import api from "../Services/API";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();

    try {
      const resposta = await axios.post(`${import.meta.env.VITE_API_URL.replace("/api", "")}/login`, {
      email,
      password: senha,
    });


      localStorage.setItem("token", resposta.data.accessToken);

      const perfilResposta = await api.get("/Usuarios/perfil");
      localStorage.setItem("papel", perfilResposta.data.papel);
      setMensagem("Login realizado com sucesso!");
    } catch (erro) {
      console.error(erro);
      setMensagem("E-mail ou senha inválidos.");
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>E-mail: </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Senha: </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        <button type="submit">Entrar</button>
      </form>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}