using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GatherGrove.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketingLeadEmailSourceUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM "MarketingLeads" a
                USING "MarketingLeads" b
                WHERE a."Id" > b."Id"
                  AND lower(a."Email") = lower(b."Email")
                  AND a."Source" = b."Source";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_MarketingLeads_Email_Source",
                table: "MarketingLeads",
                columns: new[] { "Email", "Source" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MarketingLeads_Email_Source",
                table: "MarketingLeads");
        }
    }
}
