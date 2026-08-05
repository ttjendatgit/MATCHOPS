using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCoachSessionRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CoachSessionRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    CoachProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequesterId = table.Column<Guid>(type: "uuid", nullable: false),
                    SportId = table.Column<Guid>(type: "uuid", nullable: true),
                    PreferredDate = table.Column<DateOnly>(type: "date", nullable: true),
                    PreferredTimeSlot = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    LocationNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    CoachResponseMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoachSessionRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoachSessionRequests_CoachProfiles_CoachProfileId",
                        column: x => x.CoachProfileId,
                        principalTable: "CoachProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CoachSessionRequests_Sports_SportId",
                        column: x => x.SportId,
                        principalTable: "Sports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CoachSessionRequests_Users_RequesterId",
                        column: x => x.RequesterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_coach_session_requests_coach_profile_status",
                table: "CoachSessionRequests",
                columns: new[] { "CoachProfileId", "Status" });

            migrationBuilder.CreateIndex(
                name: "ix_coach_session_requests_created_at",
                table: "CoachSessionRequests",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "ix_coach_session_requests_preferred_date",
                table: "CoachSessionRequests",
                column: "PreferredDate");

            migrationBuilder.CreateIndex(
                name: "ix_coach_session_requests_requester_status",
                table: "CoachSessionRequests",
                columns: new[] { "RequesterId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CoachSessionRequests_SportId",
                table: "CoachSessionRequests",
                column: "SportId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoachSessionRequests");
        }
    }
}
