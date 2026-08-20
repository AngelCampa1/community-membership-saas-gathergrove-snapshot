using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for comprehensive event engagement analytics and management
/// </summary>
[ApiController]
[Route("api/v1")]
[Authorize]
public class EventEngagementController : ControllerBase
{
    private readonly IEventEngagementService _eventEngagementService;
    private readonly IClubAuthorizationService _authorizationService;
    private readonly ILogger<EventEngagementController> _logger;

    public EventEngagementController(
        IEventEngagementService eventEngagementService,
        IClubAuthorizationService authorizationService,
        ILogger<EventEngagementController> logger)
    {
        _eventEngagementService = eventEngagementService;
        _authorizationService = authorizationService;
        _logger = logger;
    }

    /// <summary>
    /// Get comprehensive engagement metrics for a specific event
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <returns>Event engagement analytics including RSVPs, attendance, and participation metrics</returns>
    [HttpGet("events/{eventId}/engagement")]
    [ProducesResponseType(typeof(EventEngagementMetricsResponse), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetEventEngagement([FromRoute] int eventId)
    {
        try
        {
            _logger.LogInformation("Getting event engagement metrics for event {EventId}", eventId);

            var metrics = await _eventEngagementService.CalculateEventEngagementScoreAsync(eventId);

            var response = new EventEngagementMetricsResponse
            {
                EventId = eventId,
                EventName = metrics.EventName,
                EventDateTime = metrics.EventDateTime,
                TotalInvited = metrics.TotalInvited,
                TotalRsvps = metrics.TotalRsvps,
                TotalAttended = metrics.TotalAttended,
                RsvpRate = metrics.RsvpRate,
                AttendanceRate = metrics.AttendanceRate,
                EngagementScore = metrics.EngagementScore,
                EngagementLevel = metrics.EngagementLevel.ToString(),
                MemberTypeBreakdown = metrics.MemberTypeBreakdown,
                TopEngagementFactors = metrics.TopEngagementFactors
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event engagement metrics for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while retrieving event engagement metrics");
        }
    }

    /// <summary>
    /// Get event engagement overview for all events in a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="timeframe">Timeframe filter: upcoming, past, all (default: all)</param>
    /// <param name="daysBack">Number of days back to analyze (default: 90)</param>
    /// <returns>Club events engagement overview with aggregated metrics</returns>
    [HttpGet("clubs/{clubId}/events/engagement")]
    [ProducesResponseType(typeof(ClubEventEngagementResponse), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetClubEventsEngagement(
        [FromRoute] int clubId,
        [FromQuery] string timeframe = "all",
        [FromQuery] int daysBack = 90)
    {
        try
        {
            _logger.LogInformation("Getting club event engagement overview for club {ClubId}, timeframe: {Timeframe}", clubId, timeframe);

            var overview = await _eventEngagementService.GetClubEventOverviewAsync(clubId);
            var trends = await _eventEngagementService.GetEventEngagementTrendsAsync(clubId, daysBack);
            var topEvents = await _eventEngagementService.GetTopPerformingEventsAsync(clubId, 10, daysBack);

            var response = new ClubEventEngagementResponse
            {
                ClubId = clubId,
                ClubName = overview.ClubName,
                TotalEvents = overview.TotalEvents,
                TotalMembers = overview.TotalMembers,
                AverageEventAttendance = overview.AverageEventAttendance,
                ClubEventEngagementScore = overview.ClubEventEngagementScore,
                Trends = new EventEngagementTrendsResponse
                {
                    ClubId = trends.ClubId,
                    AverageEngagementScore = trends.AverageEngagementScore,
                    TrendDirection = trends.TrendDirection,
                    TotalEvents = trends.TotalEvents,
                    TotalAttendances = trends.TotalAttendances,
                    DailyTrends = trends.DailyTrends.Select(d => new DailyEventEngagementResponse
                    {
                        Date = d.Date,
                        EventsHeld = d.EventsHeld,
                        TotalAttendance = d.TotalAttendance,
                        AverageEngagementScore = d.AverageEngagementScore
                    }).ToList()
                },
                TopEvents = topEvents.Select(e => new EventEngagementMetricsResponse
                {
                    EventId = e.EventId,
                    EventName = e.EventName,
                    EventDateTime = e.EventDateTime,
                    TotalInvited = e.TotalInvited,
                    TotalRsvps = e.TotalRsvps,
                    TotalAttended = e.TotalAttended,
                    RsvpRate = e.RsvpRate,
                    AttendanceRate = e.AttendanceRate,
                    EngagementScore = e.EngagementScore,
                    EngagementLevel = e.EngagementLevel.ToString(),
                    MemberTypeBreakdown = e.MemberTypeBreakdown,
                    TopEngagementFactors = e.TopEngagementFactors
                }).ToList(),
                LowEngagementMembers = overview.LowEngagementMembers.Select(m => new MemberEventEngagementResponse
                {
                    MemberId = m.MemberId,
                    MemberName = m.MemberName,
                    Email = m.Email,
                    EventsInvited = m.EventsInvited,
                    EventsRsvped = m.EventsRsvped,
                    EventsAttended = m.EventsAttended,
                    EventEngagementScore = m.EventEngagementScore,
                    EngagementLevel = m.EngagementLevel.ToString(),
                    LastEventAttendance = m.LastEventAttendance,
                    PreferredEventTypes = m.PreferredEventTypes
                }).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting club events engagement overview for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving club events engagement data");
        }
    }

    /// <summary>
    /// Record event attendance for a member
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="request">Attendance recording request</param>
    /// <returns>Attendance record confirmation</returns>
    [HttpPost("events/{eventId}/attendance")]
    [ProducesResponseType(typeof(EventAttendanceResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> RecordEventAttendance(
        [FromRoute] int eventId,
        [FromBody] RecordAttendanceRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Recording attendance for member {MemberId} at event {EventId}", request.MemberId, eventId);

            var attendance = await _eventEngagementService.RecordEventAttendanceAsync(
                eventId,
                request.MemberId,
                request.AttendedAt,
                request.Notes);

            var response = new EventAttendanceResponse
            {
                Id = attendance.Id,
                EventId = attendance.EventId,
                MemberId = attendance.MemberId,
                AttendedAt = attendance.AttendedAt,
                CreatedAt = attendance.CreatedAt,
                Notes = attendance.Notes
            };

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid attendance recording request for event {EventId}", eventId);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording attendance for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while recording attendance");
        }
    }

    /// <summary>
    /// Get event engagement history for a specific member
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="daysBack">Number of days back to analyze (default: 180)</param>
    /// <returns>Member's event engagement history with analytics</returns>
    [HttpGet("members/{memberId}/events/engagement")]
    [ProducesResponseType(typeof(MemberEventEngagementHistoryResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetMemberEventEngagement(
        [FromRoute] int memberId,
        [FromQuery] int daysBack = 180)
    {
        try
        {
            // SECURITY FIX: Validate that the requesting user has access to this member's data
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Unable to determine user identity");
            }

            // Verify the user can access the member's data (same club or self)
            if (!await _authorizationService.CanAccessMemberDataAsync(memberId, userId))
            {
                _logger.LogWarning("User {UserId} attempted unauthorized access to member {MemberId} event engagement", userId, memberId);
                return Forbid();
            }

            _logger.LogInformation("Getting event engagement history for member {MemberId} over {DaysBack} days", memberId, daysBack);

            var attendanceHistory = await _eventEngagementService.GetMemberAttendanceHistoryAsync(memberId, daysBack);
            var memberScore = await _eventEngagementService.CalculateMemberEventScoreAsync(memberId, daysBack);

            var response = new MemberEventEngagementHistoryResponse
            {
                MemberId = memberId,
                DaysAnalyzed = daysBack,
                EventEngagementScore = memberScore,
                TotalEventsAttended = attendanceHistory.Count,
                AttendanceHistory = attendanceHistory.Select(a => new EventAttendanceResponse
                {
                    Id = a.Id,
                    EventId = a.EventId,
                    MemberId = a.MemberId,
                    AttendedAt = a.AttendedAt,
                    CreatedAt = a.CreatedAt,
                    Notes = a.Notes,
                    EventName = a.Event?.Name ?? "Unknown Event",
                    EventDateTime = a.Event?.EventDateTime ?? DateTime.MinValue
                }).OrderByDescending(a => a.AttendedAt).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event engagement history for member {MemberId}", memberId);
            return StatusCode(500, "An error occurred while retrieving member event engagement data");
        }
    }

    /// <summary>
    /// Get comprehensive event analytics dashboard data
    /// </summary>
    /// <param name="clubId">Optional club ID filter</param>
    /// <param name="daysBack">Number of days back to analyze (default: 90)</param>
    /// <returns>Event analytics dashboard with comprehensive metrics</returns>
    [HttpGet("events/analytics")]
    [ProducesResponseType(typeof(EventAnalyticsResponse), 200)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetEventAnalytics(
        [FromQuery] int? clubId = null,
        [FromQuery] int daysBack = 90)
    {
        try
        {
            _logger.LogInformation("Getting event analytics dashboard data, club: {ClubId}, days back: {DaysBack}", clubId, daysBack);

            var response = new EventAnalyticsResponse
            {
                DaysAnalyzed = daysBack,
                GeneratedAt = DateTime.UtcNow
            };

            if (clubId.HasValue)
            {
                // Club-specific analytics
                var clubOverview = await _eventEngagementService.GetClubEventOverviewAsync(clubId.Value);
                var topEvents = await _eventEngagementService.GetTopPerformingEventsAsync(clubId.Value, 10, daysBack);
                var trends = await _eventEngagementService.GetEventEngagementTrendsAsync(clubId.Value, daysBack);

                response.ClubId = clubId.Value;
                response.TotalEvents = clubOverview.TotalEvents;
                response.TotalMembers = clubOverview.TotalMembers;
                response.AverageEngagementScore = clubOverview.ClubEventEngagementScore;
                response.TopPerformingEvents = topEvents.Select(e => new EventEngagementMetricsResponse
                {
                    EventId = e.EventId,
                    EventName = e.EventName,
                    EventDateTime = e.EventDateTime,
                    TotalInvited = e.TotalInvited,
                    TotalRsvps = e.TotalRsvps,
                    TotalAttended = e.TotalAttended,
                    RsvpRate = e.RsvpRate,
                    AttendanceRate = e.AttendanceRate,
                    EngagementScore = e.EngagementScore,
                    EngagementLevel = e.EngagementLevel.ToString(),
                    MemberTypeBreakdown = e.MemberTypeBreakdown,
                    TopEngagementFactors = e.TopEngagementFactors
                }).ToList();
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event analytics dashboard data");
            return StatusCode(500, "An error occurred while retrieving event analytics data");
        }
    }

    /// <summary>
    /// Submit feedback for an event
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="request">Event feedback request</param>
    /// <returns>Feedback submission confirmation</returns>
    [HttpPost("events/{eventId}/feedback")]
    [ProducesResponseType(typeof(EventFeedbackResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> SubmitEventFeedback(
        [FromRoute] int eventId,
        [FromBody] EventFeedbackRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Submitting feedback for event {EventId} from member {MemberId}", eventId, request.MemberId);

            // For now, we'll store this as a simple success response
            // In a real implementation, you would save this to a database table

            var response = new EventFeedbackResponse
            {
                EventId = eventId,
                MemberId = request.MemberId,
                Rating = request.Rating,
                Comments = request.Comments,
                SubmittedAt = DateTime.UtcNow,
                Status = "Submitted"
            };

            _logger.LogInformation("Event feedback submitted successfully for event {EventId}", eventId);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting feedback for event {EventId}", eventId);
            return StatusCode(500, "An error occurred while submitting event feedback");
        }
    }

    /// <summary>
    /// Get personalized event recommendations for a member
    /// </summary>
    /// <param name="memberId">Member ID</param>
    /// <param name="limit">Maximum number of recommendations (default: 10)</param>
    /// <returns>Personalized event recommendations based on member's engagement history</returns>
    [HttpGet("events/recommendations/{memberId}")]
    [ProducesResponseType(typeof(List<EventRecommendationResponse>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetEventRecommendations(
        [FromRoute] int memberId,
        [FromQuery] int limit = 10)
    {
        try
        {
            // SECURITY FIX: Validate that the requesting user has access to this member's data
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Unable to determine user identity");
            }

            // Verify the user can access the member's data (same club or self)
            if (!await _authorizationService.CanAccessMemberDataAsync(memberId, userId))
            {
                _logger.LogWarning("User {UserId} attempted unauthorized access to member {MemberId} event recommendations", userId, memberId);
                return Forbid();
            }

            _logger.LogInformation("Getting event recommendations for member {MemberId}, limit: {Limit}", memberId, limit);

            var recommendations = await _eventEngagementService.GetEventRecommendationsAsync(memberId, limit);

            var response = recommendations.Select(r => new EventRecommendationResponse
            {
                EventId = r.EventId,
                EventName = r.EventName,
                EventDateTime = r.EventDateTime,
                Location = r.Location,
                RecommendationScore = r.RecommendationScore,
                RecommendationReasons = r.RecommendationReasons,
                AttendanceProbability = r.AttendanceProbability
            }).ToList();

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event recommendations for member {MemberId}", memberId);
            return StatusCode(500, "An error occurred while retrieving event recommendations");
        }
    }
}

#region Request/Response DTOs

public class RecordAttendanceRequest
{
    [Required]
    public int MemberId { get; set; }

    public DateTime? AttendedAt { get; set; }

    public string? Notes { get; set; }
}

public class EventFeedbackRequest
{
    [Required]
    public int MemberId { get; set; }

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    public string? Comments { get; set; }

    public List<string> Tags { get; set; } = new();
}

public class EventEngagementMetricsResponse
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public int TotalInvited { get; set; }
    public int TotalRsvps { get; set; }
    public int TotalAttended { get; set; }
    public decimal RsvpRate { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal EngagementScore { get; set; }
    public string EngagementLevel { get; set; } = string.Empty;
    public Dictionary<string, decimal> MemberTypeBreakdown { get; set; } = new();
    public List<string> TopEngagementFactors { get; set; } = new();
}

public class ClubEventEngagementResponse
{
    public int ClubId { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public int TotalEvents { get; set; }
    public int TotalMembers { get; set; }
    public decimal AverageEventAttendance { get; set; }
    public decimal ClubEventEngagementScore { get; set; }
    public EventEngagementTrendsResponse Trends { get; set; } = new();
    public List<EventEngagementMetricsResponse> TopEvents { get; set; } = new();
    public List<MemberEventEngagementResponse> LowEngagementMembers { get; set; } = new();
}

public class EventEngagementTrendsResponse
{
    public int ClubId { get; set; }
    public List<DailyEventEngagementResponse> DailyTrends { get; set; } = new();
    public decimal AverageEngagementScore { get; set; }
    public decimal TrendDirection { get; set; }
    public int TotalEvents { get; set; }
    public int TotalAttendances { get; set; }
}

public class DailyEventEngagementResponse
{
    public DateTime Date { get; set; }
    public int EventsHeld { get; set; }
    public int TotalAttendance { get; set; }
    public decimal AverageEngagementScore { get; set; }
}

public class MemberEventEngagementResponse
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int EventsInvited { get; set; }
    public int EventsRsvped { get; set; }
    public int EventsAttended { get; set; }
    public decimal EventEngagementScore { get; set; }
    public string EngagementLevel { get; set; } = string.Empty;
    public DateTime LastEventAttendance { get; set; }
    public List<string> PreferredEventTypes { get; set; } = new();
}

public class EventAttendanceResponse
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int MemberId { get; set; }
    public DateTime AttendedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Notes { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
}

public class MemberEventEngagementHistoryResponse
{
    public int MemberId { get; set; }
    public int DaysAnalyzed { get; set; }
    public decimal EventEngagementScore { get; set; }
    public int TotalEventsAttended { get; set; }
    public List<EventAttendanceResponse> AttendanceHistory { get; set; } = new();
}

public class EventAnalyticsResponse
{
    public int? ClubId { get; set; }
    public int DaysAnalyzed { get; set; }
    public int TotalEvents { get; set; }
    public int TotalMembers { get; set; }
    public decimal AverageEngagementScore { get; set; }
    public List<EventEngagementMetricsResponse> TopPerformingEvents { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

public class EventFeedbackResponse
{
    public int EventId { get; set; }
    public int MemberId { get; set; }
    public int Rating { get; set; }
    public string? Comments { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class EventRecommendationResponse
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public decimal RecommendationScore { get; set; }
    public List<string> RecommendationReasons { get; set; } = new();
    public decimal AttendanceProbability { get; set; }
}

#endregion