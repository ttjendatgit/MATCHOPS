using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCoachAvailabilityAndSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CoachAvailabilitySlots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    CoachProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoachAvailabilitySlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoachAvailabilitySlots_CoachProfiles_CoachProfileId",
                        column: x => x.CoachProfileId,
                        principalTable: "CoachProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CoachSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    CoachSessionRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    CoachProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequesterId = table.Column<Guid>(type: "uuid", nullable: false),
                    SportId = table.Column<Guid>(type: "uuid", nullable: true),
                    ScheduledDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ScheduledTimeSlot = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    LocationNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PriceAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "VND"),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    PaymentStatus = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    PaymentTransactionCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoachSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoachSessions_CoachProfiles_CoachProfileId",
                        column: x => x.CoachProfileId,
                        principalTable: "CoachProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CoachSessions_CoachSessionRequests_CoachSessionRequestId",
                        column: x => x.CoachSessionRequestId,
                        principalTable: "CoachSessionRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CoachSessions_Sports_SportId",
                        column: x => x.SportId,
                        principalTable: "Sports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CoachSessions_Users_RequesterId",
                        column: x => x.RequesterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_coach_availability_slots_profile_day",
                table: "CoachAvailabilitySlots",
                columns: new[] { "CoachProfileId", "DayOfWeek" });

            migrationBuilder.CreateIndex(
                name: "ix_coach_sessions_coach_profile_status",
                table: "CoachSessions",
                columns: new[] { "CoachProfileId", "Status" });

            migrationBuilder.CreateIndex(
                name: "ix_coach_sessions_created_at",
                table: "CoachSessions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "ix_coach_sessions_requester_status",
                table: "CoachSessions",
                columns: new[] { "RequesterId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CoachSessions_SportId",
                table: "CoachSessions",
                column: "SportId");

            migrationBuilder.CreateIndex(
                name: "ux_coach_sessions_request_id",
                table: "CoachSessions",
                column: "CoachSessionRequestId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoachAvailabilitySlots");

            migrationBuilder.DropTable(
                name: "CoachSessions");
        }
    }
}
