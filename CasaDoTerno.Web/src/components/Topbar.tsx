import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

interface TopbarProps {
  onAbrirMenu: () => void;
}

export function Topbar({ onAbrirMenu }: TopbarProps) {
  const navigate = useNavigate();

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("papel");
    localStorage.removeItem("modulosPermitidos");
    navigate("/login");
  }

  return (
    <header className="topbar">
      <button className="menu-hamburguer" onClick={onAbrirMenu}>☰</button>
      <h1>Casa do Terno</h1>
      <button onClick={sair} style={{ marginLeft: "auto", background: "none", color: "var(--texto-suave)" }}>
        <LogOut size={16} /> Sair
      </button>
    </header>
  );
}