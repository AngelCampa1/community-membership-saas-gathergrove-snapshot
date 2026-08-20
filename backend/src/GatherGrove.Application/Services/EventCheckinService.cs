using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.Security;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing event check-in operations
/// </summary>
public class EventCheckinService : IEventCheckinService
{
    private readonly GatherGroveDbContext _context;
    private readonly IQRCodeService _qrCodeService;
    private readonly ILogger<EventCheckinService> _logger;

    public EventCheckinService(
        GatherGroveDbContext context,
        IQRCodeService qrCodeService,
        ILogger<EventCheckinService> logger)
    {
        _context = context;
        _qrCodeService = qrCodeService;
        _logger = logger;
    }

    /// <summary>
    /// Generates a QR code for event check-in
    /// </summary>
    /// <param name="request">The QR code generation request</param>
    /// <returns>The generated QR code data</returns>
    public async Task<EventQRCodeResponse> GenerateEventCheckinQRCodeAsync(GenerateEventQRCodeRequest request)
    {
        _logger.LogInformation("Generating check-in QR code for event {EventId}", request.EventId);

        // Validate event exists
        var eventEntity = await _context.Events.FindAsync(request.EventId);
        if (eventEntity == null)
        {
            throw new ArgumentException($"Event with ID {request.EventId} not found");
        }

        if (request.ClubId.HasValue && eventEntity.ClubId != request.ClubId.Value)
        {
            _logger.LogWarning(
                "Rejected QR code generation for event {EventId}: event club {EventClubId} did not match expected club {ExpectedClubId}",
                request.EventId,
                eventEntity.ClubId,
                request.ClubId.Value);

            throw new ArgumentException("Event does not belong to the specified club");
        }

        return await _qrCodeService.GenerateEventQRCodeAsync(request);
    }

    /// <summary>
    /// Checks in a member using a QR code
    /// </summary>
    /// <param name="request">The QR code check-in request</param>
    /// <returns>The check-in response</returns>
    public async Task<CheckinResponse> CheckinWithQRCodeAsync(QRCodeCheckinRequest request)
    {
        _logger.LogInformation(
            "Processing QR code check-in for member {MemberId} with QR token fingerprint {TokenFingerprint}",
            request.MemberId,
            SensitiveLogValue.Fingerprint(request.QRCodeData));

        // Validate QR code
        var qrCodeValidation = await _qrCodeService.ValidateQRCodeAsync(new QRCodeCheckinRequest
        {
            QRCodeData = request.QRCodeData,
            MemberId = request.MemberId,
            CheckinTime = request.CheckinTime,
            Location = request.Location
        });

        if (!qrCodeValidation.IsValid || !qrCodeValidation.EventId.HasValue)
        {
            return new CheckinResponse
            {
                Success = false,
                ErrorMessage = qrCodeValidation.ErrorMessage ?? "Invalid or expired QR code"
            };
        }

        if (request.EventId.HasValue && qrCodeValidation.EventId.Value != request.EventId.Value)
        {
            _logger.LogWarning(
                "Rejected QR code check-in for member {MemberId}: token event {TokenEventId} did not match expected event {ExpectedEventId}",
                request.MemberId,
                qrCodeValidation.EventId.Value,
                request.EventId.Value);

            return new CheckinResponse
            {
                Success = false,
                ErrorMessage = "QR code is not valid for this event"
            };
        }

        // Get event details
        var eventEntity = await _context.Events.FindAsync(qrCodeValidation.EventId.Value);
        if (eventEntity == null)
        {
            return new CheckinResponse
            {
                Success = false,
                ErrorMessage = "Event not found"
            };
        }

        if (request.ClubId.HasValue && eventEntity.ClubId != request.ClubId.Value)
        {
            _logger.LogWarning(
                "Rejected QR code check-in for member {MemberId}: event club {EventClubId} did not match expected club {ExpectedClubId}",
                request.MemberId,
                eventEntity.ClubId,
                request.ClubId.Value);

            return new CheckinResponse
            {
                Success = false,
                ErrorMessage = "QR code is not valid for this event"
            };
        }

        var memberBelongsToEventClub = await _context.Members
            .AnyAsync(m => m.Id == request.MemberId && m.ClubId == eventEntity.ClubId);
        if (!memberBelongsToEventClub)
        {
            return new CheckinResponse
            {
                Success = false,
                ErrorMessage = "Member not found for event club"
            };
        }

        // Check if event requires RSVP
        var rsvpRecord = await _context.EventRsvps
            .FirstOrDefaultAsync(r => r.EventId == qrCodeValidation.EventId.Value && r.MemberId == request.MemberId);

        if (rsvpRecord == null)
        {
            return new CheckinResponse
            {
                Success = false,
                ErrorMessage = "Member must RSVP to this event before checking in"
            };
        }

        // Check if member is already checked in
        var existingCheckin = await _context.EventCheckins
            .AnyAsync(c => c.EventId == qrCodeValidation.EventId.Value && c.MemberId == request.MemberId);
        if (existingCheckin)
        {
            return new CheckinResponse
            {
                Success = false,
                ErrorMessage = "Member has already checked in and multiple scans are not allowed"
            };
        }

        // Create check-in record
        var checkinRecord = new EventCheckin
        {
            EventId = qrCodeValidation.EventId.Value,
            MemberId = request.MemberId,
            CheckinTime = request.CheckinTime,
            CheckinMethod = Domain.Entities.CheckinMethod.QRCode,
            QRCodeToken = request.QRCodeData,
            CheckinLocation = request.Location
        };

        _context.EventCheckins.Add(checkinRecord);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Member {MemberId} checked in successfully for event {EventId} using QR code",
            request.MemberId, qrCodeValidation.EventId.Value);

