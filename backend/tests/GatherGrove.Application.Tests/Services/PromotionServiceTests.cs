using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using Stripe;
using GatherGrove.Application.Configuration;
using GatherGrove.Application.Services;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class PromotionServiceTests
{
    private Mock<ILogger<PromotionService>> _mockLogger = null!;
    private Mock<IOptions<StripeSettings>> _mockStripeSettings = null!;
    private PromotionService _promotionService = null!;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<PromotionService>>();
        _mockStripeSettings = new Mock<IOptions<StripeSettings>>();

        _mockStripeSettings.Setup(x => x.Value).Returns(new StripeSettings
        {
            SecretKey = "sk_test_fake_key_for_testing",
            PublishableKey = "pk_test_fake_key",
            WebhookSecret = "whsec_test"
        });

        _promotionService = new PromotionService(_mockLogger.Object, _mockStripeSettings.Object);
    }

    #region ValidatePromoCodeAsync Tests

    [Test]
    public async Task ValidatePromoCodeAsync_WithNullCode_ReturnsInvalid()
    {
        // Act
        var result = await _promotionService.ValidatePromoCodeAsync(null!);

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Promo code is required"));
        Assert.That(result.Promotion, Is.Null);
    }

    [Test]
    public async Task ValidatePromoCodeAsync_WithEmptyCode_ReturnsInvalid()
    {
        // Act
        var result = await _promotionService.ValidatePromoCodeAsync("");

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Promo code is required"));
    }

    [Test]
    public async Task ValidatePromoCodeAsync_WithWhitespaceCode_ReturnsInvalid()
    {
        // Act
        var result = await _promotionService.ValidatePromoCodeAsync("   ");

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Promo code is required"));
    }

    [Test]
    public async Task ValidatePromoCodeAsync_WithInvalidStripeKey_ReturnsErrorGracefully()
    {
        // Arrange - using fake key will cause Stripe API error

        // Act
        var result = await _promotionService.ValidatePromoCodeAsync("TESTCODE");

        // Assert - should handle error gracefully
        Assert.That(result.IsValid, Is.False);
        // Either "Invalid promo code" or "Unable to validate" depending on error type
        Assert.That(result.ErrorMessage, Is.Not.Null);
    }

    #endregion

    #region GetActivePromotionResponseAsync Tests

    [Test]
    public async Task GetActivePromotionResponseAsync_WithInvalidStripeKey_ReturnsNoPromotion()
    {
        // Act
        var result = await _promotionService.GetActivePromotionResponseAsync();

        // Assert - should handle error gracefully and return no promotion
        Assert.That(result.HasActivePromotion, Is.False);
        Assert.That(result.Promotion, Is.Null);
    }

    #endregion

    #region GetStripePromotionCodeIdAsync Tests

    [Test]
    public async Task GetStripePromotionCodeIdAsync_WithNullCode_ReturnsNull()
    {
        // Act
        var result = await _promotionService.GetStripePromotionCodeIdAsync(null!);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetStripePromotionCodeIdAsync_WithEmptyCode_ReturnsNull()
    {
        // Act
        var result = await _promotionService.GetStripePromotionCodeIdAsync("");

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetStripePromotionCodeIdAsync_WithWhitespaceCode_ReturnsNull()
    {
        // Act
        var result = await _promotionService.GetStripePromotionCodeIdAsync("   ");

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region GetStripeCouponIdAsync Tests

    [Test]
    public async Task GetStripeCouponIdAsync_WithNullCode_ReturnsNull()
    {
        // Act
        var result = await _promotionService.GetStripeCouponIdAsync(null!);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetStripeCouponIdAsync_WithEmptyCode_ReturnsNull()
    {
        // Act
        var result = await _promotionService.GetStripeCouponIdAsync("");

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetStripeCouponIdAsync_WithWhitespaceCode_ReturnsNull()
    {
        // Act
        var result = await _promotionService.GetStripeCouponIdAsync("   ");

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region Logging Tests

    [Test]
    public async Task ValidatePromoCodeAsync_WithEmptyCode_DoesNotLogError()
    {
        // Act
        await _promotionService.ValidatePromoCodeAsync("");

        // Assert - should not log error for expected validation failure
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
    }

    #endregion
}

/// <summary>
/// Integration tests that require actual Stripe API access
/// These tests are skipped by default - run manually with valid Stripe test keys
/// </summary>
[TestFixture]
[Category("Integration")]
[Category("Stripe")]
public class PromotionServiceIntegrationTests
{
    private Mock<ILogger<PromotionService>> _mockLogger = null!;
    private Mock<IOptions<StripeSettings>> _mockStripeSettings = null!;
    private PromotionService _promotionService = null!;
    private string? _stripeSecretKey;

    [SetUp]
    public void Setup()
    {
        // Try to get Stripe key from environment variable
        _stripeSecretKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");

        _mockLogger = new Mock<ILogger<PromotionService>>();
        _mockStripeSettings = new Mock<IOptions<StripeSettings>>();

        _mockStripeSettings.Setup(x => x.Value).Returns(new StripeSettings
        {
            SecretKey = _stripeSecretKey ?? "sk_test_not_configured",
            PublishableKey = "pk_test_fake",
            WebhookSecret = "whsec_test"
        });

        _promotionService = new PromotionService(_mockLogger.Object, _mockStripeSettings.Object);
    }

    private bool HasValidStripeKey => !string.IsNullOrEmpty(_stripeSecretKey) && _stripeSecretKey.StartsWith("sk_test_");

    [Test]
    public async Task ValidatePromoCodeAsync_WithRealStripeKey_AndInvalidCode_ReturnsInvalid()
    {
        if (!HasValidStripeKey)
        {
            Assert.Ignore("Skipping: STRIPE_SECRET_KEY environment variable not set or not a test key");
            return;
        }

        // Act
        var result = await _promotionService.ValidatePromoCodeAsync("INVALID_CODE_12345");

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Invalid promo code"));
    }

    [Test]
    public async Task GetActivePromotionResponseAsync_WithRealStripeKey_ReturnsValidResponse()
    {
        if (!HasValidStripeKey)
        {
            Assert.Ignore("Skipping: STRIPE_SECRET_KEY environment variable not set or not a test key");
            return;
        }

        // Act
        var result = await _promotionService.GetActivePromotionResponseAsync();

        // Assert - should return a valid response (may or may not have active promotion)
        Assert.That(result, Is.Not.Null);
        // HasActivePromotion can be true or false depending on Stripe setup
        if (result.HasActivePromotion)
        {
            Assert.That(result.Promotion, Is.Not.Null);
            Assert.That(result.Promotion!.Name, Is.Not.Null.And.Not.Empty);
            Assert.That(result.Promotion.DiscountDescription, Is.Not.Null);
        }
    }

    /// <summary>
    /// This test requires a promotion code to exist in Stripe with the code "TESTPROMO"
    /// Create it manually in Stripe Dashboard for this test to pass
    /// </summary>
    [Test]
    [Explicit("Requires TESTPROMO promotion code to exist in Stripe")]
    public async Task ValidatePromoCodeAsync_WithRealStripeKey_AndValidCode_ReturnsValid()
    {
        if (!HasValidStripeKey)
        {
            Assert.Ignore("Skipping: STRIPE_SECRET_KEY environment variable not set or not a test key");
            return;
        }

        // Act
        var result = await _promotionService.ValidatePromoCodeAsync("TESTPROMO");

        // Assert
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.Promotion, Is.Not.Null);
        Assert.That(result.Promotion!.PromoCode, Is.EqualTo("TESTPROMO").IgnoreCase);
    }
}
