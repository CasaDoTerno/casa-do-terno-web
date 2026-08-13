import { useEffect, useState } from "react";
import api from "../Services/API";

interface Usuario {
  id: string;
  email: string;
  papel: string;
  perfilId: number | null;
  perfilNome: string | null;
}

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [perfis, setPerfis] = useState<{ id: number; nome: string }[]>([]);

  function carregarUsuarios() {
    api.get<Usuario[]>("/Usuarios").then((r) => setUsuarios(r.data));
  }

  useEffect(() => {
    carregarUsuarios();
    api.get("/Perfis").then((r) => setPerfis(r.data));
  }, []);

  async function alterarPapel(id: string, papel: string) {
    try {
      await api.put(`/Usuarios/${id}/papel`, { papel });
      setMensagem("Papel atualizado com sucesso!");
      carregarUsuarios();
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao atualizar papel.");
    }
  }

  async function vincularPerfil(usuarioId: string, perfilId: number) {
    try {
      await api.put(`/Usuarios/${usuarioId}/perfil-acesso`, { perfilId });
      setMensagem("Perfil vinculado com sucesso!");
      carregarUsuarios();
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao vincular perfil.");
    }
  }

  async function resetarSenha(id: string) {
    const novaSenha = window.prompt("Digite a nova senha pra esse usuário (mín. 6 caracteres, com maiúscula, número e símbolo):");
    if (!novaSenha) return;

    try {
      await api.put(`/Usuarios/${id}/senha`, { novaSenha });
      setMensagem("Senha redefinida com sucesso!");
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao redefinir senha.");
    }
  }

  return (
    <div>
      <h1>Usuários do Sistema</h1>
      {mensagem && <p>{mensagem}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {usuarios.map((usuario) => (
          <div key={usuario.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span>{usuario.email}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

                <select
                  value={usuario.perfilId ?? 0}
                  onChange={(e) => vincularPerfil(usuario.id, Number(e.target.value))}
                  style={{ width: "auto" }}
                >
                  <option value={0}>Sem perfil</option>
                  {perfis.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>

                <select
                  value={usuario.papel}
                  onChange={(e) => alterarPapel(usuario.id, e.target.value)}
                  style={{ width: "auto" }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Vendedor">Vendedor</option>
                </select>
                <button onClick={() => resetarSenha(usuario.id)}>Resetar senha</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}