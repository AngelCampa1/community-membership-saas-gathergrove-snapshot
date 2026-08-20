using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;
using System.Security.Cryptography;
using System.Text;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling non-member event payments with optional membership upgrade (EC-04)
/// </summary>
public class NonMemberEventPaymentService : INonMemberEventPaymentService
{
    private readonly GatherGroveDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NonMemberEventPaymentService> _logger;

    public NonMemberEventPaymentService(
        GatherGroveDbContext context,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<NonMemberEventPaymentService> logger)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Process payment for a non-member guest including optional membership upgrade and account creation
    /// </summary>
    public async Task<NonMemberEventPaymentResponse> ProcessNonMemberEventPaymentAsync(NonMemberEventPaymentRequest request)
    {
        _logger.LogInformation("Processing non-member event payment for event {EventId}, guest {GuestEmail}",
            request.EventId, request.GuestEmail);

        // Validate required fields
        if (string.IsNullOrWhiteSpace(request.GuestName))
        {
            throw new ArgumentException("Guest name is required", nameof(request.GuestName));
        }

        if (string.IsNullOrWhiteSpace(request.GuestEmail))
        {
            throw new ArgumentException("Guest email is required", nameof(request.GuestEmail));
        }

        if (request.CreateAccount && string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Password is required when creating an account", nameof(request.Password));
        }

        // Get the event and verify it exists and is paid
        var eventEntity = await _context.Events
            .Include(e => e.Club)
                .ThenInclude(c => c.MembershipTypes)
            .FirstOrDefaultAsync(e => e.Id == request.EventId);

        if (eventEntity == null)
        {
            _logger.LogWarning("Event {EventId} not found", request.EventId);
            throw new ArgumentException($"Event with ID {request.EventId} not found", nameof(request.EventId));
        }

        // Verify event is paid (not free)
        if (eventEntity.IsFree)
        {
            _logger.LogWarning("Event {EventId} is free, no payment required", request.EventId);
            throw new InvalidOperationException("This event does not require payment");
        }

        // Get non-member pricing
        var eventAmount = eventEntity.NonMemberPrice ?? 0;
        if (eventAmount <= 0)
        {
            _logger.LogWarning("Event {EventId} has no non-member price set", request.EventId);
            throw new InvalidOperationException("Non-member pricing is not available for this event");
        }

        // Verify club has Stripe connected
        if (string.IsNullOrEmpty(eventEntity.Club.StripeAccountId))
        {
            _logger.LogWarning("Club {ClubId} has no Stripe account connected", eventEntity.ClubId);
            throw new InvalidOperationException("This club has not configured online payments. Please contact your club administrator.");
        }

        // Check for existing guest registration with same email for this event (duplicate prevention)
        var existingRsvp = await _context.EventRsvps
            .Include(r => r.Member)
            .FirstOrDefaultAsync(r => r.EventId == request.EventId
                && (r.GuestEmail == request.GuestEmail || r.Member.Email == request.GuestEmail)
                && r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded);

        if (existingRsvp != null)
        {
            _logger.LogWarning("Guest with email {Email} has already paid for event {EventId}",
                request.GuestEmail, request.EventId);
            throw new InvalidOperationException("You have already registered and paid for this event");
        }

        // Calculate total amount (event + optional membership)
        decimal membershipAmount = 0;
        MembershipType? membershipType = null;

        if (request.MembershipTypeId.HasValue)
        {
            membershipType = await _context.MembershipTypes
                .FirstOrDefaultAsync(mt => mt.Id == request.MembershipTypeId.Value && mt.ClubId == eventEntity.ClubId);

            if (membershipType == null)
            {
                _logger.LogWarning("Membership type {MembershipTypeId} not found for club {ClubId}",
                    request.MembershipTypeId.Value, eventEntity.ClubId);
                throw new ArgumentException("Invalid membership type selected", nameof(request.MembershipTypeId));
            }

            membershipAmount = membershipType.DuesAmount;
            _logger.LogInformation("Adding membership upgrade: {MembershipTypeName} for ${Amount}",
                membershipType.Name, membershipAmount);
        }

        var totalAmount = eventAmount + membershipAmount;

        // Configure Stripe
        StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];

        // Auto-detect if we can use application fees
        bool useApplicationFees = !string.IsNullOrEmpty(eventEntity.Club.StripeAccountId);

        _logger.LogInformation("Processing payment of ${Total} (event: ${Event}, membership: ${Membership}) for event {EventId}",
            totalAmount, eventAmount, membershipAmount, request.EventId);

