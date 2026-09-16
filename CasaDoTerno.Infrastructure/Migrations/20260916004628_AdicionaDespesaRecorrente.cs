using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CasaDoTerno.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaDespesaRecorrente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DespesaRecorrenteId",
                table: "Despesas",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DespesasRecorrentes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Descricao = table.Column<string>(type: "text", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric", nullable: false),
                    DiaVencimento = table.Column<int>(type: "integer", nullable: false),
                    Ativa = table.Column<bool>(type: "boolean", nullable: false),
                    UltimoMesGerado = table.Column<int>(type: "integer", nullable: true),
                    UltimoAnoGerado = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DespesasRecorrentes", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DespesasRecorrentes");

            migrationBuilder.DropColumn(
                name: "DespesaRecorrenteId",
                table: "Despesas");
        }
    }
}
