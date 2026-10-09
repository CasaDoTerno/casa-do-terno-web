import { useEffect, useState } from "react";
import api from "../Services/API";

// Se na sua tabela de clientes as medidas (ombro, manga, cintura, abdômen, bainha)
// são TEXTO, troque para true. Se são NÚMERO (decimal), deixe false.
const MEDIDAS_SAO_TEXTO = false;

interface ModalNovoClienteProps {
  onFechar: () => void;
  // devolve o id do cliente recém-criado, pra tela de locação já selecionar ele
  onCriado: (clienteId: number) => void;
}

function medidaParaEnvio(valor: string): string | number {
  if (MEDIDAS_SAO_TEXTO) return valor.trim();
  const numero = Number(valor.replace(",", "."));
  return valor.trim() === "" || Number.isNaN(numero) ? 0 : numero;
}

export function ModalNovoCliente({ onFechar, onCriado }: ModalNovoClienteProps) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [ombro, setOmbro] = useState("");
  const [manga, setManga] = useState("");
  const [cintura, setCintura] = useState("");
  const [abdomen, setAbdomen] = useState("");
  const [bainha, setBainha] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function aoApertarTecla(e: KeyboardEvent) {
      if (e.key === "Escape" && !salvando) onFechar();
    }
    window.addEventListener("keydown", aoApertarTecla);
    return () => window.removeEventListener("keydown", aoApertarTecla);
  }, [onFechar, salvando]);

  async function salvar(evento: React.FormEvent) {
    // o modal fica dentro da tela de locação: não deixa o Enter enviar a locação inteira
    evento.preventDefault();
    evento.stopPropagation();
    if (salvando) return;

    if (nome.trim().length < 2) {
      setErro("Informe o nome do cliente.");
      return;
    }
    if (telefone.trim() === "") {
      setErro("Informe o telefone do cliente. Ele vai junto no agendamento da retirada.");
      return;
    }

    setSalvando(true);
    setErro("");
    try {
      const resposta = await api.post("/Clientes", {
        nome: nome.trim(),
        cpf: cpf.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        endereco: endereco.trim(),
        ombro: medidaParaEnvio(ombro),
        manga: medidaParaEnvio(manga),
        cintura: medidaParaEnvio(cintura),
        abdomen: medidaParaEnvio(abdomen),
        bainha: medidaParaEnvio(bainha),
      });

      let novoId: number | undefined = resposta.data?.id;

      // se a API não devolveu o cliente criado, procura ele na lista
      if (!novoId) {
        const lista = await api.get<{ id: number; nome: string; cpf: string }[]>("/Clientes");
        const achado = lista.data
          .filter((c) => c.nome === nome.trim() && (cpf.trim() === "" || c.cpf === cpf.trim()))
          .sort((a, b) => b.id - a.id)[0];
        novoId = achado?.id;
      }

      if (!novoId) {
        setErro("Cliente salvo, mas não consegui selecionar ele sozinho. Escolha na lista.");
        return;
      }

      onCriado(novoId);
    } catch (e: any) {
      console.error(e);
      const dados = e.response?.data;
      setErro(typeof dados === "string" && dados ? dados : "Não foi possível salvar o cliente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cliente-titulo"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: 16,
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <form
        className="card"
        onSubmit={salvar}
        style={{ maxWidth: 640, width: "100%", margin: "24px 0", boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)" }}
      >
        <h2 id="modal-cliente-titulo" style={{ marginTop: 0 }}>
          Novo cliente
        </h2>

        <div>
          <label>Nome *</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>

        <div className="grid-2">
          <div>
            <label>CPF</label>
            <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div>
            <label>Telefone *</label>
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(32) 99999-0000" />
          </div>
        </div>

        <div>
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vai junto no agendamento da retirada"
          />
        </div>

        <div>
          <label>Endereço</label>
          <input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </div>

        <h3 style={{ marginBottom: 4 }}>Medidas (opcional)</h3>
        <div className="grid-3">
          <div>
            <label>Ombro</label>
            <input value={ombro} onChange={(e) => setOmbro(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label>Manga</label>
            <input value={manga} onChange={(e) => setManga(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label>Cintura</label>
            <input value={cintura} onChange={(e) => setCintura(e.target.value)} inputMode="decimal" />
          </div>
        </div>
        <div className="grid-2">
          <div>
            <label>Abdômen</label>
            <input value={abdomen} onChange={(e) => setAbdomen(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label>Bainha</label>
            <input value={bainha} onChange={(e) => setBainha(e.target.value)} inputMode="decimal" />
          </div>
        </div>

        {erro && <p style={{ color: "#f87171", margin: "12px 0 0 0" }}>{erro}</p>}

        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar e selecionar"}
          </button>
          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            style={{ background: "var(--chumbo-input)" }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}