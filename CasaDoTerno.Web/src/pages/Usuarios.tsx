import { useEffect, useState } from "react";
import api from "../Services/API";

interface Usuario {
  id: string;
  email: string;
  papel: string;
}

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mensagem, setMensagem] = useState("");

  function carregarUsuarios() {
    api.get<Usuario[]>("/Usuarios").then((r) => setUsuarios(r.data));
  }

  useEffect(() => {
    carregarUsuarios();
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

  return (
    <div>
      <h1>Usuários do Sistema</h1>
      {mensagem && <p>{mensagem}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {usuarios.map((usuario) => (
          <div key={usuario.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{usuario.email}</span>
              <select
                value={usuario.papel}
                onChange={(e) => alterarPapel(usuario.id, e.target.value)}
                style={{ width: "auto" }}
              >
                <option value="Admin">Admin</option>
                <option value="Vendedor">Vendedor</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}