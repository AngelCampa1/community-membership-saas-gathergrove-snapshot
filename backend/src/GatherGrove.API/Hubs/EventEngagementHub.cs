using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Application.Services.Interfaces;
using System.Security.Claims;

namespace GatherGrove.API.Hubs;

/// <summary>
/// SignalR hub for real-time event engagement updates
/// </summary>
[Authorize]
public class EventEngagementHub : Hub
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<EventEngagementHub> _logger;
    private readonly IMemberEngagementService _memberEngagementService;

    public EventEngagementHub(
        GatherGroveDbContext context,
        ILogger<EventEngagementHub> logger,
        IMemberEngagementService memberEngagementService)
    {
        _context = context;
        _logger = logger;
        _memberEngagementService = memberEngagementService;
    }

    /// <summary>
    /// Join an event-specific engagement monitoring group
    /// </summary>
    /// <param name="eventId">Event ID</param>
    public async Task JoinEventEngagementGroup(int eventId)
    {
        try
        {
            var userId = Context.UserIdentifier;
            var clubId = await GetUserClubId();

            if (clubId == null)
            {
                _logger.LogWarning("User {UserId} attempted to join event engagement group without valid club membership", userId);
                return;
            }

            // Verify user has access to this event
            var hasAccess = await _context.Events
                .AnyAsync(e => e.Id == eventId && e.ClubId == clubId.Value);

            if (!hasAccess)
            {
                _logger.LogWarning("User {UserId} attempted to join event engagement group for event {EventId} without access", userId, eventId);
                return;
            }

            var groupName = $"Event_{eventId}_Engagement";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation("User {UserId} joined event engagement group for event {EventId}", userId, eventId);

            // Send current engagement data to the newly joined client
            var currentMetrics = await GetEventEngagementSummary(eventId);
            await Clients.Caller.SendAsync("EventEngagementSummary", currentMetrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining event engagement group for event {EventId}", eventId);
            await Clients.Caller.SendAsync("Error", "Failed to join event engagement monitoring");
        }
    }

    /// <summary>
    /// Leave an event-specific engagement monitoring group
    /// </summary>
    /// <param name="eventId">Event ID</param>
    public async Task LeaveEventEngagementGroup(int eventId)
    {
        try
        {
            var groupName = $"Event_{eventId}_Engagement";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation("User {UserId} left event engagement group for event {EventId}", Context.UserIdentifier, eventId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving event engagement group for event {EventId}", eventId);
        }
    }

    /// <summary>
    /// Join a club-wide event engagement monitoring group
    /// </summary>
    public async Task JoinClubEngagementGroup()
    {
        try
        {
            var userId = Context.UserIdentifier;
            var clubId = await GetUserClubId();

            if (clubId == null)
            {
                _logger.LogWarning("User {UserId} attempted to join club engagement group without valid club membership", userId);
                return;
            }

            var groupName = $"Club_{clubId.Value}_EventEngagement";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation("User {UserId} joined club engagement group for club {ClubId}", userId, clubId.Value);

            // Send current club engagement overview to the newly joined client
            var overview = await GetClubEngagementOverview(clubId.Value);
            await Clients.Caller.SendAsync("ClubEngagementOverview", overview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining club engagement group");
            await Clients.Caller.SendAsync("Error", "Failed to join club engagement monitoring");
        }
    }

    /// <summary>
    /// Leave a club-wide event engagement monitoring group
    /// </summary>
    public async Task LeaveClubEngagementGroup()
    {
        try
        {
            var clubId = await GetUserClubId();
            if (clubId == null) return;

            var groupName = $"Club_{clubId.Value}_EventEngagement";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation("User {UserId} left club engagement group for club {ClubId}", Context.UserIdentifier, clubId.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving club engagement group");
        }
    }

    /// <summary>
    /// Request real-time event recommendations for a member
    /// </summary>
    /// <param name="memberId">Member ID</param>
    public async Task RequestEventRecommendations(int memberId)
    {
        try
        {
            var userId = Context.UserIdentifier;
            var clubId = await GetUserClubId();

            if (clubId == null)
            {
                await Clients.Caller.SendAsync("Error", "Invalid club membership");
                return;
            }

            // Verify user has access to this member data
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.Id == memberId && m.ClubId == clubId.Value);

            if (member == null)
            {
                await Clients.Caller.SendAsync("Error", "Member not found or access denied");
                return;
            }

            _logger.LogInformation("User {UserId} requested event recommendations for member {MemberId}", userId, memberId);
            await Clients.Caller.SendAsync("EventRecommendationsRequested", new { MemberId = memberId, Status = "Processing" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing event recommendations request for member {MemberId}", memberId);
            await Clients.Caller.SendAsync("Error", "Failed to process recommendations request");
        }
    }

    /// <summary>
    /// Override connection methods for proper logging
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        var clubId = await GetUserClubId();

        _logger.LogInformation("User {UserId} connected to Event Engagement Hub (Club: {ClubId})", userId, clubId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;

        if (exception != null)
        {
            _logger.LogError(exception, "User {UserId} disconnected from Event Engagement Hub with error", userId);
        }
        else
        {
            _logger.LogInformation("User {UserId} disconnected from Event Engagement Hub", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    #region Private Helper Methods

    private async Task<int?> GetUserClubId()
    {
        var userClubIdClaim = Context.User?.FindFirst("ClubId");
        if (userClubIdClaim != null && int.TryParse(userClubIdClaim.Value, out var userClubId))
        {
            return userClubId;
        }

        // Fallback: try to get club ID from user/admin relationship
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
        {
            var clubAdmin = await _context.ClubAdmins
                .FirstOrDefaultAsync(ca => ca.UserId == userId);

            return clubAdmin?.ClubId;
        }

        return null;
    }

    private async Task<object> GetEventEngagementSummary(int eventId)
    {
        try
        {
            var eventEntity = await _context.Events
                .Include(e => e.Club)
                .FirstOrDefaultAsync(e => e.Id == eventId);

            if (eventEntity == null)
                return new { Error = "Event not found" };

            var rsvpCount = await _context.EventRsvps.CountAsync(r => r.EventId == eventId);
            var attendanceCount = await _context.EventAttendances.CountAsync(a => a.EventId == eventId);

            return new
            {
                EventId = eventId,
                EventName = eventEntity.Name,
                EventDateTime = eventEntity.EventDateTime,
                TotalRsvps = rsvpCount,
                TotalAttendances = attendanceCount,
                AttendanceRate = rsvpCount > 0 ? Math.Round((decimal)attendanceCount / rsvpCount * 100, 2) : 0,
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event engagement summary for event {EventId}", eventId);
            return new { Error = "Failed to load event engagement data" };
        }
    }

    private async Task<object> GetClubEngagementOverview(int clubId)
    {
        try
        {
            var club = await _context.Clubs.FindAsync(clubId);
            if (club == null)
                return new { Error = "Club not found" };

            var totalEvents = await _context.Events.CountAsync(e => e.ClubId == clubId);
            var totalMembers = await _context.Members.CountAsync(m => m.ClubId == clubId && m.Status == "Active");

            var totalRsvps = await (from e in _context.Events
                                    join r in _context.EventRsvps on e.Id equals r.EventId
                                    where e.ClubId == clubId
                                    select r).CountAsync();

            var totalAttendances = await (from e in _context.Events
                                          join a in _context.EventAttendances on e.Id equals a.EventId
                                          where e.ClubId == clubId
                                          select a).CountAsync();

            return new
            {
                ClubId = clubId,
                ClubName = club.Name,
                TotalEvents = totalEvents,
                TotalMembers = totalMembers,
                TotalRsvps = totalRsvps,
                TotalAttendances = totalAttendances,
                AverageAttendanceRate = totalRsvps > 0 ? Math.Round((decimal)totalAttendances / totalRsvps * 100, 2) : 0,
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting club engagement overview for club {ClubId}", clubId);
            return new { Error = "Failed to load club engagement data" };
        }
    }

    #endregion
}