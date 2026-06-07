using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfileModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_users_phone",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "Users",
                newName: "PhoneNumber");

            migrationBuilder.RenameColumn(
                name: "Avatar",
                table: "Users",
                newName: "AvatarUrl");

            migrationBuilder.AddColumn<string>(
                name: "PreferredPlayingArea",
                table: "Users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SkillLevel",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateTable(
                name: "FavoriteSports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SportType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavoriteSports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FavoriteSports_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ux_users_phone_number",
                table: "Users",
                column: "PhoneNumber",
                unique: true,
                filter: "\"PhoneNumber\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_favorite_sports_user_id",
                table: "FavoriteSports",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "ux_favorite_sports_user_sport_type",
                table: "FavoriteSports",
                columns: new[] { "UserId", "SportType" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FavoriteSports");

            migrationBuilder.DropIndex(
                name: "ux_users_phone_number",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PreferredPlayingArea",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SkillLevel",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "PhoneNumber",
                table: "Users",
                newName: "Phone");

            migrationBuilder.RenameColumn(
                name: "AvatarUrl",
                table: "Users",
                newName: "Avatar");

            migrationBuilder.CreateIndex(
                name: "ux_users_phone",
                table: "Users",
                column: "Phone",
                unique: true,
                filter: "\"Phone\" IS NOT NULL");
        }
    }
}
