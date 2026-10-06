import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../Services/API";
import { Logo } from "../components/Logo";

interface Folha {
  funcionarioId: number;
  nomeFuncionario: string;
  salarioBase: number;
  diasTrabalhados: number;
  salarioProporcional: number;
  quantidadeFaltas: number;
  quantidadeFaltasAbonadas: number;
  valorPorDia: number;
  valorDescontado: number;
  totalVales: number;
  totalComissoes: number;
  totalInss: number;
  salarioLiquido: number;
}

const nomesMeses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function DemonstrativoPagamento() {
  const { id } = useParams();
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [folha, setFolha] = useState<Folha | null>(null);

  useEffect(() => {
    api.get<Folha>(`/Funcionarios/${id}/folha-pagamento?mes=${mes}&ano=${ano}`).then((r) => setFolha(r.data));
  }, [id, mes, ano]);

  if (!folha) return <p>Carregando...</p>;

  const totalProventos = folha.salarioProporcional + folha.totalComissoes;
  const totalDescontos = folha.valorDescontado + folha.totalVales + folha.totalInss;

  return (
    <div className="conteudo" style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="no-imprimir" style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-end" }}>
        <div className="campo">
          <label>Mês</label>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {nomesMeses.map((nome, index) => (
              <option key={index} value={index + 1}>{nome}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label>Ano</label>
          <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} style={{ width: 100 }} />
        </div>
        <button onClick={() => window.print()}>Imprimir</button>
      </div>

      <div className="recibo-card card">
        <Logo tamanho="grande" />

        <div className="recibo-titulo">Demonstrativo de Pagamento</div>
        <div className="recibo-subtitulo">
          {nomesMeses[mes - 1]} de {ano} — {folha.nomeFuncionario}
        </div>

        <div className="recibo-linha">
          <span>Valor por dia</span>
          <span>R$ {folha.valorPorDia.toFixed(2)}</span>
        </div>

        <div style={{ fontWeight: 800, marginTop: 16 }}>PROVENTOS</div>
        <div className="recibo-linha">
          <span>
            {folha.diasTrabalhados < 30
              ? `Salário proporcional (${folha.diasTrabalhados}/30 dias)`
              : "Salário base"}
          </span>
          <span>R$ {folha.salarioProporcional.toFixed(2)}</span>
        </div>
        {folha.totalComissoes > 0 && (
          <div className="recibo-linha">
            <span>Comissões</span>
            <span>R$ {folha.totalComissoes.toFixed(2)}</span>
          </div>
        )}
        <div className="recibo-linha" style={{ fontWeight: 700 }}>
          <span>Total de proventos</span>
          <span>R$ {totalProventos.toFixed(2)}</span>
        </div>

        <div style={{ fontWeight: 800, marginTop: 16 }}>DESCONTOS</div>
        <div className="recibo-linha" style={{ color: "#b91c1c" }}>
          <span>Faltas não abonadas ({folha.quantidadeFaltas})</span>
          <span>- R$ {folha.valorDescontado.toFixed(2)}</span>
        </div>
        {folha.quantidadeFaltasAbonadas > 0 && (
          <div className="recibo-linha">
            <span>Faltas abonadas (sem desconto)</span>
            <span>{folha.quantidadeFaltasAbonadas}</span>
          </div>
        )}
        {folha.totalVales > 0 && (
          <div className="recibo-linha" style={{ color: "#b91c1c" }}>
            <span>Vales</span>
            <span>- R$ {folha.totalVales.toFixed(2)}</span>
          </div>
        )}
        {folha.totalInss > 0 && (
          <div className="recibo-linha" style={{ color: "#b91c1c" }}>
            <span>INSS</span>
            <span>- R$ {folha.totalInss.toFixed(2)}</span>
          </div>
        )}
        <div className="recibo-linha" style={{ fontWeight: 700 }}>
          <span>Total de descontos</span>
          <span>- R$ {totalDescontos.toFixed(2)}</span>
        </div>

        <div className="recibo-linha" style={{ fontWeight: 800, fontSize: 18, border: "none", marginTop: 12 }}>
          <span>Salário líquido</span>
          <span>R$ {folha.salarioLiquido.toFixed(2)}</span>
        </div>

        <div style={{ marginTop: 60, textAlign: "center" }}>
          <div className="assinatura-linha" style={{ paddingTop: 6, borderTop: "1px solid #000" }}>
            Assinatura do(a) Funcionário(a)
          </div>
        </div>
      </div>
    </div>
  );
}