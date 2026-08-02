using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDoTerno.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RefatoraLocacaoComItens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ProdutoId",
                table: "Locacoes",
                newName: "FormaPagamento");

            migrationBuilder.AddColumn<string>(
                name: "Consultor",
                table: "Locacoes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataEvento",
                table: "Locacoes",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "ItensLocacao",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LocacaoId = table.Column<int>(type: "int", nullable: false),
                    ProdutoId = table.Column<int>(type: "int", nullable: false),
                    ValorItem = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Ajustes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItensLocacao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItensLocacao_Locacoes_LocacaoId",
                        column: x => x.LocacaoId,
                        principalTable: "Locacoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItensLocacao_LocacaoId",
                table: "ItensLocacao",
                column: "LocacaoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItensLocacao");

            migrationBuilder.DropColumn(
                name: "Consultor",
                table: "Locacoes");

            migrationBuilder.DropColumn(
                name: "DataEvento",
                table: "Locacoes");

            migrationBuilder.RenameColumn(
                name: "FormaPagamento",
                table: "Locacoes",
                newName: "ProdutoId");
        }
    }
}
