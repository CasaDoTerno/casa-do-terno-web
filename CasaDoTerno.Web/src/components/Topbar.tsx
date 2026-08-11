interface TopbarProps {
  onAbrirMenu: () => void;
}

export function Topbar({ onAbrirMenu }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="menu-hamburguer" onClick={onAbrirMenu}>☰</button>
      <h1>Casa do Terno</h1>
    </header>
  );
}