import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Menu } from "./components/menu";
import { Login } from "./pages/Login";
import { Produtos } from "./pages/Produtos";
import { CadastroProduto } from "./pages/CadastroProdutos";
import { CadastroCliente } from "./pages/CadastroCliente";
import { Locacao } from "./pages/Locacao";
import { Devolucoes } from "./pages/Devolucoes";
import { Venda } from "./pages/Venda";
import { EditarProduto } from "./pages/EditarProduto";
import { Clientes } from "./pages/Clientes";
import { EditarCliente } from "./pages/EditarCliente";
import { Retiradas } from "./pages/Retiradas";
import { CadastroFornecedor } from "./pages/CadastroFornecedor";
import { Compra } from "./pages/Compra";
import { EstoqueBaixo } from "./pages/EstoqueBaixo";

function App() {
  return (
    <BrowserRouter>
      <Menu />
      <hr />
      <div className="conteudo">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/cadastro-produto" element={<CadastroProduto />} />
        <Route path="/cadastro-cliente" element={<CadastroCliente />} />
        <Route path="/locacao" element={<Locacao />} />
        <Route path="/retiradas" element={<Retiradas />} />
        <Route path="/devolucoes" element={<Devolucoes />} />
        <Route path="/" element={<Produtos />} />
        <Route path="/venda" element={<Venda />} />
        <Route path="/produtos/editar/:id" element={<EditarProduto />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/editar/:id" element={<EditarCliente />} />
        <Route path="/cadastro-fornecedor" element={<CadastroFornecedor />} />
        <Route path="/compra" element={<Compra />} />
        <Route path="/estoque-baixo" element={<EstoqueBaixo />} />
      </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

