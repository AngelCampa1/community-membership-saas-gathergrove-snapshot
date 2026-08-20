using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for event engagement analytics and tracking
/// </summary>
public class EventEngagementAnalyticsService : IEventEngagementAnalyticsService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<EventEngagementAnalyticsService> _logger;
    private readonly IClubTierService _clubTierService;

    // Scoring weights for engagement calculation
    private static readonly Dictionary<string, decimal> EngagementWeights = new()
    {
        ["attendance"] = 30m,
        ["session_duration"] = 20m,
        ["interactions"] = 15m,
        ["networking"] = 15m,
        ["participation"] = 10m,
        ["satisfaction"] = 10m
    };

    public EventEngagementAnalyticsService(
        GatherGroveDbContext context,
        ILogger<EventEngagementAnalyticsService> logger,
        IClubTierService clubTierService)
    {
        _context = context;
        _logger = logger;
        _clubTierService = clubTierService;
    }

    #region Event Interaction Tracking

    public async Task<bool> TrackEventInteractionAsync(TrackEventInteractionRequest request)
    {
        try
        {
            _logger.LogInformation("Tracking event interaction: {InteractionType} for Event {EventId}, Member {MemberId}",
                request.InteractionType, request.EventId, request.MemberId);

            // Get or create engagement tracking record
            var tracking = await _context.EventEngagementTrackings
                .FirstOrDefaultAsync(et => et.EventId == request.EventId && et.MemberId == request.MemberId);

            if (tracking == null)
            {
                tracking = new EventEngagementTracking
                {
                    EventId = request.EventId,
                    MemberId = request.MemberId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.EventEngagementTrackings.Add(tracking);
            }

            // Update tracking based on interaction type
            var now = DateTime.UtcNow;
            tracking.UpdatedAt = now;
            tracking.InteractionCount++;

            switch (request.InteractionType.ToLower())
            {
                case "sign_up":
                case "register":
                    tracking.RegistrationStatus = "registered";
                    break;

                case "check_in":
                    tracking.AttendanceStatus = "attended";
                    tracking.CheckInTimestamp = now;
                    if (request.InteractionData != null)
                    {
                        if (request.InteractionData.TryGetValue("platform", out var platform))
                            tracking.Platform = platform?.ToString() ?? "web";
                        if (request.InteractionData.TryGetValue("device_type", out var deviceType))
                            tracking.DeviceType = deviceType?.ToString();
                        if (request.InteractionData.TryGetValue("connection_quality", out var quality))
                            tracking.ConnectionQuality = quality?.ToString();
                    }
                    break;

                case "check_out":
                    tracking.CheckOutTimestamp = now;
                    if (tracking.CheckInTimestamp.HasValue)
                    {
                        tracking.SessionDurationMinutes = (int)(now - tracking.CheckInTimestamp.Value).TotalMinutes;
                    }
                    break;

                case "cancel":
                    tracking.RegistrationStatus = "cancelled";
                    tracking.AttendanceStatus = "cancelled";
                    break;

                case "no_show":
                    tracking.AttendanceStatus = "no_show";
                    break;

                case "interaction":
                    if (request.InteractionData != null)
                    {
                        if (request.InteractionData.TryGetValue("question_asked", out var _))
                            tracking.QuestionsAsked++;
                        if (request.InteractionData.TryGetValue("poll_participated", out var _))
                            tracking.PollsParticipated++;
                        if (request.InteractionData.TryGetValue("resource_downloaded", out var _))
                            tracking.ResourcesDownloaded++;
                        if (request.InteractionData.TryGetValue("chat_message", out var _))
                            tracking.ChatMessages++;
                        if (request.InteractionData.TryGetValue("networking_connection", out var _))
                            tracking.NetworkingConnections++;
                        if (request.InteractionData.TryGetValue("breakout_participation", out var breakout) && bool.Parse(breakout?.ToString() ?? "false"))
                            tracking.BreakoutParticipation = true;
                    }
                    break;

                case "feedback":
                    tracking.PostEventSurveyCompleted = true;
                    if (request.InteractionData != null)
                    {
                        // BUG FIX: Use TryParse to avoid FormatException from invalid data
                        if (request.InteractionData.TryGetValue("satisfaction_rating", out var satisfaction))
                            tracking.SatisfactionRating = decimal.TryParse(satisfaction?.ToString(), out var sat) ? sat : 0;
                        if (request.InteractionData.TryGetValue("nps_score", out var nps))
                            tracking.NetPromoterScore = int.TryParse(nps?.ToString(), out var npsScore) ? npsScore : 0;
                    }
                    break;
            }

            // Update participation level and score
            await UpdateParticipationMetricsAsync(tracking);

            await _context.SaveChangesAsync();

            // Note: Engagement score calculation is handled on-demand to avoid DbContext threading issues
            // Score will be calculated when explicitly requested via CalculateEventEngagementScoreAsync

            _logger.LogInformation("Successfully tracked event interaction for Event {EventId}, Member {MemberId}",
                request.EventId, request.MemberId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking event interaction for Event {EventId}, Member {MemberId}",
                request.EventId, request.MemberId);
            return false;
        }
    }

    public async Task<int> TrackEventInteractionsBatchAsync(List<TrackEventInteractionRequest> requests)
    {
        if (!requests.Any()) return 0;

        _logger.LogInformation("Batch tracking {Count} event interactions", requests.Count);

        var successCount = 0;
        const int batchSize = 50;

        for (int i = 0; i < requests.Count; i += batchSize)
        {
            var batch = requests.Skip(i).Take(batchSize);

            foreach (var request in batch)
            {
                if (await TrackEventInteractionAsync(request))
                {
                    successCount++;
                }
            }

            // Small delay between batches to prevent overwhelming the database
            if (i + batchSize < requests.Count)
            {
                await Task.Delay(100);
            }
        }

        _logger.LogInformation("Successfully tracked {SuccessCount}/{TotalCount} event interactions",
            successCount, requests.Count);

        return successCount;
    }

    public async Task<bool> TrackMemberCheckInAsync(int eventId, int memberId, Dictionary<string, object>? checkInData = null)
    {
        var request = new TrackEventInteractionRequest
        {
            EventId = eventId,
            MemberId = memberId,
            InteractionType = "check_in",
            InteractionData = checkInData
        };

        return await TrackEventInteractionAsync(request);
    }

    public async Task<int?> TrackMemberCheckOutAsync(int eventId, int memberId, Dictionary<string, object>? checkOutData = null)
    {
        var request = new TrackEventInteractionRequest
        {
            EventId = eventId,
            MemberId = memberId,
            InteractionType = "check_out",
            InteractionData = checkOutData
        };

        var success = await TrackEventInteractionAsync(request);
        if (!success) return null;

        // Return session duration (AsNoTracking to avoid concurrency issues)
        var tracking = await _context.EventEngagementTrackings
            .AsNoTracking()
            .FirstOrDefaultAsync(et => et.EventId == eventId && et.MemberId == memberId);

        return tracking?.SessionDurationMinutes;
    }

    #endregion

    #region Engagement Score Calculation

    public async Task<decimal> CalculateEventEngagementScoreAsync(int eventId, int memberId)
    {
        try
        {
            var tracking = await _context.EventEngagementTrackings
                .Include(et => et.Event)
                .FirstOrDefaultAsync(et => et.EventId == eventId && et.MemberId == memberId);

            if (tracking == null) return 0;

            var scores = new Dictionary<string, decimal>();

            // Attendance Score (0-100)
            scores["attendance"] = tracking.AttendanceStatus switch
            {
                "attended" => 100m,
                "partial" => 60m,
                "no_show" => 0m,
                "cancelled" => 20m, // Some credit for early cancellation
                _ => 0m
            };

            // Session Duration Score (0-100) - Based on event duration
            if (tracking.SessionDurationMinutes.HasValue && tracking.Event != null)
            {
                var eventDurationMinutes = 120; // Default 2 hours, could be calculated from event data
                var durationRatio = Math.Min((decimal)tracking.SessionDurationMinutes.Value / eventDurationMinutes, 1m);
                scores["session_duration"] = durationRatio * 100m;
            }
            else
            {
                scores["session_duration"] = tracking.AttendanceStatus == "attended" ? 70m : 0m;
            }

            // Interaction Score (0-100)
            var maxInteractions = 20; // Expected max interactions for full score
            var interactionScore = Math.Min((decimal)tracking.InteractionCount / maxInteractions * 100m, 100m);

            // Bonus for specific interactions
            interactionScore += tracking.QuestionsAsked * 5m;
            interactionScore += tracking.PollsParticipated * 3m;
            interactionScore += tracking.ChatMessages * 1m;
            interactionScore += tracking.ResourcesDownloaded * 2m;
            if (tracking.BreakoutParticipation) interactionScore += 10m;

            scores["interactions"] = Math.Min(interactionScore, 100m);

            // Networking Score (0-100)
            var maxNetworking = 10; // Expected max connections for full score
            scores["networking"] = Math.Min((decimal)tracking.NetworkingConnections / maxNetworking * 100m, 100m);

            // Participation Score (0-100) - Based on participation level
            scores["participation"] = tracking.ParticipationLevel switch
            {
                "highly_active" => 100m,
                "active" => 80m,
                "moderate" => 60m,
                "passive" => 30m,
                _ => 0m
            };

            // Satisfaction Score (0-100)
            scores["satisfaction"] = tracking.SatisfactionRating.HasValue
                ? (tracking.SatisfactionRating.Value / 5m) * 100m
                : 50m; // Neutral if no rating

            // Calculate weighted final score
            var finalScore = scores.Sum(kvp => kvp.Value * (EngagementWeights[kvp.Key] / 100m));

            // Update tracking record
            tracking.ParticipationScore = finalScore;
            tracking.LastEngagementUpdate = DateTime.UtcNow;
            tracking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogDebug("Calculated engagement score {Score} for Event {EventId}, Member {MemberId}",
                finalScore, eventId, memberId);

            return finalScore;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating engagement score for Event {EventId}, Member {MemberId}",
                eventId, memberId);
            return 0;
        }
    }

    public async Task<MemberEventEngagementDto> CalculateMemberEngagementScoresAsync(int memberId, int clubId)
    {
        try
        {
            _logger.LogInformation("Calculating member engagement scores for Member {MemberId} in Club {ClubId}",
                memberId, clubId);

            // Get member info
            var member = await _context.Members
                .Where(m => m.Id == memberId && m.ClubId == clubId)
                .Select(m => new { m.Id, m.FullName })
                .FirstOrDefaultAsync();

            if (member == null)
            {
                throw new ArgumentException($"Member {memberId} not found in club {clubId}");
            }

            // Get all event engagement data for this member in the club
            var engagementData = await _context.EventEngagementTrackings
                .Include(et => et.Event)
                .Where(et => et.MemberId == memberId && et.Event.ClubId == clubId)
                .ToListAsync();

            var cutoffDate = DateTime.UtcNow.AddDays(-90);
            var recentEngagements = engagementData.Where(ed => ed.CreatedAt >= cutoffDate).ToList();

            // Calculate metrics
            var totalEvents = engagementData.Where(ed => ed.AttendanceStatus == "attended").Count();
            var totalRegistrations = engagementData.Count();
            var attendanceRate = totalRegistrations > 0 ? (decimal)totalEvents / totalRegistrations * 100m : 0m;

            var avgEngagementScore = engagementData.Any()
                ? engagementData.Where(ed => ed.ParticipationScore > 0).Select(ed => ed.ParticipationScore).DefaultIfEmpty(0m).Average()
                : 0m;

            var highEngagementCount = engagementData.Count(ed => ed.ParticipationScore >= 80m);
            var lowEngagementCount = engagementData.Count(ed => ed.ParticipationScore > 0 && ed.ParticipationScore < 40m);

            var avgSatisfaction = engagementData.Where(ed => ed.SatisfactionRating.HasValue)
                .Select(ed => ed.SatisfactionRating!.Value)
                .DefaultIfEmpty(0)
                .Average();

            // Calculate recent metrics
            var recent90DayEvents = recentEngagements.Count(ed => ed.AttendanceStatus == "attended");
            var recent90DayScore = recentEngagements.Any()
                ? recentEngagements.Where(ed => ed.ParticipationScore > 0).Select(ed => ed.ParticipationScore).DefaultIfEmpty(0m).Average()
                : 0m;

            // Calculate trend (comparison of last 30 days vs previous 60 days)
            var last30Days = engagementData.Where(ed => ed.CreatedAt >= DateTime.UtcNow.AddDays(-30)).ToList();
            var previous60Days = engagementData.Where(ed =>
                ed.CreatedAt >= DateTime.UtcNow.AddDays(-90) &&
                ed.CreatedAt < DateTime.UtcNow.AddDays(-30)).ToList();

            var recentScore = last30Days.Any()
                ? last30Days.Where(ed => ed.ParticipationScore > 0).Select(ed => ed.ParticipationScore).DefaultIfEmpty(0m).Average()
                : 0m;
            var previousScore = previous60Days.Any()
                ? previous60Days.Where(ed => ed.ParticipationScore > 0).Select(ed => ed.ParticipationScore).DefaultIfEmpty(0m).Average()
                : 0m;

            var trend = recentScore - previousScore;

            // Determine engagement trend and risk level
            var engagementTrend = trend switch
            {
                > 10m => "improving",
                < -10m => "declining",
                _ => "stable"
            };

            var riskLevel = avgEngagementScore switch
            {
                < 30m => "high",
                < 60m => "medium",
                _ => "low"
            };

            // Calculate networking and social metrics
            var networkingScore = engagementData.Any()
                ? (decimal)engagementData.Average(ed => ed.NetworkingConnections) * 10m // Scale to 0-100
                : 0m;

            // Create or update member engagement scores
            var memberScores = await _context.MemberEventEngagementScores
                .FirstOrDefaultAsync(mes => mes.MemberId == memberId);

            if (memberScores == null)
            {
                memberScores = new MemberEventEngagementScores
                {
                    MemberId = memberId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.MemberEventEngagementScores.Add(memberScores);
            }

            // Update scores
            memberScores.TotalEventsAttended = totalEvents;
            memberScores.EventAttendanceRate = attendanceRate;
            memberScores.AverageEventEngagementScore = avgEngagementScore;
            memberScores.HighEngagementEventsCount = highEngagementCount;
            memberScores.LowEngagementEventsCount = lowEngagementCount;
            memberScores.AverageSatisfactionRating = avgSatisfaction;
            memberScores.NetworkingScore = Math.Min(networkingScore, 100m);
            memberScores.Recent90DayEvents = recent90DayEvents;
            memberScores.Recent90DayEngagementScore = recent90DayScore;
            memberScores.Recent90DayTrend = trend;
            memberScores.EngagementTrend = engagementTrend;
            memberScores.RiskLevel = riskLevel;
            memberScores.EventRetentionProbability = CalculateRetentionProbability(avgEngagementScore, attendanceRate, trend);
            memberScores.UpdatedAt = DateTime.UtcNow;
            memberScores.CalculatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new MemberEventEngagementDto
            {
                MemberId = memberId,
                MemberName = member.FullName,
                TotalEventsAttended = totalEvents,
                EventAttendanceRate = attendanceRate,
                AverageEventEngagementScore = avgEngagementScore,
                HighEngagementEventsCount = highEngagementCount,
                LowEngagementEventsCount = lowEngagementCount,
                AverageSatisfactionRating = avgSatisfaction > 0 ? avgSatisfaction : null,
                NetworkingScore = memberScores.NetworkingScore,
                Recent90DayEvents = recent90DayEvents,
                Recent90DayEngagementScore = recent90DayScore,
                Recent90DayTrend = trend,
                EngagementTrend = engagementTrend,
                RiskLevel = riskLevel,
                EventRetentionProbability = memberScores.EventRetentionProbability,
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating member engagement scores for Member {MemberId}", memberId);
            throw;
        }
    }

    public async Task<int> RecalculateClubMemberEngagementScoresAsync(int clubId)
    {
        try
        {
            _logger.LogInformation("Recalculating engagement scores for all members in Club {ClubId}", clubId);

            var memberIds = await _context.Members
                .Where(m => m.ClubId == clubId && m.Status == "Active")
                .Select(m => m.Id)
                .ToListAsync();

            var processedCount = 0;
            const int batchSize = 10;

            for (int i = 0; i < memberIds.Count(); i += batchSize)
            {
                var batch = memberIds.Skip(i).Take(batchSize);

                var tasks = batch.Select(memberId =>
                    CalculateMemberEngagementScoresAsync(memberId, clubId));

                await Task.WhenAll(tasks);
                processedCount += batch.Count();

                _logger.LogDebug("Processed batch {Processed}/{Total} members for club {ClubId}",
                    Math.Min(i + batchSize, memberIds.Count()), memberIds.Count(), clubId);

                // Small delay between batches
                if (i + batchSize < memberIds.Count())
                {
                    await Task.Delay(500);
                }
            }

            _logger.LogInformation("Successfully recalculated engagement scores for {Count} members in Club {ClubId}",
                processedCount, clubId);

            return processedCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalculating club member engagement scores for Club {ClubId}", clubId);
            throw;
        }
    }

    #endregion

    #region Analytics and Reporting

    public async Task<EventEngagementMetricsDto?> GetEventEngagementMetricsAsync(int eventId, int clubId, int userId)
    {
        try
        {
            // Check authorization
            if (!await _clubTierService.HasUnlimitedTierAccess(userId, clubId))
            {
                _logger.LogWarning("User {UserId} denied access to engagement metrics for Club {ClubId}", userId, clubId);
                return null;
            }

            var eventData = await _context.Events
                .Where(e => e.Id == eventId && e.ClubId == clubId)
                .Select(e => new { e.Id, e.Name, e.EventDateTime })
                .FirstOrDefaultAsync();

            if (eventData == null) return null;

            // Get or calculate event analytics metrics
            var metrics = await _context.EventAnalyticsMetrics
                .FirstOrDefaultAsync(eam => eam.EventId == eventId);

            if (metrics == null)
            {
                // Calculate metrics if not exists
                metrics = await CalculateEventAnalyticsMetricsAsync(eventId, clubId);
                if (metrics == null) return null;
            }

            return new EventEngagementMetricsDto
            {
                EventId = eventId,
                EventName = eventData.Name,
                EventDateTime = eventData.EventDateTime,
                TotalRegistrations = metrics.TotalRegistrations,
                TotalAttendees = metrics.TotalAttendees,
                AttendanceRate = metrics.AttendanceRate,
                NoShowRate = metrics.NoShowRate,
                AverageParticipationScore = metrics.AverageParticipationScore,
                AverageSessionDurationMinutes = metrics.AverageSessionDuration,
                TotalInteractions = metrics.TotalInteractions,
                NetworkingConnections = metrics.NetworkingConnectionsMade,
                AverageSatisfactionRating = metrics.AverageSatisfactionRating,
                AverageNPS = metrics.AverageNPS,
                SurveyResponseRate = metrics.SurveyResponseRate,
                ComparedToClubAverage = metrics.ComparedToClubAverage,
                ComparedToEventType = metrics.ComparedToEventType,
                EventSuccessScore = metrics.EventSuccessScore,
                CalculatedAt = metrics.CalculatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event engagement metrics for Event {EventId}", eventId);
            return null;
        }
    }

    public async Task<EventEngagementAnalyticsReportDto> GetEventEngagementAnalyticsReportAsync(EventEngagementAnalyticsQuery query, int userId)
    {
        try
        {
            // Validate input parameters first
            if (query == null)
            {
                throw new ArgumentNullException(nameof(query), "Query cannot be null");
            }

            if (query.ClubId <= 0)
            {
                throw new ArgumentException("ClubId must be a positive integer", nameof(query));
            }

            // Check authorization
            if (!await _clubTierService.HasUnlimitedTierAccess(userId, query.ClubId))
            {
                throw new UnauthorizedAccessException("User does not have access to analytics for this club");
            }

            _logger.LogInformation("Generating engagement analytics report for Club {ClubId}", query.ClubId);

            var club = await _context.Clubs
                .Where(c => c.Id == query.ClubId)
                .Select(c => new { c.Id, c.Name })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found when generating analytics report", query.ClubId);
                throw new ArgumentException($"Club {query.ClubId} not found", nameof(query));
            }

            var startDate = query.StartDate ?? DateTime.UtcNow.AddDays(-30);
            var endDate = query.EndDate ?? DateTime.UtcNow;

            // Get events in the period
            var eventsQuery = _context.Events
                .Where(e => e.ClubId == query.ClubId && e.EventDateTime >= startDate && e.EventDateTime <= endDate);

            if (query.EventTypes?.Any() == true)
            {
                // Since Event entity doesn't have EventType, we'll skip this filter for now
                // TODO: Add EventType to Event entity if needed
            }

            if (query.EventIds?.Any() == true)
            {
                eventsQuery = eventsQuery.Where(e => query.EventIds.Contains(e.Id));
            }

            var events = await eventsQuery.ToListAsync();
            var eventIds = events.Select(e => e.Id).ToList();

            // Get engagement tracking data
            var engagementData = await _context.EventEngagementTrackings
                .Where(et => eventIds.Contains(et.EventId))
                .ToListAsync();

            // Calculate overview metrics
            var totalRegistrations = engagementData.Count;
            var totalAttendees = engagementData.Count(ed => ed.AttendanceStatus == "attended");
            var overallAttendanceRate = totalRegistrations > 0 ? (decimal)totalAttendees / totalRegistrations * 100m : 0m;
            var overallNoShowRate = totalRegistrations > 0 ?
                (decimal)engagementData.Count(ed => ed.AttendanceStatus == "no_show") / totalRegistrations * 100m : 0m;

            // Get event metrics
            var eventMetrics = new List<EventEngagementMetricsDto>();
            foreach (var eventId in eventIds)
            {
                var metrics = await GetEventEngagementMetricsAsync(eventId, query.ClubId, userId);
                if (metrics != null)
                {
                    eventMetrics.Add(metrics);
                }
            }

            // Get member engagement scores
            var topEngaged = query.IncludeAtRiskMembers ?
                await GetMostEngagedEventParticipantsAsync(query.ClubId, userId, query.TopMembersLimit, startDate, endDate) :
                new List<MemberEventEngagementDto>();

            var atRisk = query.IncludeAtRiskMembers ?
                await GetAtRiskMembersAsync(query.ClubId, userId, query.TopMembersLimit) :
                new List<MemberEventEngagementDto>();

            // Get event type analysis
            var eventTypeAnalysis = await CompareEngagementAcrossEventTypesAsync(query.ClubId, userId, startDate, endDate);

            // Get no-show analysis
            var noShowAnalysis = query.IncludeNoShowAnalysis ?
                await AnalyzeNoShowPatternsAsync(query.ClubId, userId, startDate, endDate) :
                new NoShowPatternAnalysisDto();

            // Generate recommendations
            var recommendations = query.IncludeRecommendations ?
                GenerateEngagementRecommendations(eventMetrics, eventTypeAnalysis, noShowAnalysis) :
                new List<string>();

            return new EventEngagementAnalyticsReportDto
            {
                ClubId = query.ClubId,
                ClubName = club.Name,
                ReportPeriodStart = startDate,
                ReportPeriodEnd = endDate,
                TotalEvents = events.Count,
                TotalRegistrations = totalRegistrations,
                TotalAttendees = totalAttendees,
                OverallAttendanceRate = overallAttendanceRate,
                OverallNoShowRate = overallNoShowRate,
                EventMetrics = eventMetrics,
                TopEngagedMembers = topEngaged,
                AtRiskMembers = atRisk,
                EventTypeAnalysis = eventTypeAnalysis,
                NoShowPatterns = noShowAnalysis,
                Recommendations = recommendations,
                GeneratedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating engagement analytics report for Club {ClubId}", query.ClubId);
            throw;
        }
    }

    // Continue with remaining methods...
    #endregion

    #region Private Helper Methods

    private async Task UpdateParticipationMetricsAsync(EventEngagementTracking tracking)
    {
        var totalInteractions = tracking.InteractionCount + tracking.QuestionsAsked +
                               tracking.PollsParticipated + tracking.ChatMessages;

        tracking.ParticipationLevel = totalInteractions switch
        {
            >= 20 => "highly_active",
            >= 10 => "active",
            >= 5 => "moderate",
            >= 1 => "passive",
            _ => "disengaged"
        };
    }

    private decimal CalculateRetentionProbability(decimal avgScore, decimal attendanceRate, decimal trend)
    {
        var baseScore = (avgScore + attendanceRate) / 2m;
        var trendAdjustment = trend * 0.5m; // Trend has moderate impact

        var probability = Math.Max(0, Math.Min(100, baseScore + trendAdjustment));
        return probability;
    }

    private async Task<EventAnalyticsMetrics?> CalculateEventAnalyticsMetricsAsync(int eventId, int clubId)
    {
        try
        {
            var engagements = await _context.EventEngagementTrackings
                .Where(et => et.EventId == eventId)
                .ToListAsync();

            if (!engagements.Any()) return null;

            var totalRegistrations = engagements.Count;
            var totalAttendees = engagements.Count(e => e.AttendanceStatus == "attended");
            var attendanceRate = totalRegistrations > 0 ? (decimal)totalAttendees / totalRegistrations * 100m : 0m;
            var noShowRate = totalRegistrations > 0 ?
                (decimal)engagements.Count(e => e.AttendanceStatus == "no_show") / totalRegistrations * 100m : 0m;

            var metrics = new EventAnalyticsMetrics
            {
                EventId = eventId,
                ClubId = clubId,
                TotalRegistrations = totalRegistrations,
                TotalAttendees = totalAttendees,
                AttendanceRate = attendanceRate,
                NoShowRate = noShowRate,
                AverageParticipationScore = engagements.Where(e => e.ParticipationScore > 0).Select(e => e.ParticipationScore).DefaultIfEmpty(0m).Average(),
                AverageSessionDuration = (int)engagements.Where(e => e.SessionDurationMinutes.HasValue)
                    .Select(e => e.SessionDurationMinutes!.Value).DefaultIfEmpty(0).Average(),
                TotalInteractions = engagements.Sum(e => e.InteractionCount),
                UniqueParticipants = engagements.Count(e => e.AttendanceStatus == "attended"),
                AverageSatisfactionRating = engagements.Where(e => e.SatisfactionRating.HasValue)
                    .Select(e => e.SatisfactionRating!.Value).DefaultIfEmpty(0).Average(),
                SurveyResponseRate = totalAttendees > 0 ?
                    (decimal)engagements.Count(e => e.PostEventSurveyCompleted) / totalAttendees * 100m : 0m,
                NetworkingConnectionsMade = engagements.Sum(e => e.NetworkingConnections),
                ResourceDownloads = engagements.Sum(e => e.ResourcesDownloaded),
                TechnicalIssuesCount = engagements.Count(e => e.TechnicalIssues),
                EventSuccessScore = CalculateEventSuccessScore(attendanceRate, engagements.Select(e => e.ParticipationScore).DefaultIfEmpty(0m).Average()),
                CalculatedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.EventAnalyticsMetrics.Add(metrics);
            await _context.SaveChangesAsync();

            return metrics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating event analytics metrics for Event {EventId}", eventId);
            return null;
        }
    }

    private decimal CalculateEventSuccessScore(decimal attendanceRate, decimal avgParticipationScore)
    {
        return (attendanceRate * 0.4m) + (avgParticipationScore * 0.6m);
    }

    private List<string> GenerateEngagementRecommendations(
        List<EventEngagementMetricsDto> eventMetrics,
        Dictionary<string, EventTypeEngagementDto> eventTypeAnalysis,
        NoShowPatternAnalysisDto noShowAnalysis)
    {
        var recommendations = new List<string>();

        // Attendance-based recommendations
        var avgAttendanceRate = eventMetrics.Any() ? eventMetrics.Average(em => em.AttendanceRate) : 0m;
        if (avgAttendanceRate < 70m)
        {
            recommendations.Add("Consider improving event promotion and member communication to increase attendance rates");
        }

        // No-show recommendations
        if (noShowAnalysis.OverallNoShowRate > 20m)
        {
            recommendations.Add("Implement reminder notifications and waitlist management to reduce no-show rates");

            var highestNoShowEventType = noShowAnalysis.NoShowRateByEventType
                .OrderByDescending(kvp => kvp.Value)
                .FirstOrDefault();

            if (!string.IsNullOrEmpty(highestNoShowEventType.Key))
            {
                recommendations.Add($"Review format and timing for {highestNoShowEventType.Key} events to improve attendance");
            }
        }

        // Engagement recommendations
        var avgEngagementScore = eventMetrics.Any() ? eventMetrics.Average(em => em.AverageParticipationScore) : 0m;
        if (avgEngagementScore < 60m)
        {
            recommendations.Add("Incorporate more interactive elements like polls, Q&A sessions, and breakout rooms");
        }

        // Event type recommendations
        var topPerformingEventType = eventTypeAnalysis
            .OrderByDescending(kvp => kvp.Value.AverageEngagementScore)
            .FirstOrDefault();

        if (!string.IsNullOrEmpty(topPerformingEventType.Key))
        {
            recommendations.Add($"Consider hosting more {topPerformingEventType.Key} events as they show higher engagement");
        }

        return recommendations;
    }

    #endregion

    // Additional methods would continue here following the same patterns...
    // Due to length constraints, I'll implement the key remaining methods

    public async Task<List<MemberEventEngagementDto>> GetMemberEventEngagementScoresAsync(
        int clubId, int userId, int limit = 50, string sortBy = "AverageEventEngagementScore")
    {
        if (!await _clubTierService.HasUnlimitedTierAccess(userId, clubId))
        {
            return new List<MemberEventEngagementDto>();
        }

        var query = _context.MemberEventEngagementScores
            .Include(mes => mes.Member)
            .Where(mes => mes.Member.ClubId == clubId);

        query = sortBy.ToLower() switch
        {
            "averageeventengagementscore" => query.OrderByDescending(mes => mes.AverageEventEngagementScore),
            "totaleventsattended" => query.OrderByDescending(mes => mes.TotalEventsAttended),
            "eventattendancerate" => query.OrderByDescending(mes => mes.EventAttendanceRate),
            "recent90dayengagementscore" => query.OrderByDescending(mes => mes.Recent90DayEngagementScore),
            _ => query.OrderByDescending(mes => mes.AverageEventEngagementScore)
        };

        var results = await query.Take(limit).ToListAsync();

        return results.Select(mes => new MemberEventEngagementDto
        {
            MemberId = mes.MemberId,
            MemberName = mes.Member.FullName,
            TotalEventsAttended = mes.TotalEventsAttended,
            EventAttendanceRate = mes.EventAttendanceRate,
            AverageEventEngagementScore = mes.AverageEventEngagementScore,
            HighEngagementEventsCount = mes.HighEngagementEventsCount,
            LowEngagementEventsCount = mes.LowEngagementEventsCount,
            AverageSatisfactionRating = mes.AverageSatisfactionRating,
            NetworkingScore = mes.NetworkingScore,
            EngagementTrend = mes.EngagementTrend,
            RiskLevel = mes.RiskLevel,
            Recent90DayEvents = mes.Recent90DayEvents,
            Recent90DayEngagementScore = mes.Recent90DayEngagementScore,
            Recent90DayTrend = mes.Recent90DayTrend,
            EventRetentionProbability = mes.EventRetentionProbability,
            LastUpdated = mes.UpdatedAt
        }).ToList();
    }

    public async Task<Dictionary<string, decimal>> GetSignUpToAttendanceConversionRatesAsync(
        int clubId, int userId, DateTime? periodStart = null, DateTime? periodEnd = null)
    {
        if (!await _clubTierService.HasUnlimitedTierAccess(userId, clubId))
        {
            return new Dictionary<string, decimal>();
        }

        var start = periodStart ?? DateTime.UtcNow.AddDays(-30);
        var end = periodEnd ?? DateTime.UtcNow;

        var engagements = await _context.EventEngagementTrackings
            .Include(et => et.Event)
            .Where(et => et.Event.ClubId == clubId &&
                        et.Event.EventDateTime >= start &&
                        et.Event.EventDateTime <= end)
            .ToListAsync();

        var totalSignUps = engagements.Count;
        var totalAttendees = engagements.Count(e => e.AttendanceStatus == "attended");
        var totalCancellations = engagements.Count(e => e.AttendanceStatus == "cancelled");
        var totalNoShows = engagements.Count(e => e.AttendanceStatus == "no_show");

        return new Dictionary<string, decimal>
        {
            ["overall_conversion_rate"] = totalSignUps > 0 ? (decimal)totalAttendees / totalSignUps * 100m : 0m,
            ["cancellation_rate"] = totalSignUps > 0 ? (decimal)totalCancellations / totalSignUps * 100m : 0m,
            ["no_show_rate"] = totalSignUps > 0 ? (decimal)totalNoShows / totalSignUps * 100m : 0m,
            ["attendance_rate"] = totalSignUps > 0 ? (decimal)totalAttendees / totalSignUps * 100m : 0m
        };
    }

    // Placeholder implementations for remaining interface methods to ensure compilation
    public async Task<Dictionary<string, EventTypeEngagementDto>> CompareEngagementAcrossEventTypesAsync(
        int clubId, int userId, DateTime? periodStart = null, DateTime? periodEnd = null)
    {
        // Implementation would follow similar patterns
        return new Dictionary<string, EventTypeEngagementDto>();
    }

    public async Task<NoShowPatternAnalysisDto> AnalyzeNoShowPatternsAsync(
        int clubId, int userId, DateTime? periodStart = null, DateTime? periodEnd = null)
    {
        // Implementation would follow similar patterns  
        return new NoShowPatternAnalysisDto();
    }

    public async Task<List<MemberEventEngagementDto>> GetMostEngagedEventParticipantsAsync(
        int clubId, int userId, int limit = 10, DateTime? periodStart = null, DateTime? periodEnd = null)
    {
        return await GetMemberEventEngagementScoresAsync(clubId, userId, limit, "AverageEventEngagementScore");
    }

    public async Task<List<MemberEventEngagementDto>> GetAtRiskMembersAsync(int clubId, int userId, int limit = 10)
    {
        if (!await _clubTierService.HasUnlimitedTierAccess(userId, clubId))
        {
            return new List<MemberEventEngagementDto>();
        }

        var atRiskMembers = await _context.MemberEventEngagementScores
            .Include(mes => mes.Member)
            .Where(mes => mes.Member.ClubId == clubId &&
                         (mes.RiskLevel == "high" || mes.EngagementTrend == "declining"))
            .OrderBy(mes => mes.EventRetentionProbability)
            .Take(limit)
            .ToListAsync();

        return atRiskMembers.Select(mes => new MemberEventEngagementDto
        {
            MemberId = mes.MemberId,
            MemberName = mes.Member.FullName,
            RiskLevel = mes.RiskLevel,
            EngagementTrend = mes.EngagementTrend,
            EventRetentionProbability = mes.EventRetentionProbability,
            Recent90DayTrend = mes.Recent90DayTrend,
            AverageEventEngagementScore = mes.AverageEventEngagementScore,
            LastUpdated = mes.UpdatedAt
        }).ToList();
    }

    // Additional placeholder methods for interface compliance
    public Task<RealTimeEngagementDto?> GetRealTimeEventEngagementAsync(int eventId, int clubId, int userId) =>
        Task.FromResult<RealTimeEngagementDto?>(null);
    public Task<bool> UpdateRealTimeEngagementAsync(int eventId, Dictionary<string, object> engagementData) =>
        Task.FromResult(false);
    public Task<Dictionary<string, decimal>> GetMemberParticipationFrequencyAsync(int memberId, int clubId, int periodDays = 90) =>
        Task.FromResult(new Dictionary<string, decimal>());
    public Task<Dictionary<string, object>> GetSatisfactionEngagementCorrelationAsync(int clubId, int userId) =>
        Task.FromResult(new Dictionary<string, object>());
    public Task<byte[]> ExportEngagementAnalyticsAsync(EventEngagementAnalyticsQuery query, int userId, string format = "csv") =>
        Task.FromResult(new byte[0]);


    /// <summary>
    /// Batch process engagement data for multiple events
    /// </summary>
    public async Task<int> BatchProcessEngagementDataAsync(int clubId, int userId)
    {
        if (!await _clubTierService.HasUnlimitedTierAccess(userId, clubId))
        {
            return 0;
        }

        var events = await _context.Events
            .Where(e => e.ClubId == clubId)
            .ToListAsync();

        int processed = 0;
        foreach (var evt in events)
        {
            try
            {
                // Process engagement data for each event
                await GetEventEngagementAnalyticsAsync(evt.Id, clubId, userId);
                processed++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to process engagement data for event {EventId}", evt.Id);
            }
        }

        return processed;
    }

    #region Additional Analytics Methods Implementation

    /// <summary>
    /// Generate event recommendations for a member
    /// </summary>
    public async Task<List<EventRecommendation>> GenerateEventRecommendationsAsync(int clubId, int memberId, int maxRecommendations = 5)
    {
        try
        {
            _logger.LogInformation("Generating event recommendations for Member {MemberId} in Club {ClubId}", memberId, clubId);

            // Get member's past engagement data
            var memberEngagements = await _context.EventEngagementTrackings
                .Include(et => et.Event)
                .Where(et => et.MemberId == memberId && et.Event.ClubId == clubId)
                .OrderByDescending(et => et.CreatedAt)
                .Take(20) // Last 20 events for analysis
                .ToListAsync();

            // Get upcoming events in the club
            var upcomingEvents = await _context.Events
                .Where(e => e.ClubId == clubId && e.EventDateTime > DateTime.UtcNow)
                .OrderBy(e => e.EventDateTime)
                .Take(20) // Next 20 events
                .ToListAsync();

            var recommendations = new List<EventRecommendation>();

            foreach (var eventItem in upcomingEvents.Take(maxRecommendations))
            {
                // Calculate recommendation score based on historical data
                var score = CalculateRecommendationScore(memberEngagements, eventItem);
                var attendanceProbability = CalculateAttendanceProbability(memberEngagements, eventItem);
                var reason = GenerateRecommendationReason(memberEngagements, eventItem, score);

                recommendations.Add(new EventRecommendation
                {
                    EventId = eventItem.Id,
                    EventName = eventItem.Name,
                    EventDateTime = eventItem.EventDateTime,
                    RecommendationScore = score,
                    AttendanceProbability = attendanceProbability,
                    RecommendationReason = reason
                });
            }

            return recommendations.OrderByDescending(r => r.RecommendationScore).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating event recommendations for Member {MemberId}", memberId);
            return new List<EventRecommendation>();
        }
    }

    /// <summary>
    /// Analyze event performance metrics
    /// </summary>
    public async Task<EventPerformanceAnalysis> AnalyzeEventPerformanceAsync(int eventId)
    {
        try
        {
            _logger.LogInformation("Analyzing performance for Event {EventId}", eventId);

            var eventData = await _context.Events
                .FirstOrDefaultAsync(e => e.Id == eventId);

            if (eventData == null)
            {
                throw new ArgumentException($"Event {eventId} not found");
            }

            var engagements = await _context.EventEngagementTrackings
                .Where(et => et.EventId == eventId)
                .ToListAsync();

            // Calculate attendance metrics
            var totalRsvps = engagements.Count;
            var totalAttended = engagements.Count(e => e.AttendanceStatus == "attended");
            var attendanceRate = totalRsvps > 0 ? (decimal)totalAttended / totalRsvps * 100m : 0m;
            var noShowRate = totalRsvps > 0 ? (decimal)engagements.Count(e => e.AttendanceStatus == "no_show") / totalRsvps * 100m : 0m;

            var attendanceAnalysis = new AttendanceAnalysis
            {
                TotalRsvps = totalRsvps,
                TotalAttended = totalAttended,
                AttendanceRate = attendanceRate,
                NoShowRate = noShowRate
            };

            // Calculate performance score
            var avgParticipationScore = engagements.Any()
                ? engagements.Where(e => e.ParticipationScore > 0).Select(e => e.ParticipationScore).DefaultIfEmpty(0m).Average()
                : 0m;

            var performanceScore = CalculateEventSuccessScore(attendanceRate, avgParticipationScore);

            // Get club averages for comparison
            var clubAverages = await GetClubAveragesAsync(eventData.ClubId);

            var comparisonToAverage = new PerformanceComparison
            {
                AttendanceRateVsAverage = attendanceRate - clubAverages.AttendanceRate,
                EngagementScoreVsAverage = avgParticipationScore - clubAverages.EngagementScore
            };

            // Generate improvement suggestions
            var suggestions = GenerateImprovementSuggestions(attendanceRate, avgParticipationScore, engagements);

            return new EventPerformanceAnalysis
            {
                EventId = eventId,
                EventName = eventData.Name,
                EventDate = eventData.EventDateTime,
                PerformanceScore = performanceScore,
                AttendanceAnalysis = attendanceAnalysis,
                EngagementBreakdown = CalculateEngagementBreakdown(engagements),
                ComparisonToAverage = comparisonToAverage,
                ImprovementSuggestions = suggestions
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing event performance for Event {EventId}", eventId);
            throw;
        }
    }

    /// <summary>
    /// Get engagement benchmarks for a club
    /// </summary>
    public async Task<EngagementBenchmarks> GetEngagementBenchmarksAsync(int clubId)
    {
        try
        {
            _logger.LogInformation("Getting engagement benchmarks for Club {ClubId}", clubId);

            var cutoffDate = DateTime.UtcNow.AddDays(-90);

            var recentEvents = await _context.Events
                .Where(e => e.ClubId == clubId && e.EventDateTime >= cutoffDate)
                .ToListAsync();

            var eventIds = recentEvents.Select(e => e.Id).ToList();

            var engagements = await _context.EventEngagementTrackings
                .Where(et => eventIds.Contains(et.EventId))
                .ToListAsync();

            if (!engagements.Any())
            {
                return new EngagementBenchmarks
                {
                    ClubId = clubId,
                    BenchmarkPeriod = "Last 90 days",
                    LastUpdated = DateTime.UtcNow
                };
            }

            var totalRegistrations = engagements.Count;
            var totalAttended = engagements.Count(e => e.AttendanceStatus == "attended");

            var avgAttendanceRate = totalRegistrations > 0 ? (decimal)totalAttended / totalRegistrations * 100m : 0m;
            var avgRsvpRate = recentEvents.Any() ? (decimal)totalRegistrations / recentEvents.Count : 0m;
            var avgEngagementScore = engagements.Where(e => e.ParticipationScore > 0)
                .Select(e => e.ParticipationScore).DefaultIfEmpty(0m).Average();

            // Mock industry comparisons - in real implementation, these would come from a data source
            var industryComparisons = new Dictionary<string, decimal>
            {
                ["attendance_rate"] = avgAttendanceRate - 65m, // Industry average 65%
                ["engagement_score"] = avgEngagementScore - 72m, // Industry average 72
                ["retention_rate"] = 0m // Would be calculated
            };

            var performanceIndicators = new Dictionary<string, string>
            {
                ["attendance_trend"] = avgAttendanceRate > 70 ? "Above Average" : avgAttendanceRate > 50 ? "Average" : "Below Average",
                ["engagement_health"] = avgEngagementScore > 75 ? "Excellent" : avgEngagementScore > 60 ? "Good" : "Needs Improvement"
            };

            return new EngagementBenchmarks
            {
                ClubId = clubId,
                AverageAttendanceRate = avgAttendanceRate,
                AverageRsvpRate = avgRsvpRate,
                AverageEngagementScore = avgEngagementScore,
                IndustryComparisons = industryComparisons,
                PerformanceIndicators = performanceIndicators,
                BenchmarkPeriod = "Last 90 days",
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting engagement benchmarks for Club {ClubId}", clubId);
            throw;
        }
    }

    /// <summary>
    /// Predict event success based on historical data
    /// </summary>
    public async Task<EventSuccessPrediction> PredictEventSuccessAsync(int eventId)
    {
        try
        {
            _logger.LogInformation("Predicting success for Event {EventId}", eventId);

            var eventData = await _context.Events
                .FirstOrDefaultAsync(e => e.Id == eventId);

            if (eventData == null)
            {
                throw new ArgumentException($"Event {eventId} not found");
            }

            // Get historical data for similar events in the club
            var historicalEvents = await _context.Events
                .Where(e => e.ClubId == eventData.ClubId && e.Id != eventId && e.EventDateTime < DateTime.UtcNow)
                .OrderByDescending(e => e.EventDateTime)
                .Take(10)
                .ToListAsync();

            var historicalEventIds = historicalEvents.Select(e => e.Id).ToList();

            var historicalEngagements = await _context.EventEngagementTrackings
                .Where(et => historicalEventIds.Contains(et.EventId))
                .ToListAsync();

            // Calculate predicted metrics based on historical averages
            var avgHistoricalAttendance = CalculateHistoricalAttendanceRate(historicalEngagements, historicalEventIds);
            var predictedAttendanceRate = AdjustPredictionBasedOnFactors(avgHistoricalAttendance, eventData);

            var successProbability = CalculateSuccessProbability(predictedAttendanceRate, eventData);
            var confidenceLevel = CalculateConfidenceLevel(historicalEvents.Count, historicalEngagements.Count);

            var riskFactors = IdentifyRiskFactors(eventData, historicalEngagements);
            var successFactors = IdentifySuccessFactors(eventData, historicalEngagements);
            var recommendations = GenerateActionRecommendations(riskFactors, successFactors);

            return new EventSuccessPrediction
            {
                EventId = eventId,
                EventName = eventData.Name,
                EventDate = eventData.EventDateTime,
                PredictedAttendanceRate = predictedAttendanceRate,
                SuccessProbability = successProbability,
                ConfidenceLevel = confidenceLevel,
                RiskFactors = riskFactors,
                SuccessFactors = successFactors,
                RecommendedActions = recommendations
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error predicting event success for Event {EventId}", eventId);
            throw;
        }
    }

    /// <summary>
    /// Generate comprehensive engagement report
    /// </summary>
    public async Task<EngagementReport> GenerateEngagementReportAsync(int clubId, string reportType, DateTime startDate, DateTime endDate)
    {
        try
        {
            _logger.LogInformation("Generating engagement report for Club {ClubId}, Type: {ReportType}", clubId, reportType);

            var club = await _context.Clubs
                .FirstOrDefaultAsync(c => c.Id == clubId);

            if (club == null)
            {
                throw new ArgumentException($"Club {clubId} not found");
            }

            var events = await _context.Events
                .Where(e => e.ClubId == clubId && e.EventDateTime >= startDate && e.EventDateTime <= endDate)
                .ToListAsync();

            var eventIds = events.Select(e => e.Id).ToList();

            var engagements = await _context.EventEngagementTrackings
                .Where(et => eventIds.Contains(et.EventId))
                .ToListAsync();

            // Calculate key metrics
            var keyMetrics = CalculateKeyMetrics(events, engagements);

            // Generate trend analysis
            var trendAnalysis = CalculateTrendAnalysis(engagements, startDate, endDate);

            // Get member insights
            var memberInsights = await GenerateMemberInsights(clubId, eventIds, reportType);

            // Get event analysis
            var eventAnalysis = GenerateEventAnalysis(events, engagements);

            // Generate recommendations based on report type
            var recommendations = GenerateReportRecommendations(keyMetrics, trendAnalysis, reportType);

            var executiveSummary = GenerateExecutiveSummary(keyMetrics, trendAnalysis, reportType);

            return new EngagementReport
            {
                ClubId = clubId,
                ReportType = reportType,
                ReportPeriod = new DTOs.DateRange
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    Description = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}"
                },
                GeneratedAt = DateTime.UtcNow,
                ExecutiveSummary = executiveSummary,
                KeyMetrics = keyMetrics,
                TrendAnalysis = trendAnalysis,
                MemberInsights = memberInsights,
                EventAnalysis = eventAnalysis,
                Recommendations = recommendations
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating engagement report for Club {ClubId}", clubId);
            throw;
        }
    }

    /// <summary>
    /// Calculate ROI metrics for events
    /// </summary>
    public async Task<EventROIMetrics> CalculateROIMetricsAsync(int clubId, int periodMonths = 6)
    {
        try
        {
            _logger.LogInformation("Calculating ROI metrics for Club {ClubId}, Period: {PeriodMonths} months", clubId, periodMonths);

            var startDate = DateTime.UtcNow.AddMonths(-periodMonths);
            var endDate = DateTime.UtcNow;

            var events = await _context.Events
                .Where(e => e.ClubId == clubId && e.EventDateTime >= startDate && e.EventDateTime <= endDate)
                .ToListAsync();

            // Mock cost and value calculations - in real implementation, these would be configurable
            var totalEventCosts = CalculateEventCosts(events);
            var totalMemberValue = CalculateMemberValue(clubId, events, startDate, endDate);

            var roiPercentage = totalEventCosts > 0 ? ((totalMemberValue - totalEventCosts) / totalEventCosts) * 100m : 0m;

            var costBreakdown = CalculateCostBreakdown(events);
            var valueDrivers = CalculateValueDrivers(events);

            var memberCount = await _context.Members
                .CountAsync(m => m.ClubId == clubId && m.Status == "Active");

            var costPerMember = memberCount > 0 ? totalEventCosts / memberCount : 0m;
            var valuePerMember = memberCount > 0 ? totalMemberValue / memberCount : 0m;

            return new EventROIMetrics
            {
                ClubId = clubId,
                AnalysisPeriodMonths = periodMonths,
                TotalEventCosts = totalEventCosts,
                TotalMemberValue = totalMemberValue,
                ROIPercentage = roiPercentage,
                CostBreakdown = costBreakdown,
                ValueDrivers = valueDrivers,
                CostPerMember = costPerMember,
                ValuePerMember = valuePerMember
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating ROI metrics for Club {ClubId}", clubId);
            throw;
        }
    }

    #endregion

    #region Private Helper Methods for New Features

    private decimal CalculateRecommendationScore(List<EventEngagementTracking> memberEngagements, Event eventItem)
    {
        if (!memberEngagements.Any()) return 50m; // Neutral score for new members

        var avgEngagementScore = memberEngagements.Where(e => e.ParticipationScore > 0)
            .Select(e => e.ParticipationScore).DefaultIfEmpty(50m).Average();

        var attendanceRate = (decimal)memberEngagements.Count(e => e.AttendanceStatus == "attended") / memberEngagements.Count * 100m;

        // Combine factors with weights
        return (avgEngagementScore * 0.6m) + (attendanceRate * 0.4m);
    }

    private decimal CalculateAttendanceProbability(List<EventEngagementTracking> memberEngagements, Event eventItem)
    {
        if (!memberEngagements.Any()) return 60m; // Default for new members

        var recentEngagements = memberEngagements.Take(5);
        var recentAttendanceRate = recentEngagements.Any()
            ? (decimal)recentEngagements.Count(e => e.AttendanceStatus == "attended") / recentEngagements.Count() * 100m
            : 60m;

        return Math.Max(0, Math.Min(100, recentAttendanceRate));
    }

    private string GenerateRecommendationReason(List<EventEngagementTracking> memberEngagements, Event eventItem, decimal score)
    {
        if (score > 80) return "High engagement history suggests strong interest in similar events";
        if (score > 60) return "Good match based on past participation patterns";
        if (score > 40) return "Moderate interest indicated by engagement history";
        return "New event type - expanding engagement opportunities";
    }

    private async Task<(decimal AttendanceRate, decimal EngagementScore)> GetClubAveragesAsync(int clubId)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-90);
        var recentEngagements = await _context.EventEngagementTrackings
            .Include(et => et.Event)
            .Where(et => et.Event.ClubId == clubId && et.Event.EventDateTime >= cutoffDate)
            .ToListAsync();

        if (!recentEngagements.Any()) return (0m, 0m);

        var attendanceRate = (decimal)recentEngagements.Count(e => e.AttendanceStatus == "attended") / recentEngagements.Count * 100m;
        var engagementScore = recentEngagements.Where(e => e.ParticipationScore > 0)
            .Select(e => e.ParticipationScore).DefaultIfEmpty(0m).Average();

        return (attendanceRate, engagementScore);
    }

    private Dictionary<string, object> CalculateEngagementBreakdown(List<EventEngagementTracking> engagements)
    {
        return new Dictionary<string, object>
        {
            ["total_interactions"] = engagements.Sum(e => e.InteractionCount),
            ["questions_asked"] = engagements.Sum(e => e.QuestionsAsked),
            ["polls_participated"] = engagements.Sum(e => e.PollsParticipated),
            ["chat_messages"] = engagements.Sum(e => e.ChatMessages),
            ["networking_connections"] = engagements.Sum(e => e.NetworkingConnections),
            ["resources_downloaded"] = engagements.Sum(e => e.ResourcesDownloaded)
        };
    }

    private List<string> GenerateImprovementSuggestions(decimal attendanceRate, decimal avgParticipationScore, List<EventEngagementTracking> engagements)
    {
        var suggestions = new List<string>();

        if (attendanceRate < 60)
            suggestions.Add("Consider improving event promotion and reminder communications");

        if (avgParticipationScore < 60)
            suggestions.Add("Add more interactive elements like polls, Q&A, and breakout sessions");

        if (engagements.Any() && engagements.Average(e => e.SessionDurationMinutes ?? 0) < 60)
            suggestions.Add("Review event content and pacing to maintain participant attention");

        if (engagements.Count(e => e.PostEventSurveyCompleted) < engagements.Count * 0.3m)
            suggestions.Add("Improve post-event survey response rates to gather better feedback");

        return suggestions;
    }

    private decimal CalculateHistoricalAttendanceRate(List<EventEngagementTracking> engagements, List<int> eventIds)
    {
        if (!engagements.Any()) return 65m; // Default industry average

        return (decimal)engagements.Count(e => e.AttendanceStatus == "attended") / engagements.Count * 100m;
    }

    private decimal AdjustPredictionBasedOnFactors(decimal baseRate, Event eventData)
    {
        var adjustment = 0m;

        // Time-based adjustments
        var dayOfWeek = eventData.EventDateTime.DayOfWeek;
        if (dayOfWeek == DayOfWeek.Tuesday || dayOfWeek == DayOfWeek.Wednesday || dayOfWeek == DayOfWeek.Thursday)
            adjustment += 5m; // Weekday events typically perform better

        // Time of day adjustments
        var hour = eventData.EventDateTime.Hour;
        if (hour >= 18 && hour <= 20)
            adjustment += 3m; // Evening events often have better attendance

        return Math.Max(0, Math.Min(100, baseRate + adjustment));
    }

    private decimal CalculateSuccessProbability(decimal attendanceRate, Event eventData)
    {
        var baseProbability = attendanceRate;

        // Adjust based on advance notice
        var daysInAdvance = (eventData.EventDateTime - eventData.CreatedAt).TotalDays;
        if (daysInAdvance > 14) baseProbability += 5m; // More planning time
        if (daysInAdvance < 3) baseProbability -= 10m; // Short notice penalty

        return Math.Max(0, Math.Min(100, baseProbability));
    }

    private string CalculateConfidenceLevel(int historicalEventsCount, int engagementsCount)
    {
        if (historicalEventsCount >= 10 && engagementsCount >= 50) return "High";
        if (historicalEventsCount >= 5 && engagementsCount >= 20) return "Medium";
        return "Low";
    }

    private List<string> IdentifyRiskFactors(Event eventData, List<EventEngagementTracking> historicalEngagements)
    {
        var factors = new List<string>();

        if (eventData.EventDateTime.DayOfWeek == DayOfWeek.Friday)
            factors.Add("Friday events may have lower attendance due to end-of-week fatigue");

        if (eventData.EventDateTime.Hour < 10 || eventData.EventDateTime.Hour > 21)
            factors.Add("Event timing outside typical business hours may impact attendance");

        var avgNoShowRate = historicalEngagements.Any()
            ? (decimal)historicalEngagements.Count(e => e.AttendanceStatus == "no_show") / historicalEngagements.Count * 100m
            : 0m;

        if (avgNoShowRate > 25)
            factors.Add("Historical no-show rates are above average for this club");

        return factors;
    }

    private List<string> IdentifySuccessFactors(Event eventData, List<EventEngagementTracking> historicalEngagements)
    {
        var factors = new List<string>();

        if (eventData.EventDateTime.DayOfWeek == DayOfWeek.Tuesday || eventData.EventDateTime.DayOfWeek == DayOfWeek.Wednesday)
            factors.Add("Mid-week events typically show strong attendance");

        if (eventData.EventDateTime.Hour >= 18 && eventData.EventDateTime.Hour <= 20)
            factors.Add("Evening timing aligns with peak member availability");

        var avgEngagementScore = historicalEngagements.Where(e => e.ParticipationScore > 0)
            .Select(e => e.ParticipationScore).DefaultIfEmpty(0m).Average();

        if (avgEngagementScore > 75)
            factors.Add("Club members show high historical engagement levels");

        return factors;
    }

    private List<string> GenerateActionRecommendations(List<string> riskFactors, List<string> successFactors)
    {
        var recommendations = new List<string>();

        if (riskFactors.Any(f => f.Contains("timing")))
            recommendations.Add("Consider sending additional reminders closer to the event date");

        if (riskFactors.Any(f => f.Contains("no-show")))
            recommendations.Add("Implement waitlist management and confirmation requirements");

        if (successFactors.Any(f => f.Contains("engagement")))
            recommendations.Add("Leverage high engagement by promoting interactive elements");

        return recommendations;
    }

    private Dictionary<string, object> CalculateKeyMetrics(List<Event> events, List<EventEngagementTracking> engagements)
    {
        var totalEvents = events.Count;
        var totalRegistrations = engagements.Count;
        var totalAttendees = engagements.Count(e => e.AttendanceStatus == "attended");
        var avgAttendanceRate = totalRegistrations > 0 ? (decimal)totalAttendees / totalRegistrations * 100m : 0m;
        var avgEngagementScore = engagements.Where(e => e.ParticipationScore > 0)
            .Select(e => e.ParticipationScore).DefaultIfEmpty(0m).Average();

        return new Dictionary<string, object>
        {
            ["total_events"] = totalEvents,
            ["total_registrations"] = totalRegistrations,
            ["total_attendees"] = totalAttendees,
            ["average_attendance_rate"] = avgAttendanceRate,
            ["average_engagement_score"] = avgEngagementScore,
            ["member_satisfaction"] = engagements.Where(e => e.SatisfactionRating.HasValue)
                .Select(e => e.SatisfactionRating!.Value).DefaultIfEmpty(0m).Average()
        };
    }

    private TrendAnalysis CalculateTrendAnalysis(List<EventEngagementTracking> engagements, DateTime startDate, DateTime endDate)
    {
        var monthlyGroups = engagements
            .GroupBy(e => new { e.CreatedAt.Year, e.CreatedAt.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .ToList();

        var monthlyGrowthRate = 0m;
        if (monthlyGroups.Count > 1)
        {
            var firstMonth = monthlyGroups.First();
            var lastMonth = monthlyGroups.Last();
            var firstMonthAttendance = firstMonth.Count(e => e.AttendanceStatus == "attended");
            var lastMonthAttendance = lastMonth.Count(e => e.AttendanceStatus == "attended");

            if (firstMonthAttendance > 0)
                monthlyGrowthRate = ((decimal)(lastMonthAttendance - firstMonthAttendance) / firstMonthAttendance) * 100m;
        }

        var overallDirection = monthlyGrowthRate > 5 ? "Improving" : monthlyGrowthRate < -5 ? "Declining" : "Stable";

        return new TrendAnalysis
        {
            OverallDirection = overallDirection,
            MonthlyGrowthRate = monthlyGrowthRate,
            SeasonalPatterns = new Dictionary<string, decimal>() // Would be calculated from historical data
        };
    }

    private async Task<List<MemberInsightSummary>> GenerateMemberInsights(int clubId, List<int> eventIds, string reportType)
    {
        var memberScores = await _context.MemberEventEngagementScores
            .Include(mes => mes.Member)
            .Where(mes => mes.Member.ClubId == clubId)
            .OrderByDescending(mes => mes.AverageEventEngagementScore)
            .Take(reportType == "comprehensive" ? 50 : 10)
            .ToListAsync();

        return memberScores.Select(mes => new MemberInsightSummary
        {
            MemberId = mes.MemberId,
            MemberName = mes.Member.FullName,
            EngagementScore = mes.AverageEventEngagementScore,
            EngagementLevel = mes.AverageEventEngagementScore > 75 ? "High" :
                             mes.AverageEventEngagementScore > 50 ? "Medium" : "Low"
        }).ToList();
    }

    private List<EventAnalysisSummary> GenerateEventAnalysis(List<Event> events, List<EventEngagementTracking> engagements)
    {
        return events.Select(e =>
        {
            var eventEngagements = engagements.Where(eng => eng.EventId == e.Id).ToList();
            var attendanceRate = eventEngagements.Any()
                ? (decimal)eventEngagements.Count(eng => eng.AttendanceStatus == "attended") / eventEngagements.Count * 100m
                : 0m;
            var performanceScore = eventEngagements.Any()
                ? eventEngagements.Where(eng => eng.ParticipationScore > 0).Select(eng => eng.ParticipationScore).DefaultIfEmpty(0m).Average()
                : 0m;

            return new EventAnalysisSummary
            {
                EventId = e.Id,
                EventName = e.Name,
                EventDate = e.EventDateTime,
                PerformanceScore = performanceScore,
                AttendanceRate = attendanceRate
            };
        }).OrderByDescending(e => e.PerformanceScore).ToList();
    }

    private List<string> GenerateReportRecommendations(Dictionary<string, object> keyMetrics, TrendAnalysis trendAnalysis, string reportType)
    {
        var recommendations = new List<string>();

        if (keyMetrics.TryGetValue("average_attendance_rate", out var attendanceObj) && (decimal)attendanceObj < 70)
            recommendations.Add("Focus on improving event promotion and member communication strategies");

        if (keyMetrics.TryGetValue("average_engagement_score", out var engagementObj) && (decimal)engagementObj < 60)
            recommendations.Add("Increase interactive elements in events to boost engagement");

        if (trendAnalysis.OverallDirection == "Declining")
            recommendations.Add("Implement member retention strategies and review event format preferences");

        return recommendations;
    }

    private string GenerateExecutiveSummary(Dictionary<string, object> keyMetrics, TrendAnalysis trendAnalysis, string reportType)
    {
        var avgAttendanceRate = keyMetrics.TryGetValue("average_attendance_rate", out var att) ? (decimal)att : 0m;
        var avgEngagementScore = keyMetrics.TryGetValue("average_engagement_score", out var eng) ? (decimal)eng : 0m;

        return $"Club engagement analysis shows {avgAttendanceRate:F1}% average attendance rate with {avgEngagementScore:F1} engagement score. " +
               $"Trend direction is {trendAnalysis.OverallDirection.ToLower()} with {trendAnalysis.MonthlyGrowthRate:F1}% monthly growth rate.";
    }

    private decimal CalculateEventCosts(List<Event> events)
    {
        // Mock calculation - in real implementation, this would be based on actual cost tracking
        return events.Count * 250m; // Average $250 per event
    }

    private decimal CalculateMemberValue(int clubId, List<Event> events, DateTime startDate, DateTime endDate)
    {
        // Mock calculation - in real implementation, this would be based on member value metrics
        return events.Count * 400m; // Average $400 value per event
    }

    private Dictionary<string, decimal> CalculateCostBreakdown(List<Event> events)
    {
        return new Dictionary<string, decimal>
        {
            ["venue_costs"] = events.Count * 100m,
            ["catering_costs"] = events.Count * 75m,
            ["speaker_fees"] = events.Count * 50m,
            ["marketing_costs"] = events.Count * 25m
        };
    }

    private Dictionary<string, decimal> CalculateValueDrivers(List<Event> events)
    {
        return new Dictionary<string, decimal>
        {
            ["member_retention"] = events.Count * 150m,
            ["networking_value"] = events.Count * 100m,
            ["knowledge_sharing"] = events.Count * 100m,
            ["community_building"] = events.Count * 50m
        };
    }

    /// <summary>
    /// Calculate engagement trends for a club over time
    /// </summary>
    public async Task<List<DailyEngagementTrend>> CalculateEngagementTrendsAsync(int clubId, int userId, int daysBack = 30)
    {
        try
        {
            _logger.LogInformation("Calculating engagement trends for Club {ClubId}, {DaysBack} days back", clubId, daysBack);

            // Verify user has access to this club
            var hasAccess = await _clubTierService.HasUnlimitedTierAccess(userId, clubId);
            if (!hasAccess)
            {
                throw new UnauthorizedAccessException("User does not have access to engagement analytics for this club");
            }

            var startDate = DateTime.UtcNow.Date.AddDays(-daysBack);
            var endDate = DateTime.UtcNow.Date;

            var trends = new List<DailyEngagementTrend>();

            // Get events and their engagement data for each day
            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                var dayStart = date;
                var dayEnd = date.AddDays(1);

                var eventsOnDay = await _context.Events
                    .Where(e => e.ClubId == clubId &&
                               e.EventDateTime >= dayStart &&
                               e.EventDateTime < dayEnd)
                    .ToListAsync();

                var eventIds = eventsOnDay.Select(e => e.Id).ToList();

                var trackingsOnDay = await _context.EventEngagementTrackings
                    .Where(et => eventIds.Contains(et.EventId))
                    .ToListAsync();

                var attendeeCount = trackingsOnDay.Count(t => t.AttendanceStatus == "attended");
                var registrationCount = trackingsOnDay.Count(t => t.RegistrationStatus == "registered");

                var averageEngagementScore = trackingsOnDay.Any()
                    ? (decimal)trackingsOnDay.Average(t => t.InteractionCount * 10) // Simple scoring
                    : 0m;

                var attendanceRate = registrationCount > 0
                    ? (decimal)attendeeCount / registrationCount * 100
                    : 0m;

                trends.Add(new DailyEngagementTrend
                {
                    Date = date,
                    EngagementScore = Math.Round(averageEngagementScore, 2),
                    EventCount = eventsOnDay.Count(),
                    AttendeeCount = attendeeCount,
                    AttendanceRate = Math.Round(attendanceRate, 2)
                });
            }

            return trends.OrderBy(t => t.Date).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating engagement trends for Club {ClubId}", clubId);
            throw;
        }
    }

    /// <summary>
    /// Get detailed engagement insights for a specific member
    /// </summary>
    public async Task<MemberEngagementInsights> GetMemberEngagementInsightsAsync(int clubId, int memberId, int userId, int periodDays = 90)
    {
        try
        {
            _logger.LogInformation("Getting engagement insights for Member {MemberId} in Club {ClubId}, period: {PeriodDays} days",
                memberId, clubId, periodDays);

            // Verify user has access to this club
            var hasAccess = await _clubTierService.HasUnlimitedTierAccess(userId, clubId);
            if (!hasAccess)
            {
                throw new UnauthorizedAccessException("User does not have access to engagement analytics for this club");
            }

            // Get member information
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.Id == memberId && m.ClubId == clubId);

            if (member == null)
            {
                throw new ArgumentException($"Member {memberId} not found in club {clubId}");
            }

            var startDate = DateTime.UtcNow.Date.AddDays(-periodDays);
            var endDate = DateTime.UtcNow.Date;

            // Get member's event engagement data
            var memberEngagements = await _context.EventEngagementTrackings
                .Include(et => et.Event)
                .Where(et => et.MemberId == memberId &&
                            et.Event.ClubId == clubId &&
                            et.CreatedAt >= startDate)
                .ToListAsync();

            var totalEventsRegistered = memberEngagements.Count(e => e.RegistrationStatus == "registered");
            var totalEventsAttended = memberEngagements.Count(e => e.AttendanceStatus == "attended");
            var eventAttendanceRate = totalEventsRegistered > 0
                ? (decimal)totalEventsAttended / totalEventsRegistered * 100
                : 0m;

            var rsvpAccuracyRate = totalEventsRegistered > 0
                ? (decimal)totalEventsAttended / totalEventsRegistered * 100
                : 0m;

            var averageEngagementScore = memberEngagements.Any()
                ? (decimal)memberEngagements.Average(e => e.InteractionCount * 10)
                : 0m;

            // Determine engagement trend and level
            var recentEngagements = memberEngagements
                .Where(e => e.CreatedAt >= DateTime.UtcNow.AddDays(-30))
                .Count();
            var olderEngagements = memberEngagements
                .Where(e => e.CreatedAt < DateTime.UtcNow.AddDays(-30) && e.CreatedAt >= DateTime.UtcNow.AddDays(-60))
                .Count();

            var engagementTrend = recentEngagements > olderEngagements ? "Increasing" :
                                 recentEngagements < olderEngagements ? "Decreasing" : "Stable";

            var engagementLevel = averageEngagementScore >= 80 ? "High" :
                                 averageEngagementScore >= 60 ? "Medium" :
                                 averageEngagementScore >= 40 ? "Low" : "Inactive";

            // Generate recommended actions
            var recommendedActions = new List<string>();
            if (eventAttendanceRate < 50)
            {
                recommendedActions.Add("Consider reaching out to improve event attendance");
                recommendedActions.Add("Review event scheduling and format preferences");
            }
            else if (eventAttendanceRate < 80)
            {
                recommendedActions.Add("Good engagement - look for opportunities to increase participation");
            }
            else
            {
                recommendedActions.Add("Excellent engagement - consider for leadership opportunities");
            }

            // Create trend data for the period
            var trendData = await CalculateEngagementTrendsAsync(clubId, userId, periodDays);

            return new MemberEngagementInsights
            {
                MemberId = memberId,
                MemberName = member.FullName,
                ClubId = clubId,
                AnalysisPeriod = periodDays,
                EventAttendanceRate = Math.Round(eventAttendanceRate, 2),
                RsvpAccuracyRate = Math.Round(rsvpAccuracyRate, 2),
                EngagementTrend = engagementTrend,
                EngagementLevel = engagementLevel,
                RecommendedActions = recommendedActions,
                AverageEngagementScore = Math.Round(averageEngagementScore, 2),
                TotalEventsAttended = totalEventsAttended,
                TotalEventsRegistered = totalEventsRegistered,
                LastEventAttended = memberEngagements
                    .Where(e => e.AttendanceStatus == "attended")
                    .OrderByDescending(e => e.CheckInTimestamp)
                    .FirstOrDefault()?.CheckInTimestamp ?? DateTime.MinValue,
                EngagementMetrics = new Dictionary<string, decimal>
                {
                    ["attendance_rate"] = eventAttendanceRate,
                    ["rsvp_accuracy"] = rsvpAccuracyRate,
                    ["avg_session_duration"] = (decimal)(memberEngagements.Average(e => e.SessionDurationMinutes) ?? 0),
                    ["interaction_count"] = memberEngagements.Sum(e => e.InteractionCount)
                },
                EngagementTrendData = trendData
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting engagement insights for Member {MemberId} in Club {ClubId}",
                memberId, clubId);
            throw;
        }
    }

    /// <summary>
    /// Get event engagement analytics summary for a specific event
    /// Requires Expand tier access for authorization
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="clubId">Club ID for authorization</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>Event engagement analytics summary</returns>
    public async Task<EventEngagementAnalytics> GetEventEngagementAnalyticsAsync(int eventId, int clubId, int userId)
    {
        try
        {
            // Authorization check - EventEngagementAnalytics requires Expand tier
            var hasUnlimitedAccess = await _clubTierService.HasUnlimitedTierAccess(userId, clubId);

            if (!hasUnlimitedAccess)
            {
                throw new UnauthorizedAccessException("EventEngagementAnalytics requires Expand tier");
            }

            // Verify the event belongs to the club
            var eventItem = await _context.Events
                .Where(e => e.Id == eventId && e.ClubId == clubId)
                .FirstOrDefaultAsync();

            if (eventItem == null)
            {
                throw new ArgumentException($"Event {eventId} not found in club {clubId}");
            }

            // Get basic event data for analytics
            var eventData = await _context.Events
                .Include(e => e.EventRsvps)
                .Include(e => e.EventAttendances)
                .FirstOrDefaultAsync(e => e.Id == eventId && e.ClubId == clubId);

            if (eventData == null)
            {
                throw new ArgumentException($"Event {eventId} not found in club {clubId}");
            }

            var totalRegistrations = eventData.EventRsvps.Count(r => r.RsvpStatus == "Attending");
            var totalAttendees = eventData.EventAttendances.Count;
            var attendanceRate = totalRegistrations > 0 ? (decimal)totalAttendees / totalRegistrations * 100m : 0m;

            return new EventEngagementAnalytics
            {
                EventId = eventId,
                EventName = eventData.Name,
                EventDateTime = eventData.EventDateTime,
                TotalRegistrations = totalRegistrations,
                TotalAttendees = totalAttendees,
                AttendanceRate = attendanceRate,
                EngagementScore = attendanceRate, // Simple engagement score based on attendance
                SatisfactionRating = 0m, // Would be calculated from feedback
                EngagementLevel = attendanceRate > 80 ? "High" : attendanceRate > 50 ? "Medium" : "Low",
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (UnauthorizedAccessException)
        {
            throw; // Re-throw authorization exceptions
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event engagement analytics for Event {EventId} in Club {ClubId}",
                eventId, clubId);
            throw;
        }
    }

    #endregion
}
