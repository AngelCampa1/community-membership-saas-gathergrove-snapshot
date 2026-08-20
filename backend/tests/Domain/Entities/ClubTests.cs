using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class ClubTests
{
    #region Tier Tests (6 tests)

    [Test]
    public void Tier_DefaultsToSprout()
    {
        var club = new Club();
        Assert.That(club.Tier, Is.EqualTo("Sprout"));
    }

    [Test]
    public void Tier_CanBeSetToGrow()
    {
        var club = new Club { Tier = "Grow" };
        Assert.That(club.Tier, Is.EqualTo("Grow"));
    }

    [Test]
    public void Tier_CanBeSetToUnlimited()
    {
        var club = new Club { Tier = "Unlimited" };
        Assert.That(club.Tier, Is.EqualTo("Unlimited"));
    }

    [Test]
    public void Tier_SupportsTransitionFromSproutToGrow()
    {
        var club = new Club { Tier = "Sprout" };
        club.Tier = "Grow";
        Assert.That(club.Tier, Is.EqualTo("Grow"));
    }

    [Test]
    public void Tier_SupportsTransitionFromGrowToUnlimited()
    {
        var club = new Club { Tier = "Grow" };
        club.Tier = "Unlimited";
        Assert.That(club.Tier, Is.EqualTo("Unlimited"));
    }

    [Test]
    public void Tier_SupportsDowngrade()
    {
        var club = new Club { Tier = "Unlimited" };
        club.Tier = "Grow";
        Assert.That(club.Tier, Is.EqualTo("Grow"));
    }

    #endregion

    #region Trial Expiration Tests (8 tests)

    [Test]
    public void TrialExpiresAt_DefaultsToNull()
    {
        var club = new Club();
        Assert.That(club.TrialExpiresAt, Is.Null);
    }

    [Test]
    public void TrialExpiresAt_CanBeSetToFutureDate_ActiveTrial()
    {
        var futureDate = DateTime.UtcNow.AddDays(14);
        var club = new Club { TrialExpiresAt = futureDate };
        Assert.That(club.TrialExpiresAt, Is.EqualTo(futureDate));
    }

    [Test]
    public void TrialExpiresAt_CanBeSetToPastDate_ExpiredTrial()
    {
        var pastDate = DateTime.UtcNow.AddDays(-1);
        var club = new Club { TrialExpiresAt = pastDate };
        Assert.That(club.TrialExpiresAt, Is.EqualTo(pastDate));
    }

    [Test]
    public void TrialExpiresAt_CanBeSetToCurrentTime()
    {
        var now = DateTime.UtcNow;
        var club = new Club { TrialExpiresAt = now };
        Assert.That(club.TrialExpiresAt, Is.EqualTo(now));
    }

    [Test]
    public void TrialExpiresAt_CanBeExtended()
    {
        var club = new Club { TrialExpiresAt = DateTime.UtcNow.AddDays(7) };
        var newExpiry = DateTime.UtcNow.AddDays(14);
        club.TrialExpiresAt = newExpiry;
        Assert.That(club.TrialExpiresAt, Is.EqualTo(newExpiry));
    }

    [Test]
    public void TrialExpiresAt_CanBeSetToNull_ConvertToFullMembership()
    {
        var club = new Club { TrialExpiresAt = DateTime.UtcNow.AddDays(7) };
        club.TrialExpiresAt = null;
        Assert.That(club.TrialExpiresAt, Is.Null);
    }

    [Test]
    public void TrialExpiresAt_PreservesDateTimePrecision()
    {
        var preciseTime = new DateTime(2025, 1, 15, 23, 59, 59, 999);
        var club = new Club { TrialExpiresAt = preciseTime };
        Assert.That(club.TrialExpiresAt?.Millisecond, Is.EqualTo(999));
    }

    [Test]
    public void TrialExpiresAt_SupportsTypical14DayTrial()
    {
        var startDate = DateTime.UtcNow;
        var expiryDate = startDate.AddDays(14);
        var club = new Club { TrialExpiresAt = expiryDate };

        var actualDuration = (club.TrialExpiresAt.Value - startDate).TotalDays;
        Assert.That(actualDuration, Is.EqualTo(14).Within(0.1));
    }

    #endregion

    #region Stripe Integration Tests (8 tests)

    [Test]
    public void StripeCustomerId_DefaultsToNull()
    {
        var club = new Club();
        Assert.That(club.StripeCustomerId, Is.Null);
    }

    [Test]
    public void StripeCustomerId_CanBeSet()
    {
        var club = new Club { StripeCustomerId = "cus_ABC123XYZ" };
        Assert.That(club.StripeCustomerId, Is.EqualTo("cus_ABC123XYZ"));
    }

    [Test]
    public void StripeSubscriptionId_DefaultsToNull()
    {
        var club = new Club();
        Assert.That(club.StripeSubscriptionId, Is.Null);
    }

    [Test]
    public void StripeSubscriptionId_CanBeSet()
    {
        var club = new Club { StripeSubscriptionId = "sub_ABC123XYZ" };
        Assert.That(club.StripeSubscriptionId, Is.EqualTo("sub_ABC123XYZ"));
    }

    [Test]
    public void SubscriptionStatus_CanBeSetToActive()
    {
        var club = new Club { SubscriptionStatus = "active" };
        Assert.That(club.SubscriptionStatus, Is.EqualTo("active"));
    }

    [Test]
    public void SubscriptionStatus_CanBeSetToCanceled()
    {
        var club = new Club { SubscriptionStatus = "canceled" };
        Assert.That(club.SubscriptionStatus, Is.EqualTo("canceled"));
    }

    [Test]
    public void StripeAccountId_CanBeSetForPaymentReceiving()
    {
        var club = new Club { StripeAccountId = "acct_ABC123" };
        Assert.That(club.StripeAccountId, Is.EqualTo("acct_ABC123"));
    }

    [Test]
    public void StripeAccountCountry_CanBeSetForPaymentProcessing()
    {
        var club = new Club { StripeAccountCountry = "US" };
        Assert.That(club.StripeAccountCountry, Is.EqualTo("US"));
    }

    #endregion

    #region Feature Flag Tests (4 tests)

    [Test]
    public void IsDirectoryEnabled_DefaultsToFalse()
    {
        var club = new Club();
        Assert.That(club.IsDirectoryEnabled, Is.False);
    }

    [Test]
    public void IsDirectoryEnabled_CanBeEnabled()
    {
        var club = new Club { IsDirectoryEnabled = true };
        Assert.That(club.IsDirectoryEnabled, Is.True);
    }

    [Test]
    public void IsChatEnabled_DefaultsToFalse()
    {
        var club = new Club();
        Assert.That(club.IsChatEnabled, Is.False);
    }

    [Test]
    public void IsChatEnabled_CanBeEnabled()
    {
        var club = new Club { IsChatEnabled = true };
        Assert.That(club.IsChatEnabled, Is.True);
    }

    #endregion

    #region Membership Expiration Tests (4 tests)

    [Test]
    public void MembershipExpiresAt_DefaultsToNull()
    {
        var club = new Club();
        Assert.That(club.MembershipExpiresAt, Is.Null);
    }

    [Test]
    public void MembershipExpiresAt_CanBeSetToFutureDate()
    {
        var futureDate = DateTime.UtcNow.AddMonths(12);
        var club = new Club { MembershipExpiresAt = futureDate };
        Assert.That(club.MembershipExpiresAt, Is.EqualTo(futureDate));
    }

    [Test]
    public void MembershipExpiresAt_CanBeSetToPastDate_ExpiredMembership()
    {
        var pastDate = DateTime.UtcNow.AddDays(-1);
        var club = new Club { MembershipExpiresAt = pastDate };
        Assert.That(club.MembershipExpiresAt, Is.EqualTo(pastDate));
    }

    [Test]
    public void MembershipExpiresAt_CanBeUpdated_RenewalScenario()
    {
        var club = new Club { MembershipExpiresAt = DateTime.UtcNow.AddMonths(1) };
        var renewedExpiry = DateTime.UtcNow.AddMonths(13);
        club.MembershipExpiresAt = renewedExpiry;
        Assert.That(club.MembershipExpiresAt, Is.EqualTo(renewedExpiry));
    }

    #endregion
}
