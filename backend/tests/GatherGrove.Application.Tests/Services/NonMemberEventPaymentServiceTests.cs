using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class NonMemberEventPaymentServiceTests
{
    private GatherGroveDbContext _context = null!;
    private Mock<IEmailService> _mockEmailService = null!;
    private Mock<IConfiguration> _mockConfiguration = null!;
    private Mock<ILogger<NonMemberEventPaymentService>> _mockLogger = null!;
    private NonMemberEventPaymentService _service = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockEmailService = new Mock<IEmailService>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockLogger = new Mock<ILogger<NonMemberEventPaymentService>>();

        // Setup Stripe configuration
        _mockConfiguration.Setup(c => c["Stripe:SecretKey"]).Returns("sk_test_dummy");
        _mockConfiguration.Setup(c => c["App:FrontendUrl"]).Returns("https://test.com");

        _service = new NonMemberEventPaymentService(
            _context,
            _mockEmailService.Object,
            _mockConfiguration.Object,
            _mockLogger.Object
        );
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(Club club, Event eventEntity, MembershipType membershipType)> CreateTestEventAsync(
        decimal nonMemberPrice = 50m,
        bool isFree = false,
        bool hasStripeAccount = true)
    {
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            StripeAccountId = hasStripeAccount ? "acct_test123" : null,
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var eventEntity = new Event
        {
            ClubId = club.Id,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddMonths(1),
            Location = "Test Location",
            Description = "Test Description",
            NonMemberPrice = isFree ? 0 : nonMemberPrice,
            MemberPrice = isFree ? 0 : nonMemberPrice * 0.8m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Individual",
            Description = "Individual membership",
            DuesAmount = 100m,
            DuesFrequency = "Annual",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        return (club, eventEntity, membershipType);
    }

    [Test]
    public void ProcessNonMemberPaymentAsync_WithMissingGuestName_ThrowsArgumentException()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test",
            GuestName = "",
            GuestEmail = "test@example.com",
            CreateAccount = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.ProcessNonMemberEventPaymentAsync(request));

        Assert.That(ex.Message, Does.Contain("Guest name is required"));
        Assert.That(ex.ParamName, Is.EqualTo("GuestName"));
    }

    [Test]
    public void ProcessNonMemberPaymentAsync_WithMissingGuestEmail_ThrowsArgumentException()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test",
            GuestName = "Test User",
            GuestEmail = "",
            CreateAccount = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.ProcessNonMemberEventPaymentAsync(request));

        Assert.That(ex.Message, Does.Contain("Guest email is required"));
        Assert.That(ex.ParamName, Is.EqualTo("GuestEmail"));
    }

    [Test]
    public void ProcessNonMemberPaymentAsync_WithCreateAccountButNoPassword_ThrowsArgumentException()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 1,
            PaymentMethodId = "pm_test",
            GuestName = "Test User",
            GuestEmail = "test@example.com",
            CreateAccount = true,
            Password = ""
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.ProcessNonMemberEventPaymentAsync(request));

        Assert.That(ex.Message, Does.Contain("Password is required when creating an account"));
        Assert.That(ex.ParamName, Is.EqualTo("Password"));
    }

    [Test]
    public async Task ProcessNonMemberPaymentAsync_WithNonExistentEvent_ThrowsArgumentException()
    {
        // Arrange
        var request = new NonMemberEventPaymentRequest
        {
            EventId = 999,
            PaymentMethodId = "pm_test",
            GuestName = "Test User",
            GuestEmail = "test@example.com",
            CreateAccount = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.ProcessNonMemberEventPaymentAsync(request));

        Assert.That(ex.Message, Does.Contain("Event with ID 999 not found"));
    }

    [Test]
    public async Task ProcessNonMemberPaymentAsync_WithFreeEvent_ThrowsInvalidOperationException()
    {
        // Arrange
        var (club, eventEntity, _) = await CreateTestEventAsync(isFree: true);

        var request = new NonMemberEventPaymentRequest
        {
            EventId = eventEntity.Id,
            PaymentMethodId = "pm_test",
            GuestName = "Test User",
            GuestEmail = "test@example.com",
            CreateAccount = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.ProcessNonMemberEventPaymentAsync(request));

        Assert.That(ex.Message, Does.Contain("This event does not require payment"));
    }

    [Test]
    public async Task ProcessNonMemberPaymentAsync_WithNoStripeAccount_ThrowsInvalidOperationException()
    {
        // Arrange
        var (club, eventEntity, _) = await CreateTestEventAsync(hasStripeAccount: false);

        var request = new NonMemberEventPaymentRequest
        {
            EventId = eventEntity.Id,
            PaymentMethodId = "pm_test",
            GuestName = "Test User",
            GuestEmail = "test@example.com",
            CreateAccount = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.ProcessNonMemberEventPaymentAsync(request));

        Assert.That(ex.Message, Does.Contain("has not configured online payments"));
    }

    [Test]
    public async Task ProcessNonMemberPaymentAsync_WithInvalidMembershipType_ThrowsArgumentException()
    {
        // Arrange
        var (club, eventEntity, _) = await CreateTestEventAsync();

        var request = new NonMemberEventPaymentRequest
        {
            EventId = eventEntity.Id,
            PaymentMethodId = "pm_test",
            GuestName = "Test User",
            GuestEmail = "test@example.com",
            MembershipTypeId = 999,
            CreateAccount = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.ProcessNonMemberEventPaymentAsync(request));

        Assert.That(ex.Message, Does.Contain("Invalid membership type selected"));
    }

    [Test]
    public async Task GetAvailableMembershipTypesAsync_WithValidEvent_ReturnsMembershipTypes()
    {
        // Arrange
        var (club, eventEntity, membershipType) = await CreateTestEventAsync();

        // Add another membership type
        var premiumType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Premium",
            Description = "Premium membership",
            DuesAmount = 200m,
            DuesFrequency = "Annual",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(premiumType);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetAvailableMembershipTypesForEventAsync(eventEntity.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result[0].DuesAmount, Is.LessThanOrEqualTo(result[1].DuesAmount)); // Should be ordered by price
        Assert.That(result.All(mt => mt.IsActive), Is.True);
    }

    [Test]
    public async Task GetAvailableMembershipTypesAsync_WithNonExistentEvent_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetAvailableMembershipTypesForEventAsync(999));

        Assert.That(ex.Message, Does.Contain("Event with ID 999 not found"));
    }

    [Test]
    public async Task GetAvailableMembershipTypesAsync_ReturnsOnlyActiveTypes()
    {
        // Arrange
        var (club, eventEntity, activeMembership) = await CreateTestEventAsync();

        // Add inactive membership type
        var inactiveType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Inactive",
            Description = "Inactive membership",
            DuesAmount = 150m,
            DuesFrequency = "Annual",
            IsActive = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(inactiveType);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetAvailableMembershipTypesForEventAsync(eventEntity.Id);

        // Assert
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].Name, Is.EqualTo("Individual"));
        Assert.That(result.All(mt => mt.IsActive), Is.True);
    }

    [Test]
    public async Task GetAvailableMembershipTypesAsync_IncludesAllRequiredFields()
    {
        // Arrange
        var (club, eventEntity, membershipType) = await CreateTestEventAsync();

        // Act
        var result = await _service.GetAvailableMembershipTypesForEventAsync(eventEntity.Id);

        // Assert
        var type = result.First();
        Assert.That(type.Id, Is.GreaterThan(0));
        Assert.That(type.ClubId, Is.EqualTo(club.Id));
        Assert.That(type.Name, Is.EqualTo("Individual"));
        Assert.That(type.Description, Is.EqualTo("Individual membership"));
        Assert.That(type.DuesAmount, Is.EqualTo(100m));
        Assert.That(type.DuesFrequency, Is.EqualTo("Annual"));
        Assert.That(type.IsActive, Is.True);
        Assert.That(type.CreatedAt, Is.Not.EqualTo(default(DateTime)));
        Assert.That(type.UpdatedAt, Is.Not.EqualTo(default(DateTime)));
    }

    // Note: Full payment processing tests would require mocking Stripe API calls
    // which is complex and should be done with integration tests or E2E tests
    // These tests cover the validation and data access logic
}

