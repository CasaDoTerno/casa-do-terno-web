import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Services/API";

interface ClienteComDebito {
  clienteId: number;
  nome: string;
  totalDebito: number;
}

interface ItemDebito {
  tipo: string;
  id: number;
  valor: number;
  data: string;
}

export function DebitosClientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<ClienteComDebito[]>([]);
  const [clienteAberto, setClienteAberto] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<{ itens: ItemDebito[]; total: number } | null>(null);

  function carregar() {
    api.get<ClienteComDebito[]>("/Clientes/com-debito").then((r) => setClientes(r.data));
  }

  useEffect(() => {
    carregar();
  }, []);

  function verDetalhes(clienteId: number) {
    if (clienteAberto === clienteId) {
      setClienteAberto(null);
      setDetalhes(null);
      return;
    }
    api.get(`/Clientes/${clienteId}/debitos`).then((r) => {
      setDetalhes(r.data);
      setClienteAberto(clienteId);
    });
  }

  return (
    <div>
      <h1>Débitos por Cliente</h1>
      <p style={{ color: "var(--texto-suave)" }}>
        Clientes com pagamento pendente (venda) ou restante em aberto (locação).
      </p>

      {clientes.length === 0 && (
        <p style={{ color: "var(--texto-suave)" }}>Nenhum cliente com débito no momento.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {clientes.map((cliente) => (
          <div key={cliente.clienteId} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{cliente.nome}</strong>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#f87171", fontWeight: 700, fontSize: 18 }}>
                  R$ {cliente.totalDebito.toFixed(2)}
                </span>
                <button type="button" onClick={() => verDetalhes(cliente.clienteId)}>
                  {clienteAberto === cliente.clienteId ? "Fechar" : "Ver detalhes"}
                </button>
              </div>
            </div>

            {clienteAberto === cliente.clienteId && detalhes && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--borda)" }}>
                {detalhes.itens.map((item, index) => (
                  <div
                    key={index}
                    style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}
                  >
                    <span>
                      {item.tipo} #{item.id} — {new Date(item.data).toLocaleDateString("pt-BR")}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong>R$ {item.valor.toFixed(2)}</strong>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(item.tipo === "Venda" ? "/vendas/pendentes" : "/retiradas")
                        }
                        style={{ fontSize: 12 }}
                      >
                        Ir resolver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}