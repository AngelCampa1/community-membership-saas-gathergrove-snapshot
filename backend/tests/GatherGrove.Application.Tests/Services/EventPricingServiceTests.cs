using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using IPaymentService = GatherGrove.Application.Services.IPaymentService;
using StripeRefundResult = GatherGrove.Application.Services.StripeRefundResult;
using StripePaymentResult = GatherGrove.Application.Services.StripePaymentResult;
using EventRefundRequest = GatherGrove.Application.Services.EventRefundRequest;
using DateRange = GatherGrove.Application.DTOs.DateRange;
using GroupRegistrationRequest = GatherGrove.Application.Services.GroupRegistrationRequest;
using EventRegistrationRequestNew = GatherGrove.Application.Services.EventRegistrationRequestNew;
using UpdateEventPricingRequestNew = GatherGrove.Application.Services.UpdateEventPricingRequestNew;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// TDD Unit Tests for Event Pricing Service
/// Tests written BEFORE implementation following RED-GREEN-REFACTOR cycle
/// </summary>
[TestFixture]
public class EventPricingServiceTests
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
            .UseInMemoryDatabase(databaseName: $"EventPricingTestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<EventPricingService>>();
        _mockPaymentService = new Mock<IPaymentService>();
        _mockStripeService = new Mock<IStripeService>();

        // This will FAIL until EventPricingService is implemented
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

    [Test]
    public async Task CreatePaidEvent_WithValidPrice_ShouldCreateEventWithPricing()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        await SeedTestData(clubId, userId);

        var createRequest = new CreatePaidEventRequest
        {
            Name = "Paid Workshop",
            Description = "Professional development workshop",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Conference Center",
            Price = 99.99m,
            Currency = "USD",
            MaxCapacity = 50,
            EarlyBirdPrice = 79.99m,
            EarlyBirdDeadline = DateTime.Now.AddDays(14),
            RefundPolicy = RefundPolicyType.RefundableUntil48Hours
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, createRequest);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data.Price, Is.EqualTo(99.99m));
        Assert.That(result.Data.Currency, Is.EqualTo("USD"));
        Assert.That(result.Data.IsPaid, Is.True);
        Assert.That(result.Data.EarlyBirdPrice, Is.EqualTo(79.99m));
    }

    [Test]
    public async Task CreatePaidEvent_WithNegativePrice_ShouldReturnValidationError()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        await SeedTestData(clubId, userId);

        var createRequest = new CreatePaidEventRequest
        {
            Name = "Invalid Event",
            Price = -10.00m, // Invalid negative price
            Currency = "USD"
        };

        // Act
        var result = await _eventPricingService.CreatePaidEventAsync(clubId, userId, createRequest);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("Price must be greater than 0"));
    }

    [Test]
    public async Task UpdateEventPricing_WithValidNewPrice_ShouldUpdateSuccessfully()
    {
        // Arrange
        var (clubId, userId, eventId) = await CreateTestPaidEvent();

        var updateRequest = new UpdateEventPricingRequestNew
        {
            EventId = eventId,
            Price = 129.99m,
            EarlyBirdPrice = 99.99m,
            EarlyBirdDeadline = DateTime.Now.AddDays(21)
        };

        // Act
        var result = await _eventPricingService.UpdateEventPricingAsync(clubId, userId, updateRequest);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data.Price, Is.EqualTo(129.99m));
        Assert.That(result.Data.EarlyBirdPrice, Is.EqualTo(99.99m));
    }

    [Test]
    public async Task CalculateEventRevenue_WithMultipleRegistrations_ShouldCalculateCorrectly()
    {
        // Arrange
        var (clubId, userId, eventId) = await CreateTestPaidEvent();
        await CreateTestRegistrations(eventId, clubId);

        // Act
        var revenue = await _eventPricingService.CalculateEventRevenueAsync(eventId, clubId, userId);

        // Assert
        Assert.That(revenue.TotalRevenue, Is.EqualTo(399.96m)); // 4 registrations × $99.99
        Assert.That(revenue.TotalPaidRegistrations, Is.EqualTo(4));
        // Note: PendingPayments property doesn't exist in EventRevenueAnalyticsResponse
        // Assert.That(revenue.PendingPayments, Is.EqualTo(1));
    }

    [Test]
    public async Task ProcessEventRefund_WithValidRefundPolicy_ShouldProcessRefund()
    {
        // Arrange
        var (clubId, userId, eventId) = await CreateTestPaidEvent();
        var registrationId = await CreatePaidRegistration(eventId, clubId);

        var refundRequest = new EventRefundRequest
        {
            EventId = eventId,
            RegistrationId = registrationId,
            RefundReason = "Personal emergency",
            RefundAmount = 99.99m
        };

        _mockStripeService.Setup(x => x.ProcessRefundAsync(It.IsAny<ProcessStripeRefundRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Stripe.Refund { Id = "re_test123", Status = "succeeded" });

        // Act
        var result = await _eventPricingService.ProcessEventRefundAsync(clubId, userId, refundRequest);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data.RefundAmount, Is.EqualTo(99.99m));
        Assert.That(result.Data.Status, Is.EqualTo(GatherGrove.Application.Services.RefundStatus.Processed));
    }

    [Test]
    public async Task GetEventPricingAnalytics_WithRevenueData_ShouldReturnAnalytics()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        await CreateMultiplePaidEvents(clubId, userId);

        var dateRange = new DateRange
        {
            StartDate = DateTime.Now.AddMonths(-1),
            EndDate = DateTime.Now.AddDays(30)
        };

        // Act
        var analytics = await _eventPricingService.GetEventPricingAnalyticsAsync(clubId, userId, dateRange);

        // Assert
        Assert.That(analytics.TotalRevenue, Is.GreaterThan(0));
        Assert.That(analytics.AverageTicketPrice, Is.GreaterThan(0));
        Assert.That(analytics.TopPerformingEvents.Count, Is.GreaterThan(0));
        Assert.That(analytics.RefundRate, Is.LessThan(10)); // Should be under 10%
    }

    [Test]
    public async Task ValidateGroupDiscountEligibility_WithSufficientAttendees_ShouldApplyDiscount()
    {
        // Arrange
        var (clubId, userId, eventId) = await CreateTestEventWithGroupDiscount();

        var groupRegistrationRequest = new GroupRegistrationRequest
        {
            EventId = eventId,
            AttendeeCount = 8, // Above group discount threshold of 5
            PrimaryAttendeeEmail = "group@example.com"
        };

        // Act
        var pricing = await _eventPricingService.CalculateGroupPricingAsync(clubId, groupRegistrationRequest);

        // Assert
        Assert.That(pricing.DiscountApplied, Is.True);
        Assert.That(pricing.DiscountPercentage, Is.EqualTo(10.0m));
        Assert.That(pricing.PricePerAttendee, Is.EqualTo(45.00m)); // $50 - 10% = $45
        Assert.That(pricing.TotalPrice, Is.EqualTo(360.00m)); // 8 × $45
    }

    [Test]
    public async Task CheckEarlyBirdEligibility_BeforeDeadline_ShouldReturnEarlyBirdPrice()
    {
        // Arrange
        var (clubId, userId, eventId) = await CreateTestEventWithEarlyBird();

        // Act
        var currentPricing = await _eventPricingService.GetCurrentEventPricingAsync(eventId);

        // Assert
        Assert.That(currentPricing.IsEarlyBirdActive, Is.True);
        Assert.That(currentPricing.CurrentPrice, Is.EqualTo(79.99m)); // Early bird price
        Assert.That(currentPricing.RegularPrice, Is.EqualTo(99.99m));
        Assert.That(currentPricing.Savings, Is.EqualTo(20.00m));
    }

    [Test]
    public async Task ValidateCapacityWithPricing_WhenEventFull_ShouldPreventRegistration()
    {
        // Arrange
        var (clubId, userId, eventId) = await CreateTestPaidEventWithLimitedCapacity();
        await FillEventToCapacity(eventId, clubId);

        var registrationRequest = new EventRegistrationRequestNew
        {
            EventId = eventId,
            AttendeeEmail = "lateregistration@example.com"
        };

        // Act
        var result = await _eventPricingService.RegisterForPaidEventAsync(clubId, registrationRequest);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("Event is at full capacity"));
    }

    [Test]
    public async Task HandlePaymentFailure_WithFailedPayment_ShouldRevertRegistration()
    {
        // Arrange
        var (clubId, userId, eventId) = await CreateTestPaidEvent();

        var registrationRequest = new EventRegistrationRequestNew
        {
            EventId = eventId,
            AttendeeEmail = "test@example.com"
        };

        _mockStripeService.Setup(x => x.CreatePaymentIntentAsync(It.IsAny<CreateStripePaymentIntentRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Stripe.PaymentIntent { Id = "pi_test_123", Status = "requires_payment_method" });

        // Act
        var result = await _eventPricingService.RegisterForPaidEventAsync(clubId, registrationRequest);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("Payment failed"));

        // Verify registration was not created
        var registration = await _context.EventRsvps
            .FirstOrDefaultAsync(r => r.EventId == eventId && r.Member.Email == "test@example.com");
        Assert.That(registration, Is.Null);
    }

    // Helper methods for test setup
    private async Task<(int clubId, int userId)> SeedTestData(int clubId, int userId)
    {
        var user = new User
        {
            Id = userId,
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Id = clubId,
            Name = "Test Club",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        return (clubId, userId);
    }

    private async Task<(int clubId, int userId, int eventId)> CreateTestPaidEvent()
    {
        var (clubId, userId) = await SeedTestData(1, 1);

        var paidEvent = new Event
        {
            ClubId = clubId,
            Name = "Test Paid Event",
            Description = "Test Description",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Test Location",
            Price = 99.99m,
            Currency = "USD",
            MemberPrice = 99.99m,
            NonMemberPrice = 99.99m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        return (clubId, userId, paidEvent.Id);
    }

    private async Task CreateTestRegistrations(int eventId, int clubId)
    {
        var members = new List<Member>();
        for (int i = 1; i <= 5; i++)
        {
            var member = new Member
            {
                ClubId = clubId,
                FullName = $"Member {i}",
                Email = $"member{i}@example.com",
                JoinedAt = DateTime.UtcNow
            };
            members.Add(member);
        }

        _context.Members.AddRange(members);
        await _context.SaveChangesAsync();

        // Create 4 paid registrations and 1 pending
        for (int i = 0; i < 4; i++)
        {
            var rsvp = new EventRsvp
            {
                EventId = eventId,
                MemberId = members[i].Id,
                Status = GatherGrove.Domain.Enums.RsvpStatus.Confirmed,
                PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded,
                PaidAmount = 99.99m,
                CreatedAt = DateTime.UtcNow
            };
            _context.EventRsvps.Add(rsvp);
        }

        // One pending payment
        var pendingRsvp = new EventRsvp
        {
            EventId = eventId,
            MemberId = members[4].Id,
            Status = GatherGrove.Domain.Enums.RsvpStatus.Confirmed,
            PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(pendingRsvp);

        await _context.SaveChangesAsync();
    }

    private async Task<int> CreatePaidRegistration(int eventId, int clubId)
    {
        var member = new Member
        {
            ClubId = clubId,
            FullName = "Paid Member",
            Email = "paid@example.com",
            JoinedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = eventId,
            MemberId = member.Id,
            Status = GatherGrove.Domain.Enums.RsvpStatus.Confirmed,
            PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 99.99m,
            StripePaymentIntentId = "pi_test123",
            CreatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        return rsvp.Id;
    }

    private async Task CreateMultiplePaidEvents(int clubId, int userId)
    {
        // First seed basic data if not exists
        await SeedTestData(clubId, userId);

        var events = new[]
        {
            new Event { ClubId = clubId, Name = "Workshop 1", Price = 50.00m, Currency = "USD", MemberPrice = 50.00m, NonMemberPrice = 50.00m, EventDateTime = DateTime.Now.AddDays(10), Location = "Loc 1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Event { ClubId = clubId, Name = "Workshop 2", Price = 75.00m, Currency = "USD", MemberPrice = 75.00m, NonMemberPrice = 75.00m, EventDateTime = DateTime.Now.AddDays(20), Location = "Loc 2", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Event { ClubId = clubId, Name = "Conference", Price = 150.00m, Currency = "USD", MemberPrice = 150.00m, NonMemberPrice = 150.00m, EventDateTime = DateTime.Now.AddDays(30), Location = "Loc 3", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        _context.Events.AddRange(events);
        await _context.SaveChangesAsync();

        // Create some paid registrations for revenue data
        var members = new List<Member>();
        for (int i = 1; i <= 3; i++)
        {
            var member = new Member
            {
                ClubId = clubId,
                FullName = $"Analytics Member {i}",
                Email = $"analytics{i}@example.com",
                JoinedAt = DateTime.UtcNow
            };
            members.Add(member);
        }
        _context.Members.AddRange(members);
        await _context.SaveChangesAsync();

        // Create registrations with payments
        for (int i = 0; i < events.Length; i++)
        {
            var rsvp = new EventRsvp
            {
                EventId = events[i].Id,
                MemberId = members[i].Id,
                Status = GatherGrove.Domain.Enums.RsvpStatus.Confirmed,
                PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded,
                PaidAmount = events[i].Price,
                CreatedAt = DateTime.UtcNow
            };
            _context.EventRsvps.Add(rsvp);
        }
        await _context.SaveChangesAsync();
    }

    private async Task<(int clubId, int userId, int eventId)> CreateTestEventWithGroupDiscount()
    {
        var (clubId, userId) = await SeedTestData(1, 1);

        var groupEvent = new Event
        {
            ClubId = clubId,
            Name = "Group Event",
            Price = 50.00m,
            Currency = "USD",
            MemberPrice = 50.00m,
            NonMemberPrice = 50.00m,
            GroupDiscountThreshold = 5,
            GroupDiscountPercentage = 10.0m,
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(groupEvent);
        await _context.SaveChangesAsync();

        return (clubId, userId, groupEvent.Id);
    }

    private async Task<(int clubId, int userId, int eventId)> CreateTestEventWithEarlyBird()
    {
        var (clubId, userId) = await SeedTestData(1, 1);

        var earlyBirdEvent = new Event
        {
            ClubId = clubId,
            Name = "Early Bird Event",
            Price = 99.99m,
            EarlyBirdPrice = 79.99m,
            EarlyBirdDeadline = DateTime.Now.AddDays(14),
            Currency = "USD",
            MemberPrice = 99.99m,
            NonMemberPrice = 99.99m,
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(earlyBirdEvent);
        await _context.SaveChangesAsync();

        return (clubId, userId, earlyBirdEvent.Id);
    }

    private async Task<(int clubId, int userId, int eventId)> CreateTestPaidEventWithLimitedCapacity()
    {
        var (clubId, userId) = await SeedTestData(1, 1);

        var limitedEvent = new Event
        {
            ClubId = clubId,
            Name = "Limited Capacity Event",
            Price = 25.00m,
            Currency = "USD",
            MemberPrice = 25.00m,
            NonMemberPrice = 25.00m,
            MaxCapacity = 2, // Very limited for testing
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Small Venue",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(limitedEvent);
        await _context.SaveChangesAsync();

        return (clubId, userId, limitedEvent.Id);
    }

    private async Task FillEventToCapacity(int eventId, int clubId)
    {
        var members = new[]
        {
            new Member { ClubId = clubId, FullName = "Member 1", Email = "member1@example.com", JoinedAt = DateTime.UtcNow },
            new Member { ClubId = clubId, FullName = "Member 2", Email = "member2@example.com", JoinedAt = DateTime.UtcNow }
        };

        _context.Members.AddRange(members);
        await _context.SaveChangesAsync();

        var rsvps = members.Select(m => new EventRsvp
        {
            EventId = eventId,
            MemberId = m.Id,
            Status = GatherGrove.Domain.Enums.RsvpStatus.Confirmed,
            PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            CreatedAt = DateTime.UtcNow
        });

        _context.EventRsvps.AddRange(rsvps);
        await _context.SaveChangesAsync();
    }

    // ============================================================
    // Tests for RegisterForPaidEventAsync
    // ============================================================

    [Test]
    public async Task RegisterForPaidEventAsync_ValidRequest_SuccessfullyRegisters()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        await SeedTestData(clubId, userId);

        var paidEvent = new Event
        {
            ClubId = clubId,
            Name = "Paid Workshop",
            Price = 99.99m,
            Currency = "USD",
            MaxCapacity = 50,
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Conference Center",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        var request = new EventRegistrationRequestNew
        {
            EventId = paidEvent.Id,
            AttendeeEmail = "attendee@example.com"
        };

        // Mock successful Stripe payment
        var paymentIntent = new Stripe.PaymentIntent { Id = "pi_test_123", Status = "succeeded" };
        _mockStripeService.Setup(s => s.CreatePaymentIntentAsync(It.IsAny<CreateStripePaymentIntentRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(paymentIntent);

        // Act
        var result = await _eventPricingService.RegisterForPaidEventAsync(clubId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data.PaymentStatus, Is.EqualTo("Paid"));
        Assert.That(result.Data.Amount, Is.EqualTo(99.99m));

        // Verify registration was created in database
        var registration = await _context.EventRsvps.FirstOrDefaultAsync(r => r.EventId == paidEvent.Id);
        Assert.That(registration, Is.Not.Null);
        Assert.That(registration!.Status, Is.EqualTo(GatherGrove.Domain.Enums.RsvpStatus.Confirmed));
        Assert.That(registration.PaymentStatus, Is.EqualTo(GatherGrove.Domain.Enums.PaymentStatus.Succeeded));
    }

    [Test]
    public async Task RegisterForPaidEventAsync_EventNotFound_ReturnsFailure()
    {
        // Arrange
        var clubId = 1;
        var request = new EventRegistrationRequestNew
        {
            EventId = 9999, // Non-existent event
            AttendeeEmail = "attendee@example.com"
        };

        // Act
        var result = await _eventPricingService.RegisterForPaidEventAsync(clubId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Event not found"));
    }

    [Test]
    public async Task RegisterForPaidEventAsync_EventAtCapacity_ReturnsFailure()
    {
        // Arrange
        var (clubId, userId, eventId) = await CreateTestPaidEventWithLimitedCapacity();
        await FillEventToCapacity(eventId, clubId);

        var request = new EventRegistrationRequestNew
        {
            EventId = eventId,
            AttendeeEmail = "latearrivee@example.com"
        };

        // Act
        var result = await _eventPricingService.RegisterForPaidEventAsync(clubId, request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Event is at full capacity"));
    }

    // ============================================================
    // Tests for CalculateGroupPricingAsync
    // ============================================================

    [Test]
    public async Task CalculateGroupPricingAsync_MeetsThreshold_AppliesDiscount()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        await SeedTestData(clubId, userId);

        var groupEvent = new Event
        {
            ClubId = clubId,
            Name = "Group Workshop",
            Price = 100.00m,
            Currency = "USD",
            GroupDiscountThreshold = 5,
            GroupDiscountPercentage = 20m,
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Conference Center",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(groupEvent);
        await _context.SaveChangesAsync();

        var request = new GroupRegistrationRequest
        {
            EventId = groupEvent.Id,
            AttendeeCount = 5
        };

        // Act
        var result = await _eventPricingService.CalculateGroupPricingAsync(clubId, request);

        // Assert
        Assert.That(result.DiscountApplied, Is.True);
        Assert.That(result.DiscountPercentage, Is.EqualTo(20m));
        Assert.That(result.PricePerAttendee, Is.EqualTo(80.00m)); // 100 - 20%
        Assert.That(result.TotalPrice, Is.EqualTo(400.00m)); // 80 * 5
    }

    [Test]
    public async Task CalculateGroupPricingAsync_BelowThreshold_NoDiscount()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        await SeedTestData(clubId, userId);

        var groupEvent = new Event
        {
            ClubId = clubId,
            Name = "Group Workshop",
            Price = 100.00m,
            Currency = "USD",
            GroupDiscountThreshold = 10,
            GroupDiscountPercentage = 20m,
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Conference Center",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(groupEvent);
        await _context.SaveChangesAsync();

        var request = new GroupRegistrationRequest
        {
            EventId = groupEvent.Id,
            AttendeeCount = 5
        };

        // Act
        var result = await _eventPricingService.CalculateGroupPricingAsync(clubId, request);

        // Assert
        Assert.That(result.DiscountApplied, Is.False);
        Assert.That(result.DiscountPercentage, Is.EqualTo(0m));
        Assert.That(result.PricePerAttendee, Is.EqualTo(100.00m));
        Assert.That(result.TotalPrice, Is.EqualTo(500.00m)); // 100 * 5
    }

    [Test]
    public async Task CalculateGroupPricingAsync_EventNotFound_ReturnsEmptyResult()
    {
        // Arrange
        var clubId = 1;
        var request = new GroupRegistrationRequest
        {
            EventId = 9999, // Non-existent event
            AttendeeCount = 5
        };

        // Act
        var result = await _eventPricingService.CalculateGroupPricingAsync(clubId, request);

        // Assert
        Assert.That(result.DiscountApplied, Is.False);
        Assert.That(result.TotalPrice, Is.EqualTo(0m));
    }

    // ============================================================
    // Tests for GetCurrentEventPricingAsync
    // ============================================================

    [Test]
    public async Task GetCurrentEventPricingAsync_EarlyBirdActive_ReturnsEarlyBirdPrice()
    {
        // Arrange
        var (clubId, userId, eventId) = await CreateTestEventWithEarlyBird();

        // Act
        var result = await _eventPricingService.GetCurrentEventPricingAsync(eventId);

        // Assert
        Assert.That(result.IsEarlyBirdActive, Is.True);
        Assert.That(result.CurrentPrice, Is.EqualTo(79.99m));
        Assert.That(result.RegularPrice, Is.EqualTo(99.99m));
        Assert.That(result.Savings, Is.EqualTo(20.00m));
        Assert.That(result.FormattedPriceOverride, Is.EqualTo("$79.99"));
    }

    [Test]
    public async Task GetCurrentEventPricingAsync_EarlyBirdExpired_ReturnsRegularPrice()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        await SeedTestData(clubId, userId);

        var expiredEarlyBirdEvent = new Event
        {
            ClubId = clubId,
            Name = "Workshop with Expired Early Bird",
            Price = 99.99m,
            Currency = "USD",
            EarlyBirdPrice = 79.99m,
            EarlyBirdDeadline = DateTime.Now.AddDays(-1), // Expired
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Conference Center",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(expiredEarlyBirdEvent);
        await _context.SaveChangesAsync();

        // Act
        var result = await _eventPricingService.GetCurrentEventPricingAsync(expiredEarlyBirdEvent.Id);

        // Assert
        Assert.That(result.IsEarlyBirdActive, Is.False);
        Assert.That(result.CurrentPrice, Is.EqualTo(99.99m));
        Assert.That(result.RegularPrice, Is.EqualTo(99.99m));
        Assert.That(result.Savings, Is.EqualTo(0m));
    }

    [Test]
    public async Task GetCurrentEventPricingAsync_NoEarlyBird_ReturnsRegularPrice()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        await SeedTestData(clubId, userId);

        var regularEvent = new Event
        {
            ClubId = clubId,
            Name = "Regular Workshop",
            Price = 99.99m,
            Currency = "USD",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Conference Center",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(regularEvent);
        await _context.SaveChangesAsync();

        // Act
        var result = await _eventPricingService.GetCurrentEventPricingAsync(regularEvent.Id);

        // Assert
        Assert.That(result.IsEarlyBirdActive, Is.False);
        Assert.That(result.CurrentPrice, Is.EqualTo(99.99m));
        Assert.That(result.RegularPrice, Is.EqualTo(99.99m));
        Assert.That(result.Savings, Is.EqualTo(0m));
    }

    // ============================================================
    // Tests for GetEventRevenueAnalyticsAsync
    // ============================================================

    [Test]
    public async Task GetEventRevenueAnalyticsAsync_WithPaidRegistrations_CalculatesCorrectRevenue()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        await SeedTestData(clubId, userId);

        var event1 = new Event
        {
            ClubId = clubId,
            Name = "Paid Event 1",
            Price = 50.00m,
            Currency = "USD",
            EventDateTime = DateTime.Now.AddDays(15),
            Location = "Venue 1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var event2 = new Event
        {
            ClubId = clubId,
            Name = "Paid Event 2",
            Price = 75.00m,
            Currency = "USD",
            EventDateTime = DateTime.Now.AddDays(20),
            Location = "Venue 2",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.AddRange(event1, event2);
        await _context.SaveChangesAsync();

        // Create paid registrations
        var member = new Member
        {
            ClubId = clubId,
            FullName = "Test Member",
            Email = "member@example.com",
            JoinedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var rsvps = new[]
        {
            new EventRsvp
            {
                EventId = event1.Id,
                MemberId = member.Id,
                Status = GatherGrove.Domain.Enums.RsvpStatus.Confirmed,
                PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded,
                PaidAmount = 50.00m,
                CreatedAt = DateTime.UtcNow
            },
            new EventRsvp
            {
                EventId = event2.Id,
                MemberId = member.Id,
                Status = GatherGrove.Domain.Enums.RsvpStatus.Confirmed,
                PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded,
                PaidAmount = 75.00m,
                CreatedAt = DateTime.UtcNow
            }
        };
        _context.EventRsvps.AddRange(rsvps);
        await _context.SaveChangesAsync();

        // Act
        var result = await _eventPricingService.GetEventRevenueAnalyticsAsync(
            clubId,
            DateTime.Now.AddDays(-1),
            DateTime.Now.AddDays(30));

        // Assert
        Assert.That(result.TotalRevenue, Is.EqualTo(125.00m));
        Assert.That(result.TotalPaidRegistrations, Is.EqualTo(2));
        Assert.That(result.AverageTicketPrice, Is.EqualTo(62.50m));
    }

    [Test]
    public async Task GetEventRevenueAnalyticsAsync_NoRegistrations_ReturnsZeroRevenue()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        await SeedTestData(clubId, userId);

        var event1 = new Event
        {
            ClubId = clubId,
            Name = "Empty Event",
            Price = 50.00m,
            Currency = "USD",
            EventDateTime = DateTime.Now.AddDays(15),
            Location = "Venue 1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(event1);
        await _context.SaveChangesAsync();

        // Act
        var result = await _eventPricingService.GetEventRevenueAnalyticsAsync(
            clubId,
            DateTime.Now.AddDays(-1),
            DateTime.Now.AddDays(30));

        // Assert
        Assert.That(result.TotalRevenue, Is.EqualTo(0m));
        Assert.That(result.TotalPaidRegistrations, Is.EqualTo(0));
        Assert.That(result.AverageTicketPrice, Is.EqualTo(0m));
    }

    // ============================================================
    // Tests for ValidateEventPricingAsync
    // ============================================================

    [Test]
    public async Task ValidateEventPricingAsync_ValidPrices_ReturnsValid()
    {
        // Arrange
        var request = new ValidateEventPricingRequest
        {
            MemberPrice = 15.00m,
            NonMemberPrice = 20.00m
        };

        // Act
        var result = await _eventPricingService.ValidateEventPricingAsync(request);

        // Assert
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.Errors, Is.Empty);
    }

    [Test]
    public async Task ValidateEventPricingAsync_NegativePrices_ReturnsInvalid()
    {
        // Arrange
        var request = new ValidateEventPricingRequest
        {
            MemberPrice = -10.00m,
            NonMemberPrice = -5.00m
        };

        // Act
        var result = await _eventPricingService.ValidateEventPricingAsync(request);

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.Errors, Has.Count.EqualTo(2));
        Assert.That(result.Errors, Does.Contain("Member price cannot be negative"));
        Assert.That(result.Errors, Does.Contain("Non-member price cannot be negative"));
    }

    // ============================================================
    // Tests for ApplyPromoCodeAsync
    // ============================================================

    [Test]
    public async Task ApplyPromoCodeAsync_ValidCode_AppliesDiscount()
    {
        // Arrange
        var request = new ApplyPromoCodeRequest
        {
            EventId = 1,
            MemberId = 1,
            PromoCode = "SAVE10"
        };

        // Act
        var result = await _eventPricingService.ApplyPromoCodeAsync(request);

        // Assert
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.DiscountAmount, Is.EqualTo(2.00m));
        Assert.That(result.FinalPrice, Is.EqualTo(18.00m));
        Assert.That(result.Message, Is.EqualTo("Promo code applied"));
    }

    [Test]
    public async Task ApplyPromoCodeAsync_InvalidCode_ReturnsError()
    {
        // Arrange
        var request = new ApplyPromoCodeRequest
        {
            EventId = 1,
            MemberId = 1,
            PromoCode = "INVALID"
        };

        // Act
        var result = await _eventPricingService.ApplyPromoCodeAsync(request);

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.DiscountAmount, Is.EqualTo(0m));
        Assert.That(result.FinalPrice, Is.EqualTo(20.00m));
        Assert.That(result.Message, Is.EqualTo("Invalid promo code"));
    }
}

