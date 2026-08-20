using NUnit.Framework;
using GatherGrove.Application.DTOs;
using DataAnnotations = System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.Tests.DTOs;

/// <summary>
/// TDD tests for Seed tier DTO validation.
/// Written FIRST (Red phase) before production code is updated.
/// Tests verify that "Seed" is accepted as a valid TargetTier value
/// in both UpgradeSubscriptionRequest and ClaimTrialRequest.
/// </summary>
[TestFixture]
public class SeedTierDtoValidationTests
{
    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private static IList<DataAnnotations.ValidationResult> Validate(object model)
    {
        var results = new List<DataAnnotations.ValidationResult>();
        var context = new DataAnnotations.ValidationContext(model);
        DataAnnotations.Validator.TryValidateObject(model, context, results, validateAllProperties: true);
        return results;
    }

    // ---------------------------------------------------------------------------
    // UpgradeSubscriptionRequest — TargetTier validation
    // ---------------------------------------------------------------------------

    [Test]
    public void UpgradeSubscriptionRequest_TargetTierSeed_PassesValidation()
    {
        // Arrange
        var request = new UpgradeSubscriptionRequest
        {
            PlanId = "price_SEED_MONTHLY",
            PaymentMethodId = "pm_test_123",
            TargetTier = "Seed",
            BillingCycle = "monthly"
        };

        // Act
        var results = Validate(request);

        // Assert — no validation error for TargetTier
        var tierErrors = results.Where(r => r.MemberNames.Contains(nameof(UpgradeSubscriptionRequest.TargetTier))).ToList();
        Assert.That(tierErrors, Is.Empty,
            "TargetTier = 'Seed' should pass regex validation but got errors: " +
            string.Join(", ", tierErrors.Select(e => e.ErrorMessage)));
    }

    [TestCase("Grow")]
    [TestCase("Unlimited")]
    public void UpgradeSubscriptionRequest_ExistingTiers_StillPassValidation(string tier)
    {
        var request = new UpgradeSubscriptionRequest
        {
            PlanId = "price_test",
            PaymentMethodId = "pm_test_123",
            TargetTier = tier,
            BillingCycle = "monthly"
        };

        var results = Validate(request);
        var tierErrors = results.Where(r => r.MemberNames.Contains(nameof(UpgradeSubscriptionRequest.TargetTier))).ToList();
        Assert.That(tierErrors, Is.Empty, $"TargetTier = '{tier}' should still pass validation");
    }

    [TestCase("Free")]
    [TestCase("seed")]   // case-sensitive
    [TestCase("SEED")]
    [TestCase("")]
    public void UpgradeSubscriptionRequest_InvalidTier_FailsValidation(string invalidTier)
    {
        var request = new UpgradeSubscriptionRequest
        {
            PlanId = "price_test",
            PaymentMethodId = "pm_test_123",
            TargetTier = invalidTier,
            BillingCycle = "monthly"
        };

        var results = Validate(request);
        // Either a Required or a RegularExpression error should be present
        Assert.That(results, Is.Not.Empty, $"TargetTier = '{invalidTier}' should fail validation");
    }

    // ---------------------------------------------------------------------------
    // ClaimTrialRequest — TargetTier validation
    // ---------------------------------------------------------------------------

    [Test]
    public void ClaimTrialRequest_TargetTierSeed_PassesValidation()
    {
        // Arrange
        var request = new ClaimTrialRequest
        {
            PaymentMethodId = "pm_test_456",
            TargetTier = "Seed",
            BillingCycle = "monthly"
        };

        // Act
        var results = Validate(request);

        // Assert
        var tierErrors = results.Where(r => r.MemberNames.Contains(nameof(ClaimTrialRequest.TargetTier))).ToList();
        Assert.That(tierErrors, Is.Empty,
            "TargetTier = 'Seed' should pass regex validation but got errors: " +
            string.Join(", ", tierErrors.Select(e => e.ErrorMessage)));
    }

    [Test]
    public void ClaimTrialRequest_DefaultTargetTier_IsSeed()
    {
        // Arrange — instantiate without setting TargetTier
        var request = new ClaimTrialRequest
        {
            PaymentMethodId = "pm_test_456"
        };

        // Assert
        Assert.That(request.TargetTier, Is.EqualTo("Seed"),
            "Default TargetTier should be 'Seed' after the Seed tier is introduced");
    }

    [TestCase("Grow")]
    [TestCase("Unlimited")]
    public void ClaimTrialRequest_ExistingTiers_StillPassValidation(string tier)
    {
        var request = new ClaimTrialRequest
        {
            PaymentMethodId = "pm_test_456",
            TargetTier = tier
        };

        var results = Validate(request);
        var tierErrors = results.Where(r => r.MemberNames.Contains(nameof(ClaimTrialRequest.TargetTier))).ToList();
        Assert.That(tierErrors, Is.Empty, $"TargetTier = '{tier}' should still pass validation");
    }

    [TestCase("Free")]
    [TestCase("seed")]
    [TestCase("SEED")]
    public void ClaimTrialRequest_InvalidTier_FailsValidation(string invalidTier)
    {
        var request = new ClaimTrialRequest
        {
            PaymentMethodId = "pm_test_456",
            TargetTier = invalidTier
        };

        var results = Validate(request);
        var tierErrors = results.Where(r => r.MemberNames.Contains(nameof(ClaimTrialRequest.TargetTier))).ToList();
        Assert.That(tierErrors, Is.Not.Empty, $"TargetTier = '{invalidTier}' should fail validation");
    }
}
