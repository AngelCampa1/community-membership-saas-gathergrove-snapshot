using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.API.Tests.Mocks;

/// <summary>
/// Mock implementation of IEventPaymentService for testing
/// Bypasses actual Stripe API calls
/// </summary>
public class MockEventPaymentService : IEventPaymentService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<MockEventPaymentService> _logger;

    public MockEventPaymentService(
        GatherGroveDbContext context,
        ILogger<MockEventPaymentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<EventPaymentResponse> PayForEventAsync(int userId, PayEventRequest request)
    {
        try
        {
            _logger.LogInformation("Processing MOCK member event payment for user {UserId}, event {EventId}",
                userId, request.EventId);

            // Get the user's email from their User record to find their Member record
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                Console.WriteLine($"User {userId} not found");
                throw new ArgumentException("User not found");
            }

            Console.WriteLine($"Found user {userId}: {user.Email}");

            // Get the member record for this user by email
            var member = await _context.Members
                .Include(m => m.Club)
                .FirstOrDefaultAsync(m => m.Email == user.Email);

            if (member == null)
            {
                Console.WriteLine($"Member profile not found for email {user.Email}");
                throw new ArgumentException($"Member profile not found for user {userId}");
            }

            Console.WriteLine($"Found member {member.Id} for user {userId}");

            // Get the event
            var eventEntity = await _context.Events
                .Include(e => e.Club)
                .FirstOrDefaultAsync(e => e.Id == request.EventId);

            if (eventEntity == null)
                throw new ArgumentException($"Event with ID {request.EventId} not found");

            if (eventEntity.IsFree)
                throw new InvalidOperationException("This event does not require payment");

            var amount = eventEntity.MemberPrice ?? 0;
            if (amount <= 0)
                throw new InvalidOperationException("Member pricing is not available for this event");

            // Check for duplicate registration
            var existingRsvp = await _context.EventRsvps
                .FirstOrDefaultAsync(r => r.EventId == request.EventId
                    && r.MemberId == member.Id
                    && r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded);

            if (existingRsvp != null)
                throw new InvalidOperationException("You have already paid for this event");

            // MOCK: Create fake payment intent ID instead of calling Stripe
            var mockPaymentIntentId = $"pi_test_{Guid.NewGuid().ToString("N").Substring(0, 24)}";

            // Generate confirmation number
            var confirmationNumber = GenerateConfirmationNumber();

            // Create EventRsvp
            var rsvp = new Domain.Entities.EventRsvp
            {
                EventId = request.EventId,
                MemberId = member.Id,
                Status = Domain.Enums.RsvpStatus.Confirmed,
                PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
                PaidAmount = amount,
                StripePaymentIntentId = mockPaymentIntentId,
                RsvpStatus = "Confirmed",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.EventRsvps.Add(rsvp);
            await _context.SaveChangesAsync();

            return new EventPaymentResponse
            {
                Success = true,
                PaymentId = mockPaymentIntentId,
                RsvpId = rsvp.Id,
                ConfirmationNumber = confirmationNumber,
                AmountPaid = amount,
                EventName = eventEntity.Name,
                EventDateTime = eventEntity.EventDateTime,
                EventLocation = eventEntity.Location ?? "TBD",
                ClubName = eventEntity.Club.Name
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in PayForEventAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
    }

    public async Task<EventPaymentDetailsDto?> GetPaymentDetailsAsync(string paymentId, int clubId)
    {
        var rsvp = await _context.EventRsvps
            .Include(r => r.Event)
                .ThenInclude(e => e.Club)
            .Include(r => r.Member)
            .FirstOrDefaultAsync(r => r.StripePaymentIntentId == paymentId && r.Event.ClubId == clubId);

        if (rsvp == null)
            return null;

        return new EventPaymentDetailsDto
        {
            RsvpId = rsvp.Id,
            EventId = rsvp.EventId,
            EventName = rsvp.Event.Name,
            EventDateTime = rsvp.Event.EventDateTime,
            MemberId = rsvp.MemberId,
            Name = rsvp.GuestName ?? rsvp.Member?.FullName ?? "",
            Email = rsvp.GuestEmail ?? rsvp.Member?.Email ?? "",
            IsGuestRegistration = rsvp.IsGuestRegistration,
            PaymentStatus = rsvp.PaymentStatus.ToString(),
            AmountPaid = rsvp.PaidAmount,
            PaymentDate = rsvp.CreatedAt,
            PaymentMethod = "Stripe",
            StripePaymentIntentId = rsvp.StripePaymentIntentId,
            CanRefund = rsvp.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded,
            ClubId = rsvp.Event.ClubId,
            ClubName = rsvp.Event.Club.Name,
            CreatedAt = rsvp.CreatedAt,
            UpdatedAt = rsvp.UpdatedAt
        };
    }

    public async Task<EventPaymentRefundResponse> ProcessRefundAsync(string paymentId, string reason, int clubId)
    {
        var rsvp = await _context.EventRsvps
            .FirstOrDefaultAsync(r => r.StripePaymentIntentId == paymentId && r.Event.ClubId == clubId);

        if (rsvp == null)
            throw new KeyNotFoundException($"Payment with ID {paymentId} not found");

        if (rsvp.PaymentStatus != Domain.Enums.PaymentStatus.Succeeded)
            throw new InvalidOperationException("Cannot refund a payment that has not succeeded");

        // MOCK: Create fake refund ID instead of calling Stripe
        var mockRefundId = $"re_test_{Guid.NewGuid().ToString("N").Substring(0, 24)}";

        // Update RSVP status
        rsvp.PaymentStatus = Domain.Enums.PaymentStatus.Refunded;
        rsvp.Status = Domain.Enums.RsvpStatus.Cancelled;
        rsvp.RsvpStatus = "Cancelled";
        rsvp.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new EventPaymentRefundResponse
        {
            Success = true,
            RefundId = mockRefundId,
            RefundAmount = rsvp.PaidAmount ?? 0,
            Currency = "USD",
            RefundStatus = "succeeded",
            Reason = reason,
            RefundDate = DateTime.UtcNow,
            OriginalPaymentId = paymentId
        };
    }

    public async Task<List<EventPaymentDetailsDto>> GetPaymentHistoryAsync(int eventId, int clubId)
    {
        var rsvps = await _context.EventRsvps
            .Include(r => r.Event)
                .ThenInclude(e => e.Club)
            .Include(r => r.Member)
            .Where(r => r.EventId == eventId &&
                r.Event.ClubId == clubId &&
                r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded)
            .ToListAsync();

        return rsvps.Select(rsvp => new EventPaymentDetailsDto
        {
            RsvpId = rsvp.Id,
            EventId = rsvp.EventId,
            EventName = rsvp.Event.Name,
            EventDateTime = rsvp.Event.EventDateTime,
            MemberId = rsvp.MemberId,
            Name = rsvp.GuestName ?? rsvp.Member?.FullName ?? "",
            Email = rsvp.GuestEmail ?? rsvp.Member?.Email ?? "",
            IsGuestRegistration = rsvp.IsGuestRegistration,
            PaymentStatus = rsvp.PaymentStatus.ToString(),
            AmountPaid = rsvp.PaidAmount,
            PaymentDate = rsvp.CreatedAt,
            PaymentMethod = "Stripe",
            StripePaymentIntentId = rsvp.StripePaymentIntentId,
            CanRefund = rsvp.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded,
            ClubId = rsvp.Event.ClubId,
            ClubName = rsvp.Event.Club.Name,
            CreatedAt = rsvp.CreatedAt,
            UpdatedAt = rsvp.UpdatedAt
        }).ToList();
    }

    private string GenerateConfirmationNumber()
    {
        return $"CONF-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
    }
}
