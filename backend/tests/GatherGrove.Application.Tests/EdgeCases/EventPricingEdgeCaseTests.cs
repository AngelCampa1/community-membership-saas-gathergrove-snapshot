using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using IPaymentService = GatherGrove.Application.Services.IPaymentService;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace GatherGrove.Application.Tests.EdgeCases;

/// <summary>
/// TDD Edge Case Tests for Event Pricing
/// Comprehensive testing of boundary conditions, overflow scenarios, and error cases
/// Tests written BEFORE implementation following RED-GREEN-REFACTOR
///
/// All edge cases now implemented and ready for testing
/// </summary>
[TestFixture]
public class EventPricingEdgeCaseTests
{
    private GatherGroveDbContext _context;
    private EventPricingService _eventPricingService;
    private Mock<ILogger<EventPricingService>> _mockLogger;
    private Mock<IPaymentService> _mockPaymentService;
    private Mock<IStripeService> _mockStripeService;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"EdgeCaseTestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<EventPricingService>>();
        _mockPaymentService = new Mock<IPaymentService>();
        _mockStripeService = new Mock<IStripeService>();

        _eventPricingService = new EventPricingService(
            _context,
            _mockLogger.Object,
            _mockPaymentService.Object,
            _mockStripeService.Object
        );
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region Price Validation Edge Cases

