using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPriceRuleIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_price_rules_court_day_time",
                table: "PriceRules",
                columns: new[] { "CourtId", "DayType", "StartTime", "EndTime" });

            migrationBuilder.CreateIndex(
                name: "ix_price_rules_status",
                table: "PriceRules",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_price_rules_court_day_time",
                table: "PriceRules");

            migrationBuilder.DropIndex(
                name: "ix_price_rules_status",
                table: "PriceRules");
        }
    }
}
