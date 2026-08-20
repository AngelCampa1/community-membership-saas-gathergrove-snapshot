using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class PromotionTests
{
    #region Default Value Tests (6 tests)

    [Test]
    public void StripeCouponId_DefaultsToEmptyString()
    {
        var promotion = new Promotion();
        Assert.That(promotion.StripeCouponId, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Name_DefaultsToEmptyString()
    {
        var promotion = new Promotion();
        Assert.That(promotion.Name, Is.EqualTo(string.Empty));
    }

    [Test]
    public void IsAutoApply_DefaultsToFalse()
    {
        var promotion = new Promotion();
        Assert.That(promotion.IsAutoApply, Is.False);
    }

    [Test]
    public void AutoApplyRedemptionCount_DefaultsToZero()
    {
        var promotion = new Promotion();
        Assert.That(promotion.AutoApplyRedemptionCount, Is.EqualTo(0));
    }

    [Test]
    public void MaxAutoApplyRedemptions_DefaultsToNull_UnlimitedRedemptions()
    {
        var promotion = new Promotion();
        Assert.That(promotion.MaxAutoApplyRedemptions, Is.Null);
    }

    [Test]
    public void IsActive_DefaultsToFalse()
    {
        var promotion = new Promotion();
        Assert.That(promotion.IsActive, Is.False);
    }

    #endregion

    #region Stripe Integration Tests (4 tests)

    [Test]
    public void StripeCouponId_CanBeSet()
    {
        var promotion = new Promotion { StripeCouponId = "launch-3mo-free" };
        Assert.That(promotion.StripeCouponId, Is.EqualTo("launch-3mo-free"));
    }

    [Test]
    public void StripePromotionCodeId_CanBeSet()
    {
        var promotion = new Promotion { StripePromotionCodeId = "promo_ABC123" };
        Assert.That(promotion.StripePromotionCodeId, Is.EqualTo("promo_ABC123"));
    }

    [Test]
    public void PromoCode_CanBeSetForCustomerFacingCode()
    {
        var promotion = new Promotion { PromoCode = "LAUNCH100" };
        Assert.That(promotion.PromoCode, Is.EqualTo("LAUNCH100"));
    }

    [Test]
    public void Promotion_SupportsCompleteStripeConfiguration()
    {
        var promotion = new Promotion
        {
            StripeCouponId = "launch-offer",
            StripePromotionCodeId = "promo_ABC123",
            PromoCode = "LAUNCH100",
            Name = "Launch Offer - 3 Months Free"
        };

        Assert.That(promotion.StripeCouponId, Is.EqualTo("launch-offer"));
        Assert.That(promotion.StripePromotionCodeId, Is.EqualTo("promo_ABC123"));
        Assert.That(promotion.PromoCode, Is.EqualTo("LAUNCH100"));
    }

    #endregion

    #region Auto-Apply Tests (4 tests)

    [Test]
    public void AutoApplyRedemptionCount_CanBeIncremented()
    {
        var promotion = new Promotion { AutoApplyRedemptionCount = 5 };
        promotion.AutoApplyRedemptionCount++;
        Assert.That(promotion.AutoApplyRedemptionCount, Is.EqualTo(6));
    }

    [Test]
    public void MaxAutoApplyRedemptions_CanBeSetToLimit()
    {
        var promotion = new Promotion { MaxAutoApplyRedemptions = 100 };
        Assert.That(promotion.MaxAutoApplyRedemptions, Is.EqualTo(100));
    }

    [Test]
    public void IsAutoApply_CanBeEnabled()
    {
        var promotion = new Promotion { IsAutoApply = true };
        Assert.That(promotion.IsAutoApply, Is.True);
    }

    [Test]
    public void AutoApply_SupportsLimitedRedemptions()
    {
        var promotion = new Promotion
        {
            IsAutoApply = true,
            MaxAutoApplyRedemptions = 50,
            AutoApplyRedemptionCount = 25
        };

        Assert.That(promotion.IsAutoApply, Is.True);
        Assert.That(promotion.MaxAutoApplyRedemptions, Is.EqualTo(50));
        Assert.That(promotion.AutoApplyRedemptionCount, Is.EqualTo(25));

        // Simulating 25 more redemptions available
        var remaining = promotion.MaxAutoApplyRedemptions.Value - promotion.AutoApplyRedemptionCount;
        Assert.That(remaining, Is.EqualTo(25));
    }

    #endregion

    #region Validity Period Tests (3 tests)

    [Test]
    public void StartsAt_CanBeSetToFutureDate()
    {
        var futureDate = DateTime.UtcNow.AddDays(7);
        var promotion = new Promotion { StartsAt = futureDate };
        Assert.That(promotion.StartsAt, Is.EqualTo(futureDate));
    }

    [Test]
    public void ExpiresAt_CanBeSetToFutureDate()
    {
        var expiryDate = DateTime.UtcNow.AddMonths(3);
        var promotion = new Promotion { ExpiresAt = expiryDate };
        Assert.That(promotion.ExpiresAt, Is.EqualTo(expiryDate));
    }

    [Test]
    public void ValidityPeriod_SupportsStartAndExpiry()
    {
        var start = new DateTime(2025, 1, 1, 0, 0, 0);
        var expiry = new DateTime(2025, 3, 31, 23, 59, 59);
        var promotion = new Promotion
        {
            StartsAt = start,
            ExpiresAt = expiry,
            IsActive = true
        };

        Assert.That(promotion.StartsAt, Is.EqualTo(start));
        Assert.That(promotion.ExpiresAt, Is.EqualTo(expiry));
        Assert.That(promotion.IsActive, Is.True);

        var duration = (promotion.ExpiresAt.Value - promotion.StartsAt.Value).TotalDays;
        Assert.That(duration, Is.EqualTo(90).Within(0.1)); // ~3 months
    }

    #endregion

    #region Discount Configuration Tests (3 tests)

    [Test]
    public void PercentOff_CanBeSetForPercentageDiscount()
    {
        var promotion = new Promotion
        {
            DiscountType = "percent_off",
            PercentOff = 25.0m
        };

        Assert.That(promotion.DiscountType, Is.EqualTo("percent_off"));
        Assert.That(promotion.PercentOff, Is.EqualTo(25.0m));
    }

    [Test]
    public void AmountOff_CanBeSetForFixedDiscount()
    {
        var promotion = new Promotion
        {
            DiscountType = "amount_off",
            AmountOff = 1000, // $10.00 in cents
            Currency = "usd"
        };

        Assert.That(promotion.DiscountType, Is.EqualTo("amount_off"));
        Assert.That(promotion.AmountOff, Is.EqualTo(1000));
        Assert.That(promotion.Currency, Is.EqualTo("usd"));
    }

    [Test]
    public void Duration_SupportsRepeatingWithMonths()
    {
        var promotion = new Promotion
        {
            Duration = "repeating",
            DurationInMonths = 3
        };

        Assert.That(promotion.Duration, Is.EqualTo("repeating"));
        Assert.That(promotion.DurationInMonths, Is.EqualTo(3));
    }

    #endregion
}
