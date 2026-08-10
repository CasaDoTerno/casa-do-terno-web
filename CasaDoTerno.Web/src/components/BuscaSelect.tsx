import { useState, useRef, useEffect } from "react";

interface Opcao {
  id: number;
  label: string;
}

interface BuscaSelectProps {
  opcoes: Opcao[];
  valorSelecionado: number;
  onSelecionar: (id: number) => void;
  placeholder?: string;
  onAbrir?: () => void;
}

export function BuscaSelect({ opcoes, valorSelecionado, onSelecionar, placeholder, onAbrir }: BuscaSelectProps) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const opcaoSelecionada = opcoes.find((o) => o.id === valorSelecionado);

  // fecha a listinha quando o usuário clica em qualquer lugar fora do componente
  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

 const filtradas =
  texto.length === 0
    ? opcoes.slice(0, 8)
    : opcoes
        .filter((o) => {
          const textoOpcao = o.label.toLowerCase();
          const palavras = texto.toLowerCase().split(" ").filter((p) => p.length > 0);
          return palavras.every((palavra) => textoOpcao.includes(palavra));
        })
        .slice(0, 8);
  return (
    <div className="busca-select" ref={containerRef}>
      <input
        type="text"
        placeholder={placeholder ?? "Digite para buscar..."}
        value={aberto ? texto : opcaoSelecionada?.label ?? ""}
        onChange={(e) => {
          setTexto(e.target.value);
          setAberto(true);
        }}
        onFocus={() => {
          setTexto("");
          setAberto(true);
          onAbrir?.();
        }}
      />
      {aberto && (
        <div className="busca-select-lista">
          {filtradas.length === 0 && (
            <div className="busca-select-item busca-select-vazio">Nenhum resultado</div>
          )}
          {filtradas.map((opcao) => (
            <div
              key={opcao.id}
              className="busca-select-item"
              onClick={() => {
                onSelecionar(opcao.id);
                setTexto("");
                setAberto(false);
              }}
            >
              {opcao.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}