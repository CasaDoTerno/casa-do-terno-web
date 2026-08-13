import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Services/API";

const MODULOS_DISPONIVEIS = [
  { chave: "estoque", label: "Estoque (Produtos, Compras, Importação)" },
  { chave: "locacoes", label: "Locações (Nova, Retiradas, Devoluções, Eventos)" },
  { chave: "vendas", label: "Vendas" },
  { chave: "clientes", label: "Clientes" },
  { chave: "fornecedores", label: "Fornecedores" },
  { chave: "financeiro", label: "Financeiro (Despesas, Parcelas, Caixa, Comissão)" },
  { chave: "relatorios", label: "Relatórios (Mais Movimentados)" },
  { chave: "usuarios", label: "Usuários e Perfis" },
];

export function CadastroPerfil() {
  const { id } = useParams(); // se tiver id, é edição; se não, é criação
  const navigate = useNavigate();
  const editando = !!id;

  const [nome, setNome] = useState("");
  const [modulosSelecionados, setModulosSelecionados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!editando) return;
    api.get(`/Perfis/${id}`).then((resposta) => {
      setNome(resposta.data.nome);
      const lista = (resposta.data.modulosPermitidos as string)
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m.length > 0);
      setModulosSelecionados(lista);
    });
  }, [id, editando]);

  function alternarModulo(chave: string) {
    setModulosSelecionados((atual) =>
      atual.includes(chave) ? atual.filter((m) => m !== chave) : [...atual, chave]
    );
  }

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      const dados = { nome, modulosPermitidos: modulosSelecionados.join(",") };

      if (editando) {
        await api.put(`/Perfis/${id}`, dados);
        setMensagem("Perfil atualizado com sucesso!");
      } else {
        await api.post("/Perfis", dados);
        setMensagem("Perfil criado com sucesso!");
      }
      navigate("/perfis");
    } catch (erro) {
      console.error(erro);
      setMensagem("Erro ao salvar perfil.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>{editando ? "Editar Perfil" : "Novo Perfil"}</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div>
            <label>Nome do perfil</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex: Vendedor, Financeiro" required />
          </div>

          <label style={{ display: "block", marginTop: 16, marginBottom: 8 }}>Módulos com acesso</label>
          {MODULOS_DISPONIVEIS.map((modulo) => (
            <label key={modulo.chave} style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0", fontWeight: 400 }}>
              <input
                type="checkbox"
                checked={modulosSelecionados.includes(modulo.chave)}
                onChange={() => alternarModulo(modulo.chave)}
                style={{ width: "auto" }}
              />
              {modulo.label}
            </label>
          ))}

          <p style={{ color: "var(--texto-suave)", fontSize: 12, marginTop: 12 }}>
            Marcar "Financeiro", "Fornecedores", "Relatórios" ou "Usuários" faz o(s) usuário(s) desse
            perfil virarem Admin automaticamente no sistema (necessário pra essas telas funcionarem).
          </p>
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar perfil"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}