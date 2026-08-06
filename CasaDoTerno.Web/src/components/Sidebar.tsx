import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import {
  LayoutDashboard, Shirt, ShoppingCart, Package, Users, Truck,
  Wallet, ChevronDown, LogIn,
} from "lucide-react";

function GrupoMenu({ titulo, icone, itens }: { titulo: string; icone: React.ReactNode; itens: { to: string; label: string }[] }) {
  const [aberto, setAberto] = useState(true);

  return (
    <div>
      <div className="sidebar-group-title" onClick={() => setAberto(!aberto)}>
        {icone}
        <span style={{ flex: 1 }}>{titulo}</span>
        <ChevronDown size={16} style={{ transform: aberto ? "rotate(180deg)" : "none" }} />
      </div>
      {aberto && (
        <div className="sidebar-grupo-itens">
          {itens.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "ativo" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div style={{ padding: "0 12px 24px 12px" }}>
        <Logo />
        </div>

      <NavLink to="/" className={({ isActive }) => (isActive ? "ativo" : "")} end>
        <LayoutDashboard size={18} /> Dashboard
      </NavLink>

      <GrupoMenu
        titulo="Estoque"
        icone={<Package size={18} />}
        itens={[
          { to: "/produtos", label: "Produtos" },
          { to: "/cadastro-produto", label: "Cadastrar Produto" },
          { to: "/compra", label: "Compras" },
          { to: "/compras/listagem", label: "Listar Compras" },
          { to: "/estoque-baixo", label: "Estoque Baixo" },
          { to: "/importar-produtos", label: "Importar Produtos" },
        ]}
      />

      <GrupoMenu
        titulo="Locações"
        icone={<Shirt size={18} />}
        itens={[
          { to: "/locacao", label: "Nova Locação" },
          { to: "/retiradas", label: "Retiradas" },
          { to: "/devolucoes", label: "Devoluções" },
        ]}
      />

      <GrupoMenu
        titulo="Vendas"
        icone={<ShoppingCart size={18} />}
        itens={[
          { to: "/venda", label: "Nova Venda" },
          { to: "/vendas/listagem", label: "Listar Vendas" },
        ]}
        
      />

      <GrupoMenu
        titulo="Financeiro"
        icone={<Wallet size={18} />}
        itens={[
            { to: "/despesas", label: "Lançar Despesa" },
            { to: "/despesas/listagem", label: "Despesas do Mês" },
            { to: "/parcelas", label: "Parcelas" },
            { to: "/caixa", label: "Fechamento de Caixa" },
            { to: "/comissao-consultor", label: "Comissão por Consultor" },
        ]}
      />
       <GrupoMenu
        titulo="Cliente"
        icone={<Users size={18} />}
        itens={[
          { to: "/Clientes", label: "Clientes" },
          { to: "/cadastro-cliente", label: "Cadastro de Cliente" }
        ]}
      />
      <NavLink to="/cadastro-fornecedor" className={({ isActive }) => (isActive ? "ativo" : "")}>
        <Truck size={18} /> Fornecedores
      </NavLink>

      <NavLink to="/login" className={({ isActive }) => (isActive ? "ativo" : "")}>
        <LogIn size={18} /> Login
      </NavLink>
    </aside>
  );
}