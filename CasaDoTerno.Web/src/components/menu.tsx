import { Link } from "react-router-dom";

export function Menu() {
  return (
    <nav>
      <Link to="/login">Login</Link> {" | "}
      <Link to="/produtos">Produtos</Link> {" | "}
      <Link to="/cadastro-produto">Cadastrar Produto</Link> {" | "}
      <Link to="/cadastro-cliente">Cadastrar Cliente</Link> {" | "}
      <Link to="/locacao">Nova Locação</Link> {" | "}
      <Link to="/retiradas">Retiradas</Link> {" | "}
      <Link to="/devolucoes">Devoluções</Link> {" | "}
      <Link to="/venda">Nova Venda</Link> {" | "}
      <Link to="/clientes">Clientes</Link> {" | "}
      <Link to="/cadastro-fornecedor">Fornecedores</Link> {" | "}
      <Link to="/compra">Nova Compra</Link> {" | "}
      <Link to="/estoque-baixo">Estoque Baixo</Link>
    </nav>
  );
}