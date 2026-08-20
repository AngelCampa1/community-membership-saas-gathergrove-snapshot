using GatherGrove.Application.Configuration;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using Stripe;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class EventPaymentAdminServiceTests
{
    private GatherGroveDbContext _context;
    private EventPaymentAdminService _service;
    private Mock<ILogger<EventPaymentAdminService>> _mockLogger;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<EventPaymentAdminService>>();
        var mockEmailService = new Mock<IEmailService>();
        var stripeSettings = Options.Create(new StripeSettings
        {
            SecretKey = "sk_test_fake_key",
            WebhookSecret = "whsec_test_fake_secret"
        });
        _service = new EventPaymentAdminService(_context, mockEmailService.Object, _mockLogger.Object, stripeSettings);
    }

    private void ClearChangeTracker()
    {
        _context.ChangeTracker.Clear();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(Club club, Domain.Entities.Event eventEntity, Member member)> CreateTestDataAsync()
    {
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Sprout"
        };
        _context.Clubs.Add(club);

        var eventEntity = new Domain.Entities.Event
        {
            Club = club,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m
        };
        _context.Events.Add(eventEntity);

        var member = new Member
        {
            Club = club,
            FullName = "Test Member",
            Email = "test@example.com",
            Status = "Active"
        };
        _context.Members.Add(member);

        await _context.SaveChangesAsync();

        return (club, eventEntity, member);
    }

    [Test]
    public async Task GetEventPaymentOverviewAsync_ReturnsCorrectTotals()
    {
        // Arrange
        var (club, eventEntity, member) = await CreateTestDataAsync();

        var rsvp1 = new EventRsvp
        {
            Event = eventEntity,
            Member = member,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Attending",
            PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var rsvp2 = new EventRsvp
        {
            Event = eventEntity,
            MemberId = member.Id,
            Status = RsvpStatus.Pending,
            RsvpStatus = "Pending",
            PaymentStatus = Domain.Enums.PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventRsvps.AddRange(rsvp1, rsvp2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventPaymentOverviewAsync(club.Id, eventEntity.Id);

        // Assert
        Assert.That(result.EventId, Is.EqualTo(eventEntity.Id));
        Assert.That(result.EventName, Is.EqualTo("Test Event"));
        Assert.That(result.TotalRevenue, Is.EqualTo(25.00m));
        Assert.That(result.TotalAttendees, Is.EqualTo(2));
        Assert.That(result.Attendees.Count, Is.EqualTo(2));
    }

    [Test]
    public async Task GetEventPaymentOverviewAsync_CalculatesPaymentSummaryCorrectly()
    {
        // Arrange
        var (club, eventEntity, member) = await CreateTestDataAsync();

        _context.EventRsvps.AddRange(
            new EventRsvp
            {
                Event = eventEntity,
                MemberId = member.Id,
                Status = RsvpStatus.Confirmed,
                RsvpStatus = "Attending",
                PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
                PaidAmount = 25.00m,
                StripePaymentIntentId = "pi_test1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventRsvp
            {
                Event = eventEntity,
                MemberId = member.Id,
                Status = RsvpStatus.Pending,
                RsvpStatus = "Pending",
                PaymentStatus = Domain.Enums.PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventRsvp
            {
                Event = eventEntity,
                MemberId = member.Id,
                Status = RsvpStatus.Declined,
                RsvpStatus = "Declined",
                PaymentStatus = Domain.Enums.PaymentStatus.Failed,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventRsvp
            {
                Event = eventEntity,
                MemberId = member.Id,
                Status = RsvpStatus.Cancelled,
                RsvpStatus = "Cancelled",
                PaymentStatus = Domain.Enums.PaymentStatus.Refunded,
                PaidAmount = 25.00m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );

        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventPaymentOverviewAsync(club.Id, eventEntity.Id);

        // Assert
        Assert.That(result.PaymentSummary.Completed, Is.EqualTo(1));
        Assert.That(result.PaymentSummary.Pending, Is.EqualTo(1));
        Assert.That(result.PaymentSummary.Failed, Is.EqualTo(1));
        Assert.That(result.PaymentSummary.Refunded, Is.EqualTo(1));
    }

    [Test]
    public async Task GetEventPaymentOverviewAsync_IdentifiesManualPayments()
    {
        // Arrange
        var (club, eventEntity, member) = await CreateTestDataAsync();

        // Manual payment (no Stripe payment intent)
        var rsvp = new EventRsvp
        {
            Event = eventEntity,
            Member = member,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Attending",
            PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventPaymentOverviewAsync(club.Id, eventEntity.Id);

        // Assert
        Assert.That(result.PaymentSummary.ManualPayments, Is.EqualTo(1));
        Assert.That(result.Attendees[0].PaymentMethod, Is.EqualTo("cash"));
    }

    [Test]
    public async Task GetEventPaymentOverviewAsync_HandlesGuestRegistrations()
    {
        // Arrange
        var (club, eventEntity, _) = await CreateTestDataAsync();

        var guestRsvp = new EventRsvp
        {
            EventId = eventEntity.Id,
            IsGuestRegistration = true,
            GuestName = "Guest User",
            GuestEmail = "guest@example.com",
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Attending",
            PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 50.00m,
            StripePaymentIntentId = "pi_guest123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventRsvps.Add(guestRsvp);
        await _context.SaveChangesAsync();

        // Debug: Verify the guest RSVP was saved
        var savedRsvps = await _context.EventRsvps.Where(r => r.EventId == eventEntity.Id).ToListAsync();
        Console.WriteLine($"Total RSVPs saved: {savedRsvps.Count}");
        Console.WriteLine($"Guest RSVP ID: {guestRsvp.Id}");
        Console.WriteLine($"Guest RSVP EventId: {guestRsvp.EventId}");
        Console.WriteLine($"Guest RSVP IsGuestRegistration: {guestRsvp.IsGuestRegistration}");

        // Clear change tracker to ensure clean state
        _context.ChangeTracker.Clear();

        // Act
        var result = await _service.GetEventPaymentOverviewAsync(club.Id, eventEntity.Id);

        // Assert
        Assert.That(result.Attendees.Count, Is.GreaterThan(0));
        var guestAttendee = result.Attendees.First(a => a.MemberStatus == "guest");
        Assert.That(guestAttendee.Name, Is.EqualTo("Guest User"));
        Assert.That(guestAttendee.Email, Is.EqualTo("guest@example.com"));
        Assert.That(guestAttendee.MemberStatus, Is.EqualTo("guest"));
    }

    [Test]
    public void GetEventPaymentOverviewAsync_ThrowsForNonExistentEvent()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetEventPaymentOverviewAsync(999, 999));

        Assert.That(ex.Message, Does.Contain("Event 999 not found"));
    }

    [Test]
    public async Task RecordManualPaymentAsync_CreatesNewRsvpForMember()
    {
        // Arrange
        var (club, eventEntity, member) = await CreateTestDataAsync();

        var request = new RecordManualPaymentRequest
        {
            EventId = eventEntity.Id,
            MemberId = member.Id,
            AmountPaid = 25.00m,
            PaymentMethod = "cash",
            Notes = "Paid in cash at the door"
        };

        // Act
        var result = await _service.RecordManualPaymentAsync(club.Id, request);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.RsvpId, Is.GreaterThan(0));

        var rsvp = await _context.EventRsvps.FindAsync(result.RsvpId);
        Assert.That(rsvp, Is.Not.Null);
        Assert.That(rsvp.PaymentStatus, Is.EqualTo(Domain.Enums.PaymentStatus.Succeeded));
        Assert.That(rsvp.PaidAmount, Is.EqualTo(25.00m));
        Assert.That(rsvp.Status, Is.EqualTo(RsvpStatus.Confirmed));
    }

    [Test]
    public async Task RecordManualPaymentAsync_UpdatesExistingRsvp()
    {
        // Arrange
        var (club, eventEntity, member) = await CreateTestDataAsync();

        var existingRsvp = new EventRsvp
        {
            Event = eventEntity,
            Member = member,
            Status = RsvpStatus.Pending,
            RsvpStatus = "Pending",
            PaymentStatus = Domain.Enums.PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventRsvps.Add(existingRsvp);
        await _context.SaveChangesAsync();

        var request = new RecordManualPaymentRequest
        {
            EventId = eventEntity.Id,
            MemberId = member.Id,
            AmountPaid = 25.00m,
            PaymentMethod = "check",
            Notes = "Check #1234"
        };

        // Act
        var result = await _service.RecordManualPaymentAsync(club.Id, request);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.RsvpId, Is.EqualTo(existingRsvp.Id));

        var updatedRsvp = await _context.EventRsvps.FindAsync(existingRsvp.Id);
        Assert.That(updatedRsvp.PaymentStatus, Is.EqualTo(Domain.Enums.PaymentStatus.Succeeded));
        Assert.That(updatedRsvp.PaidAmount, Is.EqualTo(25.00m));
        Assert.That(updatedRsvp.Status, Is.EqualTo(RsvpStatus.Confirmed));
    }

    [Test]
    public async Task RecordManualPaymentAsync_ThrowsForInvalidAmount()
    {
        // Arrange
        var (club, eventEntity, member) = await CreateTestDataAsync();

        var request = new RecordManualPaymentRequest
        {
            EventId = eventEntity.Id,
            MemberId = member.Id,
            AmountPaid = -10.00m,
            PaymentMethod = "cash"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.RecordManualPaymentAsync(club.Id, request));

        Assert.That(ex.Message, Does.Contain("Amount must be greater than 0"));
    }

    [Test]
    public async Task RecordManualPaymentAsync_ThrowsForNonExistentMember()
    {
        // Arrange
        var (club, eventEntity, _) = await CreateTestDataAsync();

        var request = new RecordManualPaymentRequest
        {
            EventId = eventEntity.Id,
            MemberId = 999, // Non-existent member ID
            AmountPaid = 25.00m,
            PaymentMethod = "cash"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.RecordManualPaymentAsync(club.Id, request));

        Assert.That(ex.Message, Does.Contain("Member 999 not found"));
    }

    [Test]
    public async Task ExportPaymentDataAsync_GeneratesCorrectCsv()
    {
        // Arrange
        var (club, eventEntity, member) = await CreateTestDataAsync();

        var rsvp = new EventRsvp
        {
            Event = eventEntity,
            Member = member,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Attending",
            PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        var request = new ExportPaymentDataRequest
        {
            EventId = eventEntity.Id,
            Format = "csv"
        };

        // Act
        var result = await _service.ExportPaymentDataAsync(club.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        var csvContent = System.Text.Encoding.UTF8.GetString(result);
        Assert.That(csvContent, Does.Contain("Name,Email,Member Status"));
        Assert.That(csvContent, Does.Contain("Test Member"));
        Assert.That(csvContent, Does.Contain("test@example.com"));
        Assert.That(csvContent, Does.Contain("Total Revenue"));
        Assert.That(csvContent, Does.Contain("25.00"));
    }

    [Test]
    public async Task GetEventPaymentOverviewAsync_SetsCanRefundCorrectly()
    {
        // Arrange
        var (club, eventEntity, member) = await CreateTestDataAsync();

        // Stripe payment - can refund
        var stripeRsvp = new EventRsvp
        {
            Event = eventEntity,
            Member = member,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Attending",
            PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Manual payment - cannot refund
        var manualRsvp = new EventRsvp
        {
            Event = eventEntity,
            MemberId = member.Id,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Attending",
            PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventRsvps.AddRange(stripeRsvp, manualRsvp);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventPaymentOverviewAsync(club.Id, eventEntity.Id);

        // Assert
        var stripeAttendee = result.Attendees.First(a => a.StripePaymentIntentId == "pi_test123");
        var manualAttendee = result.Attendees.First(a => a.StripePaymentIntentId == null);

        Assert.That(stripeAttendee.CanRefund, Is.True);
        Assert.That(manualAttendee.CanRefund, Is.False);
    }

    [Test]
    public async Task GetEventPaymentOverviewAsync_ExcludesRefundedFromRevenue()
    {
        // Arrange
        var (club, eventEntity, member) = await CreateTestDataAsync();

        _context.EventRsvps.AddRange(
            new EventRsvp
            {
                Event = eventEntity,
                MemberId = member.Id,
                Status = RsvpStatus.Confirmed,
                RsvpStatus = "Attending",
                PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
                PaidAmount = 25.00m,
                StripePaymentIntentId = "pi_test1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventRsvp
            {
                Event = eventEntity,
                MemberId = member.Id,
                Status = RsvpStatus.Cancelled,
                RsvpStatus = "Cancelled",
                PaymentStatus = Domain.Enums.PaymentStatus.Refunded,
                PaidAmount = 25.00m,
                StripePaymentIntentId = "pi_test2",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );

        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventPaymentOverviewAsync(club.Id, eventEntity.Id);

        // Assert
        Assert.That(result.TotalRevenue, Is.EqualTo(25.00m)); // Only non-refunded payment
    }
}
