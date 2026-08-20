using GatherGrove.Application.Configuration;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using System.Security.Cryptography;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling event payment operations (EC-03: Member Event Payment)
/// </summary>
public class EventPaymentService : IEventPaymentService
{
    private readonly GatherGroveDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EventPaymentService> _logger;
    private readonly StripeSettings _stripeSettings;

    public EventPaymentService(
        GatherGroveDbContext context,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<EventPaymentService> logger,
        IOptions<StripeSettings> stripeSettings)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
        _stripeSettings = stripeSettings.Value;
    }

    /// <summary>
    /// Processes payment for an event for an authenticated member
    /// </summary>
    public async Task<EventPaymentResponse> PayForEventAsync(int userId, PayEventRequest request)
    {
        _logger.LogInformation("Processing event payment for user {UserId}, event {EventId}",
            userId, request.EventId);

        // Get the user's email from their User record to find their Member record
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found", userId);
            throw new ArgumentException("User not found");
        }

        // Get the member record for this user by email
        var member = await _context.Members
            .Include(m => m.Club)
            .FirstOrDefaultAsync(m => m.Email == user.Email);

        if (member == null)
        {
            _logger.LogWarning("Member profile not found for user {UserId} with email {Email}",
                userId, user.Email);
            throw new ArgumentException("Member profile not found for the authenticated user. " +
                "You must be a member of the club to pay member pricing for events.");
        }

        // Get the event and verify it exists and is paid
        var eventEntity = await _context.Events
            .Include(e => e.Club)
            .FirstOrDefaultAsync(e => e.Id == request.EventId);

        if (eventEntity == null)
        {
            _logger.LogWarning("Event {EventId} not found", request.EventId);
            throw new ArgumentException($"Event with ID {request.EventId} not found", nameof(request.EventId));
        }

        // Verify member belongs to the event's club
        if (member.ClubId != eventEntity.ClubId)
        {
            _logger.LogWarning("Member {MemberId} does not belong to event's club {ClubId}",
                member.Id, eventEntity.ClubId);
            throw new InvalidOperationException("You must be a member of this club to pay for this event");
        }

        // Verify event is paid (not free)
        if (eventEntity.IsFree)
        {
            _logger.LogWarning("Event {EventId} is free, no payment required", request.EventId);
            throw new InvalidOperationException("This event does not require payment");
        }

        // Get member pricing
        var memberPrice = eventEntity.MemberPrice ?? 0;
        if (memberPrice <= 0)
        {
            _logger.LogWarning("Event {EventId} has no member price set", request.EventId);
            throw new InvalidOperationException("Member pricing is not available for this event");
        }

        // Verify club has Stripe connected
        if (string.IsNullOrEmpty(eventEntity.Club.StripeAccountId))
        {
            _logger.LogWarning("Club {ClubId} has no Stripe account connected", eventEntity.ClubId);
            throw new InvalidOperationException("This club has not configured online payments. " +
                "Please contact your club administrator.");
        }

        // Check for existing paid RSVP (duplicate payment prevention)
        var existingPaidRsvp = await _context.EventRsvps
            .FirstOrDefaultAsync(r => r.EventId == request.EventId
                && r.MemberId == member.Id
                && r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded);

        if (existingPaidRsvp != null)
        {
            _logger.LogWarning("Member {MemberId} has already paid for event {EventId}",
                member.Id, request.EventId);
            throw new InvalidOperationException("You have already paid for this event");
        }

        // Configure Stripe
        StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];

        // Auto-detect if we can use application fees
        var platformCountry = _stripeSettings.PlatformCountry ?? "US";
        var connectedCountry = eventEntity.Club.StripeAccountCountry ?? _stripeSettings.DefaultCountry ?? "US";
        var useApplicationFees = StripeRegions.AreApplicationFeesSupported(platformCountry, connectedCountry);

        if (!useApplicationFees)
        {
            _logger.LogInformation("Cross-region payment detected: Platform ({PlatformCountry}) -> Connected ({ConnectedCountry}). Using manual transfers.",
                platformCountry, connectedCountry);
        }

        // Begin database transaction BEFORE Stripe payment for atomicity
        using var transaction = await _context.Database.BeginTransactionAsync();

        PaymentIntent? paymentIntent = null;
        string? stripePaymentIntentId = null;
        EventRsvp? createdRsvp = null;

        try
        {
            _logger.LogInformation("Creating payment intent for ${Amount} (event: {EventId}, member: {MemberId})",
                memberPrice, request.EventId, member.Id);

            // Create payment intent with the payment method directly
            var paymentIntentService = new PaymentIntentService();
            var paymentIntentOptions = new PaymentIntentCreateOptions
            {
                Amount = (long)(memberPrice * 100), // Convert to cents
                Currency = "usd",
                PaymentMethod = request.PaymentMethodId,
                Confirm = true,
                Description = $"Event: {eventEntity.Name} - {eventEntity.Club.Name}",
                Metadata = new Dictionary<string, string>
                {
                    ["event_id"] = request.EventId.ToString(),
                    ["member_id"] = member.Id.ToString(),
                    ["club_id"] = eventEntity.ClubId.ToString(),
                    ["payment_type"] = "event_registration"
                },
                PaymentMethodTypes = new List<string> { "card" },
                ReturnUrl = $"{_configuration["App:FrontendUrl"]}/events/{request.EventId}/payment/success"
            };

            // Add transfer to club Stripe account (no platform fee — full amount goes to club)
            if (useApplicationFees)
            {
                paymentIntentOptions.TransferData = new PaymentIntentTransferDataOptions
                {
                    Destination = eventEntity.Club.StripeAccountId
                };
            }

            // Create and confirm the payment intent (with idempotency key to prevent double charges on retry)
            try
            {
                var requestOptions = new Stripe.RequestOptions
                {
                    IdempotencyKey = $"event_{request.EventId}_member_{member.Id}_pm_{request.PaymentMethodId}"
                };
                paymentIntent = await paymentIntentService.CreateAsync(paymentIntentOptions, requestOptions);
                stripePaymentIntentId = paymentIntent.Id;

                _logger.LogInformation("Created payment intent {PaymentIntentId} with status {Status}",
                    paymentIntent.Id, paymentIntent.Status);
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe payment failed: {Message}", ex.Message);

                if (ex.Message.Contains("No such PaymentMethod"))
                {
                    throw new InvalidOperationException(
                        "Payment method not found. Please refresh the page and try again. " +
                        "If the problem persists, try clearing your browser cache.");
                }

                throw new InvalidOperationException($"Payment failed: {ex.Message}");
            }

            // If payment requires additional action, throw an exception
            if (paymentIntent.Status == "requires_action")
            {
                throw new InvalidOperationException("Payment requires additional authentication");
            }

            if (paymentIntent.Status != "succeeded")
            {
                throw new InvalidOperationException($"Payment failed with status: {paymentIntent.Status}");
            }

            // Handle manual transfer for cross-border scenarios
            if (!useApplicationFees && paymentIntent.Status == "succeeded")
            {
                try
                {
                    var transferService = new TransferService();
                    var transferAmount = (long)(memberPrice * 100);

                    var transfer = await transferService.CreateAsync(new TransferCreateOptions
                    {
                        Amount = transferAmount,
                        Currency = "usd",
                        Destination = eventEntity.Club.StripeAccountId,
                        Description = $"Event payment: {eventEntity.Name}",
                        SourceTransaction = paymentIntent.LatestChargeId,
                        Metadata = new Dictionary<string, string>
                        {
                            ["payment_intent_id"] = paymentIntent.Id,
                            ["event_id"] = request.EventId.ToString(),
                            ["club_id"] = eventEntity.ClubId.ToString()
                        }
                    });

                    _logger.LogInformation("Manual transfer completed. Transfer ID: {TransferId}", transfer.Id);
                }
                catch (StripeException transferEx)
                {
                    _logger.LogError(transferEx, "Failed to create transfer for event payment");
                }
            }

            // Generate confirmation number
            var confirmationNumber = GenerateConfirmationNumber();

            // Create or update RSVP record
            var existingRsvp = await _context.EventRsvps
                .FirstOrDefaultAsync(r => r.EventId == request.EventId && r.MemberId == member.Id);

            if (existingRsvp != null)
            {
                // Update existing RSVP
                existingRsvp.Status = Domain.Enums.RsvpStatus.Confirmed;
                existingRsvp.RsvpStatus = "Confirmed";
                existingRsvp.PaymentStatus = Domain.Enums.PaymentStatus.Succeeded;
                existingRsvp.PaidAmount = memberPrice;
                existingRsvp.StripePaymentIntentId = paymentIntent.Id;
                existingRsvp.UpdatedAt = DateTime.UtcNow;
                createdRsvp = existingRsvp;
            }
            else
            {
                // Create new RSVP
                createdRsvp = new EventRsvp
                {
                    EventId = request.EventId,
                    MemberId = member.Id,
                    Status = Domain.Enums.RsvpStatus.Confirmed,
                    RsvpStatus = "Confirmed",
                    PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
                    PaidAmount = memberPrice,
                    StripePaymentIntentId = paymentIntent.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.EventRsvps.Add(createdRsvp);
            }

            // Save changes within transaction
            await _context.SaveChangesAsync();

            // Commit the transaction
            await transaction.CommitAsync();

            _logger.LogInformation("Event payment completed successfully. PaymentIntent: {PaymentIntentId}, RSVP: {RsvpId}",
                stripePaymentIntentId, createdRsvp.Id);

            // Send confirmation email (outside transaction - non-critical)
            try
            {
                await _emailService.SendEventPaymentConfirmationEmailAsync(
                    member.Email,
                    member.FullName,
                    eventEntity.Club.Name,
                    eventEntity.Name,
                    eventEntity.EventDateTime,
                    eventEntity.Location,
                    memberPrice,
                    paymentIntent.Id,
                    confirmationNumber);
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Failed to send confirmation email to {Email}", member.Email);
                // Don't fail the payment if email fails
            }

            // Return success response
            return new EventPaymentResponse
            {
                Success = true,
                PaymentId = paymentIntent.Id,
                RsvpId = createdRsvp.Id,
                ConfirmationNumber = confirmationNumber,
                AmountPaid = memberPrice,
                EventName = eventEntity.Name,
                EventDateTime = eventEntity.EventDateTime,
                EventLocation = eventEntity.Location,
                ClubName = eventEntity.Club.Name
            };
        }
        catch (Exception ex)
        {
            // Rollback the database transaction
            await transaction.RollbackAsync();

            _logger.LogError(ex, "Event payment processing failed. Rolling back database transaction.");

            // If Stripe payment succeeded but database failed, issue a refund
            if (paymentIntent != null && paymentIntent.Status == "succeeded" && !string.IsNullOrEmpty(stripePaymentIntentId))
            {
                try
                {
                    _logger.LogWarning("Database transaction failed after successful Stripe payment {PaymentIntentId}. Issuing refund.",
                        stripePaymentIntentId);

                    var refundService = new Stripe.RefundService();
                    var refund = await refundService.CreateAsync(new Stripe.RefundCreateOptions
                    {
                        PaymentIntent = stripePaymentIntentId,
                        Reason = Stripe.RefundReasons.RequestedByCustomer,
                        Metadata = new Dictionary<string, string>
                        {
                            ["reason"] = "database_transaction_failed",
                            ["original_payment_intent"] = stripePaymentIntentId
                        }
                    });

                    _logger.LogInformation("Issued refund {RefundId} for failed event payment processing", refund.Id);
                }
                catch (StripeException refundEx)
                {
                    _logger.LogCritical(refundEx,
                        "CRITICAL: Failed to issue refund for payment intent {PaymentIntentId}. Manual intervention required.",
                        stripePaymentIntentId);
                }
            }

            throw;
        }
    }

    /// <summary>
    /// Generates a unique confirmation number for RSVP
    /// </summary>
    private static string GenerateConfirmationNumber()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[6];
        rng.GetBytes(bytes);
        return Convert.ToHexString(bytes).ToUpper();
    }

    /// <summary>
    /// Get payment details by payment ID
    /// </summary>
    public async Task<EventPaymentDetailsDto?> GetPaymentDetailsAsync(string paymentId, int clubId)
    {
        _logger.LogInformation("Getting payment details for payment ID: {PaymentId}", paymentId);

        var rsvp = await _context.EventRsvps
            .Include(r => r.Member)
            .Include(r => r.Event)
            .ThenInclude(e => e.Club)
            .FirstOrDefaultAsync(r => r.StripePaymentIntentId == paymentId && r.Event.ClubId == clubId);

        if (rsvp == null)
        {
            _logger.LogWarning("Payment not found for payment ID: {PaymentId}", paymentId);
            return null;
        }

        return new EventPaymentDetailsDto
        {
            RsvpId = rsvp.Id,
            EventId = rsvp.EventId,
            EventName = rsvp.Event.Name,
            EventDateTime = rsvp.Event.EventDateTime,
            MemberId = rsvp.MemberId,
            Name = rsvp.Member.FullName,
            Email = rsvp.Member.Email,
            IsGuestRegistration = false,
            PaymentStatus = rsvp.PaymentStatus.ToString(),
            AmountPaid = rsvp.PaidAmount,
            PaymentDate = rsvp.CreatedAt,
            PaymentMethod = "stripe",
            StripePaymentIntentId = rsvp.StripePaymentIntentId,
            CanRefund = rsvp.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded,
            ClubId = rsvp.Event.ClubId,
            ClubName = rsvp.Event.Club.Name,
            CreatedAt = rsvp.CreatedAt,
            UpdatedAt = rsvp.UpdatedAt
        };
    }

    /// <summary>
    /// Process a refund for a payment
    /// </summary>
    public async Task<EventPaymentRefundResponse> ProcessRefundAsync(string paymentId, string reason, int clubId)
    {
        _logger.LogInformation("Processing refund for payment ID: {PaymentId}, reason: {Reason}", paymentId, reason);

        var rsvp = await _context.EventRsvps
            .Include(r => r.Member)
            .Include(r => r.Event)
            .ThenInclude(e => e.Club)
            .FirstOrDefaultAsync(r => r.StripePaymentIntentId == paymentId && r.Event.ClubId == clubId);

        if (rsvp == null)
        {
            _logger.LogWarning("Payment not found for refund: {PaymentId}", paymentId);
            throw new KeyNotFoundException($"Payment with ID {paymentId} not found");
        }

        if (rsvp.PaymentStatus != Domain.Enums.PaymentStatus.Succeeded)
        {
            _logger.LogWarning("Cannot refund payment with status: {Status}", rsvp.PaymentStatus);
            throw new InvalidOperationException($"Cannot refund payment with status: {rsvp.PaymentStatus}");
        }

        // Configure Stripe
        StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];

        try
        {
            var refundService = new Stripe.RefundService();
            var refund = await refundService.CreateAsync(new Stripe.RefundCreateOptions
            {
                PaymentIntent = paymentId,
                Reason = Stripe.RefundReasons.RequestedByCustomer,
                Metadata = new Dictionary<string, string>
                {
                    ["reason"] = reason,
                    ["refunded_by"] = "system",
                    ["original_payment_intent"] = paymentId
                }
            });

            // Update RSVP status
            rsvp.PaymentStatus = Domain.Enums.PaymentStatus.Refunded;
            rsvp.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Refund processed successfully. Refund ID: {RefundId}", refund.Id);

            return new EventPaymentRefundResponse
            {
                Success = true,
                RefundId = refund.Id,
                RefundAmount = rsvp.PaidAmount ?? 0m,
                Currency = "USD",
                RefundStatus = refund.Status,
                Reason = reason,
                RefundDate = DateTime.UtcNow,
                OriginalPaymentId = paymentId
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to process refund for payment: {PaymentId}", paymentId);
            throw new InvalidOperationException($"Refund failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Get payment history for an event
    /// </summary>
    public async Task<List<EventPaymentDetailsDto>> GetPaymentHistoryAsync(int eventId, int clubId)
    {
        _logger.LogInformation("Getting payment history for event ID: {EventId}", eventId);

        var payments = await _context.EventRsvps
            .Include(r => r.Member)
            .Include(r => r.Event)
            .ThenInclude(e => e.Club)
            .Where(r => r.EventId == eventId &&
                r.Event.ClubId == clubId &&
                r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return payments.Select(p => new EventPaymentDetailsDto
        {
            RsvpId = p.Id,
            EventId = p.EventId,
            EventName = p.Event.Name,
            EventDateTime = p.Event.EventDateTime,
            MemberId = p.MemberId,
            Name = p.Member.FullName,
            Email = p.Member.Email,
            IsGuestRegistration = false,
            PaymentStatus = p.PaymentStatus.ToString(),
            AmountPaid = p.PaidAmount,
            PaymentDate = p.CreatedAt,
            PaymentMethod = "stripe",
            StripePaymentIntentId = p.StripePaymentIntentId,
            CanRefund = p.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded,
            ClubId = p.Event.ClubId,
            ClubName = p.Event.Club.Name,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToList();
    }
}
