import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar"
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
import { Retiradas } from "./pages/Retiradas";
import { Devolucoes } from "./pages/Devolucoes";
import { Venda } from "./pages/Venda";
import { Compra } from "./pages/Compra";
import { EstoqueBaixo } from "./pages/EstoqueBaixo";
import { CadastroDespesa } from "./pages/CadastroDespesa";
import { Parcelas } from "./pages/Parcelas";
import { FechamentoCaixa } from "./pages/FechamentoCaixa";
import { ImportarProdutos } from "./pages/ImportarProdutos";
import { ListaDespesas } from "./pages/ListaDespesas";
import { EditarDespesa } from "./pages/EditarDespesa";
import { EditarVenda } from "./pages/EditarVenda";
import { EditarLocacao } from "./pages/EditarLocacao";
import { Vendas } from "./pages/Vendas";
import { ComissaoConsultor } from "./pages/ComissaoConsultor";

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <Topbar />
        <div className="conteudo">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/cadastro-produto" element={<CadastroProduto />} />
            <Route path="/produtos/editar/:id" element={<EditarProduto />} />
            <Route path="/cadastro-cliente" element={<CadastroCliente />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/editar/:id" element={<EditarCliente />} />
            <Route path="/cadastro-fornecedor" element={<CadastroFornecedor />} />
            <Route path="/locacao" element={<Locacao />} />
            <Route path="/retiradas" element={<Retiradas />} />
            <Route path="/devolucoes" element={<Devolucoes />} />
            <Route path="/venda" element={<Venda />} />
            <Route path="/compra" element={<Compra />} />
            <Route path="/estoque-baixo" element={<EstoqueBaixo />} />
            <Route path="/despesas" element={<CadastroDespesa />} />
            <Route path="/parcelas" element={<Parcelas />} />
            <Route path="/caixa" element={<FechamentoCaixa />} />
            <Route path="/importar-produtos" element={<ImportarProdutos />} />
            <Route path="/despesas/listagem" element={<ListaDespesas />} />
            <Route path="/despesas/editar/:id" element={<EditarDespesa />} />
            <Route path="/vendas/editar/:id" element={<EditarVenda />} />
            <Route path="/locacoes/editar/:id" element={<EditarLocacao />} />
            <Route path="/vendas/listagem" element={<Vendas />} />
            <Route path="/comissao-consultor" element={<ComissaoConsultor />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;