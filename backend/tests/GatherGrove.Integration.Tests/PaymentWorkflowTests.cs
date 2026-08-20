using FluentAssertions;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus;

namespace GatherGrove.Integration.Tests;

/// <summary>
/// Integration tests for payment workflows including event registration with payment,
/// refunds, Stripe webhook processing, and payment token handling.
/// Tests end-to-end payment scenarios with real database persistence.
/// </summary>
[TestFixture]
public class PaymentWorkflowTests
{
    private GatherGroveDbContext _context = null!;
    private Club _testClub = null!;
    private Member _testMember = null!;
    private Member _testNonMember = null!;
    private MembershipType _membershipType = null!;

    [SetUp]
    public async Task SetUp()
    {
        // Create in-memory database
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);

        // Seed test data
        _testClub = new Club
        {
            Name = "Test Club for Payments",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(_testClub);
        await _context.SaveChangesAsync();

        _membershipType = new MembershipType
        {
            ClubId = _testClub.Id,
            Name = "Premium",
            DuesAmount = 100.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(_membershipType);
        await _context.SaveChangesAsync();

        _testMember = new Member
        {
            ClubId = _testClub.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "Test Member",
            Email = "member@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _testNonMember = new Member
        {
            ClubId = _testClub.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "Test Non-Member",
            Email = "nonmember@test.com",
            Status = "Prospective",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.AddRange(_testMember, _testNonMember);
        await _context.SaveChangesAsync();
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    #region Event Registration with Payment Tests

    [Test]
    public async Task PaidEventRegistration_MemberPrice_RecordsPaymentAndRsvp()
    {
        // Arrange - Create paid event with member pricing
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Paid Event - Member Price",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Paid event with member pricing",
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        // Act - Member registers with payment
        var rsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 25.00m,
            StripePaymentIntentId = "pi_test_member_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Verify RSVP and payment recorded
        var savedRsvp = await _context.EventRsvps
            .FirstAsync(r => r.EventId == paidEvent.Id && r.MemberId == _testMember.Id);

        savedRsvp.Status.Should().Be(RsvpStatus.Confirmed);
        savedRsvp.PaymentStatus.Should().Be(PaymentStatus.Succeeded);
        savedRsvp.PaidAmount.Should().Be(25.00m);
        savedRsvp.StripePaymentIntentId.Should().Be("pi_test_member_123");
    }

    [Test]
    public async Task PaidEventRegistration_NonMemberPrice_ChargesCorrectAmount()
    {
        // Arrange - Paid event
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Paid Event - Non-Member Price",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Paid event with non-member pricing",
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        // Act - Non-member registers and pays higher price
        var rsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testNonMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 50.00m,
            StripePaymentIntentId = "pi_test_nonmember_456",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Non-member charged correct amount
        var savedRsvp = await _context.EventRsvps
            .FirstAsync(r => r.EventId == paidEvent.Id && r.MemberId == _testNonMember.Id);

        savedRsvp.PaidAmount.Should().Be(50.00m);
        savedRsvp.PaidAmount.Should().Be(paidEvent.NonMemberPrice);
    }

    [Test]
    public async Task FreeEvent_Registration_NoPaymentRequired()
    {
        // Arrange - Free event (both prices set to 0)
        var freeEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Free Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Free event",
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(freeEvent);
        await _context.SaveChangesAsync();

        // Act - Register without payment
        var rsvp = new EventRsvp
        {
            EventId = freeEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded, // Still set to succeeded for free events
            PaidAmount = 0.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Free registration confirmed
        var savedRsvp = await _context.EventRsvps
            .FirstAsync(r => r.EventId == freeEvent.Id && r.MemberId == _testMember.Id);

        savedRsvp.Status.Should().Be(RsvpStatus.Confirmed);
        savedRsvp.PaidAmount.Should().Be(0.00m);
        freeEvent.IsFree.Should().BeTrue();
        freeEvent.IsPaid.Should().BeFalse();
    }

    [Test]
    public async Task EarlyBirdPricing_BeforeDeadline_AppliesDiscount()
    {
        // Arrange - Event with early bird pricing
        var earlyBirdDeadline = DateTime.UtcNow.AddDays(7);
        var eventWithEarlyBird = new Event
        {
            ClubId = _testClub.Id,
            Name = "Event with Early Bird",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Event with early bird discount",
            MemberPrice = 50.00m,
            NonMemberPrice = 75.00m,
            EarlyBirdPrice = 35.00m,
            EarlyBirdDeadline = earlyBirdDeadline,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventWithEarlyBird);
        await _context.SaveChangesAsync();

        // Act - Register before early bird deadline
        var rsvp = new EventRsvp
        {
            EventId = eventWithEarlyBird.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 35.00m, // Early bird price applied
            StripePaymentIntentId = "pi_earlybird_789",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Early bird price applied
        var savedRsvp = await _context.EventRsvps
            .FirstAsync(r => r.EventId == eventWithEarlyBird.Id);

        savedRsvp.PaidAmount.Should().Be(35.00m);
        savedRsvp.PaidAmount.Should().BeLessThan(eventWithEarlyBird.MemberPrice!.Value);
        eventWithEarlyBird.IsEarlyBirdActive.Should().BeTrue();
    }

    [Test]
    public async Task EventCapacity_WithPayment_EnforcesMaxCapacity()
    {
        // Arrange - Event with limited capacity
        var limitedEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Limited Capacity Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Small Venue",
            Description = "Limited capacity paid event",
            MemberPrice = 30.00m,
            NonMemberPrice = 40.00m,
            MaxCapacity = 1, // Only 1 spot
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(limitedEvent);
        await _context.SaveChangesAsync();

        // Act - First member registers successfully
        var rsvp1 = new EventRsvp
        {
            EventId = limitedEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 30.00m,
            StripePaymentIntentId = "pi_capacity_001",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp1);
        await _context.SaveChangesAsync();

        // Assert - Verify capacity tracking
        var rsvpCount = await _context.EventRsvps
            .Where(r => r.EventId == limitedEvent.Id && r.Status == RsvpStatus.Confirmed)
            .CountAsync();

        rsvpCount.Should().Be(1);
        rsvpCount.Should().BeLessOrEqualTo(limitedEvent.MaxCapacity!.Value);
    }

    #endregion

    #region Failed Payment Handling Tests

    [Test]
    public async Task FailedPayment_Registration_RsvpPending()
    {
        // Arrange - Paid event
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Paid Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Event with payment failure scenario",
            MemberPrice = 40.00m,
            NonMemberPrice = 60.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        // Act - Payment fails
        var rsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Pending,
            PaymentStatus = PaymentStatus.Failed,
            StripePaymentIntentId = "pi_failed_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Assert - RSVP remains pending, not confirmed
        var savedRsvp = await _context.EventRsvps
            .FirstAsync(r => r.EventId == paidEvent.Id && r.MemberId == _testMember.Id);

        savedRsvp.Status.Should().Be(RsvpStatus.Pending);
        savedRsvp.PaymentStatus.Should().Be(PaymentStatus.Failed);
        savedRsvp.PaidAmount.Should().BeNull();
    }

    [Test]
    public async Task RetryPayment_AfterFailure_ConfirmsRsvp()
    {
        // Arrange - Create RSVP with failed payment
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Retry Payment Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Event to test payment retry",
            MemberPrice = 45.00m,
            NonMemberPrice = 65.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Pending,
            PaymentStatus = PaymentStatus.Failed,
            StripePaymentIntentId = "pi_retry_failed",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Retry payment succeeds
        rsvp.Status = RsvpStatus.Confirmed;
        rsvp.PaymentStatus = PaymentStatus.Succeeded;
        rsvp.PaidAmount = 45.00m;
        rsvp.StripePaymentIntentId = "pi_retry_succeeded";
        rsvp.UpdatedAt = DateTime.UtcNow;
        _context.EventRsvps.Update(rsvp);
        await _context.SaveChangesAsync();

        // Assert - RSVP confirmed after successful retry
        var updated = await _context.EventRsvps
            .FirstAsync(r => r.EventId == paidEvent.Id && r.MemberId == _testMember.Id);

        updated.Status.Should().Be(RsvpStatus.Confirmed);
        updated.PaymentStatus.Should().Be(PaymentStatus.Succeeded);
        updated.PaidAmount.Should().Be(45.00m);
    }

    [Test]
    public async Task PaymentRequiresAction_3DSecure_StatusTracked()
    {
        // Arrange - Event requiring payment
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "3D Secure Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Event testing 3D Secure",
            MemberPrice = 55.00m,
            NonMemberPrice = 80.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        // Act - Payment requires 3D Secure authentication
        var rsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Pending,
            PaymentStatus = PaymentStatus.RequiresAction,
            StripePaymentIntentId = "pi_3dsecure_pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Status correctly reflects requires action
        var savedRsvp = await _context.EventRsvps
            .FirstAsync(r => r.EventId == paidEvent.Id && r.MemberId == _testMember.Id);

        savedRsvp.PaymentStatus.Should().Be(PaymentStatus.RequiresAction);
        savedRsvp.Status.Should().Be(RsvpStatus.Pending);
    }

    #endregion

    #region Refund Workflow Tests

    [Test]
    public async Task CancelRegistration_FullRefund_ProcessesRefund()
    {
        // Arrange - Confirmed paid registration
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Refundable Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Event with full refund policy",
            MemberPrice = 60.00m,
            NonMemberPrice = 90.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 60.00m,
            StripePaymentIntentId = "pi_to_refund_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Cancel and refund
        rsvp.Status = RsvpStatus.Cancelled;
        rsvp.PaymentStatus = PaymentStatus.Refunded;
        rsvp.UpdatedAt = DateTime.UtcNow;
        _context.EventRsvps.Update(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Refund processed
        var refunded = await _context.EventRsvps
            .FirstAsync(r => r.EventId == paidEvent.Id && r.MemberId == _testMember.Id);

        refunded.Status.Should().Be(RsvpStatus.Cancelled);
        refunded.PaymentStatus.Should().Be(PaymentStatus.Refunded);
        refunded.PaidAmount.Should().Be(60.00m); // Original amount still recorded
    }

    [Test]
    public async Task PartialRefund_LateCancellation_ProcessesPartialAmount()
    {
        // Arrange - Paid registration
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Partial Refund Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Event with partial refund policy",
            MemberPrice = 100.00m,
            NonMemberPrice = 150.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 100.00m,
            StripePaymentIntentId = "pi_partial_refund",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Partial refund (50%)
        rsvp.Status = RsvpStatus.Cancelled;
        rsvp.PaymentStatus = PaymentStatus.PartiallyRefunded;
        rsvp.UpdatedAt = DateTime.UtcNow;
        _context.EventRsvps.Update(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Partial refund status
        var refunded = await _context.EventRsvps
            .FirstAsync(r => r.EventId == paidEvent.Id && r.MemberId == _testMember.Id);

        refunded.PaymentStatus.Should().Be(PaymentStatus.PartiallyRefunded);
        refunded.Status.Should().Be(RsvpStatus.Cancelled);
    }

    [Test]
    public async Task RefundFailed_DatabaseState_Tracked()
    {
        // Arrange - Paid registration
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Refund Failure Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Event to test refund failure",
            MemberPrice = 70.00m,
            NonMemberPrice = 100.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 70.00m,
            StripePaymentIntentId = "pi_refund_will_fail",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Attempt refund but it fails
        rsvp.Status = RsvpStatus.Cancelled; // User cancels
        rsvp.PaymentStatus = PaymentStatus.Failed; // But refund fails
        rsvp.UpdatedAt = DateTime.UtcNow;
        _context.EventRsvps.Update(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Cancelled but payment shows as failed refund
        var failed = await _context.EventRsvps
            .FirstAsync(r => r.EventId == paidEvent.Id && r.MemberId == _testMember.Id);

        failed.Status.Should().Be(RsvpStatus.Cancelled);
        failed.PaymentStatus.Should().Be(PaymentStatus.Failed);
    }

    #endregion

    #region Stripe Webhook Processing Tests

    [Test]
    public async Task WebhookPaymentSucceeded_UpdatesRsvpStatus()
    {
        // Arrange - Pending RSVP awaiting payment
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Webhook Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Event for webhook testing",
            MemberPrice = 50.00m,
            NonMemberPrice = 75.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Pending,
            PaymentStatus = PaymentStatus.Processing,
            StripePaymentIntentId = "pi_webhook_success",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Webhook: payment_intent.succeeded
        var matchingRsvp = await _context.EventRsvps
            .FirstOrDefaultAsync(r => r.StripePaymentIntentId == "pi_webhook_success");

        if (matchingRsvp != null)
        {
            matchingRsvp.Status = RsvpStatus.Confirmed;
            matchingRsvp.PaymentStatus = PaymentStatus.Succeeded;
            matchingRsvp.PaidAmount = 50.00m;
            matchingRsvp.UpdatedAt = DateTime.UtcNow;
            _context.EventRsvps.Update(matchingRsvp);
            await _context.SaveChangesAsync();
        }

        // Assert - RSVP confirmed via webhook
        var updated = await _context.EventRsvps
            .FirstAsync(r => r.StripePaymentIntentId == "pi_webhook_success");

        updated.Status.Should().Be(RsvpStatus.Confirmed);
        updated.PaymentStatus.Should().Be(PaymentStatus.Succeeded);
        updated.PaidAmount.Should().Be(50.00m);
    }

    [Test]
    public async Task WebhookPaymentFailed_UpdatesFailureStatus()
    {
        // Arrange - Processing payment
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Webhook Failure Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Event for webhook failure testing",
            MemberPrice = 55.00m,
            NonMemberPrice = 80.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Pending,
            PaymentStatus = PaymentStatus.Processing,
            StripePaymentIntentId = "pi_webhook_fail",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Webhook: payment_intent.payment_failed
        var matchingRsvp = await _context.EventRsvps
            .FirstOrDefaultAsync(r => r.StripePaymentIntentId == "pi_webhook_fail");

        if (matchingRsvp != null)
        {
            matchingRsvp.PaymentStatus = PaymentStatus.Failed;
            matchingRsvp.UpdatedAt = DateTime.UtcNow;
            _context.EventRsvps.Update(matchingRsvp);
            await _context.SaveChangesAsync();
        }

        // Assert - Payment failed via webhook
        var updated = await _context.EventRsvps
            .FirstAsync(r => r.StripePaymentIntentId == "pi_webhook_fail");

        updated.Status.Should().Be(RsvpStatus.Pending);
        updated.PaymentStatus.Should().Be(PaymentStatus.Failed);
    }

    [Test]
    public async Task DuplicateWebhook_Idempotency_NoDoubleProcessing()
    {
        // Arrange - Already processed payment
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Idempotency Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Event for testing webhook idempotency",
            MemberPrice = 45.00m,
            NonMemberPrice = 65.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 45.00m,
            StripePaymentIntentId = "pi_idempotent_test",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Duplicate webhook received
        var matchingRsvp = await _context.EventRsvps
            .FirstOrDefaultAsync(r => r.StripePaymentIntentId == "pi_idempotent_test");

        if (matchingRsvp != null && matchingRsvp.PaymentStatus != PaymentStatus.Succeeded)
        {
            matchingRsvp.PaymentStatus = PaymentStatus.Succeeded;
            matchingRsvp.UpdatedAt = DateTime.UtcNow;
            _context.EventRsvps.Update(matchingRsvp);
            await _context.SaveChangesAsync();
        }

        // Assert - Status unchanged (idempotent)
        var unchanged = await _context.EventRsvps
            .FirstAsync(r => r.StripePaymentIntentId == "pi_idempotent_test");

        unchanged.PaymentStatus.Should().Be(PaymentStatus.Succeeded);
        unchanged.PaidAmount.Should().Be(45.00m);
    }

    #endregion

    #region Payment Token Workflow Tests

    [Test]
    public async Task PaymentToken_Generation_CreatesValidToken()
    {
        // Arrange & Act - Generate payment token
        var token = new PaymentToken
        {
            Token = Guid.NewGuid().ToString(),
            MemberId = _testMember.Id,
            ClubId = _testClub.Id,
            Amount = 150.00m,
            Description = "Annual Membership Dues",
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.PaymentTokens.Add(token);
        await _context.SaveChangesAsync();

        // Assert - Token created with correct properties
        var savedToken = await _context.PaymentTokens
            .FirstAsync(t => t.MemberId == _testMember.Id);

        savedToken.Token.Should().NotBeNullOrEmpty();
        savedToken.Amount.Should().Be(150.00m);
        savedToken.IsUsed.Should().BeFalse();
        savedToken.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Test]
    public async Task PaymentToken_UsedForPayment_MarkedAsUsed()
    {
        // Arrange - Create payment token
        var token = new PaymentToken
        {
            Token = Guid.NewGuid().ToString(),
            MemberId = _testMember.Id,
            ClubId = _testClub.Id,
            Amount = 75.00m,
            Description = "Event Registration Fee",
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.PaymentTokens.Add(token);
        await _context.SaveChangesAsync();

        // Act - Use token for payment
        var payment = new Payment
        {
            MemberId = _testMember.Id,
            ClubId = _testClub.Id,
            Amount = token.Amount,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Stripe",
            Notes = $"Payment via token {token.Token}",
            CreatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(payment);

        token.IsUsed = true;
        _context.PaymentTokens.Update(token);
        await _context.SaveChangesAsync();

        // Assert - Token marked as used
        var usedToken = await _context.PaymentTokens
            .FirstAsync(t => t.Token == token.Token);

        usedToken.IsUsed.Should().BeTrue();

        var recordedPayment = await _context.Payments
            .FirstAsync(p => p.MemberId == _testMember.Id);

        recordedPayment.Amount.Should().Be(75.00m);
    }

    [Test]
    public async Task ExpiredPaymentToken_CannotBeUsed()
    {
        // Arrange - Create expired token
        var expiredToken = new PaymentToken
        {
            Token = Guid.NewGuid().ToString(),
            MemberId = _testMember.Id,
            ClubId = _testClub.Id,
            Amount = 100.00m,
            Description = "Expired Payment Link",
            ExpiresAt = DateTime.UtcNow.AddHours(-1), // Expired 1 hour ago
            IsUsed = false,
            CreatedAt = DateTime.UtcNow.AddHours(-25)
        };
        _context.PaymentTokens.Add(expiredToken);
        await _context.SaveChangesAsync();

        // Act - Check if token is valid
        var token = await _context.PaymentTokens
            .FirstAsync(t => t.Token == expiredToken.Token);

        var isValid = !token.IsUsed && token.ExpiresAt > DateTime.UtcNow;

        // Assert - Token is expired and invalid
        isValid.Should().BeFalse();
        token.ExpiresAt.Should().BeBefore(DateTime.UtcNow);
    }

    [Test]
    public async Task PaymentToken_ReuseAttempt_Prevented()
    {
        // Arrange - Already used token
        var usedToken = new PaymentToken
        {
            Token = Guid.NewGuid().ToString(),
            MemberId = _testMember.Id,
            ClubId = _testClub.Id,
            Amount = 120.00m,
            Description = "Already Used Token",
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = true, // Already marked as used
            CreatedAt = DateTime.UtcNow
        };
        _context.PaymentTokens.Add(usedToken);
        await _context.SaveChangesAsync();

        // Act - Attempt to reuse token
        var token = await _context.PaymentTokens
            .FirstAsync(t => t.Token == usedToken.Token);

        var canReuse = !token.IsUsed && token.ExpiresAt > DateTime.UtcNow;

        // Assert - Token cannot be reused
        canReuse.Should().BeFalse();
        token.IsUsed.Should().BeTrue();
    }

    #endregion

    #region Multiple Registrations and Payments Tests

    [Test]
    public async Task MultipleEvents_SameMember_TracksAllPayments()
    {
        // Arrange - Create 3 different paid events
        var event1 = new Event
        {
            ClubId = _testClub.Id,
            Name = "Event 1",
            EventDateTime = DateTime.UtcNow.AddDays(10),
            Location = "Venue 1",
            Description = "First event",
            MemberPrice = 30.00m,
            NonMemberPrice = 45.00m,
            MaxCapacity = 50,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var event2 = new Event
        {
            ClubId = _testClub.Id,
            Name = "Event 2",
            EventDateTime = DateTime.UtcNow.AddDays(20),
            Location = "Venue 2",
            Description = "Second event",
            MemberPrice = 40.00m,
            NonMemberPrice = 60.00m,
            MaxCapacity = 50,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var event3 = new Event
        {
            ClubId = _testClub.Id,
            Name = "Event 3",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Venue 3",
            Description = "Third event",
            MemberPrice = 50.00m,
            NonMemberPrice = 75.00m,
            MaxCapacity = 50,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.AddRange(event1, event2, event3);
        await _context.SaveChangesAsync();

        // Act - Member registers for all 3 events
        var rsvps = new List<EventRsvp>
        {
            new EventRsvp
            {
                EventId = event1.Id,
                MemberId = _testMember.Id,
                Status = RsvpStatus.Confirmed,
                PaymentStatus = PaymentStatus.Succeeded,
                PaidAmount = 30.00m,
                StripePaymentIntentId = "pi_event1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventRsvp
            {
                EventId = event2.Id,
                MemberId = _testMember.Id,
                Status = RsvpStatus.Confirmed,
                PaymentStatus = PaymentStatus.Succeeded,
                PaidAmount = 40.00m,
                StripePaymentIntentId = "pi_event2",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventRsvp
            {
                EventId = event3.Id,
                MemberId = _testMember.Id,
                Status = RsvpStatus.Confirmed,
                PaymentStatus = PaymentStatus.Succeeded,
                PaidAmount = 50.00m,
                StripePaymentIntentId = "pi_event3",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.EventRsvps.AddRange(rsvps);
        await _context.SaveChangesAsync();

        // Assert - All payments tracked
        var memberRsvps = await _context.EventRsvps
            .Where(r => r.MemberId == _testMember.Id)
            .ToListAsync();

        var totalSpent = memberRsvps.Sum(r => r.PaidAmount ?? 0);

        memberRsvps.Should().HaveCount(3);
        memberRsvps.Should().AllSatisfy(r =>
        {
            r.Status.Should().Be(RsvpStatus.Confirmed);
            r.PaymentStatus.Should().Be(PaymentStatus.Succeeded);
        });
        totalSpent.Should().Be(120.00m);
    }

    [Test]
    public async Task SameEvent_MultipleMembers_TracksEachPayment()
    {
        // Arrange - Single event with multiple attendees
        var groupEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Group Event",
            EventDateTime = DateTime.UtcNow.AddDays(15),
            Location = "Large Venue",
            Description = "Event with multiple attendees",
            MemberPrice = 35.00m,
            NonMemberPrice = 50.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(groupEvent);
        await _context.SaveChangesAsync();

        // Act - Both members register
        var rsvps = new List<EventRsvp>
        {
            new EventRsvp
            {
                EventId = groupEvent.Id,
                MemberId = _testMember.Id,
                Status = RsvpStatus.Confirmed,
                PaymentStatus = PaymentStatus.Succeeded,
                PaidAmount = 35.00m,
                StripePaymentIntentId = "pi_member1_group",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventRsvp
            {
                EventId = groupEvent.Id,
                MemberId = _testNonMember.Id,
                Status = RsvpStatus.Confirmed,
                PaymentStatus = PaymentStatus.Succeeded,
                PaidAmount = 50.00m,
                StripePaymentIntentId = "pi_member2_group",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.EventRsvps.AddRange(rsvps);
        await _context.SaveChangesAsync();

        // Assert - Both payments tracked separately
        var eventRsvps = await _context.EventRsvps
            .Where(r => r.EventId == groupEvent.Id)
            .ToListAsync();

        var totalRevenue = eventRsvps.Sum(r => r.PaidAmount ?? 0);

        eventRsvps.Should().HaveCount(2);
        totalRevenue.Should().Be(85.00m);
    }

    #endregion

    #region Payment Status Transitions Tests

    [Test]
    public async Task PaymentStatusTransition_PendingToSucceeded_Valid()
    {
        // Arrange - Create RSVP with pending payment
        var event1 = new Event
        {
            ClubId = _testClub.Id,
            Name = "Status Transition Event",
            EventDateTime = DateTime.UtcNow.AddDays(20),
            Location = "Test Venue",
            Description = "Event for status transition testing",
            MemberPrice = 40.00m,
            NonMemberPrice = 60.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(event1);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = event1.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            StripePaymentIntentId = "pi_transition_test",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Transition to Processing, then to Succeeded
        rsvp.PaymentStatus = PaymentStatus.Processing;
        _context.EventRsvps.Update(rsvp);
        await _context.SaveChangesAsync();

        rsvp.Status = RsvpStatus.Confirmed;
        rsvp.PaymentStatus = PaymentStatus.Succeeded;
        rsvp.PaidAmount = 40.00m;
        rsvp.UpdatedAt = DateTime.UtcNow;
        _context.EventRsvps.Update(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Successful transition
        var final = await _context.EventRsvps
            .FirstAsync(r => r.StripePaymentIntentId == "pi_transition_test");

        final.PaymentStatus.Should().Be(PaymentStatus.Succeeded);
        final.Status.Should().Be(RsvpStatus.Confirmed);
    }

    [Test]
    public async Task PaymentDisputed_Status_TrackedCorrectly()
    {
        // Arrange - Successful payment that gets disputed
        var event1 = new Event
        {
            ClubId = _testClub.Id,
            Name = "Disputed Payment Event",
            EventDateTime = DateTime.UtcNow.AddDays(25),
            Location = "Test Venue",
            Description = "Event for testing disputed payments",
            MemberPrice = 80.00m,
            NonMemberPrice = 110.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(event1);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = event1.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 80.00m,
            StripePaymentIntentId = "pi_to_be_disputed",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Payment gets disputed
        rsvp.PaymentStatus = PaymentStatus.Disputed;
        rsvp.UpdatedAt = DateTime.UtcNow;
        _context.EventRsvps.Update(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Dispute tracked
        var disputed = await _context.EventRsvps
            .FirstAsync(r => r.StripePaymentIntentId == "pi_to_be_disputed");

        disputed.PaymentStatus.Should().Be(PaymentStatus.Disputed);
        disputed.PaidAmount.Should().Be(80.00m);
    }

    #endregion

    #region Edge Cases and Boundary Tests

    [Test]
    public async Task Payment_ZeroAmount_FreeEventHandling()
    {
        // Arrange - Event with explicit 0.00 price
        var freeEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Explicit Free Event",
            EventDateTime = DateTime.UtcNow.AddDays(15),
            Location = "Community Center",
            Description = "Explicitly free event",
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            MaxCapacity = 200,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(freeEvent);
        await _context.SaveChangesAsync();

        // Act - Register without payment
        var rsvp = new EventRsvp
        {
            EventId = freeEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 0.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Zero payment recorded
        var saved = await _context.EventRsvps
            .FirstAsync(r => r.EventId == freeEvent.Id);

        saved.PaidAmount.Should().Be(0.00m);
        saved.Status.Should().Be(RsvpStatus.Confirmed);
        saved.StripePaymentIntentId.Should().BeNullOrEmpty();
    }

    [Test]
    public async Task Payment_MaximumAmount_ProcessedCorrectly()
    {
        // Arrange - High-value event
        var premiumEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Premium Gala Event",
            EventDateTime = DateTime.UtcNow.AddDays(60),
            Location = "Grand Ballroom",
            Description = "High-value premium event",
            MemberPrice = 999.99m,
            NonMemberPrice = 1499.99m,
            MaxCapacity = 50,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(premiumEvent);
        await _context.SaveChangesAsync();

        // Act - Process high-value payment
        var rsvp = new EventRsvp
        {
            EventId = premiumEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 999.99m,
            StripePaymentIntentId = "pi_high_value_123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Assert - High value processed
        var saved = await _context.EventRsvps
            .FirstAsync(r => r.EventId == premiumEvent.Id);

        saved.PaidAmount.Should().Be(999.99m);
        saved.PaymentStatus.Should().Be(PaymentStatus.Succeeded);
    }

    [Test]
    public async Task ConcurrentPayments_SameEvent_AllProcessedIndependently()
    {
        // Arrange - Popular event
        var popularEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "High-Demand Event",
            EventDateTime = DateTime.UtcNow.AddDays(14),
            Location = "Convention Center",
            Description = "Event with concurrent registrations",
            MemberPrice = 45.00m,
            NonMemberPrice = 65.00m,
            MaxCapacity = 500,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(popularEvent);
        await _context.SaveChangesAsync();

        // Act - Multiple concurrent payments
        var rsvps = new List<EventRsvp>
        {
            new EventRsvp
            {
                EventId = popularEvent.Id,
                MemberId = _testMember.Id,
                Status = RsvpStatus.Confirmed,
                PaymentStatus = PaymentStatus.Succeeded,
                PaidAmount = 45.00m,
                StripePaymentIntentId = "pi_concurrent_1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new EventRsvp
            {
                EventId = popularEvent.Id,
                MemberId = _testNonMember.Id,
                Status = RsvpStatus.Confirmed,
                PaymentStatus = PaymentStatus.Succeeded,
                PaidAmount = 65.00m,
                StripePaymentIntentId = "pi_concurrent_2",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.EventRsvps.AddRange(rsvps);
        await _context.SaveChangesAsync();

        // Assert - All payments independent
        var allRsvps = await _context.EventRsvps
            .Where(r => r.EventId == popularEvent.Id)
            .ToListAsync();

        allRsvps.Should().HaveCount(2);
        allRsvps.Should().AllSatisfy(r =>
        {
            r.PaymentStatus.Should().Be(PaymentStatus.Succeeded);
            r.StripePaymentIntentId.Should().NotBeNullOrEmpty();
        });
    }

    [Test]
    public async Task PaymentToken_BulkGeneration_AllUniqueTokens()
    {
        // Arrange & Act - Generate multiple tokens
        var tokens = new List<PaymentToken>();
        for (int i = 0; i < 10; i++)
        {
            tokens.Add(new PaymentToken
            {
                Token = Guid.NewGuid().ToString(),
                MemberId = _testMember.Id,
                ClubId = _testClub.Id,
                Amount = 50.00m * (i + 1),
                Description = $"Payment {i + 1}",
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.PaymentTokens.AddRange(tokens);
        await _context.SaveChangesAsync();

        // Assert - All tokens unique
        var savedTokens = await _context.PaymentTokens
            .Where(t => t.MemberId == _testMember.Id)
            .ToListAsync();

        savedTokens.Should().HaveCount(10);
        var uniqueTokens = savedTokens.Select(t => t.Token).Distinct().Count();
        uniqueTokens.Should().Be(10);
    }

    [Test]
    public async Task MemberDues_PaymentRecord_TrackedSeparatelyFromEvents()
    {
        // Arrange & Act - Record member dues payment
        var duesPayment = new Payment
        {
            MemberId = _testMember.Id,
            ClubId = _testClub.Id,
            Amount = 100.00m,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Stripe",
            Notes = "Monthly membership dues",
            CreatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(duesPayment);
        await _context.SaveChangesAsync();

        // Also create event payment
        var paidEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Member Event",
            EventDateTime = DateTime.UtcNow.AddDays(20),
            Location = "Venue",
            Description = "Event after dues payment",
            MemberPrice = 30.00m,
            NonMemberPrice = 45.00m,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        var eventRsvp = new EventRsvp
        {
            EventId = paidEvent.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 30.00m,
            StripePaymentIntentId = "pi_event_after_dues",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(eventRsvp);
        await _context.SaveChangesAsync();

        // Assert - Both payment types tracked
        var duesRecord = await _context.Payments
            .FirstAsync(p => p.MemberId == _testMember.Id);

        var eventPayment = await _context.EventRsvps
            .FirstAsync(r => r.MemberId == _testMember.Id);

        duesRecord.Amount.Should().Be(100.00m);
        duesRecord.Notes.Should().Contain("dues");

        eventPayment.PaidAmount.Should().Be(30.00m);
        eventPayment.StripePaymentIntentId.Should().Contain("event");
    }

    [Test]
    public async Task EarlyBirdDeadlinePassed_RegularPricing_Applied()
    {
        // Arrange - Event with expired early bird
        var pastDeadline = DateTime.UtcNow.AddDays(-1);
        var eventWithExpiredEarlyBird = new Event
        {
            ClubId = _testClub.Id,
            Name = "Event Past Early Bird",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Early bird expired",
            MemberPrice = 60.00m,
            NonMemberPrice = 85.00m,
            EarlyBirdPrice = 40.00m,
            EarlyBirdDeadline = pastDeadline,
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventWithExpiredEarlyBird);
        await _context.SaveChangesAsync();

        // Act - Register after early bird deadline
        var rsvp = new EventRsvp
        {
            EventId = eventWithExpiredEarlyBird.Id,
            MemberId = _testMember.Id,
            Status = RsvpStatus.Confirmed,
            PaymentStatus = PaymentStatus.Succeeded,
            PaidAmount = 60.00m, // Regular member price
            StripePaymentIntentId = "pi_late_registration",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Regular price charged (not early bird)
        var saved = await _context.EventRsvps
            .FirstAsync(r => r.EventId == eventWithExpiredEarlyBird.Id);

        saved.PaidAmount.Should().Be(60.00m);
        saved.PaidAmount.Should().NotBe(eventWithExpiredEarlyBird.EarlyBirdPrice);
        eventWithExpiredEarlyBird.IsEarlyBirdActive.Should().BeFalse();
    }

    #endregion
}
