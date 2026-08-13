import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Services/API";

interface Perfil {
  id: number;
  nome: string;
}

export function EditarUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("Vendedor");
  const [perfilId, setPerfilId] = useState(0);
  const [perfis, setPerfis] = useState<Perfil[]>([]);

  const [novaSenha, setNovaSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviandoSenha, setEnviandoSenha] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    api.get<Perfil[]>("/Perfis").then((r) => setPerfis(r.data));

    api.get(`/Usuarios/${id}`).then((resposta) => {
      const u = resposta.data;
      setEmail(u.email);
      setPapel(u.papel);
      setPerfilId(u.perfilId ?? 0);
    });
  }, [id]);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando || !id) return;

    setEnviando(true);
    try {
      // vincula o perfil (isso já ajusta o papel automaticamente, se o perfil tiver módulo sensível)
      if (perfilId !== 0) {
        await api.put(`/Usuarios/${id}/perfil-acesso`, { perfilId });
      } else {
        // sem perfil selecionado, só ajusta o papel diretamente
        await api.put(`/Usuarios/${id}/papel`, { papel });
      }

      setMensagem("Usuário atualizado com sucesso!");
      navigate("/usuarios");
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao atualizar usuário.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleResetarSenha(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviandoSenha || !id || !novaSenha) return;

    setEnviandoSenha(true);
    try {
      await api.put(`/Usuarios/${id}/senha`, { novaSenha });
      setMensagem("Senha redefinida com sucesso!");
      setNovaSenha("");
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao redefinir senha.");
    } finally {
      setEnviandoSenha(false);
    }
  }

  return (
    <div>
      <h1>Editar Usuário</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <h2>Dados de acesso</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>E-mail</label>
            <input value={email} disabled style={{ opacity: 0.6 }} />
          </div>
          <div>
            <label>Perfil</label>
            <select value={perfilId} onChange={(e) => setPerfilId(Number(e.target.value))}>
              <option value={0}>Sem perfil (definir papel manualmente)</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {perfilId === 0 && (
            <div>
              <label>Papel</label>
              <select value={papel} onChange={(e) => setPapel(e.target.value)}>
                <option value="Admin">Admin</option>
                <option value="Vendedor">Vendedor</option>
              </select>
            </div>
          )}
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <h2 style={{ marginTop: 32 }}>Redefinir senha</h2>
      <form onSubmit={handleResetarSenha} style={{ maxWidth: 480 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mín. 6 caracteres, com maiúscula, número e símbolo"
            />
          </div>
        </div>
        <button type="submit" disabled={enviandoSenha || !novaSenha}>
          {enviandoSenha ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>

      {mensagem && <p style={{ marginTop: 16 }}>{mensagem}</p>}
    </div>
  );
}