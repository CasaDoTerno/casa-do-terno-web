import { useEffect, useState } from "react";
import api from "../Services/API";

interface Locacao {
  id: number;
  produtoId: number;
  clienteId: number;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal: string | null;
  valorTotal: number;
}

export function Devolucoes() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [mensagem, setMensagem] = useState("");

  function carregarLocacoes() {
    api.get<Locacao[]>("/Locacoes").then((resposta) => {
      // mostra só as que ainda não foram devolvidas
      const emAberto = resposta.data.filter((l) => l.dataDevolucaoReal === null);
      setLocacoes(emAberto);
    });
  }

  useEffect(() => {
    carregarLocacoes();
  }, []);

  async function registrarDevolucao(id: number) {
    try {
      await api.put(`/Locacoes/${id}/devolucao`);
      setMensagem(`Locação #${id} devolvida com sucesso!`);
      carregarLocacoes(); // recarrega a lista, já sem essa locação
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao registrar devolução.");
    }
  }

  return (
    <div>
      <h1>Locações em Aberto</h1>
      {locacoes.length === 0 && <p>Nenhuma locação em aberto no momento.</p>}
      <ul>
        {locacoes.map((locacao) => (
          <li key={locacao.id}>
            Locação #{locacao.id} — retirada em {locacao.dataRetirada.split("T")[0]},
            devolução prevista {locacao.dataDevolucaoPrevista.split("T")[0]}
            {" "}
            <button onClick={() => registrarDevolucao(locacao.id)}>Registrar devolução</button>
          </li>
        ))}
      </ul>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}