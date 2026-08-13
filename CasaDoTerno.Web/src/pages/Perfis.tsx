import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface Perfil {
  id: number;
  nome: string;
  modulosPermitidos: string;
}

export function Perfis() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);

  useEffect(() => {
    api.get<Perfil[]>("/Perfis").then((r) => setPerfis(r.data));
  }, []);

  return (
    <div>
      <h1>Perfis de Acesso</h1>
      <div style={{ marginBottom: 16 }}>
        <Link to="/perfis/novo">
          <button type="button">+ Novo Perfil</button>
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {perfis.map((perfil) => (
          <div key={perfil.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{perfil.nome}</strong>
                <div style={{ color: "var(--texto-suave)", fontSize: 13 }}>
                  {perfil.modulosPermitidos || "Nenhum módulo"}
                </div>
              </div>
              <Link to={`/perfis/editar/${perfil.id}`}>Editar</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}