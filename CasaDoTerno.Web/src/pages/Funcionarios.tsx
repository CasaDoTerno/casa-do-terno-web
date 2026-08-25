import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface Funcionario {
  id: number;
  nome: string;
  cargo: string | null;
  salarioBase: number;
  ativo: boolean;
}

export function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  function carregar() {
    api.get<Funcionario[]>("/Funcionarios").then((r) => setFuncionarios(r.data));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function alternarAtivo(funcionario: Funcionario) {
    const acao = funcionario.ativo ? "desativar" : "reativar";
    await api.put(`/Funcionarios/${funcionario.id}/${acao}`);
    carregar();
  }

  return (
    <div>
      <h1>Funcionários</h1>
      <div style={{ marginBottom: 16 }}>
        <Link to="/cadastro-funcionario">
          <button type="button">+ Novo Funcionário</button>
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {funcionarios.map((f) => (
          <div key={f.id} className="card" style={{ opacity: f.ativo ? 1 : 0.6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{f.nome}</strong>
                {!f.ativo && <span style={{ color: "#f87171", fontSize: 12, marginLeft: 8 }}>(inativo)</span>}
                <div style={{ color: "var(--texto-suave)", fontSize: 13 }}>
                  {f.cargo} · Salário: R$ {f.salarioBase.toFixed(2)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link to={`/funcionarios/${f.id}/folha`}>
                  <button type="button">Folha de Pagamento</button>
                </Link>
                <Link to={`/funcionarios/editar/${f.id}`}>Editar</Link>
                <button type="button" onClick={() => alternarAtivo(f)}>
                  {f.ativo ? "Desativar" : "Reativar"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