        // Create payment intent
        var paymentIntentService = new PaymentIntentService();
        var paymentIntentOptions = new PaymentIntentCreateOptions
        {
            Amount = (long)(totalAmount * 100), // Convert to cents
            Currency = "usd",
            PaymentMethod = request.PaymentMethodId,
            Confirm = true,
            Description = $"Event: {eventEntity.Name} - {eventEntity.Club.Name}" +
                          (request.MembershipTypeId.HasValue ? $" + {membershipType!.Name} Membership" : ""),
            Metadata = new Dictionary<string, string>
            {
                ["event_id"] = request.EventId.ToString(),
                ["club_id"] = eventEntity.ClubId.ToString(),
                ["guest_email"] = request.GuestEmail,
                ["guest_name"] = request.GuestName,
                ["payment_type"] = "guest_event_registration",
                ["event_amount"] = eventAmount.ToString("F2"),
                ["membership_amount"] = membershipAmount.ToString("F2"),
                ["membership_included"] = request.MembershipTypeId.HasValue.ToString()
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

        PaymentIntent paymentIntent;
        try
        {
            paymentIntent = await paymentIntentService.CreateAsync(paymentIntentOptions);
            _logger.LogInformation("Created Stripe PaymentIntent {PaymentIntentId} for ${Amount}",
                paymentIntent.Id, totalAmount);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe payment failed for guest event payment");
            throw new InvalidOperationException($"Payment processing failed: {ex.Message}", ex);
        }

        // Start database transaction
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Create or find existing guest Member record
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.Email == request.GuestEmail && m.ClubId == eventEntity.ClubId);

            bool isNewMember = member == null;
            User? newUser = null;

            if (member == null)
            {
                // Create guest Member record
                var defaultMembershipType = membershipType ?? await _context.MembershipTypes
                    .Where(mt => mt.ClubId == eventEntity.ClubId && mt.IsActive)
                    .OrderBy(mt => mt.DuesAmount)
                    .FirstOrDefaultAsync();

                if (defaultMembershipType == null)
                {
                    throw new InvalidOperationException("No active membership types available for this club");
                }

                member = new Member
                {
                    ClubId = eventEntity.ClubId,
                    MembershipTypeId = request.MembershipTypeId ?? defaultMembershipType.Id,
                    FullName = request.GuestName,
                    Email = request.GuestEmail,
                    PhoneNumber = request.GuestPhone,
                    Status = "Active",
                    JoinDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Set DuesPaidUntil if membership was purchased
                if (request.MembershipTypeId.HasValue && membershipType != null)
                {
                    member.DuesPaidUntil = CalculateDuesPaidUntil(membershipType);
                    _logger.LogInformation("Setting DuesPaidUntil to {DuesPaidUntil} for {Frequency} membership",
                        member.DuesPaidUntil, membershipType.DuesFrequency);
                }

                _context.Members.Add(member);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created guest Member {MemberId} for {Email}", member.Id, request.GuestEmail);
            }
            else
            {
                // Update existing member if membership was purchased
                if (request.MembershipTypeId.HasValue && membershipType != null)
                {
                    member.MembershipTypeId = membershipType.Id;
                    member.DuesPaidUntil = CalculateDuesPaidUntil(membershipType);
                    member.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Updated existing member {MemberId} with new membership type", member.Id);
                }
            }

            // Create User account if requested
            if (request.CreateAccount)
            {
                // Check if user with this email already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.GuestEmail);

                if (existingUser != null)
                {
                    _logger.LogWarning("User account with email {Email} already exists", request.GuestEmail);
                    // Don't throw error, just skip account creation
                }
                else
                {
                    // Hash password
                    var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

                    newUser = new User
                    {
                        FullName = request.GuestName,
                        Email = request.GuestEmail,
                        PasswordHash = passwordHash,
                        OnboardingCompleted = true, // Skip onboarding since they've already registered
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Users.Add(newUser);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Created User account {UserId} for {Email}", newUser.Id, request.GuestEmail);
                }
            }

            // Generate confirmation number
            var confirmationNumber = GenerateConfirmationNumber();

            // Create EventRsvp
            var rsvp = new EventRsvp
            {
                EventId = request.EventId,
                MemberId = member.Id,
                Status = Domain.Enums.RsvpStatus.Confirmed,
                PaymentStatus = Domain.Enums.PaymentStatus.Succeeded,
                PaidAmount = totalAmount,
                StripePaymentIntentId = paymentIntent.Id,
                GuestName = request.GuestName,
                GuestEmail = request.GuestEmail,
                GuestPhone = request.GuestPhone,
                IsGuestRegistration = isNewMember && !request.CreateAccount,
                MembershipUpgradeTypeId = request.MembershipTypeId,
                RsvpStatus = "Confirmed",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.EventRsvps.Add(rsvp);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created RSVP {RsvpId} for member {MemberId}", rsvp.Id, member.Id);

            // Commit transaction
            await transaction.CommitAsync();

            // Send confirmation email
            try
            {
                await _emailService.SendGuestEventPaymentConfirmationEmailAsync(
                    request.GuestEmail,
                    request.GuestName,
                    eventEntity.Name,
                    eventEntity.EventDateTime,
                    eventEntity.Location ?? "TBD",
                    totalAmount,
                    request.MembershipTypeId.HasValue,
                    confirmationNumber,
                    request.CreateAccount && newUser != null,
                    request.CreateAccount ? request.GuestEmail : null
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send confirmation email to {Email}", request.GuestEmail);
                // Don't fail the entire payment if email fails
            }

            return new NonMemberEventPaymentResponse
            {
                Success = true,
                PaymentId = paymentIntent.Id,
                RsvpId = rsvp.Id,
                ConfirmationNumber = confirmationNumber,
                EventAmount = eventAmount,
                MembershipAmount = request.MembershipTypeId.HasValue ? membershipAmount : null,
                TotalAmount = totalAmount,
                MembershipCreated = request.MembershipTypeId.HasValue,
                AccountCreated = request.CreateAccount && newUser != null,
                MemberId = member.Id,
                EventName = eventEntity.Name,
                EventDateTime = eventEntity.EventDateTime,
                EventLocation = eventEntity.Location ?? "TBD",
                ClubName = eventEntity.Club.Name
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Database transaction failed, rolling back and refunding payment");

            // Refund the payment
            try
            {
                var refundService = new RefundService();
                await refundService.CreateAsync(new RefundCreateOptions
                {
                    PaymentIntent = paymentIntent.Id,
                    Reason = RefundReasons.RequestedByCustomer
                });
                _logger.LogInformation("Refunded payment {PaymentIntentId}", paymentIntent.Id);
            }
            catch (StripeException refundEx)
            {
                _logger.LogError(refundEx, "Failed to refund payment {PaymentIntentId}", paymentIntent.Id);
            }

            throw new InvalidOperationException("Payment processing failed. Your payment has been refunded.", ex);
        }
    }

    /// <summary>
    /// Get available membership types for a club hosting the event
    /// </summary>
    public async Task<List<MembershipTypeResponse>> GetAvailableMembershipTypesForEventAsync(int eventId)
    {
        _logger.LogInformation("Getting available membership types for event {EventId}", eventId);

        var eventEntity = await _context.Events
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (eventEntity == null)
        {
            _logger.LogWarning("Event {EventId} not found", eventId);
            throw new ArgumentException($"Event with ID {eventId} not found", nameof(eventId));
        }

        var membershipTypes = await _context.MembershipTypes
            .AsNoTracking()
            .Where(mt => mt.ClubId == eventEntity.ClubId && mt.IsActive)
            .OrderBy(mt => mt.DuesAmount)
            .Select(mt => new MembershipTypeResponse
            {
                Id = mt.Id,
                ClubId = mt.ClubId,
                Name = mt.Name,
                Description = mt.Description,
                DuesAmount = mt.DuesAmount,
                DuesFrequency = mt.DuesFrequency,
                IsActive = mt.IsActive,
                CreatedAt = mt.CreatedAt,
                UpdatedAt = mt.UpdatedAt,
                MemberCount = mt.Members.Count
            })
            .ToListAsync();

        _logger.LogInformation("Found {Count} active membership types for club", membershipTypes.Count);

        return membershipTypes;
    }

    /// <summary>
    /// Calculate dues paid until date based on membership frequency
    /// </summary>
    private DateTime CalculateDuesPaidUntil(MembershipType membershipType)
    {
        var now = DateTime.UtcNow;
        return membershipType.DuesFrequency.ToLower() switch
        {
            "monthly" => now.AddMonths(1),
            "quarterly" => now.AddMonths(3),
            "annually" or "annual" => now.AddYears(1),
            _ => now.AddMonths(1) // Default to monthly
        };
    }

    /// <summary>
    /// Generate a cryptographically secure confirmation number
    /// </summary>
    private string GenerateConfirmationNumber()
    {
        var bytes = new byte[6];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(bytes);
        }

        var sb = new StringBuilder("CONF-");
        foreach (var b in bytes)
        {
            sb.Append(b.ToString("X2"));
        }

        return sb.ToString();
    }
}

