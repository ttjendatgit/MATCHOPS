using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMembershipCore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MembershipPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TargetRole = table.Column<int>(type: "integer", nullable: false),
                    Tier = table.Column<int>(type: "integer", nullable: false),
                    PricePerMonth = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PricePerYear = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    CommissionRate = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: true),
                    MaxVenues = table.Column<int>(type: "integer", nullable: true),
                    MaxCourts = table.Column<int>(type: "integer", nullable: true),
                    MaxMatchPostsPerMonth = table.Column<int>(type: "integer", nullable: true),
                    MaxJoinRequestsPerMonth = table.Column<int>(type: "integer", nullable: true),
                    FeaturesJson = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MembershipPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    MembershipPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSubscriptions_MembershipPlans_MembershipPlanId",
                        column: x => x.MembershipPlanId,
                        principalTable: "MembershipPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserSubscriptions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "MembershipPlans",
                columns: new[] { "Id", "Code", "CommissionRate", "CreatedAt", "FeaturesJson", "IsActive", "MaxCourts", "MaxJoinRequestsPerMonth", "MaxMatchPostsPerMonth", "MaxVenues", "Name", "PricePerMonth", "PricePerYear", "SortOrder", "TargetRole", "Tier", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), "USER_FREE", null, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, true, null, 5, 3, null, "Người dùng Miễn phí", 0m, null, 1, 1, 1, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("10000000-0000-0000-0000-000000000002"), "USER_PRO", null, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, true, null, null, 20, null, "Người dùng Pro", 49000m, null, 2, 1, 3, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("10000000-0000-0000-0000-000000000003"), "USER_PREMIUM", null, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, true, null, null, null, null, "Người dùng Premium", 99000m, null, 3, 1, 4, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("10000000-0000-0000-0000-000000000004"), "OWNER_FREE", 0.07m, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, true, 3, null, null, 1, "Chủ sân Miễn phí", 0m, null, 4, 2, 1, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("10000000-0000-0000-0000-000000000005"), "OWNER_STANDARD", 0.05m, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, true, 10, null, null, 3, "Chủ sân Standard", 199000m, null, 5, 2, 2, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("10000000-0000-0000-0000-000000000006"), "OWNER_PRO", 0.03m, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, true, null, null, null, 10, "Chủ sân Pro", 499000m, null, 6, 2, 3, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("10000000-0000-0000-0000-000000000007"), "OWNER_PREMIUM", 0.02m, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, true, null, null, null, null, "Chủ sân Premium", 999000m, null, 7, 2, 4, new DateTime(2026, 6, 22, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "ix_membership_plans_role_active",
                table: "MembershipPlans",
                columns: new[] { "TargetRole", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "ux_membership_plans_code",
                table: "MembershipPlans",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_subscriptions_status_expiry",
                table: "UserSubscriptions",
                columns: new[] { "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserSubscriptions_MembershipPlanId",
                table: "UserSubscriptions",
                column: "MembershipPlanId");

            migrationBuilder.CreateIndex(
                name: "ux_user_subscriptions_user_id",
                table: "UserSubscriptions",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserSubscriptions");

            migrationBuilder.DropTable(
                name: "MembershipPlans");
        }
    }
}
