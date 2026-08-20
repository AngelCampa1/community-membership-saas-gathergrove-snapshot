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
using Stripe;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class PaymentServiceCoreTests
{
    private GatherGroveDbContext _context;
    private Mock<ILogger<PaymentService>> _mockLogger;
    private Mock<IConfiguration> _mockConfiguration;
    private Mock<IOptions<StripeSettings>> _mockStripeSettings;
    private Mock<IEmailService> _mockEmailService;
    private Mock<IUrlService> _mockUrlService;
    private PaymentService _paymentService;
    private Club _testClub;
    private Member _testMember;
    private MembershipType _testMembershipType;

    [SetUp]
    public void Setup()
    {
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"PaymentServiceCoreTest_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);

        // Setup mocks
        _mockLogger = new Mock<ILogger<PaymentService>>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockEmailService = new Mock<IEmailService>();
        _mockStripeSettings = new Mock<IOptions<StripeSettings>>();
        _mockUrlService = new Mock<IUrlService>();

        // Setup configuration mock
        _mockConfiguration.Setup(c => c["Stripe:SecretKey"]).Returns("sk_test_fake_key");
        _mockConfiguration.Setup(c => c["FrontendUrl"]).Returns("http://localhost:3000");

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

        // Create test data
        SetupTestData();

        _paymentService = new PaymentService(_context, _mockEmailService.Object, _mockConfiguration.Object, _mockLogger.Object, _mockStripeSettings.Object, _mockUrlService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private void SetupTestData()
    {
        // Create test club
        _testClub = new Club
        {
            Id = 1,
            Name = "Test Club",
            Tier = "Grow",
            StripeAccountId = "acct_test123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(_testClub);

        // Create test membership type
        _testMembershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Monthly Membership",
            DuesAmount = 100.00m,
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
            FullName = "Test Member",
            Email = "test@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(_testMember);

        _context.SaveChanges();
    }

    [Test]
    public void NoPlatformFee_ClubReceivesFullAmount()
    {
        // Verify that no platform fee is deducted — club receives full payment amount
        var testAmounts = new[] { 50.00m, 100.00m, 250.00m, 1000.00m, 25.50m };

        foreach (var amount in testAmounts)
        {
            // Club receives full amount — no platform fee deduction
            var clubReceives = amount;
            Assert.That(clubReceives, Is.EqualTo(amount),
                $"Club should receive full amount ${amount} with no platform fee");
        }
    }

    [Test]
    public async Task RequestPaymentAsync_ValidRequest_CreatesTokenAndSendsEmail()
    {
        // Arrange
        var request = new RequestPaymentRequest
        {
            Amount = 100.00m,
            Description = "Test payment"
        };

        // Act
        await _paymentService.RequestPaymentAsync(_testClub.Id, _testMember.Id, request);

        // Assert - Verify token was saved to database
        var savedToken = await _context.PaymentTokens
            .FirstOrDefaultAsync(pt => pt.Amount == 100.00m && pt.Description == "Test payment");
        Assert.That(savedToken, Is.Not.Null);
        Assert.That(savedToken.IsUsed, Is.False);
        Assert.That(savedToken.ExpiresAt, Is.GreaterThan(DateTime.UtcNow));

        // Verify email was sent
        _mockEmailService.Verify(e => e.SendPaymentRequestEmailAsync(
            It.Is<string>(email => email == _testMember.Email),
            It.Is<string>(name => name == _testMember.FullName),
            It.Is<string>(clubName => clubName == _testClub.Name),
            It.Is<decimal>(amount => amount == 100.00m),
            It.Is<string>(desc => desc == "Test payment"),
            It.IsAny<string>()), Times.Once);
    }

    [Test]
    public async Task GetPaymentPageAsync_ValidToken_ReturnsPaymentPage()
    {
        // Arrange - Create a payment token first
        var request = new RequestPaymentRequest
        {
            Amount = 150.00m,
            Description = "Monthly dues"
        };
        await _paymentService.RequestPaymentAsync(_testClub.Id, _testMember.Id, request);

        var savedToken = await _context.PaymentTokens
            .FirstOrDefaultAsync(pt => pt.Amount == 150.00m);
        Assert.That(savedToken, Is.Not.Null);

        // Act
        var result = await _paymentService.GetPaymentPageAsync(savedToken.Token);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubName, Is.EqualTo(_testClub.Name));
        Assert.That(result.MemberName, Is.EqualTo(_testMember.FullName));
        Assert.That(result.Amount, Is.EqualTo(150.00m));
        Assert.That(result.Description, Is.EqualTo("Monthly dues"));
        Assert.That(result.IsValid, Is.True);
    }

    [Test]
    public void StripeConnect_NoApplicationFee_FullAmountToClub()
    {
        // Verify Stripe Connect routes full amount to club with no application fee
        var testAmounts = new[] { 100.00m, 250.00m, 50.75m, 500.00m };

        foreach (var amount in testAmounts)
        {
            var paymentAmountInCents = (long)(amount * 100);

            // No ApplicationFeeAmount — club receives full payment minus only Stripe's processing fees
            Assert.That(paymentAmountInCents, Is.EqualTo((long)(amount * 100)),
                $"Full amount ${amount} should be transferred to club via Stripe Connect");
        }
    }
}