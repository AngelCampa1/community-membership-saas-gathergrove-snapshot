using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GatherGrove.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class StartPendingGrowTrials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "Clubs"
                SET "SubscriptionStatus" = 'trialing',
                    "TrialExpiresAt" = COALESCE("TrialExpiresAt", "CreatedAt" + INTERVAL '30 days'),
                    "UpdatedAt" = NOW()
                WHERE "Tier" = 'Grow'
                  AND "SubscriptionStatus" = 'pending_trial_claim'
                  AND "StripeSubscriptionId" IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "Clubs"
                SET "SubscriptionStatus" = 'pending_trial_claim',
                    "TrialExpiresAt" = NULL,
                    "UpdatedAt" = NOW()
                WHERE "Tier" = 'Grow'
                  AND "SubscriptionStatus" = 'trialing'
                  AND "StripeSubscriptionId" IS NULL
                  AND "StripeCustomerId" IS NULL;
                """);
        }
    }
}
