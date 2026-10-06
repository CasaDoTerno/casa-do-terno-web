import { useState } from "react";
import api from "../Services/API";

export function CadastroDespesa() {
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState(0);
  const [observacao, setObservacao] = useState("");
  const [formaPagamento, setFormaPagamento] = useState(0);
  const [numeroParcelas, setNumeroParcelas] = useState(1);

  const [aPagar, setAPagar] = useState(false);
  const [dataVencimento, setDataVencimento] = useState("");

  const [recorrente, setRecorrente] = useState(false);
  const [diaVencimento, setDiaVencimento] = useState(10);

  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();

    if (enviando) return;

    if (!recorrente && aPagar && !dataVencimento) {
      setMensagem("Informe a data de vencimento.");
      return;
    }

    setEnviando(true);
    try {
      if (recorrente) {
        await api.post("/DespesasRecorrentes", {
          descricao,
          valor,
          diaVencimento,
        });
        setMensagem("Despesa recorrente cadastrada! A primeira cobrança já foi gerada, como pendente.");
      } else {
        await api.post("/Despesas", {
          descricao,
          categoria,
          valor,
          observacao,
          formaPagamento,
          numeroParcelas,
          aguardandoPagamento: aPagar,
          dataVencimento: aPagar ? dataVencimento : null,
        });
        setMensagem(
          aPagar
            ? "Despesa lançada como A PAGAR. Quando pagar, registre em Despesas do Mês."
            : "Despesa lançada com sucesso!"
        );
      }

      setDescricao("");
      setCategoria("");
      setValor(0);
      setObservacao("");
      setNumeroParcelas(1);
      setAPagar(false);
      setDataVencimento("");
      setRecorrente(false);
      setDiaVencimento(10);
    } catch (erro: any) {
      console.error(erro);
      const detalhe = erro.response?.data;
      setMensagem(typeof detalhe === "string" ? detalhe : "Erro ao lançar despesa.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Lançar Despesa</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Descrição: </label>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="ex: Material de limpeza"
            required
          />
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, margin: 0 }}>
            <input
              type="checkbox"
              checked={recorrente}
              onChange={(e) => setRecorrente(e.target.checked)}
              style={{ width: "auto" }}
            />
            Essa despesa é recorrente (se repete todo mês, tipo DAS, aluguel)
          </label>

          {recorrente && (
            <div style={{ marginTop: 12, maxWidth: 200 }}>
              <label>Dia do vencimento (todo mês)</label>
              <input
                type="number"
                min={1}
                max={31}
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(Number(e.target.value))}
              />
              <p style={{ fontSize: 12, color: "var(--texto-suave)", marginTop: 8 }}>
                Cada cobrança nasce como boleto a pagar. Você registra o pagamento em Despesas do Mês.
              </p>
            </div>
          )}
        </div>

        {!recorrente && (
          <>
            <div className="card" style={{ marginBottom: 12 }}>
              <strong>Situação do pagamento</strong>
              <div style={{ display: "flex", flexDirection: "row", gap: 24, marginTop: 8, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, margin: 0 }}>
                  <input
                    type="radio"
                    name="situacao"
                    checked={!aPagar}
                    onChange={() => setAPagar(false)}
                    style={{ width: "auto" }}
                  />
                  Já paguei
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, margin: 0 }}>
                  <input
                    type="radio"
                    name="situacao"
                    checked={aPagar}
                    onChange={() => setAPagar(true)}
                    style={{ width: "auto" }}
                  />
                  Ainda vou pagar (boleto, conta a vencer)
                </label>
              </div>

              {aPagar && (
                <div style={{ marginTop: 12, maxWidth: 220 }}>
                  <label>Vencimento (1ª parcela)</label>
                  <input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label>Categoria: </label>
              <input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="ex: Limpeza, Aluguel, Manutenção"
              />
            </div>
            <div>
              <label>Valor: </label>
              <input type="number" value={valor} onChange={(e) => setValor(Number(e.target.value))} required />
            </div>
            <div>
              <label>{aPagar ? "Forma de pagamento prevista: " : "Forma de pagamento: "}</label>
              <select value={formaPagamento} onChange={(e) => setFormaPagamento(Number(e.target.value))}>
                <option value={0}>Dinheiro</option>
                <option value={1}>Cartão</option>
                <option value={2}>Pix</option>
                <option value={3}>Boleto</option>
              </select>
            </div>
            <div>
              <label>Número de parcelas: </label>
              <input
                type="number"
                min={1}
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(Number(e.target.value))}
              />
              {aPagar && numeroParcelas > 1 && (
                <p style={{ fontSize: 12, color: "var(--texto-suave)", marginTop: 4 }}>
                  Os vencimentos seguintes caem no mesmo dia, nos meses seguintes.
                </p>
              )}
            </div>
            <div>
              <label>Observação: </label>
              <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>
          </>
        )}

        {recorrente && (
          <div>
            <label>Valor (mensal): </label>
            <input type="number" value={valor} onChange={(e) => setValor(Number(e.target.value))} required />
          </div>
        )}

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : recorrente ? "Cadastrar recorrente" : "Lançar despesa"}
        </button>
      </form>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}