import logo from "../assets/Logo.png";
interface LogoProps {
  tamanho?: "normal" | "grande";
}

export function Logo({ tamanho = "normal" }: LogoProps) {
  const grande = tamanho === "grande";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: grande ? 16 : 10 }}>
      <img src={logo} alt="Casa do Terno" style={{ height: grande ? 56 : 36 }} />
      {grande && (
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: "white" }}>CASA DO TERNO</div>
          <div style={{ fontSize: 13, color: "var(--texto-suave)" }}>Locação & Venda de Ternos</div>
        </div>
      )}
    </div>
  );
}