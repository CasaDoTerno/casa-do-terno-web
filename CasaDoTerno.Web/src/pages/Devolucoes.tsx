import { useEffect, useState } from "react";
import api from "../Services/API";

interface Locacao {
  id: number;
  dataRetiradaReal: string | null;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal: string | null;
}

export function Devolucoes() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [mensagem, setMensagem] = useState("");

  function carregarLocacoes() {
    api.get<Locacao[]>("/Locacoes").then((resposta) => {
      // só locações já retiradas, e que ainda não foram devolvidas
      const emAberto = resposta.data.filter(
        (l) => l.dataRetiradaReal !== null && l.dataDevolucaoReal === null
      );
      setLocacoes(emAberto);
    });
  }

  useEffect(() => {
    carregarLocacoes();
  }, []);

  async function registrarDevolucao(id: number) {
    const confirmar = window.confirm(
      "Confirmar a DEVOLUÇÃO dessa locação? As peças ficarão disponíveis para outras locações."
    );
    if (!confirmar) return;

    try {
      await api.put(`/Locacoes/${id}/devolucao`);
      setMensagem(`Locação #${id} devolvida com sucesso!`);
      carregarLocacoes();
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao registrar devolução.");
    }
  }

  return (
    <div>
      <h1>Locações em Aberto (já retiradas)</h1>
      {locacoes.length === 0 && <p>Nenhuma locação aguardando devolução no momento.</p>}
      <ul>
        {locacoes.map((locacao) => (
          <li key={locacao.id}>
            Locação #{locacao.id} — devolução prevista em {locacao.dataDevolucaoPrevista.split("T")[0]}
            {" "}
            <button onClick={() => registrarDevolucao(locacao.id)}>Registrar devolução</button>
          </li>
        ))}
      </ul>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}