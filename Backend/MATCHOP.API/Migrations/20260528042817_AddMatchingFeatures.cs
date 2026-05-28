using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MATCHOP.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchingFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MatchPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    CreatorId = table.Column<Guid>(type: "uuid", nullable: false),
                    SportId = table.Column<Guid>(type: "uuid", nullable: false),
                    MinSkillLevel = table.Column<int>(type: "integer", nullable: false),
                    MaxSkillLevel = table.Column<int>(type: "integer", nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    District = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PreferredTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SlotsNeeded = table.Column<int>(type: "integer", nullable: false),
                    SlotsFilled = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchPosts_Sports_SportId",
                        column: x => x.SportId,
                        principalTable: "Sports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MatchPosts_Users_CreatorId",
                        column: x => x.CreatorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MatchQueues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SportId = table.Column<Guid>(type: "uuid", nullable: false),
                    SkillLevel = table.Column<int>(type: "integer", nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    District = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PreferredTimeStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PreferredTimeEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchQueues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchQueues_Sports_SportId",
                        column: x => x.SportId,
                        principalTable: "Sports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MatchQueues_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MatchSuggestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SuggestedUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SportId = table.Column<Guid>(type: "uuid", nullable: false),
                    Score = table.Column<double>(type: "double precision", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchSuggestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchSuggestions_Sports_SportId",
                        column: x => x.SportId,
                        principalTable: "Sports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MatchSuggestions_Users_SuggestedUserId",
                        column: x => x.SuggestedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MatchSuggestions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSkills",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SportId = table.Column<Guid>(type: "uuid", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSkills_Sports_SportId",
                        column: x => x.SportId,
                        principalTable: "Sports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserSkills_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MatchRooms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    SportId = table.Column<Guid>(type: "uuid", nullable: false),
                    MatchPostId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchRooms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchRooms_MatchPosts_MatchPostId",
                        column: x => x.MatchPostId,
                        principalTable: "MatchPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MatchRooms_Sports_SportId",
                        column: x => x.SportId,
                        principalTable: "Sports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MatchRoomPlayers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsHost = table.Column<bool>(type: "boolean", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchRoomPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchRoomPlayers_MatchRooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "MatchRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MatchRoomPlayers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_match_posts_creator",
                table: "MatchPosts",
                column: "CreatorId");

            migrationBuilder.CreateIndex(
                name: "ix_match_posts_location",
                table: "MatchPosts",
                columns: new[] { "City", "District" });

            migrationBuilder.CreateIndex(
                name: "ix_match_posts_sport",
                table: "MatchPosts",
                column: "SportId");

            migrationBuilder.CreateIndex(
                name: "ix_match_posts_status",
                table: "MatchPosts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_MatchQueues_SportId",
                table: "MatchQueues",
                column: "SportId");

            migrationBuilder.CreateIndex(
                name: "ux_match_queue_user_sport",
                table: "MatchQueues",
                columns: new[] { "UserId", "SportId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchRoomPlayers_UserId",
                table: "MatchRoomPlayers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "ux_match_room_players_room_user",
                table: "MatchRoomPlayers",
                columns: new[] { "RoomId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchRooms_MatchPostId",
                table: "MatchRooms",
                column: "MatchPostId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchRooms_SportId",
                table: "MatchRooms",
                column: "SportId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchSuggestions_SportId",
                table: "MatchSuggestions",
                column: "SportId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchSuggestions_SuggestedUserId",
                table: "MatchSuggestions",
                column: "SuggestedUserId");

            migrationBuilder.CreateIndex(
                name: "ux_match_suggestions_unique",
                table: "MatchSuggestions",
                columns: new[] { "UserId", "SuggestedUserId", "SportId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserSkills_SportId",
                table: "UserSkills",
                column: "SportId");

            migrationBuilder.CreateIndex(
                name: "ux_user_skills_user_sport",
                table: "UserSkills",
                columns: new[] { "UserId", "SportId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MatchQueues");

            migrationBuilder.DropTable(
                name: "MatchRoomPlayers");

            migrationBuilder.DropTable(
                name: "MatchSuggestions");

            migrationBuilder.DropTable(
                name: "UserSkills");

            migrationBuilder.DropTable(
                name: "MatchRooms");

            migrationBuilder.DropTable(
                name: "MatchPosts");
        }
    }
}
