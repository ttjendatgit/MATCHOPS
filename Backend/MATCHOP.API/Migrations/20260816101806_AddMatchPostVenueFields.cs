using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchPostVenueFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid?>(
                name: "CourtId",
                table: "MatchPosts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalVenueName",
                table: "MatchPosts",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<Guid?>(
                name: "VenueId",
                table: "MatchPosts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchPosts_CourtId",
                table: "MatchPosts",
                column: "CourtId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchPosts_VenueId",
                table: "MatchPosts",
                column: "VenueId");

            migrationBuilder.AddForeignKey(
                name: "FK_MatchPosts_Courts_CourtId",
                table: "MatchPosts",
                column: "CourtId",
                principalTable: "Courts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_MatchPosts_Venues_VenueId",
                table: "MatchPosts",
                column: "VenueId",
                principalTable: "Venues",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MatchPosts_Courts_CourtId",
                table: "MatchPosts");

            migrationBuilder.DropForeignKey(
                name: "FK_MatchPosts_Venues_VenueId",
                table: "MatchPosts");

            migrationBuilder.DropIndex(
                name: "IX_MatchPosts_CourtId",
                table: "MatchPosts");

            migrationBuilder.DropIndex(
                name: "IX_MatchPosts_VenueId",
                table: "MatchPosts");

            migrationBuilder.DropColumn(
                name: "CourtId",
                table: "MatchPosts");

            migrationBuilder.DropColumn(
                name: "ExternalVenueName",
                table: "MatchPosts");

            migrationBuilder.DropColumn(
                name: "VenueId",
                table: "MatchPosts");
        }
    }
}
