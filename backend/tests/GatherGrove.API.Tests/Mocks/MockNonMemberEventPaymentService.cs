using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.API.Tests.Mocks;

/// <summary>
/// Mock implementation of INonMemberEventPaymentService for testing
/// Bypasses actual Stripe API calls
/// </summary>
public class MockNonMemberEventPaymentService : INonMemberEventPaymentService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<MockNonMemberEventPaymentService> _logger;

    public MockNonMemberEventPaymentService(
        GatherGroveDbContext context,
        ILogger<MockNonMemberEventPaymentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<NonMemberEventPaymentResponse> ProcessNonMemberEventPaymentAsync(NonMemberEventPaymentRequest request)
    {
        _logger.LogInformation("Processing MOCK payment for event {EventId}", request.EventId);

        // Validate required fields
        if (string.IsNullOrWhiteSpace(request.GuestName))
            throw new ArgumentException("Guest name is required", nameof(request.GuestName));

        if (string.IsNullOrWhiteSpace(request.GuestEmail))
            throw new ArgumentException("Guest email is required", nameof(request.GuestEmail));

        if (request.CreateAccount && string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Password is required when creating an account", nameof(request.Password));

        // Get the event
        var eventEntity = await _context.Events
            .Include(e => e.Club)
                .ThenInclude(c => c.MembershipTypes)
            .FirstOrDefaultAsync(e => e.Id == request.EventId);

        if (eventEntity == null)
            throw new ArgumentException($"Event with ID {request.EventId} not found", nameof(request.EventId));

        if (eventEntity.IsFree)
            throw new InvalidOperationException("This event does not require payment");

        var eventAmount = eventEntity.NonMemberPrice ?? 0;
        if (eventAmount <= 0)
            throw new InvalidOperationException("Non-member pricing is not available for this event");

        // Check for duplicate registration
        var existingRsvp = await _context.EventRsvps
            .Include(r => r.Member)
            .FirstOrDefaultAsync(r => r.EventId == request.EventId
                && (r.GuestEmail == request.GuestEmail || r.Member.Email == request.GuestEmail)
                && r.PaymentStatus == Domain.Enums.PaymentStatus.Succeeded);

        if (existingRsvp != null)
            throw new InvalidOperationException("You have already registered and paid for this event");

        // Calculate amounts
        decimal membershipAmount = 0;
        MembershipType? membershipType = null;

        if (request.MembershipTypeId.HasValue)
        {
            membershipType = await _context.MembershipTypes
                .FirstOrDefaultAsync(mt => mt.Id == request.MembershipTypeId.Value && mt.ClubId == eventEntity.ClubId);

            if (membershipType == null)
                throw new ArgumentException("Invalid membership type selected", nameof(request.MembershipTypeId));

            membershipAmount = membershipType.DuesAmount;
        }

        var totalAmount = eventAmount + membershipAmount;

        // MOCK: Create fake payment intent ID instead of calling Stripe
        var mockPaymentIntentId = $"pi_test_{Guid.NewGuid().ToString("N").Substring(0, 24)}";

        // Note: In-memory database doesn't support transactions, so we skip transaction management
        try
        {
            // Create or find existing guest Member record
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.Email == request.GuestEmail && m.ClubId == eventEntity.ClubId);

            bool isNewMember = member == null;
            User? newUser = null;

            if (member == null)
            {
                var defaultMembershipType = membershipType ?? await _context.MembershipTypes
                    .Where(mt => mt.ClubId == eventEntity.ClubId && mt.IsActive)
                    .OrderBy(mt => mt.DuesAmount)
                    .FirstOrDefaultAsync();

                if (defaultMembershipType == null)
                    throw new InvalidOperationException("No active membership types available for this club");

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

                if (request.MembershipTypeId.HasValue && membershipType != null)
                {
                    member.DuesPaidUntil = CalculateDuesPaidUntil(membershipType);
                }

                _context.Members.Add(member);
                await _context.SaveChangesAsync();
            }
            else
            {
                if (request.MembershipTypeId.HasValue && membershipType != null)
                {
                    member.MembershipTypeId = membershipType.Id;
                    member.DuesPaidUntil = CalculateDuesPaidUntil(membershipType);
                    member.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }

            // Create User account if requested
            if (request.CreateAccount)
            {
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.GuestEmail);

                if (existingUser == null)
                {
                    var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

                    newUser = new User
                    {
                        FullName = request.GuestName,
                        Email = request.GuestEmail,
                        PasswordHash = passwordHash,
                        OnboardingCompleted = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Users.Add(newUser);
                    await _context.SaveChangesAsync();
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
                StripePaymentIntentId = mockPaymentIntentId,
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

            return new NonMemberEventPaymentResponse
            {
                Success = true,
                PaymentId = mockPaymentIntentId,
                RsvpId = rsvp.Id,
                ConfirmationNumber = confirmationNumber,
                EventAmount = eventAmount,
                MembershipAmount = request.MembershipTypeId.HasValue ? membershipAmount : null,
                TotalAmount = totalAmount,
                EventName = eventEntity.Name,
                EventDateTime = eventEntity.EventDateTime,
                EventLocation = eventEntity.Location ?? "TBD",
                ClubName = eventEntity.Club.Name,
                MembershipCreated = request.MembershipTypeId.HasValue,
                AccountCreated = request.CreateAccount && newUser != null,
                MemberId = member.Id
            };
        }
        catch
        {
            // No transaction to rollback in in-memory database
            throw;
        }
    }

    public async Task<List<MembershipTypeResponse>> GetAvailableMembershipTypesForEventAsync(int eventId)
    {
        var eventEntity = await _context.Events
            .Include(e => e.Club)
                .ThenInclude(c => c.MembershipTypes)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (eventEntity == null)
            throw new ArgumentException($"Event with ID {eventId} not found", nameof(eventId));

        var membershipTypes = eventEntity.Club.MembershipTypes
            .Where(mt => mt.IsActive)
            .Select(mt => new MembershipTypeResponse
            {
                Id = mt.Id,
                Name = mt.Name,
                Description = mt.Description,
                DuesAmount = mt.DuesAmount,
                DuesFrequency = mt.DuesFrequency ?? "Monthly"
            })
            .ToList();

        return membershipTypes;
    }

    private DateTime? CalculateDuesPaidUntil(MembershipType membershipType)
    {
        return membershipType.DuesFrequency?.ToLower() switch
        {
            "monthly" => DateTime.UtcNow.AddMonths(1),
            "quarterly" => DateTime.UtcNow.AddMonths(3),
            "yearly" or "annual" => DateTime.UtcNow.AddYears(1),
            "onetime" or "one-time" or "lifetime" => null,
            _ => null
        };
    }

    private string GenerateConfirmationNumber()
    {
        return $"CONF-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
    }
}
