using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCoachPortfolioImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CoachPortfolioImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    CoachProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    PublicId = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Caption = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsCover = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoachPortfolioImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoachPortfolioImages_CoachProfiles_CoachProfileId",
                        column: x => x.CoachProfileId,
                        principalTable: "CoachProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_coach_portfolio_images_coach_profile_id",
                table: "CoachPortfolioImages",
                column: "CoachProfileId");

            migrationBuilder.CreateIndex(
                name: "ix_coach_portfolio_images_coach_profile_sort_order",
                table: "CoachPortfolioImages",
                columns: new[] { "CoachProfileId", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoachPortfolioImages");
        }
    }
}
