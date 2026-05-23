using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCourtImageGallery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameIndex(
                name: "IX_Venues_OwnerId",
                table: "Venues",
                newName: "ix_venues_owner_id");

            migrationBuilder.RenameIndex(
                name: "IX_PriceRules_CourtId",
                table: "PriceRules",
                newName: "ix_price_rules_court_id");

            migrationBuilder.RenameIndex(
                name: "IX_Courts_VenueId",
                table: "Courts",
                newName: "ix_courts_venue_id");

            migrationBuilder.RenameIndex(
                name: "IX_Courts_SportId",
                table: "Courts",
                newName: "ix_courts_sport_id");

            migrationBuilder.AddColumn<string>(
                name: "ImagePublicId",
                table: "Courts",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CourtImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    CourtId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    PublicId = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourtImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourtImages_Courts_CourtId",
                        column: x => x.CourtId,
                        principalTable: "Courts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_venues_status",
                table: "Venues",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "ix_courts_status",
                table: "Courts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "ix_courts_venue_name",
                table: "Courts",
                columns: new[] { "VenueId", "Name" });

            migrationBuilder.CreateIndex(
                name: "ix_court_images_court_id",
                table: "CourtImages",
                column: "CourtId");

            migrationBuilder.CreateIndex(
                name: "ix_court_images_court_primary",
                table: "CourtImages",
                columns: new[] { "CourtId", "IsPrimary" });

            migrationBuilder.CreateIndex(
                name: "ix_court_images_court_sort_order",
                table: "CourtImages",
                columns: new[] { "CourtId", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourtImages");

            migrationBuilder.DropIndex(
                name: "ix_venues_status",
                table: "Venues");

            migrationBuilder.DropIndex(
                name: "ix_courts_status",
                table: "Courts");

            migrationBuilder.DropIndex(
                name: "ix_courts_venue_name",
                table: "Courts");

            migrationBuilder.DropColumn(
                name: "ImagePublicId",
                table: "Courts");

            migrationBuilder.RenameIndex(
                name: "ix_venues_owner_id",
                table: "Venues",
                newName: "IX_Venues_OwnerId");

            migrationBuilder.RenameIndex(
                name: "ix_price_rules_court_id",
                table: "PriceRules",
                newName: "IX_PriceRules_CourtId");

            migrationBuilder.RenameIndex(
                name: "ix_courts_venue_id",
                table: "Courts",
                newName: "IX_Courts_VenueId");

            migrationBuilder.RenameIndex(
                name: "ix_courts_sport_id",
                table: "Courts",
                newName: "IX_Courts_SportId");
        }
    }
}
