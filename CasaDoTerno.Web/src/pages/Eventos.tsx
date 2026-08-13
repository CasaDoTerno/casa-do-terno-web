import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/API";

interface Evento {
  id: number;
  tipo: number;
  nome: string;
  data: string;
  observacao: string | null;
}

const nomesTipo = ["Casamento", "Formatura", "Aniversário"];

export function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    api.get<Evento[]>("/Eventos").then((r) =>
      setEventos(r.data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()))
    );
  }, []);

  return (
    <div>
      <h1>Eventos</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {eventos.map((evento) => (
          <div key={evento.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{evento.nome}</strong>
                <div style={{ color: "var(--texto-suave)", fontSize: 13 }}>
                  {nomesTipo[evento.tipo]} — {evento.data.split("T")[0]}
                </div>
              </div>
              <Link to={`/eventos/editar/${evento.id}`}>Editar</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}