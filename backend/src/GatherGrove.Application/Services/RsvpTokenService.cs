using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Security;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing RSVP tokens and processing email-based RSVPs
/// </summary>
public class RsvpTokenService : IRsvpTokenService
{
    private readonly GatherGroveDbContext _context;
    private readonly IEventService _eventService;
    private readonly ILogger<RsvpTokenService> _logger;

    public RsvpTokenService(
        GatherGroveDbContext context,
        IEventService eventService,
        ILogger<RsvpTokenService> logger)
    {
        _context = context;
        _eventService = eventService;
        _logger = logger;
    }

    /// <summary>
    /// Generates RSVP tokens for all members of a club for a specific event
    /// </summary>
    public async Task<Dictionary<int, Dictionary<string, string>>> GenerateRsvpTokensForEventAsync(int clubId, int eventId)
    {
        _logger.LogInformation("Generating RSVP tokens for event {EventId} in club {ClubId}", eventId, clubId);

        // Validate that the event exists and belongs to the club
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId && e.ClubId == clubId);

        if (eventEntity == null)
        {
            throw new ArgumentException($"Event {eventId} not found in club {clubId}");
        }

        // Get all active members of the club
        var members = await _context.Members
            .Where(m => m.ClubId == clubId && m.Status == "Active")
            .ToListAsync();

        var tokenMap = new Dictionary<int, Dictionary<string, string>>();

        foreach (var member in members)
        {
            var memberTokens = new Dictionary<string, string>();

            // Generate tokens for "Attending" and "NotAttending"
            var attendingToken = GenerateRsvpToken(member.Id, eventId, "Attending", eventEntity.EventDateTime);
            var notAttendingToken = GenerateRsvpToken(member.Id, eventId, "NotAttending", eventEntity.EventDateTime);

            memberTokens["Attending"] = attendingToken;
            memberTokens["NotAttending"] = notAttendingToken;

            tokenMap[member.Id] = memberTokens;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Generated RSVP tokens for {MemberCount} members for event {EventId}", members.Count, eventId);

        return tokenMap;
    }

    /// <summary>
    /// Processes an RSVP via a unique token from an email link
    /// </summary>
    public async Task<RsvpViaLinkResponse> ProcessRsvpViaTokenAsync(string token)
    {
        _logger.LogInformation("Processing RSVP via token");

        // Find and validate the token
        var rsvpToken = await _context.RsvpTokens
            .Include(rt => rt.Member)
            .Include(rt => rt.Event)
            .FirstOrDefaultAsync(rt => rt.TokenValue == token);

        if (rsvpToken == null)
        {
            _logger.LogWarning("RSVP token not found. Token fingerprint: {TokenFingerprint}",
                SensitiveLogValue.Fingerprint(token));
            return new RsvpViaLinkResponse
            {
                Success = false,
                Message = "This RSVP link is no longer valid or has already been used."
            };
        }

        // Check if token has expired
        if (rsvpToken.ExpiresAt <= DateTime.UtcNow)
        {
            _logger.LogWarning("RSVP token has expired. Token fingerprint: {TokenFingerprint}",
                SensitiveLogValue.Fingerprint(token));
            return new RsvpViaLinkResponse
            {
                Success = false,
                Message = "This RSVP link has expired."
            };
        }

        // Check if token has already been used
        if (rsvpToken.IsUsed)
        {
            _logger.LogWarning("RSVP token has already been used. Token fingerprint: {TokenFingerprint}",
                SensitiveLogValue.Fingerprint(token));
            return new RsvpViaLinkResponse
            {
                Success = false,
                Message = "This RSVP link has already been used."
            };
        }

        try
        {
            // Process the RSVP using the existing event service
            var updateRequest = new UpdateRsvpRequest { RsvpStatus = rsvpToken.IntendedRsvpStatus };
            await _eventService.UpsertRsvpAsync(rsvpToken.Event.ClubId, rsvpToken.EventId, rsvpToken.MemberId, updateRequest);

            // Mark the token as used
            rsvpToken.IsUsed = true;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully processed RSVP via token for member {MemberId} and event {EventId} with status {RsvpStatus}",
                rsvpToken.MemberId, rsvpToken.EventId, rsvpToken.IntendedRsvpStatus);

            return new RsvpViaLinkResponse
            {
                Success = true,
                Message = $"Thank you, {rsvpToken.Member.FullName}! Your RSVP for '{rsvpToken.Event.Name}' has been recorded as '{GetFriendlyRsvpStatus(rsvpToken.IntendedRsvpStatus)}'.",
                MemberName = rsvpToken.Member.FullName,
                EventName = rsvpToken.Event.Name,
                RsvpStatus = rsvpToken.IntendedRsvpStatus
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing RSVP via token fingerprint {TokenFingerprint}",
                SensitiveLogValue.Fingerprint(token));
            return new RsvpViaLinkResponse
            {
                Success = false,
                Message = "There was an error processing your RSVP. Please try again later."
            };
        }
    }

    /// <summary>
    /// Cleans up expired RSVP tokens
    /// </summary>
    public async Task<int> CleanupExpiredTokensAsync()
    {
        _logger.LogInformation("Cleaning up expired RSVP tokens");

        var expiredTokens = await _context.RsvpTokens
            .Where(rt => rt.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync();

        if (expiredTokens.Any())
        {
            _context.RsvpTokens.RemoveRange(expiredTokens);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Cleaned up {TokenCount} expired RSVP tokens", expiredTokens.Count);
        }

        return expiredTokens.Count;
    }

    /// <summary>
    /// Generates a cryptographically secure RSVP token
    /// </summary>
    private string GenerateRsvpToken(int memberId, int eventId, string intendedRsvpStatus, DateTime eventDateTime)
    {
        // Generate a cryptographically secure random token
        var tokenBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }
        var tokenValue = Convert.ToBase64String(tokenBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");

        // Create the token record
        var rsvpToken = new RsvpToken
        {
            TokenValue = tokenValue,
            MemberId = memberId,
            EventId = eventId,
            IntendedRsvpStatus = intendedRsvpStatus,
            ExpiresAt = eventDateTime, // Token expires when event starts
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.RsvpTokens.Add(rsvpToken);

        return tokenValue;
    }

    /// <summary>
    /// Converts internal RSVP status to user-friendly display text
    /// </summary>
    private static string GetFriendlyRsvpStatus(string rsvpStatus)
    {
        return rsvpStatus switch
        {
            "Attending" => "Attending",
            "NotAttending" => "Not Attending",
            _ => rsvpStatus
        };
    }
}
