using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service implementation for comprehensive event engagement analysis and tracking
/// </summary>
public class EventEngagementService : IEventEngagementService
{
    private readonly GatherGroveDbContext _context;
    private readonly IMemberEngagementService _memberEngagementService;
    private readonly IEngagementScoringService _engagementScoringService;
    private readonly ILogger<EventEngagementService> _logger;

    // Event engagement scoring weights
    private readonly Dictionary<string, decimal> _eventScoreWeights = new()
    {
        ["rsvp"] = 0.3m,           // 30% - RSVPing to events
        ["attendance"] = 0.5m,     // 50% - Actually attending events  
        ["consistency"] = 0.2m     // 20% - Consistent participation
    };

    public EventEngagementService(
        GatherGroveDbContext context,
        IMemberEngagementService memberEngagementService,
        IEngagementScoringService engagementScoringService,
        ILogger<EventEngagementService> logger)
    {
        _context = context;
        _memberEngagementService = memberEngagementService;
        _engagementScoringService = engagementScoringService;
        _logger = logger;
    }

    #region Event Attendance & Participation

    /// <inheritdoc />
    public async Task<EventAttendance> RecordEventAttendanceAsync(int eventId, int memberId, DateTime? attendedAt = null, string? notes = null)
    {
        // Validate input parameters
        if (eventId <= 0)
            throw new ArgumentException("Event ID must be positive", nameof(eventId));
        if (memberId <= 0)
            throw new ArgumentException("Member ID must be positive", nameof(memberId));

        try
        {
            _logger.LogInformation("Recording event attendance for member {MemberId} at event {EventId}", memberId, eventId);

            // Validate event and member exist
            var eventEntity = await _context.Events.FindAsync(eventId);
            if (eventEntity == null)
            {
                throw new ArgumentException($"Event with ID {eventId} not found");
            }

            var member = await _context.Members.FindAsync(memberId);
            if (member == null)
            {
                throw new ArgumentException($"Member with ID {memberId} not found");
            }

            // Check if attendance already recorded
            var existingAttendance = await _context.EventAttendances
                .FirstOrDefaultAsync(a => a.EventId == eventId && a.MemberId == memberId);

            if (existingAttendance != null)
            {
                // Update existing attendance with new notes if provided
                if (!string.IsNullOrEmpty(notes))
                {
                    existingAttendance.Notes = notes;
                    await _context.SaveChangesAsync();
                }
                _logger.LogWarning("Attendance already recorded for member {MemberId} at event {EventId}, updated with notes", memberId, eventId);
                return existingAttendance;
            }

            // Create attendance record
            var attendance = new EventAttendance
            {
                EventId = eventId,
                MemberId = memberId,
                AttendedAt = attendedAt ?? DateTime.UtcNow,
                Notes = notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.EventAttendances.Add(attendance);
            await _context.SaveChangesAsync();


            // Update member engagement score in real-time
            _ = Task.Run(async () =>
            {
                try
                {
                    await UpdateEngagementAfterEventActivityAsync(
                        memberId,
                        "eventattendance",
                        eventId,
                        new { attendance = true, eventName = eventEntity.Name }
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to update engagement score after event attendance for member {MemberId}", memberId);
                }
            });

            _logger.LogInformation("Successfully recorded attendance for member {MemberId} at event {EventId}", memberId, eventId);
            return attendance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording event attendance for member {MemberId} at event {EventId}", memberId, eventId);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<EventRsvp> UpdateEventRsvpAsync(int eventId, int memberId, string rsvpStatus)
    {
        // Validate input parameters
        if (eventId <= 0)
            throw new ArgumentException("Event ID must be positive", nameof(eventId));
        if (memberId <= 0)
            throw new ArgumentException("Member ID must be positive", nameof(memberId));
        if (string.IsNullOrWhiteSpace(rsvpStatus))
            throw new ArgumentException("RSVP status cannot be null or empty", nameof(rsvpStatus));

        try
        {
            _logger.LogInformation("Updating RSVP for member {MemberId} at event {EventId} to {RsvpStatus}", memberId, eventId, rsvpStatus);

            var eventEntity = await _context.Events.FindAsync(eventId);
            if (eventEntity == null)
            {
                throw new ArgumentException($"Event with ID {eventId} not found");
            }

            var member = await _context.Members.FindAsync(memberId);
            if (member == null)
            {
                throw new ArgumentException($"Member with ID {memberId} not found");
            }

            // Update or create RSVP
            var rsvp = await _context.EventRsvps
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.MemberId == memberId);

            if (rsvp == null)
            {
                rsvp = new EventRsvp
                {
                    EventId = eventId,
                    MemberId = memberId,
                    RsvpStatus = rsvpStatus,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.EventRsvps.Add(rsvp);
            }
            else
            {
                rsvp.RsvpStatus = rsvpStatus;
                rsvp.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();


            // Update engagement score
            _ = Task.Run(async () =>
            {
                try
                {
                    await UpdateEngagementAfterEventActivityAsync(
                        memberId,
                        "eventrsvp",
                        eventId,
                        new { rsvpStatus, eventName = eventEntity.Name }
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to update engagement score after RSVP for member {MemberId}", memberId);
                }
            });

            _logger.LogInformation("Successfully updated RSVP for member {MemberId} at event {EventId}", memberId, eventId);
            return rsvp;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating event RSVP for member {MemberId} at event {EventId}", memberId, eventId);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<List<EventAttendance>> GetEventAttendanceAsync(int eventId)
    {
        return await _context.EventAttendances
            .Where(a => a.EventId == eventId)
            .Include(a => a.Member)
            .Include(a => a.Event)
            .OrderBy(a => a.AttendedAt)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<List<EventAttendance>> GetMemberAttendanceHistoryAsync(int memberId, int daysBack = 365)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysBack);

        return await _context.EventAttendances
            .Where(a => a.MemberId == memberId && a.AttendedAt >= cutoffDate)
            .Include(a => a.Event)
            .OrderByDescending(a => a.AttendedAt)
            .ToListAsync();
    }

    #endregion

    #region Event Engagement Scoring

    /// <inheritdoc />
    public async Task<EventEngagementMetrics> CalculateEventEngagementScoreAsync(int eventId)
    {
        try
        {
            _logger.LogInformation("Calculating engagement score for event {EventId}", eventId);

            var eventEntity = await _context.Events
                .Include(e => e.Club)
                .FirstOrDefaultAsync(e => e.Id == eventId);

            if (eventEntity == null)
            {
                throw new ArgumentException($"Event with ID {eventId} not found");
            }

            // Get RSVPs and attendance data
            var rsvps = await _context.EventRsvps
                .Where(r => r.EventId == eventId)
                .ToListAsync();

            var attendances = await _context.EventAttendances
                .Where(a => a.EventId == eventId)
                .ToListAsync();

            // Get total club members for context
            var totalMembers = await _context.Members
                .CountAsync(m => m.ClubId == eventEntity.ClubId && m.Status == "Active");

            // Calculate basic metrics
            var totalInvited = totalMembers; // Assuming all active members are invited
            var totalRsvps = rsvps.Count;
            var totalAttended = attendances.Count;
            var rsvpRate = totalInvited > 0 ? (decimal)totalRsvps / totalInvited * 100 : 0;
            var attendanceRate = totalRsvps > 0 ? (decimal)totalAttended / totalRsvps * 100 : 0;

            // Calculate engagement score based on participation rates
            var engagementScore = CalculateEventEngagementLevel(rsvpRate, attendanceRate);
            var engagementLevel = DetermineEventEngagementLevel(engagementScore);

            // Analyze member type breakdown
            var memberTypeBreakdown = await AnalyzeMemberTypeBreakdownAsync(eventId, rsvps, attendances);

            // Identify top engagement factors
            var topEngagementFactors = await IdentifyTopEngagementFactorsAsync(eventId);

            var metrics = new EventEngagementMetrics
            {
                EventId = eventId,
                EventName = eventEntity.Name,
                EventDateTime = eventEntity.EventDateTime,
                TotalInvited = totalInvited,
                TotalRsvps = totalRsvps,
                TotalAttended = totalAttended,
                RsvpRate = Math.Round(rsvpRate, 2),
                AttendanceRate = Math.Round(attendanceRate, 2),
                EngagementScore = Math.Round(engagementScore, 2),
                EngagementLevel = Enum.Parse<EngagementLevel>(engagementLevel),
                MemberTypeBreakdown = memberTypeBreakdown,
                TopEngagementFactors = topEngagementFactors
            };

            _logger.LogInformation("Calculated engagement score for event {EventId}: {EngagementScore}", eventId, engagementScore);
            return metrics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating event engagement score for event {EventId}", eventId);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<decimal> CalculateMemberEventScoreAsync(int memberId, int daysBack = 90)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysBack);

        // Get member's event activity
        var rsvps = await _context.EventRsvps
            .Include(r => r.Event)
            .Where(r => r.MemberId == memberId && r.Event.EventDateTime >= cutoffDate)
            .CountAsync();

        var attendances = await _context.EventAttendances
            .Where(a => a.MemberId == memberId && a.AttendedAt >= cutoffDate)
            .CountAsync();

        // Calculate score components
        var rsvpScore = Math.Min(30m, rsvps * 5m);          // 5 points per RSVP, max 30
        var attendanceScore = Math.Min(70m, attendances * 10m); // 10 points per attendance, max 70

        var eventScore = rsvpScore + attendanceScore;
        return Math.Min(100m, Math.Round(eventScore, 2));
    }

    /// <inheritdoc />
    public async Task<EventImpactAnalysis> AnalyzeEventImpactAsync(int eventId)
    {
        try
        {
            _logger.LogInformation("Analyzing impact of event {EventId} on member engagement", eventId);

            var eventEntity = await _context.Events.FindAsync(eventId);
            if (eventEntity == null)
            {
                throw new ArgumentException($"Event with ID {eventId} not found");
            }

            // Get members who attended the event
            var attendances = await _context.EventAttendances
                .Where(a => a.EventId == eventId)
                .Include(a => a.Member)
                .ToListAsync();

            var memberChanges = new List<MemberEngagementChange>();
            var membersPositivelyImpacted = 0;
            var membersNegativelyImpacted = 0;

            // Analyze engagement changes for each attendee
            foreach (var attendance in attendances)
            {
                var memberId = attendance.MemberId;

                // Get engagement scores before and after the event
                var preEventScore = await GetMemberEngagementScoreBeforeDateAsync(memberId, eventEntity.EventDateTime);
                var postEventScore = await GetMemberEngagementScoreAfterDateAsync(memberId, eventEntity.EventDateTime);

                if (preEventScore != null && postEventScore != null)
                {
                    var scoreChange = postEventScore.OverallScore - preEventScore.OverallScore;

                    memberChanges.Add(new MemberEngagementChange
                    {
                        MemberId = memberId,
                        MemberName = attendance.Member.FullName,
                        PreEventScore = preEventScore.OverallScore,
                        PostEventScore = postEventScore.OverallScore,
                        ScoreChange = scoreChange,
                        Attended = true
                    });

                    if (scoreChange > 0) membersPositivelyImpacted++;
                    else if (scoreChange < 0) membersNegativelyImpacted++;
                }
            }

            // Calculate overall impact metrics
            var preEventAverage = memberChanges.Count > 0
                ? memberChanges.Average(m => m.PreEventScore)
                : 0;

            var postEventAverage = memberChanges.Count > 0
                ? memberChanges.Average(m => m.PostEventScore)
                : 0;

            var engagementImpact = postEventAverage - preEventAverage;

            var impact = new EventImpactAnalysis
            {
                EventId = eventId,
                EventName = eventEntity.Name,
                PreEventAverageScore = Math.Round(preEventAverage, 2),
                PostEventAverageScore = Math.Round(postEventAverage, 2),
                EngagementImpact = Math.Round(engagementImpact, 2),
                MembersPositivelyImpacted = membersPositivelyImpacted,
                MembersNegativelyImpacted = membersNegativelyImpacted,
                MemberChanges = memberChanges
            };

            _logger.LogInformation("Analyzed impact for event {EventId}: {EngagementImpact} point change", eventId, engagementImpact);
            return impact;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing event impact for event {EventId}", eventId);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<GatherGrove.Application.Services.Interfaces.EventEngagementTrendsDto> GetEventEngagementTrendsAsync(int clubId, int daysBack = 90)
    {
        try
        {
            _logger.LogInformation("Getting event engagement trends for club {ClubId} over {DaysBack} days", clubId, daysBack);

            var cutoffDate = DateTime.UtcNow.AddDays(-daysBack);

            // Get events and their engagement data
            var events = await _context.Events
                .Where(e => e.ClubId == clubId && e.EventDateTime >= cutoffDate)
                .OrderBy(e => e.EventDateTime)
                .ToListAsync();

            var dailyTrends = new Dictionary<DateTime, DailyEventEngagement>();
            var totalEngagementScore = 0m;
            var totalAttendances = 0;

            // Process each event
            foreach (var eventEntity in events)
            {
                var eventMetrics = await CalculateEventEngagementScoreAsync(eventEntity.Id);
                var eventDate = eventEntity.EventDateTime.Date;

                if (!dailyTrends.ContainsKey(eventDate))
                {
                    dailyTrends[eventDate] = new DailyEventEngagement
                    {
                        Date = eventDate,
                        EventsHeld = 0,
                        TotalAttendance = 0,
                        AverageEngagementScore = 0,
                        Events = new List<EventEngagementMetrics>()
                    };
                }

                dailyTrends[eventDate].EventsHeld++;
                dailyTrends[eventDate].TotalAttendance += eventMetrics.TotalAttended;
                dailyTrends[eventDate].Events.Add(eventMetrics);

                totalEngagementScore += eventMetrics.EngagementScore;
                totalAttendances += eventMetrics.TotalAttended;
            }

            // Calculate average engagement scores per day
            foreach (var day in dailyTrends.Values)
            {
                day.AverageEngagementScore = day.Events.Count > 0
                    ? Math.Round(day.Events.Average(e => e.EngagementScore), 2)
                    : 0;
            }

            // Calculate trend direction (simple linear regression)
            var trendDirection = CalculateTrendDirection(dailyTrends.Values.ToList());

            var trends = new GatherGrove.Application.Services.Interfaces.EventEngagementTrendsDto
            {
                ClubId = clubId,
                DailyTrends = dailyTrends.Values.OrderBy(d => d.Date).ToList(),
                AverageEngagementScore = events.Count > 0
                    ? Math.Round(totalEngagementScore / events.Count, 2)
                    : 0,
                TrendDirection = Math.Round(trendDirection, 2),
                TotalEvents = events.Count,
                TotalAttendances = totalAttendances
            };

            _logger.LogInformation("Calculated event engagement trends for club {ClubId}", clubId);
            return trends;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event engagement trends for club {ClubId}", clubId);
            throw;
        }
    }

    #endregion

    #region Event Analytics & Reporting

    /// <inheritdoc />
    public async Task<EventAnalyticsReport> GenerateEventReportAsync(int eventId)
    {
        var metrics = await CalculateEventEngagementScoreAsync(eventId);
        var impact = await AnalyzeEventImpactAsync(eventId);
        var memberEngagement = await GetEventMemberEngagementAsync(eventId);

        return new EventAnalyticsReport
        {
            EventId = eventId,
            Metrics = metrics,
            Impact = impact,
            MemberEngagement = memberEngagement,
            CustomMetrics = new Dictionary<string, object>(),
            GeneratedAt = DateTime.UtcNow
        };
    }

    /// <inheritdoc />
    public async Task<ClubEventEngagementOverview> GetClubEventOverviewAsync(int clubId)
    {
        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException($"Club with ID {clubId} not found");
        }

        var totalEvents = await _context.Events.CountAsync(e => e.ClubId == clubId);
        var totalMembers = await _context.Members.CountAsync(m => m.ClubId == clubId && m.Status == "Active");

        var trends = await GetEventEngagementTrendsAsync(clubId, 90);
        var topEvents = await GetTopPerformingEventsAsync(clubId, 5);
        var lowEngagementMembers = await GetLowEventEngagementMembersAsync(clubId);

        var averageAttendance = trends.DailyTrends.Count > 0
            ? trends.DailyTrends.Average(d => d.TotalAttendance)
            : 0;

        return new ClubEventEngagementOverview
        {
            ClubId = clubId,
            ClubName = club.Name,
            TotalEvents = totalEvents,
            TotalMembers = totalMembers,
            AverageEventAttendance = Math.Round((decimal)averageAttendance, 2),
            ClubEventEngagementScore = trends.AverageEngagementScore,
            Trends = trends,
            TopEvents = topEvents,
            LowEngagementMembers = lowEngagementMembers
        };
    }

    /// <inheritdoc />
    public async Task<List<EventEngagementMetrics>> GetTopPerformingEventsAsync(int clubId, int limit = 10, int daysBack = 365)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysBack);

        var events = await _context.Events
            .Where(e => e.ClubId == clubId && e.EventDateTime >= cutoffDate)
            .Take(50) // Limit initial query for performance
            .ToListAsync();

        var eventMetrics = new List<EventEngagementMetrics>();

        foreach (var eventEntity in events)
        {
            var metrics = await CalculateEventEngagementScoreAsync(eventEntity.Id);
            eventMetrics.Add(metrics);
        }

        return eventMetrics
            .OrderByDescending(m => m.EngagementScore)
            .Take(limit)
            .ToList();
    }

    /// <inheritdoc />
    public async Task<List<MemberEventEngagement>> GetLowEventEngagementMembersAsync(int clubId, decimal threshold = 30m, int daysBack = 90)
    {
        var members = await _context.Members
            .Where(m => m.ClubId == clubId && m.Status == "Active")
            .ToListAsync();

        var lowEngagementMembers = new List<MemberEventEngagement>();

        foreach (var member in members)
        {
            var eventScore = await CalculateMemberEventScoreAsync(member.Id, daysBack);

            if (eventScore < threshold)
            {
                var memberEngagement = await CreateMemberEventEngagementAsync(member, eventScore, daysBack);
                lowEngagementMembers.Add(memberEngagement);
            }
        }

        return lowEngagementMembers.OrderBy(m => m.EventEngagementScore).ToList();
    }

    #endregion

    #region Event Recommendations

    /// <inheritdoc />
    public async Task<List<EventRecommendation>> GetEventRecommendationsAsync(int memberId, int limit = 5)
    {
        try
        {
            _logger.LogInformation("Generating event recommendations for member {MemberId}", memberId);

            var member = await _context.Members.FindAsync(memberId);
            if (member == null)
            {
                throw new ArgumentException($"Member with ID {memberId} not found");
            }

            // Get member's event engagement patterns
            var memberEventHistory = await GetMemberAttendanceHistoryAsync(memberId, 365);
            var memberEngagement = await _memberEngagementService.GetMemberEngagementScore(memberId);

            // Get upcoming events in the club
            var upcomingEvents = await _context.Events
                .Where(e => e.ClubId == member.ClubId && e.EventDateTime > DateTime.UtcNow)
                .OrderBy(e => e.EventDateTime)
                .Take(limit * 3) // Get more to filter and rank
                .ToListAsync();

            var recommendations = new List<EventRecommendation>();

            foreach (var eventEntity in upcomingEvents)
            {
                // Calculate recommendation score based on various factors
                var recommendationScore = await CalculateEventRecommendationScoreAsync(
                    memberId,
                    eventEntity,
                    memberEventHistory,
                    memberEngagement
                );

                // Generate recommendation reasons
                var reasons = await GenerateRecommendationReasonsAsync(
                    memberId,
                    eventEntity,
                    memberEventHistory,
                    recommendationScore
                );

                // Predict attendance probability
                var attendancePrediction = await PredictEventAttendanceAsync(eventEntity.Id, memberId);

                recommendations.Add(new EventRecommendation
                {
                    EventId = eventEntity.Id,
                    EventName = eventEntity.Name,
                    EventDateTime = eventEntity.EventDateTime,
                    Location = eventEntity.Location,
                    RecommendationScore = recommendationScore,
                    RecommendationReasons = reasons,
                    AttendanceProbability = attendancePrediction.AttendanceProbability
                });
            }

            // Sort by recommendation score and return top recommendations
            var topRecommendations = recommendations
                .OrderByDescending(r => r.RecommendationScore)
                .Take(limit)
                .ToList();

            _logger.LogInformation("Generated {Count} recommendations for member {MemberId}", topRecommendations.Count, memberId);
            return topRecommendations;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating event recommendations for member {MemberId}", memberId);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<EventAttendancePrediction> PredictEventAttendanceAsync(int eventId, int memberId)
    {
        try
        {
            var member = await _context.Members.FindAsync(memberId);
            var eventEntity = await _context.Events.FindAsync(eventId);

            if (member == null || eventEntity == null)
            {
                throw new ArgumentException("Member or event not found");
            }

            // Get member's historical attendance data
            var attendanceHistory = await GetMemberAttendanceHistoryAsync(memberId, 365);
            var memberEngagement = await _memberEngagementService.GetMemberEngagementScore(memberId);

            // Calculate various factors that influence attendance
            var factors = new Dictionary<string, decimal>
            {
                ["overallEngagement"] = memberEngagement?.OverallScore ?? 0,
                ["eventEngagement"] = memberEngagement?.EventScore ?? 0,
                ["historicalAttendanceRate"] = CalculateHistoricalAttendanceRate(attendanceHistory),
                ["dayOfWeekPreference"] = await GetDayOfWeekPreferenceAsync(memberId, eventEntity.EventDateTime),
                ["timeOfDayPreference"] = await GetTimeOfDayPreferenceAsync(memberId, eventEntity.EventDateTime)
            };

            // Calculate weighted probability
            var weights = new Dictionary<string, decimal>
            {
                ["overallEngagement"] = 0.25m,
                ["eventEngagement"] = 0.30m,
                ["historicalAttendanceRate"] = 0.25m,
                ["dayOfWeekPreference"] = 0.10m,
                ["timeOfDayPreference"] = 0.10m
            };

            var attendanceProbability = 0m;
            var influencingFactors = new List<string>();
            var factorWeights = new Dictionary<string, decimal>();

            foreach (var factor in factors)
            {
                var normalizedValue = Math.Min(100m, Math.Max(0m, factor.Value)) / 100m;
                var weightedValue = normalizedValue * weights[factor.Key];
                attendanceProbability += weightedValue;

                factorWeights[factor.Key] = weights[factor.Key];

                if (normalizedValue > 0.7m)
                {
                    influencingFactors.Add($"High {factor.Key.Replace("([A-Z])", " $1").ToLower()}");
                }
                else if (normalizedValue < 0.3m)
                {
                    influencingFactors.Add($"Low {factor.Key.Replace("([A-Z])", " $1").ToLower()}");
                }
            }

            // Convert to percentage and determine confidence
            attendanceProbability = Math.Min(1m, Math.Max(0m, attendanceProbability)) * 100m;

            string predictionConfidence;
            if (attendanceProbability > 80m || attendanceProbability < 20m)
                predictionConfidence = "High";
            else if (attendanceProbability > 60m || attendanceProbability < 40m)
                predictionConfidence = "Medium";
            else
                predictionConfidence = "Low";

            return new EventAttendancePrediction
            {
                EventId = eventId,
                MemberId = memberId,
                AttendanceProbability = Math.Round(attendanceProbability, 2),
                PredictionConfidence = predictionConfidence,
                InfluencingFactors = influencingFactors,
                FactorWeights = factorWeights
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error predicting event attendance for member {MemberId} at event {EventId}", memberId, eventId);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<EventTimingRecommendations> GetOptimalEventTimingsAsync(int clubId)
    {
        // Get historical event data
        var events = await _context.Events
            .Where(e => e.ClubId == clubId && e.EventDateTime <= DateTime.UtcNow)
            .ToListAsync();

        var dayPreferences = new Dictionary<DayOfWeek, decimal>();
        var hourPreferences = new Dictionary<int, decimal>();
        var optimalTimeSlots = new List<OptimalTimeSlot>();

        // Analyze attendance patterns by day and time
        foreach (var eventEntity in events)
        {
            var attendanceCount = await _context.EventAttendances
                .CountAsync(a => a.EventId == eventEntity.Id);

            var dayOfWeek = eventEntity.EventDateTime.DayOfWeek;
            var hour = eventEntity.EventDateTime.Hour;

            if (!dayPreferences.ContainsKey(dayOfWeek))
                dayPreferences[dayOfWeek] = 0;
            if (!hourPreferences.ContainsKey(hour))
                hourPreferences[hour] = 0;

            dayPreferences[dayOfWeek] += attendanceCount;
            hourPreferences[hour] += attendanceCount;
        }

        // Normalize preferences
        var maxDayAttendance = dayPreferences.Values.DefaultIfEmpty(1).Max();
        var maxHourAttendance = hourPreferences.Values.DefaultIfEmpty(1).Max();

        foreach (var day in dayPreferences.Keys.ToList())
        {
            dayPreferences[day] = Math.Round((dayPreferences[day] / maxDayAttendance) * 100, 2);
        }

        foreach (var hour in hourPreferences.Keys.ToList())
        {
            hourPreferences[hour] = Math.Round((hourPreferences[hour] / maxHourAttendance) * 100, 2);
        }

        return new EventTimingRecommendations
        {
            ClubId = clubId,
            OptimalTimeSlots = optimalTimeSlots,
            DayPreferences = dayPreferences,
            HourPreferences = hourPreferences,
            RecommendedFrequency = "Weekly" // Simplified recommendation
        };
    }

    #endregion

    #region Real-time Updates

    /// <inheritdoc />
    public async Task<MemberEngagementScore> UpdateEngagementAfterEventActivityAsync(int memberId, string eventActivityType, int eventId, object? metadata = null)
    {
        try
        {
            _logger.LogInformation("Updating engagement for member {MemberId} after {EventActivityType} for event {EventId}",
                memberId, eventActivityType, eventId);

            // Calculate activity score impact
            var activityScore = _engagementScoringService.CalculateActivityScore(eventActivityType, metadata);

            // Update the member's engagement score
            var updatedScore = await _memberEngagementService.UpdateEngagementOnActivity(
                memberId,
                eventActivityType,
                new { eventId, activityScore, metadata }
            );

            _logger.LogInformation("Updated engagement score for member {MemberId} after {EventActivityType}",
                memberId, eventActivityType);
            return updatedScore;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating engagement after event activity for member {MemberId}", memberId);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<BatchUpdateResult> ProcessBatchEventEngagementUpdatesAsync(List<EventEngagementUpdate> updates)
    {
        var result = new BatchUpdateResult
        {
            TotalProcessed = updates.Count,
            SuccessfulUpdates = 0,
            FailedUpdates = 0,
            Errors = new List<string>(),
            ProcessedAt = DateTime.UtcNow
        };

        foreach (var update in updates)
        {
            try
            {
                await UpdateEngagementAfterEventActivityAsync(
                    update.MemberId,
                    update.ActivityType,
                    update.EventId,
                    update.Metadata
                );
                result.SuccessfulUpdates++;
            }
            catch (Exception ex)
            {
                result.FailedUpdates++;
                result.Errors.Add($"Member {update.MemberId}: {ex.Message}");
                _logger.LogError(ex, "Failed to process batch update for member {MemberId}", update.MemberId);
            }
        }

        return result;
    }

    #endregion

    #region Private Helper Methods

    private decimal CalculateEventEngagementLevel(decimal rsvpRate, decimal attendanceRate)
    {
        const decimal rsvpWeight = 0.4m;
        const decimal attendanceWeight = 0.6m;
        return (rsvpRate * rsvpWeight) + (attendanceRate * attendanceWeight);
    }

    private string DetermineEventEngagementLevel(decimal score)
    {
        return score switch
        {
            >= 70 => "Green",
            >= 40 => "Yellow",
            _ => "Red"
        };
    }

    private async Task<MemberEngagementHistory?> GetMemberEngagementScoreBeforeDateAsync(int memberId, DateTime date)
    {
        return await _context.MemberEngagementHistories
            .Where(h => h.MemberId == memberId && h.RecordedAt < date)
            .OrderByDescending(h => h.RecordedAt)
            .FirstOrDefaultAsync();
    }

    private async Task<MemberEngagementHistory?> GetMemberEngagementScoreAfterDateAsync(int memberId, DateTime date)
    {
        var afterDate = date.AddDays(7); // Look 7 days after event

        return await _context.MemberEngagementHistories
            .Where(h => h.MemberId == memberId && h.RecordedAt >= date && h.RecordedAt <= afterDate)
            .OrderBy(h => h.RecordedAt)
            .FirstOrDefaultAsync();
    }

    private decimal CalculateHistoricalAttendanceRate(List<EventAttendance> attendanceHistory)
    {
        if (attendanceHistory.Count == 0) return 0;

        // Simplified calculation - in reality, you'd compare against total invitations
        return Math.Min(100m, attendanceHistory.Count * 10m);
    }

    private decimal CalculateTrendDirection(List<DailyEventEngagement> dailyData)
    {
        if (dailyData.Count < 2) return 0;

        var n = dailyData.Count;
        var sumX = 0m;
        var sumY = 0m;
        var sumXY = 0m;
        var sumXX = 0m;

        for (int i = 0; i < dailyData.Count; i++)
        {
            var x = i;
            var y = dailyData[i].AverageEngagementScore;

            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }

        if (n * sumXX - sumX * sumX == 0) return 0;

        var slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    private async Task<Dictionary<string, decimal>> AnalyzeMemberTypeBreakdownAsync(int eventId, List<EventRsvp> rsvps, List<EventAttendance> attendances)
    {
        // Simplified implementation - could be expanded based on membership types
        var breakdown = new Dictionary<string, decimal>
        {
            ["RSVPs"] = rsvps.Count,
            ["Attendances"] = attendances.Count
        };

        return breakdown;
    }

    private async Task<List<string>> IdentifyTopEngagementFactorsAsync(int eventId)
    {
        // Simplified implementation - could analyze various factors like timing, weather, etc.
        return new List<string> { "High member interest", "Optimal timing", "Clear communication" };
    }

    private async Task<List<MemberEventEngagement>> GetEventMemberEngagementAsync(int eventId)
    {
        var eventEntity = await _context.Events.FindAsync(eventId);
        if (eventEntity == null) return new List<MemberEventEngagement>();

        var members = await _context.Members
            .Where(m => m.ClubId == eventEntity.ClubId && m.Status == "Active")
            .ToListAsync();

        var memberEngagements = new List<MemberEventEngagement>();

        foreach (var member in members)
        {
            var eventScore = await CalculateMemberEventScoreAsync(member.Id, 90);
            var memberEngagement = await CreateMemberEventEngagementAsync(member, eventScore, 90);
            memberEngagements.Add(memberEngagement);
        }

        return memberEngagements;
    }

    private async Task<MemberEventEngagement> CreateMemberEventEngagementAsync(Member member, decimal eventScore, int daysBack)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysBack);

        var eventsInvited = await _context.Events
            .CountAsync(e => e.ClubId == member.ClubId && e.EventDateTime >= cutoffDate);

        var eventsRsvped = await _context.EventRsvps
            .CountAsync(r => r.MemberId == member.Id && r.Event.EventDateTime >= cutoffDate);

        var eventsAttended = await _context.EventAttendances
            .CountAsync(a => a.MemberId == member.Id && a.AttendedAt >= cutoffDate);

        var lastAttendance = await _context.EventAttendances
            .Where(a => a.MemberId == member.Id)
            .OrderByDescending(a => a.AttendedAt)
            .Select(a => a.AttendedAt)
            .FirstOrDefaultAsync();

        var engagementLevel = eventScore >= 70 ? EngagementLevel.Green :
                             eventScore >= 40 ? EngagementLevel.Yellow :
                             EngagementLevel.Red;

        return new MemberEventEngagement
        {
            MemberId = member.Id,
            MemberName = member.FullName,
            Email = member.Email,
            EventsInvited = eventsInvited,
            EventsRsvped = eventsRsvped,
            EventsAttended = eventsAttended,
            EventEngagementScore = eventScore,
            EngagementLevel = engagementLevel,
            LastEventAttendance = lastAttendance,
            PreferredEventTypes = new List<string>() // Could be expanded with preference analysis
        };
    }

    private async Task<decimal> CalculateEventRecommendationScoreAsync(int memberId, Event eventEntity, List<EventAttendance> memberEventHistory, MemberEngagementScore? memberEngagement)
    {
        // Simplified scoring algorithm
        var baseScore = 50m;

        // Boost for high overall engagement
        if (memberEngagement?.OverallScore > 70)
            baseScore += 20m;
        else if (memberEngagement?.OverallScore > 40)
            baseScore += 10m;

        // Boost for high event engagement
        if (memberEngagement?.EventScore > 70)
            baseScore += 15m;

        // Boost for recent attendance
        var recentAttendance = memberEventHistory.Count(a => a.AttendedAt >= DateTime.UtcNow.AddDays(-30));
        baseScore += Math.Min(15m, recentAttendance * 5m);

        return Math.Min(100m, baseScore);
    }

    private async Task<List<string>> GenerateRecommendationReasonsAsync(int memberId, Event eventEntity, List<EventAttendance> memberEventHistory, decimal recommendationScore)
    {
        var reasons = new List<string>();

        if (recommendationScore > 80)
            reasons.Add("Strong match based on your engagement history");
        else if (recommendationScore > 60)
            reasons.Add("Good fit for your interests");

        if (memberEventHistory.Count > 0)
            reasons.Add("You have attended similar events recently");

        return reasons;
    }

    private async Task<decimal> GetDayOfWeekPreferenceAsync(int memberId, DateTime eventDateTime)
    {
        var dayOfWeek = eventDateTime.DayOfWeek;
        var historicalAttendance = await _context.EventAttendances
            .Include(a => a.Event)
            .Where(a => a.MemberId == memberId && a.Event.EventDateTime.DayOfWeek == dayOfWeek)
            .CountAsync();

        return Math.Min(100m, historicalAttendance * 20m);
    }

    private async Task<decimal> GetTimeOfDayPreferenceAsync(int memberId, DateTime eventDateTime)
    {
        var hour = eventDateTime.Hour;
        var historicalAttendance = await _context.EventAttendances
            .Include(a => a.Event)
            .Where(a => a.MemberId == memberId && a.Event.EventDateTime.Hour == hour)
            .CountAsync();

        return Math.Min(100m, historicalAttendance * 25m);
    }

    #endregion
}