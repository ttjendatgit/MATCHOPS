using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionPendingUpgradeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PendingBillingCycle",
                table: "UserSubscriptions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PendingMembershipPlanId",
                table: "UserSubscriptions",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PendingBillingCycle",
                table: "UserSubscriptions");

            migrationBuilder.DropColumn(
                name: "PendingMembershipPlanId",
                table: "UserSubscriptions");
        }
    }
}
