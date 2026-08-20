using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GatherGrove.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSmsMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SMSMessages");

            migrationBuilder.AlterColumn<string>(
                name: "Tier",
                table: "Clubs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Grow",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldDefaultValue: "Sprout");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Tier",
                table: "Clubs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Sprout",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldDefaultValue: "Grow");

            migrationBuilder.CreateTable(
                name: "SMSMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    CommunicationId = table.Column<int>(type: "integer", nullable: true),
                    MemberId = table.Column<int>(type: "integer", nullable: false),
                    SentByUserId = table.Column<int>(type: "integer", nullable: false),
                    Cost = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MessageContent = table.Column<string>(type: "character varying(1600)", maxLength: 1600, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ProviderMessageId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SegmentCount = table.Column<int>(type: "integer", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StatusUpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SMSMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SMSMessages_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SMSMessages_CommunicationsLogs_CommunicationId",
                        column: x => x.CommunicationId,
                        principalTable: "CommunicationsLogs",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SMSMessages_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SMSMessages_Users_SentByUserId",
                        column: x => x.SentByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SMSMessages_ClubId",
                table: "SMSMessages",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_SMSMessages_CommunicationId",
                table: "SMSMessages",
                column: "CommunicationId");

            migrationBuilder.CreateIndex(
                name: "IX_SMSMessages_MemberId",
                table: "SMSMessages",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_SMSMessages_SentByUserId",
                table: "SMSMessages",
                column: "SentByUserId");
        }
    }
}
