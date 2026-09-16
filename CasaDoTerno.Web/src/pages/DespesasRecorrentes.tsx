import { useEffect, useState } from "react";
import api from "../Services/API";

interface DespesaRecorrente {
  id: number;
  descricao: string;
  valor: number;
  diaVencimento: number;
  ativa: boolean;
}

export function DespesasRecorrentes() {
  const [lista, setLista] = useState<DespesaRecorrente[]>([]);

  function carregar() {
    api.get<DespesaRecorrente[]>("/DespesasRecorrentes").then((r) => setLista(r.data));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function desativar(id: number) {
    const confirmar = window.confirm("Desativar essa despesa recorrente? Ela para de gerar novas cobranças.");
    if (!confirmar) return;
    await api.put(`/DespesasRecorrentes/${id}/desativar`);
    carregar();
  }

  return (
    <div>
      <h1>Despesas Recorrentes</h1>
      <p style={{ color: "var(--texto-suave)" }}>
        Essas despesas geram uma cobrança nova automaticamente, todo mês, no dia configurado.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map((item) => (
          <div key={item.id} className="card" style={{ opacity: item.ativa ? 1 : 0.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{item.descricao}</strong>
                {!item.ativa && <span style={{ color: "#f87171", fontSize: 12, marginLeft: 8 }}>(inativa)</span>}
                <div style={{ color: "var(--texto-suave)", fontSize: 13 }}>
                  R$ {item.valor.toFixed(2)} — todo dia {item.diaVencimento}
                </div>
              </div>
              {item.ativa && (
                <button type="button" onClick={() => desativar(item.id)}>Desativar</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}