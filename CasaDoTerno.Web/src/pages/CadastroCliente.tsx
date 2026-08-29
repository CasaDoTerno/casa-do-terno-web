import { useState } from "react";
import api from "../Services/API";

export function CadastroCliente() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [endereco, setEndereco] = useState("");
  const [email, setEmail] = useState("");

  const [ombro, setOmbro] = useState<number | "">("");
  const [manga, setManga] = useState<number | "">("");
  const [abdomen, setAbdomen] = useState<number | "">("");
  const [bainha, setBainha] = useState<number | "">("");
  const [cintura, setCintura] = useState<number | "">("");

  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [panturrilha, setPanturrilha] = useState<number | "">("");
  const [coxa, setCoxa] = useState<number | "">("");

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      await api.post("/Clientes", {
        nome,
        telefone,
        cpf,
        endereco,
        email,
        ombro: ombro === "" ? null : ombro,
        manga: manga === "" ? null : manga,
        abdomen: abdomen === "" ? null : abdomen,
        bainha: bainha === "" ? null : bainha,
        cintura: cintura === "" ? null : cintura,
        panturrilha: panturrilha === "" ? null : panturrilha,
        coxa: coxa === "" ? null : coxa,
      });
      setMensagem("Cliente cadastrado com sucesso!");
      setNome("");
      setTelefone("");
      setCpf("");
      setEndereco("");
      setEmail("");
      setOmbro("");
      setManga("");
      setAbdomen("");
      setBainha("");
      setCintura("");
      setPanturrilha("");
      setCoxa("");
    } catch (erro: any) {
      console.error(erro);
      setMensagem(erro.response?.data || "Erro ao cadastrar cliente. Veja o console (F12).");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Cadastrar Cliente</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>

        <h2>Dados do cliente</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="grid-2">
            <div>
              <label>Telefone</label>
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
            </div>
            <div>
              <label>CPF</label>
              <input value={cpf} onChange={(e) => setCpf(e.target.value)} required />
            </div>
          </div>
          <div>
            <label>Endereço</label>
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>
          <div>
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <h2>Medidas (cm)</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="grid-3">
            <div>
              <label>Ombro</label>
              <input
                type="number"
                value={ombro}
                onChange={(e) => setOmbro(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div>
              <label>Manga</label>
              <input
                type="number"
                value={manga}
                onChange={(e) => setManga(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div>
              <label>Abdômen</label>
              <input
                type="number"
                value={abdomen}
                onChange={(e) => setAbdomen(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div>
              <label>Bainha</label>
              <input
                type="number"
                value={bainha}
                onChange={(e) => setBainha(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div>
              <label>Cintura</label>
              <input
                type="number"
                value={cintura}
                onChange={(e) => setCintura(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="grid-2" style={{ marginTop: 12 }}>
              <div>
                <label>Panturrilha</label>
                <input
                  type="number"
                  value={panturrilha}
                  onChange={(e) => setPanturrilha(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div>
                <label>Coxa</label>
                <input
                  type="number"
                  value={coxa}
                  onChange={(e) => setCoxa(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Cadastrar"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}