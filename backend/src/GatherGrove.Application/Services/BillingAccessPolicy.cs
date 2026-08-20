using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services;

public sealed record BillingAccessEvaluation(
    string NormalizedStatus,
    string TrialStatus,
    bool RequiresPaymentSetup,
    bool AccountLocked,
    bool CanAccessApp);

public static class BillingAccessPolicy
{
    public static BillingAccessEvaluation Evaluate(Club club, DateTime utcNow)
    {
        var normalizedStatus = NormalizeSubscriptionStatus(club.SubscriptionStatus);
        var trialStatus = GetTrialStatus(club, normalizedStatus, utcNow);
        var accountLocked = IsAccountLocked(club, normalizedStatus, trialStatus, utcNow);
        var requiresPaymentSetup = RequiresPaymentSetup(club, normalizedStatus, trialStatus);

        return new BillingAccessEvaluation(
            normalizedStatus,
            trialStatus,
            requiresPaymentSetup,
            accountLocked,
            !accountLocked);
    }

    public static string NormalizeSubscriptionStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return "inactive";
        }

        return status.Trim().ToLowerInvariant() switch
        {
            "cancelled" => "canceled",
            _ => status.Trim().ToLowerInvariant()
        };
    }

    private static string GetTrialStatus(Club club, string normalizedStatus, DateTime utcNow)
    {
        if (normalizedStatus == "trialing" || normalizedStatus == "pending_trial_claim")
        {
            if (club.TrialExpiresAt.HasValue && club.TrialExpiresAt.Value <= utcNow)
            {
                return "expired";
            }

            return "trialing";
        }

        return normalizedStatus switch
        {
            "active" => "active",
            "paused" => "expired",
            "past_due" => "expired",
            "unpaid" => "expired",
            "canceled" => "expired",
            "incomplete" => "expired",
            "incomplete_expired" => "expired",
            _ => "inactive"
        };
    }

    private static bool RequiresPaymentSetup(Club club, string normalizedStatus, string trialStatus)
    {
        if (trialStatus == "trialing" || trialStatus == "expired")
        {
            return string.IsNullOrEmpty(club.StripeSubscriptionId) || normalizedStatus != "active";
        }

        return normalizedStatus is "paused" or "past_due" or "unpaid" or "incomplete" or "incomplete_expired";
    }

    private static bool IsAccountLocked(Club club, string normalizedStatus, string trialStatus, DateTime utcNow)
    {
        if ((normalizedStatus == "trialing" || normalizedStatus == "pending_trial_claim") &&
            club.TrialExpiresAt.HasValue &&
            club.TrialExpiresAt.Value <= utcNow)
        {
            return true;
        }

        return normalizedStatus is "paused" or "past_due" or "unpaid" or "canceled" or "incomplete" or "incomplete_expired";
    }
}
