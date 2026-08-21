using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDoTerno.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaMultaAtrasoLocacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataPagamentoMulta",
                table: "Locacoes",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FormaPagamentoMulta",
                table: "Locacoes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MultaAtraso",
                table: "Locacoes",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataPagamentoMulta",
                table: "Locacoes");

            migrationBuilder.DropColumn(
                name: "FormaPagamentoMulta",
                table: "Locacoes");

            migrationBuilder.DropColumn(
                name: "MultaAtraso",
                table: "Locacoes");
        }
    }
}
