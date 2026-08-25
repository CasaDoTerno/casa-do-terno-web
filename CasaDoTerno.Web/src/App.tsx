import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";

import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";

import { Produtos } from "./pages/Produtos";
import { CadastroProduto } from "./pages/CadastroProdutos";
import { EditarProduto } from "./pages/EditarProduto";

import { CadastroCliente } from "./pages/CadastroCliente";
import { Clientes } from "./pages/Clientes";
import { EditarCliente } from "./pages/EditarCliente";

import { CadastroFornecedor } from "./pages/CadastroFornecedor";

import { Locacao } from "./pages/Locacao";
import { EditarLocacao } from "./pages/EditarLocacao";
import { Locacoes } from "./pages/Locacoes";
import { Retiradas } from "./pages/Retiradas";
import { Devolucoes } from "./pages/Devolucoes";
import { ImprimirRetiradasSemana } from "./pages/ImprimirRetiradasSemana";
import { ReciboLocacao } from "./pages/ReciboLocacao";

import { Venda } from "./pages/Venda";
import { EditarVenda } from "./pages/EditarVenda";
import { Vendas } from "./pages/Vendas";
import { ReciboVenda } from "./pages/ReciboVenda";

import { Compra } from "./pages/Compra";
import { EditarCompra } from "./pages/EditarCompra";
import { Compras } from "./pages/Compras";

import { EstoqueBaixo } from "./pages/EstoqueBaixo";
import { ImportarProdutos } from "./pages/ImportarProdutos";
import { Disponibilidade } from "./pages/Disponibilidade";
import { ProdutosMaisMovimentados } from "./pages/ProdutosMaisMovimentados";

import { CadastroDespesa } from "./pages/CadastroDespesa";
import { ListaDespesas } from "./pages/ListaDespesas";
import { EditarDespesa } from "./pages/EditarDespesa";
import { Parcelas } from "./pages/Parcelas";
import { FechamentoCaixa } from "./pages/FechamentoCaixa";
import { ComissaoConsultor } from "./pages/ComissaoConsultor";

import { CadastroEvento } from "./pages/CadastroEvento";
import { Eventos } from "./pages/Eventos";
import { EditarEvento } from "./pages/EditarEvento";

import { CadastroUsuario } from "./pages/CadastroUsuario";
import { Usuarios } from "./pages/Usuarios";
import { MinhaConta } from "./pages/MinhaConta";
import { Perfis } from "./pages/Perfis";
import { CadastroPerfil } from "./pages/CadastroPerfil";
import { EditarUsuario } from "./pages/EditarUsuario";
import { ContratoLocacao } from "./pages/ContratoLocacao";

import { CadastroFuncionario } from "./pages/CadastroFuncionario";
import { Funcionarios } from "./pages/Funcionarios";
import { EditarFuncionario } from "./pages/EditarFuncionario";
import { FolhaPagamento } from "./pages/FolhaPagamento";

function App() {
  const [menuAberto, setMenuAberto] = useState(false);
  const autenticado = !!localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            autenticado ? (
              <div className="app-layout">
                <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
                <div
                  className={`overlay-menu ${menuAberto ? "visivel" : ""}`}
                  onClick={() => setMenuAberto(false)}
                />
                <Topbar onAbrirMenu={() => setMenuAberto(true)} />
                <div className="conteudo">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />

                    <Route path="/produtos" element={<Produtos />} />
                    <Route path="/cadastro-produto" element={<CadastroProduto />} />
                    <Route path="/produtos/editar/:id" element={<EditarProduto />} />
                    <Route path="/estoque-baixo" element={<EstoqueBaixo />} />
                    <Route path="/importar-produtos" element={<ImportarProdutos />} />
                    <Route path="/disponibilidade" element={<Disponibilidade />} />
                    <Route path="/produtos-mais-movimentados" element={<ProdutosMaisMovimentados />} />

                    <Route path="/cadastro-cliente" element={<CadastroCliente />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/clientes/editar/:id" element={<EditarCliente />} />

                    <Route path="/cadastro-fornecedor" element={<CadastroFornecedor />} />

                    <Route path="/locacao" element={<Locacao />} />
                    <Route path="/locacoes/editar/:id" element={<EditarLocacao />} />
                    <Route path="/locacoes/listagem" element={<Locacoes />} />
                    <Route path="/retiradas" element={<Retiradas />} />
                    <Route path="/devolucoes" element={<Devolucoes />} />
                    <Route path="/retiradas/imprimir" element={<ImprimirRetiradasSemana />} />
                    <Route path="/locacoes/imprimir/:id" element={<ReciboLocacao />} />

                    <Route path="/venda" element={<Venda />} />
                    <Route path="/vendas/editar/:id" element={<EditarVenda />} />
                    <Route path="/vendas/listagem" element={<Vendas />} />
                    <Route path="/vendas/imprimir/:id" element={<ReciboVenda />} />

                    <Route path="/compra" element={<Compra />} />
                    <Route path="/compras/editar/:id" element={<EditarCompra />} />
                    <Route path="/compras/listagem" element={<Compras />} />

                    <Route path="/despesas" element={<CadastroDespesa />} />
                    <Route path="/despesas/listagem" element={<ListaDespesas />} />
                    <Route path="/despesas/editar/:id" element={<EditarDespesa />} />
                    <Route path="/parcelas" element={<Parcelas />} />
                    <Route path="/caixa" element={<FechamentoCaixa />} />
                    <Route path="/comissao-consultor" element={<ComissaoConsultor />} />

                    <Route path="/cadastro-evento" element={<CadastroEvento />} />
                    <Route path="/eventos" element={<Eventos />} />
                    <Route path="/eventos/editar/:id" element={<EditarEvento />} />

                    <Route path="/cadastro-usuario" element={<CadastroUsuario />} />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/minha-conta" element={<MinhaConta />} />
                    <Route path="/perfis" element={<Perfis />} />
                    <Route path="/perfis/novo" element={<CadastroPerfil />} />
                    <Route path="/perfis/editar/:id" element={<CadastroPerfil />} />
                    <Route path="/usuarios/editar/:id" element={<EditarUsuario />} />
                    
                    <Route path="/locacoes/contrato/:id" element={<ContratoLocacao />} />

                    <Route path="/cadastro-funcionario" element={<CadastroFuncionario />} />
<Route path="/funcionarios" element={<Funcionarios />} />
<Route path="/funcionarios/editar/:id" element={<EditarFuncionario />} />
<Route path="/funcionarios/:id/folha" element={<FolhaPagamento />} />

                  </Routes>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;