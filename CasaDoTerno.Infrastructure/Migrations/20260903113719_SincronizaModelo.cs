using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDoTerno.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SincronizaModelo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Ajustes",
                table: "Vendas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataRetiradaRealizada",
                table: "Vendas",
                type: "timestamp without time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Ajustes",
                table: "Vendas");

            migrationBuilder.DropColumn(
                name: "DataRetiradaRealizada",
                table: "Vendas");
        }
    }
}
