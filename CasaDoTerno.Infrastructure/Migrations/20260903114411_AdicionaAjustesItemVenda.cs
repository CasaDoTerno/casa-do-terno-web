using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDoTerno.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaAjustesItemVenda : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Ajustes",
                table: "Vendas");

            migrationBuilder.AddColumn<string>(
                name: "Ajustes",
                table: "ItensVenda",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Ajustes",
                table: "ItensVenda");

            migrationBuilder.AddColumn<string>(
                name: "Ajustes",
                table: "Vendas",
                type: "text",
                nullable: true);
        }
    }
}
