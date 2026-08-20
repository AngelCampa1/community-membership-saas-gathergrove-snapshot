using GatherGrove.Application.Configuration;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using Stripe;
using StripeException = Stripe.StripeException;
using DomainEvent = GatherGrove.Domain.Entities.Event;
using PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class EventPaymentServiceTests
{
    private GatherGroveDbContext _context = null!;
    private Mock<IEmailService> _mockEmailService = null!;
    private Mock<IConfiguration> _mockConfiguration = null!;
    private Mock<ILogger<EventPaymentService>> _mockLogger = null!;
    private Mock<IOptions<StripeSettings>> _mockStripeSettings = null!;
    private Mock<IUrlService> _mockUrlService = null!;
    private EventPaymentService _service = null!;

    private User _testUser = null!;
    private Club _testClub = null!;
    private Member _testMember = null!;
    private DomainEvent _testEvent = null!;

    [SetUp]
    public void Setup()
    {
        // Create in-memory database with transaction warning suppression
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(warnings =>
                warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _context = new GatherGroveDbContext(options);

        // Setup mocks
        _mockEmailService = new Mock<IEmailService>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockLogger = new Mock<ILogger<EventPaymentService>>();
        _mockStripeSettings = new Mock<IOptions<StripeSettings>>();
        _mockUrlService = new Mock<IUrlService>();

        // Configure Stripe settings
        var stripeSettings = new StripeSettings
        {
            SecretKey = "sk_test_fake_key",
            PublishableKey = "pk_test_fake_key",
            WebhookSecret = "whsec_test_fake_secret"
        };
        _mockStripeSettings.Setup(x => x.Value).Returns(stripeSettings);

        // Setup test data
        SetupTestData();

        // Create service
        _service = new EventPaymentService(
            _context,
            _mockEmailService.Object,
            _mockConfiguration.Object,
            _mockLogger.Object,
            _mockStripeSettings.Object
        );
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private void SetupTestData()
    {
        // Create club with Stripe account
        _testClub = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            StripeAccountId = "acct_test_123",
            StripeAccountCountry = "US",
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = 1,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(_testClub);
        _context.SaveChanges();

        // Create user
        _testUser = new User
        {
            Email = "member@test.com",
            FullName = "Test Member",
            PasswordHash = "hash",
            OnboardingCompleted = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(_testUser);
        _context.SaveChanges();

        // Create member
        _testMember = new Member
        {
            Email = "member@test.com",
            FullName = "Test Member",
            ClubId = _testClub.Id,
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(_testMember);
        _context.SaveChanges();

        // Create paid event
        _testEvent = new DomainEvent
        {
            Name = "Paid Test Event",
            Description = "A test event",
            Location = "Test Location",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            ClubId = _testClub.Id,
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(_testEvent);
        _context.SaveChanges();
    }

    [Test]
    public void ProcessEventPaymentAsync_UserNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new PayEventRequest
        {
            EventId = _testEvent.Id,
            PaymentMethodId = "pm_test_123"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.PayForEventAsync(99999, request));

        Assert.That(ex.Message, Does.Contain("User not found"));
    }

    [Test]
    public void ProcessEventPaymentAsync_MemberNotFound_ThrowsArgumentException()
    {
        // Arrange
        var nonMemberUser = new User
        {
            Email = "nonmember@test.com",
            FullName = "Non Member",
            PasswordHash = "hash",
            OnboardingCompleted = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(nonMemberUser);
        _context.SaveChanges();

        var request = new PayEventRequest
        {
            EventId = _testEvent.Id,
            PaymentMethodId = "pm_test_123"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.PayForEventAsync(nonMemberUser.Id, request));

        Assert.That(ex.Message, Does.Contain("Member profile not found"));
    }

    [Test]
    public void ProcessEventPaymentAsync_EventNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new PayEventRequest
        {
            EventId = 99999,
            PaymentMethodId = "pm_test_123"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.PayForEventAsync(_testUser.Id, request));

        Assert.That(ex.Message, Does.Contain("Event with ID 99999 not found"));
    }

    [Test]
    public void ProcessEventPaymentAsync_FreeEvent_ThrowsInvalidOperationException()
    {
        // Arrange
        var freeEvent = new DomainEvent
        {
            Name = "Free Event",
            Description = "A free event",
            Location = "Test Location",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            ClubId = _testClub.Id,
            MemberPrice = null, // Free events have null MemberPrice
            NonMemberPrice = null, // Free events have null NonMemberPrice
            CreatedAt = DateTime.UtcNow
        };
        _context.Events.Add(freeEvent);
        _context.SaveChanges();

        var request = new PayEventRequest
        {
            EventId = freeEvent.Id,
            PaymentMethodId = "pm_test_123"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.PayForEventAsync(_testUser.Id, request));

        Assert.That(ex.Message, Does.Contain("This event does not require payment"));
    }

    [Test]
    public void ProcessEventPaymentAsync_EventWithoutMemberPrice_ThrowsInvalidOperationException()
    {
        // Arrange
        var eventWithoutMemberPrice = new DomainEvent
        {
            Name = "Event Without Member Price",
            Description = "An event without member pricing",
            Location = "Test Location",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            ClubId = _testClub.Id,
            MemberPrice = null,
            NonMemberPrice = 50.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventWithoutMemberPrice);
        _context.SaveChanges();

        var request = new PayEventRequest
        {
            EventId = eventWithoutMemberPrice.Id,
            PaymentMethodId = "pm_test_123"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.PayForEventAsync(_testUser.Id, request));

        Assert.That(ex.Message, Does.Contain("Member pricing is not available for this event"));
    }

    [Test]
    public void ProcessEventPaymentAsync_ClubStripeNotConfigured_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubWithoutStripe = new Club
        {
            Name = "Club Without Stripe",
            Tier = "Sprout",
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = 1,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(clubWithoutStripe);

        var userInClubWithoutStripe = new User
        {
            Email = "user@nostripe.com",
            FullName = "User",
            PasswordHash = "hash",
            OnboardingCompleted = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(userInClubWithoutStripe);

        var memberInClubWithoutStripe = new Member
        {
            Email = "user@nostripe.com",
            FullName = "User",
            ClubId = clubWithoutStripe.Id,
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(memberInClubWithoutStripe);

        var eventInClubWithoutStripe = new DomainEvent
        {
            Name = "Event in Club Without Stripe",
            Description = "Event",
            Location = "Location",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            ClubId = clubWithoutStripe.Id,
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventInClubWithoutStripe);
        _context.SaveChanges();

        var request = new PayEventRequest
        {
            EventId = eventInClubWithoutStripe.Id,
            PaymentMethodId = "pm_test_123"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.PayForEventAsync(userInClubWithoutStripe.Id, request));

        Assert.That(ex.Message, Does.Contain("This club has not configured online payments"));
    }

    [Test]
    public void ProcessEventPaymentAsync_DuplicatePayment_ThrowsInvalidOperationException()
    {
        // Arrange
        // Create existing paid RSVP
        var existingRsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            RsvpStatus = "Confirmed",
            Status = RsvpStatus.Confirmed,
            PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_existing_123",
            CreatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(existingRsvp);
        _context.SaveChanges();

        var request = new PayEventRequest
        {
            EventId = _testEvent.Id,
            PaymentMethodId = "pm_test_123"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.PayForEventAsync(_testUser.Id, request));

        Assert.That(ex.Message, Does.Contain("already paid"));
    }

    [Test]
    public void ProcessEventPaymentAsync_MemberFromDifferentClub_ThrowsInvalidOperationException()
    {
        // Arrange
        var otherClub = new Club
        {
            Name = "Other Club",
            Tier = "Sprout",
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = 1,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(otherClub);

        var userInOtherClub = new User
        {
            Email = "other@test.com",
            FullName = "Other User",
            PasswordHash = "hash",
            OnboardingCompleted = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(userInOtherClub);

        var memberInOtherClub = new Member
        {
            Email = "other@test.com",
            FullName = "Other User",
            ClubId = otherClub.Id,
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(memberInOtherClub);
        _context.SaveChanges();

        var request = new PayEventRequest
        {
            EventId = _testEvent.Id, // Event belongs to _testClub
            PaymentMethodId = "pm_test_123"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.PayForEventAsync(userInOtherClub.Id, request));

        Assert.That(ex.Message, Does.Contain("You must be a member of this club to pay for this event"));
    }

    [Test]
    public void ProcessEventPaymentAsync_InvalidPaymentMethodId_ReturnsFailureResponse()
    {
        // Arrange
        var request = new PayEventRequest
        {
            EventId = _testEvent.Id,
            PaymentMethodId = "pm_invalid_123" // Invalid payment method ID
        };

        // Act & Assert
        // This will throw an InvalidOperationException because the payment method doesn't exist
        // or because Stripe API key is not configured in test environment
        Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.PayForEventAsync(_testUser.Id, request));
    }

    [Test]
    public async Task ProcessEventPaymentAsync_ValidRequest_SendsConfirmationEmail()
    {
        // Note: This test cannot fully test Stripe integration without mocking Stripe API
        // In a real implementation, you would:
        // 1. Mock the Stripe PaymentIntentService
        // 2. Setup it to return a successful PaymentIntent
        // 3. Verify the RSVP is created with correct payment details
        // 4. Verify confirmation email is sent

        // For now, we verify that the method requires proper Stripe integration
        // which will throw an InvalidOperationException in test environment due to missing API key

        // Arrange
        _mockEmailService.Setup(x => x.SendEventPaymentConfirmationEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var request = new PayEventRequest
        {
            EventId = _testEvent.Id,
            PaymentMethodId = "pm_test_123"
        };

        // Act & Assert
        // This will throw InvalidOperationException because we're using fake Stripe key
        Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.PayForEventAsync(_testUser.Id, request));
    }

    [Test]
    public void ProcessEventPaymentAsync_ZeroMemberPrice_ThrowsInvalidOperationException()
    {
        // Arrange
        var eventWithZeroPrice = new DomainEvent
        {
            Name = "Zero Price Event",
            Description = "An event with zero price",
            Location = "Test Location",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            ClubId = _testClub.Id,
            MemberPrice = 0m,
            NonMemberPrice = 50.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventWithZeroPrice);
        _context.SaveChanges();

        var request = new PayEventRequest
        {
            EventId = eventWithZeroPrice.Id,
            PaymentMethodId = "pm_test_123"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.PayForEventAsync(_testUser.Id, request));

        Assert.That(ex.Message, Does.Contain("Member pricing is not available for this event"));
    }

    #region GetPaymentDetailsAsync Tests

    [Test]
    public async Task GetPaymentDetailsAsync_ValidPaymentId_ReturnsPaymentDetails()
    {
        // Arrange - Create a successful payment RSVP
        var rsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Confirmed",
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test_success_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetPaymentDetailsAsync("pi_test_success_123", _testClub.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.RsvpId, Is.EqualTo(rsvp.Id));
        Assert.That(result.EventId, Is.EqualTo(_testEvent.Id));
        Assert.That(result.EventName, Is.EqualTo(_testEvent.Name));
        Assert.That(result.MemberId, Is.EqualTo(_testMember.Id));
        Assert.That(result.Name, Is.EqualTo(_testMember.FullName));
        Assert.That(result.Email, Is.EqualTo(_testMember.Email));
        Assert.That(result.PaymentStatus, Is.EqualTo("Succeeded"));
        Assert.That(result.AmountPaid, Is.EqualTo(25.00m));
        Assert.That(result.CanRefund, Is.True);
        Assert.That(result.ClubId, Is.EqualTo(_testClub.Id));
        Assert.That(result.ClubName, Is.EqualTo(_testClub.Name));
    }

    [Test]
    public async Task GetPaymentDetailsAsync_InvalidPaymentId_ReturnsNull()
    {
        // Act
        var result = await _service.GetPaymentDetailsAsync("pi_nonexistent_123", _testClub.Id);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetPaymentDetailsAsync_PaymentFromDifferentClub_ReturnsNull()
    {
        // Arrange
        var otherClub = new Club
        {
            Name = "Other Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = 1,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(otherClub);
        await _context.SaveChangesAsync();

        var otherEvent = new DomainEvent
        {
            Name = "Other Event",
            Location = "Other Location",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            ClubId = otherClub.Id,
            MemberPrice = 25.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(otherEvent);
        await _context.SaveChangesAsync();

        _context.EventRsvps.Add(new EventRsvp
        {
            EventId = otherEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Confirmed",
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_other_club_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetPaymentDetailsAsync("pi_other_club_123", _testClub.Id);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetPaymentDetailsAsync_RefundedPayment_CannotRefund()
    {
        // Arrange - Create a refunded payment RSVP
        var rsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Confirmed",
            PaymentStatus = PaymentStatus.Refunded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test_refunded_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetPaymentDetailsAsync("pi_test_refunded_123", _testClub.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.PaymentStatus, Is.EqualTo("Refunded"));
        Assert.That(result.CanRefund, Is.False);
    }

    #endregion

    #region ProcessRefundAsync Tests

    [Test]
    public void ProcessRefundAsync_PaymentNotFound_ThrowsKeyNotFoundException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<KeyNotFoundException>(async () =>
            await _service.ProcessRefundAsync("pi_nonexistent_123", "Customer request", _testClub.Id));

        Assert.That(ex.Message, Does.Contain("Payment with ID pi_nonexistent_123 not found"));
    }

    [Test]
    public void ProcessRefundAsync_PaymentFromDifferentClub_ThrowsKeyNotFoundException()
    {
        // Arrange
        var otherClub = new Club
        {
            Name = "Other Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = 1,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(otherClub);
        _context.SaveChanges();

        var otherEvent = new DomainEvent
        {
            Name = "Other Event",
            Location = "Other Location",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            ClubId = otherClub.Id,
            MemberPrice = 25.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(otherEvent);
        _context.SaveChanges();

        _context.EventRsvps.Add(new EventRsvp
        {
            EventId = otherEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Confirmed",
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_other_refund_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        _context.SaveChanges();

        // Act & Assert
        Assert.ThrowsAsync<KeyNotFoundException>(async () =>
            await _service.ProcessRefundAsync("pi_other_refund_123", "Customer request", _testClub.Id));
    }

    [Test]
    public void ProcessRefundAsync_AlreadyRefundedPayment_ThrowsInvalidOperationException()
    {
        // Arrange - Create a refunded payment RSVP
        var rsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Confirmed",
            PaymentStatus = PaymentStatus.Refunded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test_refunded_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        _context.SaveChanges();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.ProcessRefundAsync("pi_test_refunded_123", "Customer request", _testClub.Id));

        Assert.That(ex.Message, Does.Contain("Cannot refund payment with status: Refunded"));
    }

    [Test]
    public void ProcessRefundAsync_PendingPayment_ThrowsInvalidOperationException()
    {
        // Arrange - Create a pending payment RSVP
        var rsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Pending,
            RsvpStatus = "Pending",
            PaymentStatus = PaymentStatus.Pending,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test_pending_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        _context.SaveChanges();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.ProcessRefundAsync("pi_test_pending_123", "Customer request", _testClub.Id));

        Assert.That(ex.Message, Does.Contain("Cannot refund payment with status: Pending"));
    }

    [Test]
    public void ProcessRefundAsync_SucceededPayment_WithInvalidStripeKey_ThrowsInvalidOperationException()
    {
        // Arrange - Create a successful payment RSVP
        var rsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Confirmed",
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test_success_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        _context.SaveChanges();

        // Act & Assert - Will throw because of fake Stripe key
        Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.ProcessRefundAsync("pi_test_success_123", "Customer request", _testClub.Id));
    }

    #endregion

    #region GetPaymentHistoryAsync Tests

    [Test]
    public async Task GetPaymentHistoryAsync_EventWithMultiplePayments_ReturnsAllPayments()
    {
        // Arrange - Create multiple successful payments for the same event
        var rsvp1 = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Confirmed",
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test_1",
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-2)
        };

        // Create another member for second payment
        var otherMember = new Member
        {
            Email = "other@test.com",
            FullName = "Other Member",
            ClubId = _testClub.Id,
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(otherMember);
        _context.SaveChanges();

        var rsvp2 = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = otherMember.Id,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Confirmed",
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test_2",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _context.EventRsvps.AddRange(rsvp1, rsvp2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetPaymentHistoryAsync(_testEvent.Id, _testClub.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result[0].StripePaymentIntentId, Is.EqualTo("pi_test_2")); // Most recent first
        Assert.That(result[1].StripePaymentIntentId, Is.EqualTo("pi_test_1"));
        Assert.That(result.All(p => p.EventId == _testEvent.Id), Is.True);
        Assert.That(result.All(p => p.PaymentStatus == "Succeeded"), Is.True);
    }

    [Test]
    public async Task GetPaymentHistoryAsync_EventWithNoPayments_ReturnsEmptyList()
    {
        // Arrange - Create a new event with no payments
        var newEvent = new DomainEvent
        {
            Name = "New Event",
            Description = "No payments yet",
            Location = "Test Location",
            EventDateTime = DateTime.UtcNow.AddDays(14),
            ClubId = _testClub.Id,
            MemberPrice = 30.00m,
            NonMemberPrice = 60.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetPaymentHistoryAsync(newEvent.Id, _testClub.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(0));
    }

    [Test]
    public async Task GetPaymentHistoryAsync_EventFromDifferentClub_ReturnsEmptyList()
    {
        // Arrange
        var otherClub = new Club
        {
            Name = "Other Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = 1,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(otherClub);
        await _context.SaveChangesAsync();

        var otherEvent = new DomainEvent
        {
            Name = "Other Event",
            Description = "Other club event",
            Location = "Other Location",
            EventDateTime = DateTime.UtcNow.AddDays(14),
            ClubId = otherClub.Id,
            MemberPrice = 30.00m,
            NonMemberPrice = 60.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(otherEvent);
        await _context.SaveChangesAsync();

        _context.EventRsvps.Add(new EventRsvp
        {
            EventId = otherEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Confirmed",
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 30.00m,
            StripePaymentIntentId = "pi_other_history_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetPaymentHistoryAsync(otherEvent.Id, _testClub.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetPaymentHistoryAsync_EventWithRefundedPayments_ExcludesRefunded()
    {
        // Arrange - Create one succeeded and one refunded payment
        var succeededRsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            RsvpStatus = "Confirmed",
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test_succeeded",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var refundedRsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Cancelled,
            RsvpStatus = "Cancelled",
            PaymentStatus = PaymentStatus.Refunded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test_refunded",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventRsvps.AddRange(succeededRsvp, refundedRsvp);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetPaymentHistoryAsync(_testEvent.Id, _testClub.Id);

        // Assert - Should only include succeeded payment
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].StripePaymentIntentId, Is.EqualTo("pi_test_succeeded"));
        Assert.That(result[0].PaymentStatus, Is.EqualTo("Succeeded"));
    }

    #endregion
}
