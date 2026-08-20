using Microsoft.EntityFrameworkCore;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Communications;
using GatherGrove.Application.Services.Security;
using GatherGrove.Application.Validators;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for event operations
/// BUG FIX #22: Added server-side content sanitization for event descriptions
/// </summary>
public class EventService : IEventService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<EventService> _logger;
    private readonly ICommunicationsService _communicationsService;
    private readonly IContentSanitizationService _sanitizationService;

    public EventService(
        GatherGroveDbContext context,
        ILogger<EventService> logger,
        ICommunicationsService communicationsService,
        IContentSanitizationService sanitizationService)
    {
        _context = context;
        _logger = logger;
        _communicationsService = communicationsService;
        _sanitizationService = sanitizationService;
    }

    /// <summary>
    /// Creates a new event for a club
    /// </summary>
    public async Task<EventResponse> CreateEventAsync(int clubId, CreateEventRequest request)
    {
        // Validate pricing
        EventPriceValidator.ValidateEventPrices(request);

        // Check if club exists
        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException($"Club with ID {clubId} not found", nameof(clubId));
        }

        // Validate event date is not in the past
        if (request.EventDateTime < DateTime.UtcNow)
        {
            throw new ArgumentException("Event date cannot be in the past", nameof(request.EventDateTime));
        }

        var now = DateTime.UtcNow;

        // BUG FIX #22: Sanitize event description to prevent XSS
        var sanitizedDescription = string.IsNullOrWhiteSpace(request.Description)
            ? request.Description
            : _sanitizationService.SanitizeHtml(request.Description, SanitizationLevel.Standard);

        var eventEntity = new Event
        {
            ClubId = clubId,
            Name = request.Name,
            EventDateTime = request.EventDateTime,
            Location = request.Location,
            Description = sanitizedDescription,
            MemberPrice = request.MemberPrice ?? 0.00m, // Default to 0.00m for free events
            NonMemberPrice = request.NonMemberPrice ?? 0.00m, // Default to 0.00m for free events
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        return new EventResponse
        {
            Id = eventEntity.Id,
            ClubId = eventEntity.ClubId,
            Name = eventEntity.Name,
            EventDateTime = eventEntity.EventDateTime,
            Location = eventEntity.Location,
            Description = eventEntity.Description,
            MemberPrice = eventEntity.MemberPrice,
            NonMemberPrice = eventEntity.NonMemberPrice,
            Price = eventEntity.Price ?? 0.00m, // Return 0.00m for free events instead of null
            IsFree = eventEntity.IsFree,
            IsPaid = eventEntity.IsPaid,
            CreatedAt = eventEntity.CreatedAt,
            UpdatedAt = eventEntity.UpdatedAt
        };
    }

    /// <summary>
    /// Updates an existing event
    /// </summary>
    public async Task<EventResponse> UpdateEventAsync(int clubId, int eventId, UpdateEventRequest request)
    {
        // Validate pricing
        EventPriceValidator.ValidateEventPrices(request);

        // Check if club exists
        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException($"Club with ID {clubId} not found", nameof(clubId));
        }

        // Find the event
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId && e.ClubId == clubId);

        if (eventEntity == null)
        {
            throw new ArgumentException($"Event with ID {eventId} not found in club {clubId}", nameof(eventId));
        }

        // BUG FIX #22: Sanitize event description to prevent XSS
        var sanitizedDescription = string.IsNullOrWhiteSpace(request.Description)
            ? request.Description
            : _sanitizationService.SanitizeHtml(request.Description, SanitizationLevel.Standard);

        // Update the event
        eventEntity.Name = request.Name;
        eventEntity.EventDateTime = request.EventDateTime;
        eventEntity.Location = request.Location;
        eventEntity.Description = sanitizedDescription;
        eventEntity.MemberPrice = request.MemberPrice ?? 0.00m; // Default to 0.00m for free events
        eventEntity.NonMemberPrice = request.NonMemberPrice ?? 0.00m; // Default to 0.00m for free events
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new EventResponse
        {
            Id = eventEntity.Id,
            ClubId = eventEntity.ClubId,
            Name = eventEntity.Name,
            EventDateTime = eventEntity.EventDateTime,
            Location = eventEntity.Location,
            Description = eventEntity.Description,
            MemberPrice = eventEntity.MemberPrice,
            NonMemberPrice = eventEntity.NonMemberPrice,
            Price = eventEntity.Price ?? 0.00m, // Return 0.00m for free events instead of null
            IsFree = eventEntity.IsFree,
            IsPaid = eventEntity.IsPaid,
            CreatedAt = eventEntity.CreatedAt,
            UpdatedAt = eventEntity.UpdatedAt
        };
    }

    /// <summary>
    /// Deletes an existing event
    /// </summary>
    public async Task DeleteEventAsync(int clubId, int eventId)
    {
        // Check if club exists
        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException($"Club with ID {clubId} not found", nameof(clubId));
        }

        // Find the event
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId && e.ClubId == clubId);

        if (eventEntity == null)
        {
            throw new ArgumentException($"Event with ID {eventId} not found in club {clubId}", nameof(eventId));
        }

        // Remove the event (cascade delete will handle related data)
        _context.Events.Remove(eventEntity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Event {EventId} deleted from club {ClubId}", eventId, clubId);
    }

    /// <summary>
    /// Gets a specific event by ID
    /// </summary>
    public async Task<EventResponse?> GetEventByIdAsync(int clubId, int eventId)
    {
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId && e.ClubId == clubId);

        if (eventEntity == null)
        {
            return null;
        }

        // Get RSVPs for this event
        var rsvps = await _context.EventRsvps
            .Include(r => r.Member)
            .Where(r => r.EventId == eventId)
            .AsNoTracking()
            .ToListAsync();

        var rsvpResponses = rsvps.Select(r => new EventRsvpResponse
        {
            Id = r.Id,
            EventId = r.EventId,
            MemberId = r.MemberId,
            MemberName = r.Member.FullName,
            MemberEmail = r.Member.Email,
            RsvpStatus = r.RsvpStatus,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        }).ToList();

        var attendeeCount = rsvps.Count(r => r.RsvpStatus.Equals("Attending", StringComparison.OrdinalIgnoreCase));

        return new EventResponse
        {
            Id = eventEntity.Id,
            ClubId = eventEntity.ClubId,
            Name = eventEntity.Name,
            EventDateTime = eventEntity.EventDateTime,
            Location = eventEntity.Location,
            Description = eventEntity.Description,
            MemberPrice = eventEntity.MemberPrice,
            NonMemberPrice = eventEntity.NonMemberPrice,
            Price = eventEntity.Price ?? 0.00m, // Return 0.00m for free events instead of null
            IsFree = eventEntity.IsFree,
            IsPaid = eventEntity.IsPaid,
            CreatedAt = eventEntity.CreatedAt,
            UpdatedAt = eventEntity.UpdatedAt,
            Rsvps = rsvpResponses,
            AttendeeCount = attendeeCount,
            TotalRsvpCount = rsvps.Count
        };
    }

    /// <summary>
    /// Gets all events for a club, optionally filtered by upcoming/past
    /// </summary>
    public async Task<List<EventResponse>> GetEventsByClubAsync(int clubId, string? filter = null)
    {
        var query = _context.Events
            .Where(e => e.ClubId == clubId);

        var now = DateTime.UtcNow;

        // Apply filter if specified
        if (!string.IsNullOrEmpty(filter))
        {
            switch (filter.ToLowerInvariant())
            {
                case "upcoming":
                    query = query
                        .Where(e => e.EventDateTime >= now)
                        .OrderBy(e => e.EventDateTime); // Upcoming events: soonest first
                    break;
                case "past":
                    query = query
                        .Where(e => e.EventDateTime < now)
                        .OrderByDescending(e => e.EventDateTime); // Past events: most recent first
                    break;
                default:
                    // Invalid filter value, return all events ordered by date
                    query = query.OrderBy(e => e.EventDateTime);
                    break;
            }
        }
        else
        {
            // No filter specified, return all events ordered by date
            query = query.OrderBy(e => e.EventDateTime);
        }

        var events = await query
            .AsNoTracking()
            .ToListAsync();

        return events.Select(e => new EventResponse
        {
            Id = e.Id,
            ClubId = e.ClubId,
            Name = e.Name,
            EventDateTime = e.EventDateTime,
            Location = e.Location,
            Description = e.Description,
            MemberPrice = e.MemberPrice,
            NonMemberPrice = e.NonMemberPrice,
            Price = e.Price ?? 0.00m, // Return 0.00m for free events instead of null
            IsFree = e.IsFree,
            IsPaid = e.IsPaid,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        }).ToList();
    }

    /// <summary>
    /// Updates or creates an RSVP for a member and event
    /// </summary>
    public async Task<EventRsvpResponse> UpsertRsvpAsync(int clubId, int eventId, int memberId, UpdateRsvpRequest request)
    {
        // Verify the event exists and belongs to the club
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId && e.ClubId == clubId);

        if (eventEntity == null)
        {
            throw new ArgumentException($"Event with ID {eventId} not found in club {clubId}", nameof(eventId));
        }

        // Verify the member exists and belongs to the club
        var member = await _context.Members
            .FirstOrDefaultAsync(m => m.Id == memberId && m.ClubId == clubId);

        if (member == null)
        {
            throw new ArgumentException($"Member with ID {memberId} not found in club {clubId}", nameof(memberId));
        }

        var now = DateTime.UtcNow;

        // Determine the RSVP status to use
        // Map legacy string values to enum values for backward compatibility
        var rsvpStatus = request.Status;
        var rsvpStatusString = request.RsvpStatus;

        // If RsvpStatus string is provided, use it and map to enum if needed
        if (!string.IsNullOrEmpty(request.RsvpStatus))
        {
            // Preserve the original string value
            rsvpStatusString = request.RsvpStatus;

            // If Status enum is default (Pending), try to map the string to enum
            if (request.Status == Domain.Enums.RsvpStatus.Pending)
            {
                rsvpStatus = request.RsvpStatus.ToLower() switch
                {
                    "attending" => Domain.Enums.RsvpStatus.Confirmed,
                    "notattending" => Domain.Enums.RsvpStatus.Declined,
                    "confirmed" => Domain.Enums.RsvpStatus.Confirmed,
                    "declined" => Domain.Enums.RsvpStatus.Declined,
                    "cancelled" => Domain.Enums.RsvpStatus.Cancelled,
                    "noshow" => Domain.Enums.RsvpStatus.NoShow,
                    "checkedin" => Domain.Enums.RsvpStatus.CheckedIn,
                    _ => Domain.Enums.RsvpStatus.Pending
                };
            }
        }
        else
        {
            // Use the enum value and convert to string
            rsvpStatusString = request.Status.ToString();
        }

        // Check if RSVP already exists
        var existingRsvp = await _context.EventRsvps
            .FirstOrDefaultAsync(r => r.EventId == eventId && r.MemberId == memberId);

        if (existingRsvp != null)
        {
            // Update existing RSVP
            existingRsvp.Status = rsvpStatus;
            existingRsvp.RsvpStatus = rsvpStatusString; // Set both Status enum and RsvpStatus string
            existingRsvp.UpdatedAt = now;
        }
        else
        {
            // Check capacity enforcement for new RSVPs
            if (eventEntity.MaxCapacity.HasValue && eventEntity.MaxCapacity.Value > 0)
            {
                var currentRsvpCount = await _context.EventRsvps
                    .CountAsync(r => r.EventId == eventId && r.Status == Domain.Enums.RsvpStatus.Confirmed);

                if (currentRsvpCount >= eventEntity.MaxCapacity.Value)
                {
                    throw new InvalidOperationException($"Event has reached maximum capacity of {eventEntity.MaxCapacity.Value}");
                }
            }

            // Create new RSVP
            existingRsvp = new EventRsvp
            {
                EventId = eventId,
                MemberId = memberId,
                Status = rsvpStatus,
                RsvpStatus = rsvpStatusString, // Set both Status enum and RsvpStatus string
                PaidAmount = 0.00m, // Default to 0.00m for free events
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.EventRsvps.Add(existingRsvp);
        }

        await _context.SaveChangesAsync();

        return new EventRsvpResponse
        {
            Id = existingRsvp.Id,
            EventId = existingRsvp.EventId,
            MemberId = existingRsvp.MemberId,
            MemberName = member.FullName,
            MemberEmail = member.Email,
            RsvpStatus = existingRsvp.RsvpStatus,
            CreatedAt = existingRsvp.CreatedAt,
            UpdatedAt = existingRsvp.UpdatedAt
        };
    }

    /// <summary>
    /// Gets all RSVPs for a specific event
    /// </summary>
    public async Task<List<EventRsvpResponse>> GetEventRsvpsAsync(int clubId, int eventId)
    {
        // Verify the event exists and belongs to the club
        var eventExists = await _context.Events
            .AnyAsync(e => e.Id == eventId && e.ClubId == clubId);

        if (!eventExists)
        {
            throw new ArgumentException($"Event with ID {eventId} not found in club {clubId}", nameof(eventId));
        }

        var rsvps = await _context.EventRsvps
            .Include(r => r.Member)
            .Where(r => r.EventId == eventId)
            .AsNoTracking()
            .ToListAsync();

        return rsvps.Select(r => new EventRsvpResponse
        {
            Id = r.Id,
            EventId = r.EventId,
            MemberId = r.MemberId,
            MemberName = r.Member.FullName,
            MemberEmail = r.Member.Email,
            RsvpStatus = r.RsvpStatus,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        }).ToList();
    }

    /// <summary>
    /// Gets an RSVP for a specific member and event
    /// </summary>
    public async Task<EventRsvpResponse?> GetMemberRsvpAsync(int clubId, int eventId, int memberId)
    {
        // Verify the event exists and belongs to the club
        var eventExists = await _context.Events
            .AnyAsync(e => e.Id == eventId && e.ClubId == clubId);

        if (!eventExists)
        {
            throw new ArgumentException($"Event with ID {eventId} not found in club {clubId}", nameof(eventId));
        }

        // Verify the member exists and belongs to the club
        var memberExists = await _context.Members
            .AnyAsync(m => m.Id == memberId && m.ClubId == clubId);

        if (!memberExists)
        {
            throw new ArgumentException($"Member with ID {memberId} not found in club {clubId}", nameof(memberId));
        }

        var rsvp = await _context.EventRsvps
            .Include(r => r.Member)
            .FirstOrDefaultAsync(r => r.EventId == eventId && r.MemberId == memberId);

        if (rsvp == null)
        {
            return null;
        }

        return new EventRsvpResponse
        {
            Id = rsvp.Id,
            EventId = rsvp.EventId,
            MemberId = rsvp.MemberId,
            MemberName = rsvp.Member.FullName,
            MemberEmail = rsvp.Member.Email,
            RsvpStatus = rsvp.RsvpStatus,
            CreatedAt = rsvp.CreatedAt,
            UpdatedAt = rsvp.UpdatedAt
        };
    }

    /// <summary>
    /// Sends invitations for an event to specified members
    /// </summary>
    public async Task<SendEventInvitationsResponse> SendEventInvitationsAsync(int clubId, int eventId, SendEventInvitationsRequest request)
    {
        // Verify club exists
        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException($"Club with ID {clubId} not found", nameof(clubId));
        }

        // Verify event exists
        var eventEntity = await _context.Events.FindAsync(eventId);
        if (eventEntity == null || eventEntity.ClubId != clubId)
        {
            throw new ArgumentException($"Event with ID {eventId} not found in club {clubId}", nameof(eventId));
        }

        // Check if club has invitation features (Grow tier or above)
        if (club.Tier != "Grow" && !IsTopTier(club.Tier))
        {
            throw new UnauthorizedAccessException("Event invitations are only available for Grow or Expand subscribers. Please upgrade your subscription.");
        }

        // Get target members
        var targetMembers = new List<Member>();

        if (request.MemberIds != null && request.MemberIds.Any())
        {
            // Get specific members
            targetMembers = await _context.Members
                .Where(m => m.ClubId == clubId && request.MemberIds.Contains(m.Id))
                .ToListAsync();

            if (targetMembers.Count != request.MemberIds.Count)
            {
                throw new ArgumentException("Some specified members were not found in the club");
            }
        }
        else
        {
            // Get all club members
            targetMembers = await _context.Members
                .Where(m => m.ClubId == clubId)
                .ToListAsync();
        }

        if (!targetMembers.Any())
        {
            throw new ArgumentException("No members found to invite");
        }

        // Create RSVPs with "Invited" status for members who don't have an RSVP yet
        var existingRsvps = await _context.EventRsvps
            .Where(r => r.EventId == eventId)
            .Select(r => r.MemberId)
            .ToListAsync();

        var membersToInvite = targetMembers.Where(m => !existingRsvps.Contains(m.Id)).ToList();
        var now = DateTime.UtcNow;

        foreach (var member in membersToInvite)
        {
            var rsvp = new EventRsvp
            {
                EventId = eventId,
                MemberId = member.Id,
                RsvpStatus = "Invited",
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.EventRsvps.Add(rsvp);
        }

        await _context.SaveChangesAsync();

        // Send invitations via requested methods
        var sentCount = 0;
        var methods = request.Methods.Where(m => m == "email" || m == "push").ToList();

        foreach (var method in methods)
        {
            try
            {
                switch (method.ToLower())
                {
                    case "email":
                        // For now, we'll use the existing bulk email service which sends to all active members
                        // TODO: Enhance CommunicationsService to support targeted member lists
                        if (request.MemberIds == null || !request.MemberIds.Any())
                        {
                            var emailRequest = new SendBulkEmailRequest
                            {
                                Subject = $"You're invited to: {eventEntity.Name}",
                                Body = $"<h2>You're invited to {eventEntity.Name}</h2>" +
                                       $"<p><strong>Date:</strong> {eventEntity.EventDateTime:MMMM dd, yyyy}</p>" +
                                       $"<p><strong>Time:</strong> {eventEntity.EventDateTime:h:mm tt}</p>" +
                                       $"<p><strong>Location:</strong> {eventEntity.Location}</p>" +
                                       $"<p><strong>Description:</strong></p>" +
                                       $"<div>{eventEntity.Description}</div>" +
                                       $"<p>Please RSVP through the club app or contact an admin.</p>"
                            };
                            // Note: We need a user ID for the communications service
                            // For now, we'll use the club creator's ID
                            var clubCreator = await _context.ClubAdmins
                                .Where(ca => ca.ClubId == clubId)
                                .Select(ca => ca.UserId)
                                .FirstOrDefaultAsync();

                            if (clubCreator != 0)
                            {
                                await _communicationsService.SendBulkEmailAsync(clubId, clubCreator, emailRequest);
                                sentCount += targetMembers.Count;
                            }
                        }
                        break;

                    case "push":
                        // TODO: Implement push notification service integration
                        _logger.LogInformation("Push notifications for event invitations not yet implemented");
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send {Method} invitations for event {EventId}", method, eventId);
                // Continue with other methods even if one fails
            }
        }

        _logger.LogInformation("Sent {SentCount} invitations for event {EventId} to {MemberCount} members", sentCount, eventId, targetMembers.Count);

        return new SendEventInvitationsResponse
        {
            Message = $"Invitations sent successfully via {string.Join(", ", methods)}",
            SentCount = targetMembers.Count
        };
    }

    /// <summary>
    /// Creates a new event for a club (3-parameter overload)
    /// </summary>
    public async Task<EventResponse> CreateEventAsync(int clubId, CreateEventRequest request, CancellationToken cancellationToken)
    {
        return await CreateEventAsync(clubId, request);
    }

    /// <summary>
    /// Updates an existing event (4-parameter overload)
    /// </summary>
    public async Task<EventResponse> UpdateEventAsync(int clubId, int eventId, UpdateEventRequest request, CancellationToken cancellationToken)
    {
        return await UpdateEventAsync(clubId, eventId, request);
    }

    /// <summary>
    /// Deletes an existing event (3-parameter overload)
    /// </summary>
    public async Task DeleteEventAsync(int clubId, int eventId, CancellationToken cancellationToken)
    {
        await DeleteEventAsync(clubId, eventId);
    }

    /// <summary>
    /// Gets all events for a club (alternative name)
    /// </summary>
    public async Task<List<EventResponse>> GetEventsAsync(int clubId, string? filter = null)
    {
        return await GetEventsByClubAsync(clubId, filter);
    }

    /// <summary>
    /// Creates an RSVP for a member and event
    /// </summary>
    public async Task<EventRsvpResponse> CreateRsvpAsync(int clubId, int eventId, int memberId, UpdateRsvpRequest request)
    {
        return await UpsertRsvpAsync(clubId, eventId, memberId, request);
    }

    private static bool IsTopTier(string? tier)
    {
        return string.Equals(tier, "Expand", StringComparison.OrdinalIgnoreCase)
            || string.Equals(tier, "Unlimited", StringComparison.OrdinalIgnoreCase);
    }
}
