using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCoachProfileFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CoachProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Bio = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ExperienceYears = table.Column<int>(type: "integer", nullable: true),
                    HourlyRate = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    District = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoachProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoachProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CoachSports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    CoachProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    SportId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoachSports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoachSports_CoachProfiles_CoachProfileId",
                        column: x => x.CoachProfileId,
                        principalTable: "CoachProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CoachSports_Sports_SportId",
                        column: x => x.SportId,
                        principalTable: "Sports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_coach_profiles_location",
                table: "CoachProfiles",
                columns: new[] { "City", "District" });

            migrationBuilder.CreateIndex(
                name: "ix_coach_profiles_status",
                table: "CoachProfiles",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "ux_coach_profiles_user_id",
                table: "CoachProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_coach_sports_sport_id",
                table: "CoachSports",
                column: "SportId");

            migrationBuilder.CreateIndex(
                name: "ux_coach_sports_profile_sport",
                table: "CoachSports",
                columns: new[] { "CoachProfileId", "SportId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoachSports");

            migrationBuilder.DropTable(
                name: "CoachProfiles");
        }
    }
}
