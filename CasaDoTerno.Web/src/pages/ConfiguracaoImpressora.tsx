import { useState } from "react";

export function ConfiguracaoImpressora() {
  const [ip, setIp] = useState(localStorage.getItem("ipPonteImpressao") ?? "");
  const [mensagem, setMensagem] = useState("");
  const [testando, setTestando] = useState(false);

  function salvar() {
    localStorage.setItem("ipPonteImpressao", ip);
    setMensagem("IP salvo com sucesso!");
  }

  async function testar() {
    if (!ip) {
      setMensagem("Preencha o IP antes de testar.");
      return;
    }
    setTestando(true);
    setMensagem("");
    try {
      const resposta = await fetch(`https://${ip}:5005/status`);
      const dados = await resposta.json();
      setMensagem(`Conexão OK: ${dados.status}`);
    } catch (erro) {
      console.error(erro);
      setMensagem("Não foi possível conectar na Ponte. Confirma se ela está rodando e se o IP está certo.");
    } finally {
      setTestando(false);
    }
  }

  return (
    <div>
      <h1>Configuração da Impressora de Rede</h1>
      <p style={{ color: "var(--texto-suave)" }}>
        Informe o IP do computador do balcão, onde a "Ponte de Impressão" está rodando
        (não é o IP da impressora em si).
      </p>

      <div className="card" style={{ maxWidth: 420 }}>
        <div className="campo">
          <label>IP do computador (Ponte de Impressão)</label>
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="ex: 192.168.0.15"
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button type="button" onClick={salvar}>Salvar</button>
          <button type="button" onClick={testar} disabled={testando}>
            {testando ? "Testando..." : "Testar conexão"}
          </button>
        </div>
      </div>

      {mensagem && <p style={{ marginTop: 12 }}>{mensagem}</p>}
    </div>
  );
}