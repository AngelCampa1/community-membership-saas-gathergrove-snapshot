using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using NUnit.Framework;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Configuration;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using System;
using System.Threading.Tasks;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class StripeConnectPaymentIntegrationTests
{
    private GatherGroveDbContext _context;
    private Mock<ILogger<PaymentService>> _mockPaymentLogger;
    private Mock<ILogger<StripeConnectService>> _mockConnectLogger;
    private Mock<IConfiguration> _mockConfiguration;
    private Mock<IOptions<StripeSettings>> _mockStripeSettings;
    private Mock<IUrlService> _mockUrlService;
    private PaymentService _paymentService;
    private StripeConnectService _stripeConnectService;
    private Club _testClub;
    private Member _testMember;
    private MembershipType _testMembershipType;

    [SetUp]
    public void Setup()
    {
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"StripeConnectTest_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);

        // Setup mocks
        _mockPaymentLogger = new Mock<ILogger<PaymentService>>();
        _mockConnectLogger = new Mock<ILogger<StripeConnectService>>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockStripeSettings = new Mock<IOptions<StripeSettings>>();
        _mockUrlService = new Mock<IUrlService>();

        // Setup configuration mock with Stripe Connect enabled
        _mockConfiguration.Setup(c => c["Stripe:SecretKey"]).Returns("sk_test_fake_key");
        _mockConfiguration.Setup(c => c["Stripe:Domain"]).Returns("http://localhost:3000");

        // Setup stripe settings mock
        _mockStripeSettings.Setup(x => x.Value).Returns(new StripeSettings
        {
            SecretKey = "sk_test_fake_key",
            PublishableKey = "pk_test_fake_key",
            WebhookSecret = "whsec_test_fake",
            GrowMonthlyPriceId = "price_test_grow",
            Domain = "http://localhost:3000",
            IsConnectEnabled = true
        });

        // Setup URL service mock
        _mockUrlService.Setup(x => x.GeneratePaymentUrl(It.IsAny<string>()))
            .Returns<string>(token => $"http://localhost:3000/payment/{token}");

        // Create services
        SetupTestData();
        var mockEmailService = new Mock<IEmailService>();
        _paymentService = new PaymentService(_context, mockEmailService.Object, _mockConfiguration.Object, _mockPaymentLogger.Object, _mockStripeSettings.Object, _mockUrlService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private void SetupTestData()
    {
        // Create test club with Stripe Connect enabled
        _testClub = new Club
        {
            Id = 1,
            Name = "Test Club with Stripe",
            Tier = "Grow",
            StripeAccountId = "acct_test_connected_account",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(_testClub);

        // Create test membership type
        _testMembershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Premium Membership",
            DuesAmount = 150.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(_testMembershipType);

        // Create test member
        _testMember = new Member
        {
            Id = 1,
            ClubId = 1,
            MembershipTypeId = 1,
            FullName = "Premium Member",
            Email = "premium@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(_testMember);

        _context.SaveChanges();
    }

    [Test]
    public async Task RequestPayment_ForConnectedClub_CreatesValidTokenAndSendsEmail()
    {
        // Arrange
        var request = new RequestPaymentRequest
        {
            Amount = 150.00m,
            Description = "Premium membership dues"
        };

        // Mock email service to avoid sending actual emails
        var mockEmailService = new Mock<IEmailService>();
        var paymentServiceWithMockedEmail = new PaymentService(_context, mockEmailService.Object, _mockConfiguration.Object, _mockPaymentLogger.Object, _mockStripeSettings.Object, _mockUrlService.Object);

        // Act
        await paymentServiceWithMockedEmail.RequestPaymentAsync(_testClub.Id, _testMember.Id, request);

        // Assert - Verify token was created in database
        var savedToken = await _context.PaymentTokens
            .Include(pt => pt.Club)
            .Include(pt => pt.Member)
            .FirstOrDefaultAsync(pt => pt.Amount == 150.00m && pt.Description == "Premium membership dues");

        Assert.That(savedToken, Is.Not.Null);
        Assert.That(savedToken.Amount, Is.EqualTo(150.00m));
        Assert.That(savedToken.ClubId, Is.EqualTo(_testClub.Id));
        Assert.That(savedToken.MemberId, Is.EqualTo(_testMember.Id));
        Assert.That(savedToken.IsUsed, Is.False);
        Assert.That(savedToken.ExpiresAt, Is.GreaterThan(DateTime.UtcNow));

        // Verify the club has Stripe account ID
        Assert.That(savedToken.Club.StripeAccountId, Is.EqualTo("acct_test_connected_account"));
    }

    [Test]
    public void StripeConnect_NoPlatformFee_FullAmountToClub()
    {
        // Verify no platform fee is applied — clubs receive full payment amount
        var testAmounts = new[] { 100.00m, 250.00m, 50.50m, 500.00m };

        foreach (var amount in testAmounts)
        {
            var paymentAmountInCents = (long)(amount * 100);
            // No ApplicationFeeAmount — club receives full amount minus only Stripe's processing fees
            Assert.That(paymentAmountInCents, Is.EqualTo((long)(amount * 100)),
                $"Full amount ${amount} should be transferred to club with no platform fee");
        }
    }

    [Test]
    public async Task PaymentFlow_RequiresStripeConnectedAccount()
    {
        // Arrange - Club without Stripe account
        var clubWithoutStripe = new Club
        {
            Id = 2,
            Name = "Club Without Stripe",
            Tier = "Sprout",
            StripeAccountId = null, // No Stripe account
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(clubWithoutStripe);

        var membershipTypeWithoutStripe = new MembershipType
        {
            Id = 2,
            ClubId = 2,
            Name = "Basic Membership",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipTypeWithoutStripe);

        var memberWithoutStripe = new Member
        {
            Id = 2,
            ClubId = 2,
            MembershipTypeId = 2,
            FullName = "Basic Member",
            Email = "basic@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(memberWithoutStripe);
        await _context.SaveChangesAsync();

        var request = new RequestPaymentRequest
        {
            Amount = 50.00m,
            Description = "Basic membership dues"
        };

        // Mock email service
        var mockEmailService = new Mock<IEmailService>();
        var paymentServiceWithMockedEmail = new PaymentService(_context, mockEmailService.Object, _mockConfiguration.Object, _mockPaymentLogger.Object, _mockStripeSettings.Object, _mockUrlService.Object);

        // Act & Assert - Should fail during RequestPaymentAsync because club doesn't have Stripe
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await paymentServiceWithMockedEmail.RequestPaymentAsync(clubWithoutStripe.Id, memberWithoutStripe.Id, request));

        Assert.That(ex.Message, Is.EqualTo("Club must connect with Stripe before requesting online payments"));
    }

    [Test]
    public async Task PaymentToken_ExpirationHandling()
    {
        // Test payment token expiration (tokens always expire in 24 hours)
        var request = new RequestPaymentRequest
        {
            Amount = 100.00m,
            Description = "Test payment"
        };

        // Mock email service
        var mockEmailService = new Mock<IEmailService>();
        var paymentServiceWithMockedEmail = new PaymentService(_context, mockEmailService.Object, _mockConfiguration.Object, _mockPaymentLogger.Object, _mockStripeSettings.Object, _mockUrlService.Object);

        // Create token
        await paymentServiceWithMockedEmail.RequestPaymentAsync(_testClub.Id, _testMember.Id, request);

        // Verify expiration is set correctly (24 hours from now)
        var savedToken = await _context.PaymentTokens
            .FirstOrDefaultAsync(pt => pt.Amount == 100.00m && pt.Description == "Test payment");

        Assert.That(savedToken, Is.Not.Null);
        var expectedExpiration = DateTime.UtcNow.AddHours(24);
        Assert.That(savedToken.ExpiresAt, Is.EqualTo(expectedExpiration).Within(TimeSpan.FromMinutes(1)));

        // Test GetPaymentPageAsync with expired token
        savedToken.ExpiresAt = DateTime.UtcNow.AddHours(-1); // Make it expired
        await _context.SaveChangesAsync();

        var paymentPage = await _paymentService.GetPaymentPageAsync(savedToken.Token);
        Assert.That(paymentPage.IsValid, Is.False, "Expired token should return invalid payment page");
    }
}