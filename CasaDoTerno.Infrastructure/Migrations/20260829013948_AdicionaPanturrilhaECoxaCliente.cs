using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDoTerno.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaPanturrilhaECoxaCliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Coxa",
                table: "Clientes",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Panturrilha",
                table: "Clientes",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Coxa",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "Panturrilha",
                table: "Clientes");
        }
    }
}
