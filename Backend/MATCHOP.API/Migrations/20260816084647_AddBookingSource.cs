using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BookingSource",
                table: "Bookings",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BookingSource",
                table: "Bookings");
        }
    }
}