        return new CheckinResponse
        {
            Success = true,
            CheckinTime = checkinRecord.CheckinTime,
            CheckinMethod = Domain.Entities.CheckinMethod.QRCode
        };
    }

    /// <summary>
    /// Gets all check-ins for an event
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <returns>List of event check-ins</returns>
    public async Task<List<EventCheckin>> GetEventCheckinsAsync(int eventId)
    {
        _logger.LogInformation("Getting check-ins for event {EventId}", eventId);

        var checkins = await _context.EventCheckins
            .Where(c => c.EventId == eventId)
            .OrderByDescending(c => c.CheckinTime)
            .ToListAsync();

        return checkins;
    }

    /// <summary>
    /// Checks out a member from an event
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <param name="checkoutTime">The checkout time</param>
    /// <returns>The checkout response</returns>
    public async Task<CheckinResponse> CheckoutMemberAsync(int eventId, int memberId, DateTime checkoutTime)
    {
        _logger.LogInformation("Checking out member {MemberId} from event {EventId}", memberId, eventId);

        var activeCheckin = await _context.EventCheckins
            .FirstOrDefaultAsync(c => c.EventId == eventId && c.MemberId == memberId && c.CheckoutTime == null);
        if (activeCheckin == null)
        {
            return new CheckinResponse
            {
                Success = false,
                ErrorMessage = "No active check-in found for this member"
            };
        }

        // Update check-in with checkout time
        activeCheckin.CheckoutTime = checkoutTime;
        await _context.SaveChangesAsync();

        var duration = checkoutTime - activeCheckin.CheckinTime;

        _logger.LogInformation("Member {MemberId} checked out from event {EventId} after {Duration}",
            memberId, eventId, duration);

        return new CheckinResponse
        {
            Success = true,
            CheckinTime = activeCheckin.CheckinTime,
            CheckoutTime = activeCheckin.CheckoutTime,
            Duration = duration
        };
    }

    /// <summary>
    /// Generates a member-specific QR code for an event
    /// </summary>
    /// <param name="request">The member QR code generation request</param>
    /// <returns>The generated member QR code</returns>
    public async Task<DTOs.MemberEventQRCode> GenerateMemberQRCodeAsync(GenerateMemberQRCodeRequest request)
    {
        _logger.LogInformation("Generating member QR code for member {MemberId} and event {EventId}",
            request.MemberId, request.EventId);

        // For now, return a basic implementation - would extend QRCodeService for member-specific codes
        var qrCodeData = $"MEMBER_CHECKIN:{request.EventId}:{request.MemberId}:{Guid.NewGuid()}";

        return new DTOs.MemberEventQRCode
        {
            EventId = request.EventId,
            MemberId = request.MemberId,
            QRCodeData = qrCodeData,
            QRCodeImageBase64 = "", // Would generate actual QR code image
            ExpiresAt = DateTime.UtcNow.AddHours(request.ValidForHours),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Gets check-in statistics for an event
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <returns>Check-in statistics</returns>
    public async Task<CheckinStatisticsResponse> GetCheckinStatisticsAsync(int eventId)
    {
        _logger.LogInformation("Getting check-in statistics for event {EventId}", eventId);

        var checkins = await _context.EventCheckins
            .Where(c => c.EventId == eventId)
            .ToListAsync();

        var statistics = new CheckinStatisticsResponse
        {
            TotalCheckins = checkins.Count,
            QRCodeCheckins = checkins.Count(c => c.CheckinMethod == Domain.Entities.CheckinMethod.QRCode),
            ManualCheckins = checkins.Count(c => c.CheckinMethod == Domain.Entities.CheckinMethod.Manual),
            NFCCheckins = checkins.Count(c => c.CheckinMethod == Domain.Entities.CheckinMethod.NFC)
        };

        // Group by check-in method
        statistics.CheckinMethodBreakdown = checkins
            .GroupBy(c => c.CheckinMethod)
            .ToDictionary(g => g.Key, g => g.Count());

        // Calculate average check-in time
        if (checkins.Any())
        {
            var checkinTimes = checkins.Select(c => c.CheckinTime.TimeOfDay).ToList();
            var avgTicks = (long)checkinTimes.Average(t => t.Ticks);
            statistics.AverageCheckinTime = new TimeSpan(avgTicks);

            // Find peak check-in hour
            var checkinsByHour = checkins
                .GroupBy(c => c.CheckinTime.Hour)
                .ToDictionary(g => g.Key, g => g.Count());

            statistics.PeakCheckinHour = checkinsByHour.OrderByDescending(kvp => kvp.Value).First().Key;
        }

        return statistics;
    }

    /// <summary>
    /// Performs manual check-in for a member
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <param name="checkinTime">The check-in time</param>
    /// <param name="location">The check-in location</param>
    /// <returns>The check-in response</returns>
    public async Task<CheckinResponse> ManualCheckinAsync(int eventId, int memberId, DateTime checkinTime, string? location = null)
    {
        _logger.LogInformation("Processing manual check-in for member {MemberId} at event {EventId}",
            memberId, eventId);

        // Validate event exists
        var eventEntity = await _context.Events.FindAsync(eventId);
        if (eventEntity == null)
        {
            return new CheckinResponse
            {
                Success = false,
                ErrorMessage = "Event not found"
            };
        }

        var memberBelongsToEventClub = await _context.Members
            .AnyAsync(m => m.Id == memberId && m.ClubId == eventEntity.ClubId);
        if (!memberBelongsToEventClub)
        {
            return new CheckinResponse
            {
                Success = false,
                ErrorMessage = "Member not found for event club"
            };
        }

        // Check if member is already checked in
        var existingCheckin = await _context.EventCheckins
            .AnyAsync(c => c.EventId == eventId && c.MemberId == memberId);
        if (existingCheckin)
        {
            return new CheckinResponse
            {
                Success = false,
                ErrorMessage = "Member has already checked in"
            };
        }

        // Create check-in record
        var checkinRecord = new EventCheckin
        {
            EventId = eventId,
            MemberId = memberId,
            CheckinTime = checkinTime,
            CheckinMethod = Domain.Entities.CheckinMethod.Manual,
            CheckinLocation = location
        };

        _context.EventCheckins.Add(checkinRecord);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Member {MemberId} manually checked in successfully for event {EventId}",
            memberId, eventId);

        return new CheckinResponse
        {
            Success = true,
            CheckinTime = checkinRecord.CheckinTime,
            CheckinMethod = Domain.Entities.CheckinMethod.Manual
        };
    }

    /// <summary>
    /// Gets check-in history for a specific member
    /// </summary>
    /// <param name="memberId">The member ID</param>
    /// <param name="eventId">Optional event ID to filter by</param>
    /// <returns>List of member's check-ins</returns>
    public async Task<List<EventCheckin>> GetMemberCheckinHistoryAsync(int memberId, int? eventId = null)
    {
        _logger.LogInformation("Getting check-in history for member {MemberId}", memberId);

        var query = _context.EventCheckins
            .Where(c => c.MemberId == memberId);

        if (eventId.HasValue)
        {
            query = query.Where(c => c.EventId == eventId.Value);
        }

        return await query
            .OrderByDescending(c => c.CheckinTime)
            .ToListAsync();
    }

    /// <summary>
    /// Validates if a member can check in to an event
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <returns>Validation result with details</returns>
    public async Task<(bool CanCheckin, string? Reason)> ValidateCheckinEligibilityAsync(int eventId, int memberId)
    {
        // Check if event exists
        var eventEntity = await _context.Events.FindAsync(eventId);
        if (eventEntity == null)
        {
            return (false, "Event not found");
        }

        // Check if event has started
        if (eventEntity.EventDateTime > DateTime.UtcNow)
        {
            return (false, "Event has not started yet");
        }

        // Check if member is already checked in
        var existingCheckin = await _context.EventCheckins
            .AnyAsync(c => c.EventId == eventId && c.MemberId == memberId);
        if (existingCheckin)
        {
            return (false, "Member has already checked in");
        }

        // Check capacity if event has limits
        if (eventEntity.MaxCapacity.HasValue)
        {
            var currentCheckins = await _context.EventCheckins
                .Where(c => c.EventId == eventId)
                .ToListAsync();
            if (currentCheckins.Count >= eventEntity.MaxCapacity.Value)
            {
                return (false, "Event has reached maximum capacity");
            }
        }

        return (true, null);
    }

    /// <summary>
    /// Gets list of event attendees with check-in status (mobile-compatible)
    /// Combines RSVP data with check-in status for display in mobile app
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <returns>List of attendees with check-in status</returns>
    public async Task<List<EventAttendeeDto>> GetEventAttendeesAsync(int eventId)
    {
        _logger.LogInformation("Getting attendee list with check-in status for event {EventId}", eventId);

        // Query RSVPs with member information and check-in status
        var attendees = await _context.EventRsvps
            .Where(r => r.EventId == eventId && r.Status == RsvpStatus.Confirmed)
            .Include(r => r.Member)
            .Select(r => new EventAttendeeDto
            {
                Id = r.Id,
                MemberId = r.MemberId,
                MemberName = r.Member.FirstName + " " + r.Member.LastName,
                Email = r.Member.Email,
                CheckedIn = _context.EventCheckins.Any(c => c.EventId == eventId && c.MemberId == r.MemberId),
                CheckInTime = _context.EventCheckins
                    .Where(c => c.EventId == eventId && c.MemberId == r.MemberId)
                    .Select(c => (DateTime?)c.CheckinTime)
                    .FirstOrDefault(),
                RegistrationDate = r.CreatedAt,
                GuestCount = null,
                RsvpStatus = r.Status.ToString()
            })
            .OrderBy(a => a.MemberName)
            .ToListAsync();

        _logger.LogInformation("Found {Count} attendees for event {EventId}", attendees.Count, eventId);

        return attendees;
    }
}
