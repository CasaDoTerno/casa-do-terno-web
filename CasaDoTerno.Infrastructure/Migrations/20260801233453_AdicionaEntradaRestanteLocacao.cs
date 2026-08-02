using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDoTerno.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaEntradaRestanteLocacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FormaPagamento",
                table: "Locacoes",
                newName: "FormaPagamentoEntrada");

            migrationBuilder.AddColumn<DateTime>(
                name: "DataPagamentoEntrada",
                table: "Locacoes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataPagamentoRestante",
                table: "Locacoes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataReserva",
                table: "Locacoes",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "Desconto",
                table: "Locacoes",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "FormaPagamentoRestante",
                table: "Locacoes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorEntrada",
                table: "Locacoes",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataPagamentoEntrada",
                table: "Locacoes");

            migrationBuilder.DropColumn(
                name: "DataPagamentoRestante",
                table: "Locacoes");

            migrationBuilder.DropColumn(
                name: "DataReserva",
                table: "Locacoes");

            migrationBuilder.DropColumn(
                name: "Desconto",
                table: "Locacoes");

            migrationBuilder.DropColumn(
                name: "FormaPagamentoRestante",
                table: "Locacoes");

            migrationBuilder.DropColumn(
                name: "ValorEntrada",
                table: "Locacoes");

            migrationBuilder.RenameColumn(
                name: "FormaPagamentoEntrada",
                table: "Locacoes",
                newName: "FormaPagamento");
        }
    }
}
