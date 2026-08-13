import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface Usuario {
  id: string;
  email: string;
  papel: string;
  perfilNome: string | null;
}

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    api.get<Usuario[]>("/Usuarios").then((r) => setUsuarios(r.data));
  }, []);

  return (
    <div>
      <h1>Usuários do Sistema</h1>
      <div style={{ marginBottom: 16 }}>
        <Link to="/cadastro-usuario">
          <button type="button">+ Novo Usuário</button>
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {usuarios.map((usuario) => (
          <div key={usuario.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{usuario.email}</strong>
                <div style={{ color: "var(--texto-suave)", fontSize: 13 }}>
                  {usuario.papel} {usuario.perfilNome && `· Perfil: ${usuario.perfilNome}`}
                </div>
              </div>
              <Link to={`/usuarios/editar/${usuario.id}`}>Editar</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}