using System;
using System.Collections.Generic;
using System.Text;

namespace CasaDoTerno.Domain.Entities
{
    public class Funcionario
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public string Cpf { get; set; }
        public string Telefone { get; set; }
        public string Usuario { get; set; }
        public string Senha {  get; set; }
    }
}
