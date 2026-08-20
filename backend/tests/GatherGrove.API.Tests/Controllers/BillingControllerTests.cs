using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;
using System.Net;
using System.Text;
using System.Text.Json;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Infrastructure.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using GatherGrove.API.Tests.Shared;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class BillingControllerTests
{
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;
    private string _databaseName = null!;
    private Mock<IBillingService> _mockBillingService = null!;
    private Mock<IPromotionService> _mockPromotionService = null!;

    [SetUp]
    public void Setup()
    {
        _databaseName = Guid.NewGuid().ToString();
        _mockBillingService = new Mock<IBillingService>();
        _mockPromotionService = new Mock<IPromotionService>();

        _factory = new TestWebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Replace the billing service with our mock
                    var billingDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(IBillingService));
                    if (billingDescriptor != null)
                        services.Remove(billingDescriptor);

                    services.AddScoped(_ => _mockBillingService.Object);

                    // Replace the promotion service with our mock
                    var promotionDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(IPromotionService));
                    if (promotionDescriptor != null)
                        services.Remove(promotionDescriptor);

                    services.AddScoped(_ => _mockPromotionService.Object);
                });
            });

        _client = _factory.CreateClient();
    }

    [TearDown]
    public void TearDown()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }

    private async Task<(User user, Club club)> CreateTestUserAndClub()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        var user = new User
        {
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow"
        };

        var clubAdmin = new ClubAdmin
        {
            User = user,
            Club = club
        };

        context.Users.Add(user);
        context.Clubs.Add(club);
        context.ClubAdmins.Add(clubAdmin);
        await context.SaveChangesAsync();

        return (user, club);
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync(User user)
    {
        // Get the club ID for this user
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        var clubAdmin = await context.ClubAdmins
            .Include(ca => ca.Club)
            .FirstAsync(ca => ca.UserId == user.Id);

        var clubId = clubAdmin.ClubId;

        // Use test authentication headers instead of JWT tokens
        var client = _factory.CreateClient();
        client.WithTestAuth(
            userId: user.Id,
            clubId: clubId,
            isAdmin: true,
            role: "Admin",
            hasUnlimitedTier: true
        );

        return client;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Test]
    public async Task GetBillingStatus_WithValidClubId_ReturnsOkWithBillingStatus()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var expectedResponse = new BillingStatusResponse
        {
            CurrentTier = "Grow",
            HasActiveSubscription = false,
            MemberCount = 1,
            MemberLimit = 200,
            CanUpgrade = true,
            SubscriptionId = null,
            SubscriptionStatus = null,
            NextBillingDate = null
        };

        _mockBillingService
            .Setup(x => x.GetBillingStatusAsync(club.Id))
            .ReturnsAsync(expectedResponse);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.GetAsync($"/api/v1/billing/status");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var content = await response.Content.ReadAsStringAsync();
        var actualResponse = JsonSerializer.Deserialize<BillingStatusResponse>(content, JsonOptions);

        Assert.That(actualResponse, Is.Not.Null);
        Assert.That(actualResponse.CurrentTier, Is.EqualTo(expectedResponse.CurrentTier));
        Assert.That(actualResponse.HasActiveSubscription, Is.EqualTo(expectedResponse.HasActiveSubscription));
        Assert.That(actualResponse.MemberCount, Is.EqualTo(expectedResponse.MemberCount));
        Assert.That(actualResponse.MemberLimit, Is.EqualTo(expectedResponse.MemberLimit));
        Assert.That(actualResponse.CanUpgrade, Is.EqualTo(expectedResponse.CanUpgrade));

        _mockBillingService.Verify(x => x.GetBillingStatusAsync(club.Id), Times.Once);
    }

    [Test]
    public async Task GetBillingStatus_WithUnauthorizedUser_ReturnsUnauthorized()
    {
        // Arrange
        var client = _client;

        // Act
        var response = await client.GetAsync("/api/v1/billing/status");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task GetBillingStatus_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockBillingService
            .Setup(x => x.GetBillingStatusAsync(club.Id))
            .ThrowsAsync(new Exception("Service error"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.GetAsync("/api/v1/billing/status");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.InternalServerError));
    }

    [Test]
    public async Task GetBillingStatus_WithArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockBillingService
            .Setup(x => x.GetBillingStatusAsync(club.Id))
            .ThrowsAsync(new ArgumentException("Club not found"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.GetAsync("/api/v1/billing/status");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task UpgradeSubscription_WithValidRequest_ReturnsOkWithUpgradeResponse()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpgradeSubscriptionRequest
        {
            PlanId = "price_grow_monthly",
            PaymentMethodId = "pm_test123",
            TargetTier = "Grow",
            BillingCycle = "monthly"
        };

        var expectedResponse = new UpgradeSubscriptionResponse
        {
            SubscriptionId = "sub_test123",
            NewTier = "Grow",
            NextBillingDate = DateTime.UtcNow.AddMonths(1),
            Status = "active",
            Message = "Subscription upgraded successfully"
        };

        _mockBillingService
            .Setup(x => x.UpgradeSubscriptionAsync(club.Id, It.IsAny<UpgradeSubscriptionRequest>()))
            .ReturnsAsync(expectedResponse);

        var client = await CreateAuthenticatedClientAsync(user);
        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/v1/billing/upgrade", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseContent = await response.Content.ReadAsStringAsync();
        var actualResponse = JsonSerializer.Deserialize<UpgradeSubscriptionResponse>(responseContent, JsonOptions);

        Assert.That(actualResponse, Is.Not.Null);
        Assert.That(actualResponse.SubscriptionId, Is.EqualTo(expectedResponse.SubscriptionId));
        Assert.That(actualResponse.NewTier, Is.EqualTo(expectedResponse.NewTier));
        Assert.That(actualResponse.Status, Is.EqualTo(expectedResponse.Status));
        Assert.That(actualResponse.Message, Is.EqualTo(expectedResponse.Message));

        _mockBillingService.Verify(
            x => x.UpgradeSubscriptionAsync(club.Id, It.Is<UpgradeSubscriptionRequest>(r =>
                r.PlanId == request.PlanId && r.PaymentMethodId == request.PaymentMethodId &&
                r.TargetTier == request.TargetTier && r.BillingCycle == request.BillingCycle)),
            Times.Once);
    }

    [Test]
    public async Task UpgradeSubscription_WithInvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpgradeSubscriptionRequest
        {
            PlanId = "", // Invalid empty plan ID
            PaymentMethodId = "pm_test123",
            TargetTier = "Grow",
            BillingCycle = "monthly"
        };

        var client = await CreateAuthenticatedClientAsync(user);
        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/v1/billing/upgrade", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task UpgradeSubscription_WithUnauthorizedUser_ReturnsUnauthorized()
    {
        // Arrange
        var client = _client;
        var request = new UpgradeSubscriptionRequest
        {
            PlanId = "price_grow_monthly",
            PaymentMethodId = "pm_test123",
            TargetTier = "Grow",
            BillingCycle = "monthly"
        };
        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/v1/billing/upgrade", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task UpgradeSubscription_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpgradeSubscriptionRequest
        {
            PlanId = "price_grow_monthly",
            PaymentMethodId = "pm_test123",
            TargetTier = "Grow",
            BillingCycle = "monthly"
        };

        // Mock the billing service to throw a generic exception that should trigger InternalServerError
        _mockBillingService
            .Setup(x => x.UpgradeSubscriptionAsync(club.Id, It.IsAny<UpgradeSubscriptionRequest>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        var client = await CreateAuthenticatedClientAsync(user);
        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/v1/billing/upgrade", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.InternalServerError));
    }

    [Test]
    public async Task ClaimTrial_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var expected = new ClaimTrialResponse
        {
            Success = true,
            Message = "Trial claimed",
            SubscriptionId = "sub_trial_123",
            TrialEndsAt = DateTime.UtcNow.AddDays(30)
        };

        _mockBillingService
            .Setup(x => x.ClaimTrialAsync(club.Id, "Grow", "pm_test", It.IsAny<string>()))
            .ReturnsAsync(expected);

        var client = await CreateAuthenticatedClientAsync(user);
        var requestBody = new ClaimTrialRequest { PaymentMethodId = "pm_test", TargetTier = "Grow" };
        var json = JsonSerializer.Serialize(requestBody, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/v1/billing/claim-trial", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        _mockBillingService.Verify(x => x.ClaimTrialAsync(club.Id, "Grow", "pm_test", It.IsAny<string>()), Times.Once);
    }

    [Test]
    public async Task CreateCustomerPortalSession_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var expected = new CreateCustomerPortalSessionResponse
        {
            Url = "https://billing.stripe.com/session/test"
        };

        _mockBillingService
            .Setup(x => x.CreateCustomerPortalSessionAsync(club.Id))
            .ReturnsAsync(expected);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.PostAsync("/api/v1/billing/customer-portal-session", new StringContent("", Encoding.UTF8, "application/json"));

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        _mockBillingService.Verify(x => x.CreateCustomerPortalSessionAsync(club.Id), Times.Once);
    }

    [Test]
    public async Task CancelSubscription_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockBillingService
            .Setup(x => x.CancelSubscriptionAsync(club.Id))
            .ReturnsAsync(true);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.PostAsync("/api/v1/billing/cancel", new StringContent("", Encoding.UTF8, "application/json"));

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        _mockBillingService.Verify(x => x.CancelSubscriptionAsync(club.Id), Times.Once);
    }

    [Test]
    public async Task CancelSubscription_WithUnauthorizedUser_ReturnsUnauthorized()
    {
        // Arrange
        var client = _client;

        // Act
        var response = await client.PostAsync("/api/v1/billing/cancel", new StringContent("", Encoding.UTF8, "application/json"));

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task CancelSubscription_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        _mockBillingService
            .Setup(x => x.CancelSubscriptionAsync(club.Id))
            .ThrowsAsync(new Exception("Cancellation failed"));

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.PostAsync("/api/v1/billing/cancel", new StringContent("", Encoding.UTF8, "application/json"));

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.InternalServerError));
    }

    [Test]
    public async Task ProcessWebhook_WithValidPayload_ReturnsOk()
    {
        // Arrange
        var webhookPayload = "{\"type\":\"customer.subscription.updated\",\"data\":{\"object\":{\"id\":\"sub_test\"}}}";
        var webhookSignature = "t=123456789,v1=test_signature";

        _mockBillingService
            .Setup(x => x.ProcessWebhookAsync(webhookPayload, webhookSignature))
            .ReturnsAsync(true);

        var client = _client;
        var content = new StringContent(webhookPayload, Encoding.UTF8, "application/json");
        content.Headers.Add("Stripe-Signature", webhookSignature);

        // Act
        var response = await client.PostAsync("/api/v1/billing/webhook", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        _mockBillingService.Verify(x => x.ProcessWebhookAsync(webhookPayload, webhookSignature), Times.Once);
    }

    [Test]
    public async Task ProcessWebhook_WithMissingSignature_ReturnsBadRequest()
    {
        // Arrange
        var webhookPayload = "{\"type\":\"customer.subscription.updated\"}";

        var client = _client;
        var content = new StringContent(webhookPayload, Encoding.UTF8, "application/json");
        // Missing Stripe-Signature header

        // Act
        var response = await client.PostAsync("/api/v1/billing/webhook", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task ProcessWebhook_WithInvalidPayload_ReturnsBadRequest()
    {
        // Arrange
        var webhookPayload = "invalid json";
        var webhookSignature = "t=123456789,v1=test_signature";

        _mockBillingService
            .Setup(x => x.ProcessWebhookAsync(webhookPayload, webhookSignature))
            .ThrowsAsync(new ArgumentException("Invalid payload"));

        var client = _client;
        var content = new StringContent(webhookPayload, Encoding.UTF8, "application/json");
        content.Headers.Add("Stripe-Signature", webhookSignature);

        // Act
        var response = await client.PostAsync("/api/v1/billing/webhook", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task ProcessWebhook_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var webhookPayload = "{\"type\":\"customer.subscription.updated\"}";
        var webhookSignature = "t=123456789,v1=test_signature";

        _mockBillingService
            .Setup(x => x.ProcessWebhookAsync(webhookPayload, webhookSignature))
            .ThrowsAsync(new Exception("Webhook processing failed"));

        var client = _client;
        var content = new StringContent(webhookPayload, Encoding.UTF8, "application/json");
        content.Headers.Add("Stripe-Signature", webhookSignature);

        // Act
        var response = await client.PostAsync("/api/v1/billing/webhook", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.InternalServerError));
    }

    [Test]
    public async Task GetBillingStatus_WithGrowTier_ReturnsCorrectData()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var expectedResponse = new BillingStatusResponse
        {
            CurrentTier = "Grow",
            HasActiveSubscription = true,
            MemberCount = 25,
            MemberLimit = int.MaxValue,
            CanUpgrade = false,
            SubscriptionId = "sub_test123",
            SubscriptionStatus = "active",
            NextBillingDate = DateTime.UtcNow.AddMonths(1)
        };

        _mockBillingService
            .Setup(x => x.GetBillingStatusAsync(club.Id))
            .ReturnsAsync(expectedResponse);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.GetAsync($"/api/v1/billing/status");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var content = await response.Content.ReadAsStringAsync();
        var actualResponse = JsonSerializer.Deserialize<BillingStatusResponse>(content, JsonOptions);

        Assert.That(actualResponse, Is.Not.Null);
        Assert.That(actualResponse.CurrentTier, Is.EqualTo("Grow"));
        Assert.That(actualResponse.HasActiveSubscription, Is.True);
        Assert.That(actualResponse.CanUpgrade, Is.False);
        Assert.That(actualResponse.SubscriptionId, Is.EqualTo("sub_test123"));
    }

    [Test]
    public async Task UpgradeSubscription_WithInvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpgradeSubscriptionRequest
        {
            PlanId = "price_grow_monthly",
            PaymentMethodId = "pm_test123",
            TargetTier = "Grow",
            BillingCycle = "monthly"
        };

        _mockBillingService
            .Setup(x => x.UpgradeSubscriptionAsync(club.Id, It.IsAny<UpgradeSubscriptionRequest>()))
            .ThrowsAsync(new InvalidOperationException("Club is already on the Grow tier"));

        var client = await CreateAuthenticatedClientAsync(user);
        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/v1/billing/upgrade", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    #region Promotion Endpoint Tests

    [Test]
    public async Task GetActivePromotion_WithNoActivePromotion_ReturnsOkWithNoPromotion()
    {
        // Arrange
        _mockPromotionService
            .Setup(x => x.GetActivePromotionResponseAsync())
            .ReturnsAsync(new ActivePromotionResponse
            {
                HasActivePromotion = false,
                Promotion = null,
                RedemptionsRemaining = null
            });

        // Act - No authentication required (AllowAnonymous)
        var response = await _client.GetAsync("/api/v1/billing/active-promotion");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ActivePromotionResponse>(content, JsonOptions);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.HasActivePromotion, Is.False);
        Assert.That(result.Promotion, Is.Null);

        _mockPromotionService.Verify(x => x.GetActivePromotionResponseAsync(), Times.Once);
    }

    [Test]
    public async Task GetActivePromotion_WithActivePromotion_ReturnsOkWithPromotionDetails()
    {
        // Arrange
        var expectedPromotion = new PromotionResponse
        {
            PromotionId = 0,
            Name = "Launch Offer - 3 Months Free",
            Description = null,
            PromoCode = "LAUNCH100",
            DiscountType = "percent_off",
            PercentOff = 100,
            AmountOff = null,
            Currency = null,
            Duration = "repeating",
            DurationInMonths = 3,
            DiscountDescription = "100% off for 3 months"
        };

        _mockPromotionService
            .Setup(x => x.GetActivePromotionResponseAsync())
            .ReturnsAsync(new ActivePromotionResponse
            {
                HasActivePromotion = true,
                Promotion = expectedPromotion,
                RedemptionsRemaining = 75
            });

        // Act
        var response = await _client.GetAsync("/api/v1/billing/active-promotion");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ActivePromotionResponse>(content, JsonOptions);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.HasActivePromotion, Is.True);
        Assert.That(result.Promotion, Is.Not.Null);
        Assert.That(result.Promotion!.Name, Is.EqualTo("Launch Offer - 3 Months Free"));
        Assert.That(result.Promotion.PromoCode, Is.EqualTo("LAUNCH100"));
        Assert.That(result.Promotion.DiscountDescription, Is.EqualTo("100% off for 3 months"));
        Assert.That(result.RedemptionsRemaining, Is.EqualTo(75));
    }

    [Test]
    public async Task GetActivePromotion_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        _mockPromotionService
            .Setup(x => x.GetActivePromotionResponseAsync())
            .ThrowsAsync(new Exception("Stripe API error"));

        // Act
        var response = await _client.GetAsync("/api/v1/billing/active-promotion");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.InternalServerError));
    }

    [Test]
    public async Task ValidatePromoCode_WithValidCode_ReturnsOkWithPromotionDetails()
    {
        // Arrange
        var request = new ValidatePromoCodeRequest { PromoCode = "LAUNCH100" };
        var expectedPromotion = new PromotionResponse
        {
            PromotionId = 0,
            Name = "Launch Offer",
            PromoCode = "LAUNCH100",
            DiscountType = "percent_off",
            PercentOff = 100,
            Duration = "repeating",
            DurationInMonths = 3,
            DiscountDescription = "100% off for 3 months"
        };

        _mockPromotionService
            .Setup(x => x.ValidatePromoCodeAsync("LAUNCH100"))
            .ReturnsAsync(new ValidatePromoCodeResponse
            {
                IsValid = true,
                ErrorMessage = null,
                Promotion = expectedPromotion
            });

        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act - No authentication required (AllowAnonymous)
        var response = await _client.PostAsync("/api/v1/billing/validate-promo", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ValidatePromoCodeResponse>(responseContent, JsonOptions);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.ErrorMessage, Is.Null);
        Assert.That(result.Promotion, Is.Not.Null);
        Assert.That(result.Promotion!.PromoCode, Is.EqualTo("LAUNCH100"));

        _mockPromotionService.Verify(x => x.ValidatePromoCodeAsync("LAUNCH100"), Times.Once);
    }

    [Test]
    public async Task ValidatePromoCode_WithInvalidCode_ReturnsOkWithErrorMessage()
    {
        // Arrange
        var request = new ValidatePromoCodeRequest { PromoCode = "INVALIDCODE" };

        _mockPromotionService
            .Setup(x => x.ValidatePromoCodeAsync("INVALIDCODE"))
            .ReturnsAsync(new ValidatePromoCodeResponse
            {
                IsValid = false,
                ErrorMessage = "Invalid promo code",
                Promotion = null
            });

        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/billing/validate-promo", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ValidatePromoCodeResponse>(responseContent, JsonOptions);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Invalid promo code"));
        Assert.That(result.Promotion, Is.Null);
    }

    [Test]
    public async Task ValidatePromoCode_WithExpiredCode_ReturnsOkWithExpirationMessage()
    {
        // Arrange
        var request = new ValidatePromoCodeRequest { PromoCode = "EXPIRED2023" };

        _mockPromotionService
            .Setup(x => x.ValidatePromoCodeAsync("EXPIRED2023"))
            .ReturnsAsync(new ValidatePromoCodeResponse
            {
                IsValid = false,
                ErrorMessage = "This promo code has expired",
                Promotion = null
            });

        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/billing/validate-promo", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ValidatePromoCodeResponse>(responseContent, JsonOptions);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("This promo code has expired"));
    }

    [Test]
    public async Task ValidatePromoCode_WithRedemptionLimitReached_ReturnsOkWithLimitMessage()
    {
        // Arrange
        var request = new ValidatePromoCodeRequest { PromoCode = "LIMITREACHED" };

        _mockPromotionService
            .Setup(x => x.ValidatePromoCodeAsync("LIMITREACHED"))
            .ReturnsAsync(new ValidatePromoCodeResponse
            {
                IsValid = false,
                ErrorMessage = "This promo code has reached its redemption limit",
                Promotion = null
            });

        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/billing/validate-promo", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ValidatePromoCodeResponse>(responseContent, JsonOptions);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("This promo code has reached its redemption limit"));
    }

    [Test]
    public async Task ValidatePromoCode_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new ValidatePromoCodeRequest { PromoCode = "TESTCODE" };

        _mockPromotionService
            .Setup(x => x.ValidatePromoCodeAsync("TESTCODE"))
            .ThrowsAsync(new Exception("Stripe API error"));

        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/billing/validate-promo", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.InternalServerError));
    }

    [Test]
    public async Task ValidatePromoCode_WithEmptyPromoCode_ReturnsBadRequest()
    {
        // Arrange
        var request = new ValidatePromoCodeRequest { PromoCode = "" };

        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/v1/billing/validate-promo", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task UpgradeSubscription_WithPromoCode_PassesCodeToService()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpgradeSubscriptionRequest
        {
            PlanId = "price_grow_monthly",
            PaymentMethodId = "pm_test123",
            TargetTier = "Grow",
            BillingCycle = "monthly",
            PromoCode = "LAUNCH100"
        };

        var expectedResponse = new UpgradeSubscriptionResponse
        {
            SubscriptionId = "sub_test123",
            NewTier = "Grow",
            NextBillingDate = DateTime.UtcNow.AddMonths(1),
            Status = "active",
            Message = "Subscription upgraded successfully with promotion: Launch Offer",
            AppliedPromotionName = "Launch Offer",
            AppliedDiscountDescription = "100% off for 3 months"
        };

        _mockBillingService
            .Setup(x => x.UpgradeSubscriptionAsync(club.Id, It.Is<UpgradeSubscriptionRequest>(r => r.PromoCode == "LAUNCH100")))
            .ReturnsAsync(expectedResponse);

        var client = await CreateAuthenticatedClientAsync(user);
        var json = JsonSerializer.Serialize(request, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/v1/billing/upgrade", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseContent = await response.Content.ReadAsStringAsync();
        var actualResponse = JsonSerializer.Deserialize<UpgradeSubscriptionResponse>(responseContent, JsonOptions);

        Assert.That(actualResponse, Is.Not.Null);
        Assert.That(actualResponse.AppliedPromotionName, Is.EqualTo("Launch Offer"));
        Assert.That(actualResponse.AppliedDiscountDescription, Is.EqualTo("100% off for 3 months"));

        _mockBillingService.Verify(
            x => x.UpgradeSubscriptionAsync(club.Id, It.Is<UpgradeSubscriptionRequest>(r => r.PromoCode == "LAUNCH100")),
            Times.Once);
    }

    [Test]
    public async Task GetBillingStatus_WithAppliedPromotion_ReturnsPromotionDetails()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var expectedResponse = new BillingStatusResponse
        {
            CurrentTier = "Grow",
            HasActiveSubscription = true,
            MemberCount = 10,
            MemberLimit = 200,
            CanUpgrade = true,
            SubscriptionId = "sub_test123",
            SubscriptionStatus = "active",
            NextBillingDate = DateTime.UtcNow.AddMonths(1),
            AppliedPromotionName = "Launch Offer",
            ActiveDiscountDescription = "100% off for 3 months"
        };

        _mockBillingService
            .Setup(x => x.GetBillingStatusAsync(club.Id))
            .ReturnsAsync(expectedResponse);

        var client = await CreateAuthenticatedClientAsync(user);

        // Act
        var response = await client.GetAsync("/api/v1/billing/status");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var content = await response.Content.ReadAsStringAsync();
        var actualResponse = JsonSerializer.Deserialize<BillingStatusResponse>(content, JsonOptions);

        Assert.That(actualResponse, Is.Not.Null);
        Assert.That(actualResponse.AppliedPromotionName, Is.EqualTo("Launch Offer"));
        Assert.That(actualResponse.ActiveDiscountDescription, Is.EqualTo("100% off for 3 months"));
    }

    #endregion
}
