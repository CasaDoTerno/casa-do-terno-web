using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaDoTerno.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgendamentoReservaGoogle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "ClienteId",
                table: "Agendamentos",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "EmailExterno",
                table: "Agendamentos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeExterno",
                table: "Agendamentos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Origem",
                table: "Agendamentos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TelefoneExterno",
                table: "Agendamentos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailExterno",
                table: "Agendamentos");

            migrationBuilder.DropColumn(
                name: "NomeExterno",
                table: "Agendamentos");

            migrationBuilder.DropColumn(
                name: "Origem",
                table: "Agendamentos");

            migrationBuilder.DropColumn(
                name: "TelefoneExterno",
                table: "Agendamentos");

            migrationBuilder.AlterColumn<int>(
                name: "ClienteId",
                table: "Agendamentos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
