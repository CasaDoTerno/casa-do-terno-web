import { ehAdmin, temModulo } from "../Services/permissoes";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import {
  LayoutDashboard, Shirt, ShoppingCart, Package, Users, Truck,
  Wallet, ChevronDown, LogIn,
} from "lucide-react";

interface GrupoMenuProps {
  titulo: string;
  icone: React.ReactNode;
  itens: { to: string; label: string }[];
  onFechar: () => void;
}

function GrupoMenu({ titulo, icone, itens, onFechar }: GrupoMenuProps) {
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
              onClick={onFechar}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  aberta: boolean;
  onFechar: () => void;
}

export function Sidebar({ aberta, onFechar }: SidebarProps) {
  const admin = ehAdmin();
  //const podeEstoque = temModulo("estoque") || admin;
  //const podeLocacoes = temModulo("locacoes") || admin;
  //const podeVendas = temModulo("vendas") || admin;
  //const podeClientes = temModulo("clientes") || admin;
  //const podeFornecedores = temModulo("fornecedores") || admin;
  //const podeFinanceiro = temModulo("financeiro") || admin;
  //const podeUsuarios = temModulo("usuarios") || admin;

  return (
    <aside className={`sidebar ${aberta ? "aberta" : ""}`}>
      <div style={{ padding: "0 12px 24px 12px" }}>
        <Logo />
      </div>

      <NavLink to="/" className={({ isActive }) => (isActive ? "ativo" : "")} onClick={onFechar} end>
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
            { to: "/produtos-mais-movimentados", label: "Mais Alugados/Vendidos" },
            { to: "/disponibilidade", label: "Disponibilidade" },
          ]}
          onFechar={onFechar}
        />
     

      
        <GrupoMenu
          titulo="Locações"
          icone={<Shirt size={18} />}
          itens={[
            { to: "/locacao", label: "Nova Locação" },          
            { to: "/retiradas", label: "Retiradas" },
            { to: "/devolucoes", label: "Devoluções" },
            { to: "/cadastro-evento", label: "Cadastrar Evento" },
            { to: "/eventos", label: "Listar Eventos" },
            { to: "/retiradas/imprimir", label: "Imprimir Retiradas da Semana" },
            { to: "/locacoes/listagem", label: "Listar Locações" },
            
          ]}
          onFechar={onFechar}
        />
      

      
        <GrupoMenu
          titulo="Vendas"
          icone={<ShoppingCart size={18} />}
          itens={[
            { to: "/venda", label: "Nova Venda" },
            { to: "/vendas/listagem", label: "Listar Vendas" },
          ]}
          onFechar={onFechar}
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
          onFechar={onFechar}
        />
      

      
        <GrupoMenu
          titulo="Cliente"
          icone={<Users size={18} />}
          itens={[
            { to: "/clientes", label: "Clientes" },
            { to: "/cadastro-cliente", label: "Cadastro de Cliente" },
          ]}
          onFechar={onFechar}
        />
     
      {podeFornecedores && (
        <NavLink to="/cadastro-fornecedor" className={({ isActive }) => (isActive ? "ativo" : "")} onClick={onFechar}>
          <Truck size={18} /> Fornecedores
        </NavLink>
      )}

      {podeUsuarios && (
        <NavLink to="/perfis" className={({ isActive }) => (isActive ? "ativo" : "")} onClick={onFechar}>
          <Users size={18} /> Perfis de Acesso
        </NavLink>

      )}
      {podeUsuarios && (
        <NavLink to="/usuarios" className={({ isActive }) => (isActive ? "ativo" : "")} onClick={onFechar}>
          <Users size={18} /> Usuários
        </NavLink>
      )}

      <NavLink to="/login" className={({ isActive }) => (isActive ? "ativo" : "")} onClick={onFechar}>
        <LogIn size={18} /> Login
      </NavLink>

      <NavLink to="/minha-conta" className={({ isActive }) => (isActive ? "ativo" : "")} onClick={onFechar}>
        <Users size={18} /> Minha Conta
      </NavLink>
    </aside>
  );
}