using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace StoryApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BeatSegments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "Beats",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TransitionOverride",
                table: "Beats",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BeatSegments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    TransitionAfter = table.Column<int>(type: "integer", nullable: true),
                    BeatId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BeatSegments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BeatSegments_Beats_BeatId",
                        column: x => x.BeatId,
                        principalTable: "Beats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(
                """
                INSERT INTO "BeatSegments" ("Order", "Text", "TransitionAfter", "BeatId")
                SELECT 0, "Passage", NULL, "Id"
                FROM "Beats";
                """);

            migrationBuilder.Sql(
                """
                UPDATE "Beats" b
                SET "Order" = ranked.row_num - 1
                FROM (
                    SELECT "Id", ROW_NUMBER() OVER (PARTITION BY "PulseId" ORDER BY "CreatedAt") AS row_num
                    FROM "Beats"
                ) ranked
                WHERE b."Id" = ranked."Id";
                """);

            migrationBuilder.DropColumn(
                name: "Passage",
                table: "Beats");

            migrationBuilder.CreateIndex(
                name: "IX_Beats_PulseId_Order",
                table: "Beats",
                columns: new[] { "PulseId", "Order" });

            migrationBuilder.CreateIndex(
                name: "IX_BeatSegments_BeatId_Order",
                table: "BeatSegments",
                columns: new[] { "BeatId", "Order" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BeatSegments");

            migrationBuilder.DropIndex(
                name: "IX_Beats_PulseId_Order",
                table: "Beats");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "Beats");

            migrationBuilder.DropColumn(
                name: "TransitionOverride",
                table: "Beats");

            migrationBuilder.AddColumn<string>(
                name: "Passage",
                table: "Beats",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");
        }
    }
}