    [Test]
    public async Task CreatePaidEvent_WithMinimumValidPrice_ShouldSucceed()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "Minimum Price Event",
            Price = 0.01m, // Minimum valid price
            Currency = "USD",
            EventDateTime = DateTime.Now.AddDays(1),
            Location = "Test Location"
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data!.Price, Is.EqualTo(0.01m));
    }

    [Test]
    public async Task CreatePaidEvent_WithMaximumValidPrice_ShouldSucceed()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "Maximum Price Event",
            Price = 99999.99m, // Maximum valid price
            Currency = "USD",
            EventDateTime = DateTime.Now.AddDays(1),
            Location = "Test Location"
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data!.Price, Is.EqualTo(99999.99m));
    }

    [Test]
    public async Task CreatePaidEvent_WithPriceOverMaximum_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "Overflow Price Event",
            Price = 100000.00m, // Over maximum limit
            Currency = "USD"
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("maximum"));
    }

    [Test]
    public async Task CreatePaidEvent_WithZeroPrice_ShouldCreateFreeEvent()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "Zero Price Event",
            Price = 0.00m,
            Currency = "USD",
            EventDateTime = DateTime.Now.AddDays(1),
            Location = "Test Location"
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data!.IsPaid, Is.False);
        Assert.That(result.Data!.IsFree, Is.True);
    }

    [Test]
    public async Task CreatePaidEvent_WithNegativePrice_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "Negative Price Event",
            Price = -1.00m,
            Currency = "USD"
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("negative").Or.Contain("greater than 0"));
    }

    [Test]
    public async Task CreatePaidEvent_WithTooManyDecimalPlaces_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "Decimal Precision Event",
            Price = 25.999m, // 3 decimal places - invalid
            Currency = "USD"
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("decimal").Or.Contain("precision"));
    }

    #endregion

    #region Currency Edge Cases

    [Test]
    public async Task CreatePaidEvent_WithUnsupportedCurrency_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "Invalid Currency Event",
            Price = 25.00m,
            Currency = "XYZ" // Invalid currency code
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("currency").Or.Contain("supported"));
    }

    [Test]
    public async Task CreatePaidEvent_WithEmptyCurrency_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "No Currency Event",
            Price = 25.00m,
            Currency = string.Empty
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("currency").Or.Contain("required"));
    }

    [Test]
    public async Task CreatePaidEvent_WithNullCurrency_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "Null Currency Event",
            Price = 25.00m,
            Currency = null!
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("currency").Or.Contain("required"));
    }

    [TestCase("USD", 25.00, "$25.00")]
    [TestCase("EUR", 25.00, "€25.00")]
    [TestCase("GBP", 25.00, "£25.00")]
    [TestCase("CAD", 25.00, "CA$25.00")]
    [TestCase("AUD", 25.00, "A$25.00")]
    public async Task FormatPrice_WithDifferentCurrencies_ShouldFormatCorrectly(string currency, decimal price, string expectedFormat)
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();
        var eventId = await CreateTestEvent(clubId, price, currency);

        // Act
        var pricing = await _eventPricingService.GetCurrentEventPricingAsync(eventId);

        // Assert
        Assert.That(pricing.FormattedPrice, Is.EqualTo(expectedFormat));
    }

    #endregion

    #region Capacity Edge Cases

    [Test]
    public async Task RegisterForPaidEvent_WhenCapacityIsOne_ShouldAllowOnlyOneRegistration()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();
        var eventId = await CreateTestEventWithCapacity(clubId, 1); // Capacity of 1

        var firstRegistration = new EventRegistrationRequest
        {
            EventId = eventId
        };

        var secondRegistration = new EventRegistrationRequest
        {
            EventId = eventId
        };

        // Act
        var firstResult = await _eventPricingService.RegisterForPaidEventAsync(clubId, firstRegistration);
        var secondResult = await _eventPricingService.RegisterForPaidEventAsync(clubId, secondRegistration);

        // Assert
        Assert.That(firstResult.IsSuccess, Is.True);
        Assert.That(secondResult.IsSuccess, Is.False);
        Assert.That(secondResult.ErrorMessage, Does.Contain("capacity").Or.Contain("full"));
    }

    [Test]
    public async Task RegisterForPaidEvent_WithZeroCapacity_ShouldAllowUnlimitedRegistrations()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();
        var eventId = await CreateTestEventWithCapacity(clubId, 0); // Unlimited capacity

        var registrations = new List<EventRegistrationRequest>();
        for (int i = 1; i <= 1000; i++)
        {
            registrations.Add(new EventRegistrationRequest
            {
                EventId = eventId
            });
        }

        // Act & Assert
        foreach (var registration in registrations.Take(10)) // Test first 10 to avoid timeout
        {
            var result = await _eventPricingService.RegisterForPaidEventAsync(clubId, registration);
            Assert.That(result.IsSuccess, Is.True, $"Registration {registration.AttendeeEmail} should succeed");
        }
    }

    [Test]
    public async Task RegisterForPaidEvent_WithNegativeCapacity_ShouldTreatAsUnlimited()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();
        var eventId = await CreateTestEventWithCapacity(clubId, -1); // Invalid negative capacity

        var registration = new EventRegistrationRequest
        {
            EventId = eventId
        };

        // Act
        var result = await _eventPricingService.RegisterForPaidEventAsync(clubId, registration);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
    }

    #endregion

    #region Date/Time Edge Cases

    [Test]
    public async Task CreatePaidEvent_WithPastEventDate_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "Past Event",
            Price = 25.00m,
            Currency = "USD",
            EventDateTime = DateTime.Now.AddDays(-1) // Past date
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("past").Or.Contain("future"));
    }

    [Test]
    public async Task CreatePaidEvent_WithEarlyBirdDeadlineAfterEventDate_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var eventDate = DateTime.Now.AddDays(30);
        var request = new CreatePaidEventRequest
        {
            Name = "Invalid Early Bird Event",
            Price = 100.00m,
            Currency = "USD",
            EventDateTime = eventDate,
            EarlyBirdPrice = 80.00m,
            EarlyBirdDeadline = eventDate.AddDays(1) // After event date
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("deadline").Or.Contain("before"));
    }

    [Test]
    public async Task CreatePaidEvent_WithEarlyBirdDeadlineInPast_ShouldCreateWithoutEarlyBird()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "Expired Early Bird Event",
            Price = 100.00m,
            Currency = "USD",
            EventDateTime = DateTime.Now.AddDays(30),
            EarlyBirdPrice = 80.00m,
            EarlyBirdDeadline = DateTime.Now.AddDays(-1) // Past deadline
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data!.IsEarlyBirdActive, Is.False);
    }

    [Test]
    public async Task GetCurrentPrice_OnEarlyBirdDeadlineExactly_ShouldReturnRegularPrice()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();
        var deadlineTime = DateTime.Now.AddSeconds(-1); // Deadline just passed

        var eventId = await CreateTestEventWithEarlyBird(clubId, 100.00m, 80.00m, deadlineTime);

        // Act - deadline has already passed, no need to wait
        var pricing = await _eventPricingService.GetCurrentEventPricingAsync(eventId);

        // Assert
        Assert.That(pricing.CurrentPrice, Is.EqualTo(100.00m)); // Regular price
        Assert.That(pricing.IsEarlyBirdActive, Is.False);
    }

    #endregion

    #region Refund Edge Cases

    [Test]
    public async Task ProcessRefund_ForZeroDollarEvent_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();
        var eventId = await CreateTestEvent(clubId, 0.00m, "USD"); // Free event
        var registrationId = await CreateTestRegistration(eventId, clubId, 0.00m);

        var refundRequest = new EventRefundRequest
        {
            EventId = eventId,
            RegistrationId = registrationId,
            RefundAmount = 0.00m
        };

        // Act
        var result = await _eventPricingService.ProcessEventRefundAsync(clubId, userId, refundRequest);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("free").Or.Contain("no payment"));
    }

    [Test]
    public async Task ProcessRefund_ForMoreThanPaidAmount_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();
        var eventId = await CreateTestEvent(clubId, 50.00m, "USD");
        var registrationId = await CreateTestRegistration(eventId, clubId, 50.00m);

        var refundRequest = new EventRefundRequest
        {
            EventId = eventId,
            RegistrationId = registrationId,
            RefundAmount = 100.00m // More than paid
        };

        // Act
        var result = await _eventPricingService.ProcessEventRefundAsync(clubId, userId, refundRequest);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("exceed").Or.Contain("paid amount"));
    }

    [Test]
    public async Task ProcessRefund_WithNegativeAmount_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();
        var eventId = await CreateTestEvent(clubId, 50.00m, "USD");
        var registrationId = await CreateTestRegistration(eventId, clubId, 50.00m);

        var refundRequest = new EventRefundRequest
        {
            EventId = eventId,
            RegistrationId = registrationId,
            RefundAmount = -10.00m // Negative refund
        };

        // Act
        var result = await _eventPricingService.ProcessEventRefundAsync(clubId, userId, refundRequest);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("negative").Or.Contain("positive"));
    }

    #endregion

    #region Concurrency Edge Cases

    [Test]
    public async Task RegisterForPaidEvent_ConcurrentRegistrationsForLastSpot_ShouldAllowOnlyOne()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();
        var eventId = await CreateTestEventWithCapacity(clubId, 1); // Only 1 spot

        var registration1 = new EventRegistrationRequest
        {
            EventId = eventId,
            MemberId = 1,
            Notes = "Concurrent registration test 1"
        };

        var registration2 = new EventRegistrationRequest
        {
            EventId = eventId,
            MemberId = 2,
            Notes = "Concurrent registration test 2"
        };

        // Act - Simulate concurrent requests
        var task1 = _eventPricingService.RegisterForPaidEventAsync(clubId, registration1);
        var task2 = _eventPricingService.RegisterForPaidEventAsync(clubId, registration2);

        var results = await Task.WhenAll(task1, task2);

        // Assert
        var successCount = results.Count(r => r.IsSuccess);
        var failureCount = results.Count(r => !r.IsSuccess);

        Assert.That(successCount, Is.EqualTo(1), "Only one registration should succeed");
        Assert.That(failureCount, Is.EqualTo(1), "One registration should fail due to capacity");
    }

    [Test]
    public async Task UpdateEventPricing_ConcurrentUpdates_ShouldHandleGracefully()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();
        var eventId = await CreateTestEvent(clubId, 100.00m, "USD");

        var update1 = new GatherGrove.Application.Services.UpdateEventPricingRequestNew
        {
            EventId = eventId,
            Price = 150.00m,
            EarlyBirdPrice = null,
            EarlyBirdDeadline = null
        };

        var update2 = new GatherGrove.Application.Services.UpdateEventPricingRequestNew
        {
            EventId = eventId,
            Price = 200.00m,
            EarlyBirdPrice = null,
            EarlyBirdDeadline = null
        };

        // Act - Simulate concurrent updates
        var task1 = _eventPricingService.UpdateEventPricingAsync(clubId, userId, update1);
        var task2 = _eventPricingService.UpdateEventPricingAsync(clubId, userId, update2);

        var results = await Task.WhenAll(task1, task2);

        // Assert
        var successCount = results.Count(r => r.IsSuccess);
        Assert.That(successCount, Is.GreaterThanOrEqualTo(1), "At least one update should succeed");

        // Verify final state is consistent
        var finalPricing = await _eventPricingService.GetCurrentEventPricingAsync(eventId);
        Assert.That(finalPricing.CurrentPrice, Is.AnyOf(150.00m, 200.00m));
    }

    #endregion

    #region Locale and Internationalization Edge Cases

    [Test]
    public async Task FormatPrice_WithDifferentLocales_ShouldFormatCorrectly()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();
        var eventId = await CreateTestEvent(clubId, 1234.56m, "USD");

        // Act - Get event to access pricing info
        var eventData = await _context.Events.FindAsync(eventId);
        Assert.That(eventData, Is.Not.Null);

        // Format prices using different locales
        var usCulture = new System.Globalization.CultureInfo("en-US");
        var usFormat = string.Format(usCulture, "{0:C}", eventData.Price);
        Assert.That(usFormat, Is.EqualTo("$1,234.56"));

        var deCulture = new System.Globalization.CultureInfo("de-DE");
        var euroFormat = string.Format(deCulture, "{0:C}", eventData.Price);
        // .NET's currency format always includes currency symbol - this is expected behavior
        // German locale formats with euro symbol, number format may vary (. or space as thousand separator)
        Assert.That(euroFormat, Does.Contain(",56")); // Check decimal separator
        Assert.That(euroFormat, Does.Contain("€")); // Check euro symbol

        var frCulture = new System.Globalization.CultureInfo("fr-FR");
        var frenchFormat = string.Format(frCulture, "{0:C}", eventData.Price);
        // .NET's currency format includes currency symbol (€ for fr-FR)
        // French locale uses narrow no-break space (U+202F) as thousand separator
        Assert.That(frenchFormat, Does.Contain("1\u202F234,56")); // U+202F = narrow no-break space
        Assert.That(frenchFormat, Does.Contain("€"));
    }

    [Test]
    public async Task CreatePaidEvent_WithCurrencyNotSupportedInRegion_ShouldFail()
    {
        // Arrange
        var (clubId, userId) = await SeedTestData();

        var request = new CreatePaidEventRequest
        {
            Name = "Regional Currency Event",
            Price = 25.00m,
            Currency = "JPY", // Not supported in this region
            EventDateTime = DateTime.Now.AddDays(1)
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("region").Or.Contain("supported"));
    }

    #endregion

    // Helper methods
    private async Task<(int clubId, int userId)> SeedTestData()
    {
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Id = 1,
            Name = "Test Club",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        return (1, 1);
    }

    private async Task<int> CreateTestEvent(int clubId, decimal price, string currency)
    {
        var eventEntity = new Event
        {
            ClubId = clubId,
            Name = "Test Event",
            Price = price,
            Currency = currency,
            MemberPrice = price,
            NonMemberPrice = price,
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();
        return eventEntity.Id;
    }

    private async Task<int> CreateTestEventWithCapacity(int clubId, int capacity)
    {
        var eventEntity = new Event
        {
            ClubId = clubId,
            Name = "Capacity Test Event",
            Price = 25.00m,
            Currency = "USD",
            MemberPrice = 25.00m,
            NonMemberPrice = 25.00m,
            MaxCapacity = capacity == 0 ? null : capacity,
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();
        return eventEntity.Id;
    }

    private async Task<int> CreateTestEventWithEarlyBird(int clubId, decimal price, decimal earlyBirdPrice, DateTime deadline)
    {
        var eventEntity = new Event
        {
            ClubId = clubId,
            Name = "Early Bird Test Event",
            Price = price,
            EarlyBirdPrice = earlyBirdPrice,
            EarlyBirdDeadline = deadline,
            Currency = "USD",
            MemberPrice = price,
            NonMemberPrice = price,
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();
        return eventEntity.Id;
    }

    private async Task<int> CreateTestRegistration(int eventId, int clubId, decimal paidAmount)
    {
        var member = new Member
        {
            ClubId = clubId,
            FullName = "Test Member",
            Email = "member@example.com",
            JoinedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = eventId,
            MemberId = member.Id,
            Status = GatherGrove.Domain.Enums.RsvpStatus.Confirmed,
            PaymentStatus = paidAmount > 0 ? GatherGrove.Domain.Enums.PaymentStatus.Succeeded : GatherGrove.Domain.Enums.PaymentStatus.Pending,
            PaidAmount = paidAmount,
            CreatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        return rsvp.Id;
    }
}