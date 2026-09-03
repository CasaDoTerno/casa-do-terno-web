using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDoTerno.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaAjusteEPagamentoPendenteVenda : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataPagamentoRealizado",
                table: "Vendas",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataRetiradaAjuste",
                table: "Vendas",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NumeroParcelasPendente",
                table: "Vendas",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "PagamentoPendente",
                table: "Vendas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PrecisaAjuste",
                table: "Vendas",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataPagamentoRealizado",
                table: "Vendas");

            migrationBuilder.DropColumn(
                name: "DataRetiradaAjuste",
                table: "Vendas");

            migrationBuilder.DropColumn(
                name: "NumeroParcelasPendente",
                table: "Vendas");

            migrationBuilder.DropColumn(
                name: "PagamentoPendente",
                table: "Vendas");

            migrationBuilder.DropColumn(
                name: "PrecisaAjuste",
                table: "Vendas");
        }
    }
}
