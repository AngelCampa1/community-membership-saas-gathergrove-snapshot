using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

public class FeatureUsageAnalyticsService : IFeatureUsageAnalyticsService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<FeatureUsageAnalyticsService> _logger;

    // Feature weights for engagement scoring
    private readonly Dictionary<string, decimal> _featureWeights = new()
    {
        { "directory_search", 1.2m },
        { "profile_view", 1.0m },
        { "dues_payment", 2.0m },
        { "event_rsvp", 1.8m },
        { "event_view", 1.0m },
        { "member_directory", 1.5m },
        { "profile_edit", 1.3m },
        { "communication_view", 1.1m },
        { "help_access", 0.8m },
        { "dashboard_view", 0.9m },
        { "chat_message", 1.4m },
        { "payment_view", 1.2m },
        { "settings_access", 0.7m }
    };

    // Engagement score weights
    private readonly Dictionary<string, decimal> _engagementWeights = new()
    {
        { "login", 0.25m },      // 25% - Login frequency and consistency
        { "events", 0.30m },     // 30% - Event participation
        { "communication", 0.20m }, // 20% - Communication engagement
        { "features", 0.15m },   // 15% - Feature usage diversity
        { "profile", 0.10m }     // 10% - Profile completeness
    };

    public FeatureUsageAnalyticsService(GatherGroveDbContext context, ILogger<FeatureUsageAnalyticsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> TrackFeatureUsageAsync(int clubId, int memberId, string featureName, string platform, string? sessionId = null, string? action = null, string? context = null, decimal? duration = null)
    {
        try
        {
            var member = await _context.Members.FirstOrDefaultAsync(m => m.Id == memberId && m.ClubId == clubId);
            if (member == null)
            {
                _logger.LogWarning("Member {MemberId} not found in club {ClubId}", memberId, clubId);
                return false;
            }

            // Calculate member tenure in days
            var memberTenure = (DateTime.UtcNow - member.CreatedAt).Days;

            // Get engagement weight for this feature
            var engagementWeight = _featureWeights.GetValueOrDefault(featureName.ToLowerInvariant(), 1.0m);

            var featureUsageEvent = new FeatureUsageEvent
            {
                MemberId = memberId,
                ClubId = clubId,
                FeatureName = featureName,
                Platform = platform,
                SessionId = sessionId ?? Guid.NewGuid().ToString(),
                UsedAt = DateTime.UtcNow,
                Action = action,
                Context = context,
                Duration = duration,
                MemberTenureDays = memberTenure,
                MemberTenure = memberTenure, // For compatibility
                EngagementWeight = engagementWeight,
                Metadata = string.IsNullOrEmpty(context) ? null : System.Text.Json.JsonSerializer.Serialize(new { context, action, duration })
            };

            _context.FeatureUsageEvents.Add(featureUsageEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Tracked feature usage: {FeatureName} for member {MemberId} on {Platform}",
                featureName, memberId, platform);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking feature usage for member {MemberId} in club {ClubId}", memberId, clubId);
            return false;
        }
    }

    public async Task<FeatureUsageAnalyticsResponse> GetFeatureUsageAnalyticsAsync(int clubId, int days = 30)
    {
        try
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-days);

            // Get feature usage statistics
            var featureUsage = await _context.FeatureUsageEvents
                .Where(f => f.ClubId == clubId && f.UsedAt >= cutoffDate)
                .GroupBy(f => f.FeatureName)
                .Select(g => new FeatureUsageStatistic
                {
                    FeatureName = g.Key,
                    UsageCount = g.Count(),
                    UniqueUsers = g.Select(f => f.MemberId).Distinct().Count(),
                    TotalSessions = g.Select(f => f.SessionId).Distinct().Count(),
                    AverageEngagementScore = g.Average(f => f.EngagementWeight)
                })
                .ToListAsync();

            // Calculate adoption rates
            var totalMembers = await _context.Members.CountAsync(m => m.ClubId == clubId);
            foreach (var stat in featureUsage)
            {
                stat.AdoptionRate = totalMembers > 0 ? (double)stat.UniqueUsers / totalMembers * 100 : 0;
            }

            // Get platform usage comparison
            var platformUsage = await GetPlatformUsageComparisonAsync(clubId, days);

            // Get adoption trends (last 7 days)
            var adoptionTrends = await GetFeatureAdoptionTrendsAsync(clubId, 7);

            // Get tenure patterns
            var tenurePatterns = await GetTenureUsagePatternsAsync(clubId, days);

            return new FeatureUsageAnalyticsResponse
            {
                FeatureUsage = featureUsage,
                PlatformUsage = platformUsage,
                AdoptionTrends = adoptionTrends,
                TenurePatterns = tenurePatterns
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feature usage analytics for club {ClubId}", clubId);
            throw;
        }
    }

    public async Task<MemberEngagementAnalyticsResponse> GetMemberEngagementAnalyticsAsync(int clubId)
    {
        try
        {
            // Ensure engagement scores are calculated
            await CalculateMemberEngagementScoresAsync(clubId);

            var cutoffDate = DateTime.UtcNow.AddDays(-30);

            // Get club summary
            var clubSummary = await GetClubEngagementSummaryAsync(clubId);

            // Get member engagement scores
            var memberEngagement = await _context.MemberEngagementScores
                .Where(s => s.ClubId == clubId)
                .Include(s => s.Member)
                .Select(s => new MemberEngagementSummary
                {
                    MemberId = s.MemberId,
                    MemberName = s.Member.FullName,
                    OverallScore = s.OverallScore,
                    EngagementLevel = s.EngagementLevel,
                    LastActivity = s.LastLoginDate ?? s.UpdatedAt,
                    DaysSinceLastLogin = s.DaysSinceLastLogin,
                    ScoreBreakdown = new EngagementScoreBreakdown
                    {
                        LoginScore = s.LoginScore,
                        EventScore = s.EventScore,
                        CommunicationScore = s.CommunicationScore,
                        FeatureUsageScore = s.FeatureUsageScore,
                        ProfileCompletenessScore = s.ProfileCompletenessScore
                    }
                })
                .OrderByDescending(s => s.OverallScore)
                .ToListAsync();

            // Get engagement distribution
            var distribution = new EngagementDistribution
            {
                HighlyActive = memberEngagement.Count(m => m.OverallScore >= 80),
                Active = memberEngagement.Count(m => m.OverallScore >= 60 && m.OverallScore < 80),
                Moderate = memberEngagement.Count(m => m.OverallScore >= 40 && m.OverallScore < 60),
                LowEngagement = memberEngagement.Count(m => m.OverallScore >= 20 && m.OverallScore < 40),
                Inactive = memberEngagement.Count(m => m.OverallScore < 20)
            };

            // Get engagement trends (last 30 days)
            var trends = await GetEngagementTrendsAsync(clubId, 30);

            return new MemberEngagementAnalyticsResponse
            {
                ClubSummary = clubSummary,
                MemberEngagement = memberEngagement,
                Distribution = distribution,
                Trends = trends
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting member engagement analytics for club {ClubId}", clubId);
            throw;
        }
    }

    public async Task<bool> CalculateMemberEngagementScoresAsync(int clubId)
    {
        try
        {
            var members = await _context.Members
                .Where(m => m.ClubId == clubId)
                .ToListAsync();

            var cutoffDate = DateTime.UtcNow.AddDays(-90); // Consider last 90 days for scoring

            foreach (var member in members)
            {
                var score = await CalculateIndividualEngagementScoreAsync(member, cutoffDate);

                // Update or create engagement score record
                var existingScore = await _context.MemberEngagementScores
                    .FirstOrDefaultAsync(s => s.MemberId == member.Id);

                if (existingScore == null)
                {
                    existingScore = new MemberEngagementScore
                    {
                        MemberId = member.Id,
                        ClubId = clubId,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.MemberEngagementScores.Add(existingScore);
                }

                // Update scores
                existingScore.OverallScore = score.Overall;
                existingScore.LoginScore = score.Login;
                existingScore.EventScore = score.Events;
                existingScore.CommunicationScore = score.Communication;
                existingScore.FeatureUsageScore = score.Features;
                existingScore.ProfileCompletenessScore = score.Profile;
                var now = DateTime.UtcNow;
                existingScore.CalculatedDate = now;
                existingScore.UpdatedAt = now;

                // Update activity metrics
                existingScore.LoginCount7Days = await GetLoginCountAsync(member.Id, 7);
                existingScore.LoginCount30Days = await GetLoginCountAsync(member.Id, 30);
                existingScore.LoginCount90Days = await GetLoginCountAsync(member.Id, 90);
                existingScore.LastLoginDate = await GetLastLoginDateAsync(member.Id);
                existingScore.LoginStreakDays = await GetLoginStreakAsync(member.Id);
                existingScore.AverageSessionDurationMinutes = await GetAverageSessionDurationAsync(member.Id);

                // Determine activity level
                existingScore.ActivityLevel = score.Overall >= 80 ? "HighlyActive" :
                                            score.Overall >= 60 ? "Active" :
                                            score.Overall >= 40 ? "Moderate" : "Inactive";

                existingScore.EngagementLevel = existingScore.ActivityLevel; // For compatibility

                // Calculate days since last login
                existingScore.DaysSinceLastLogin = existingScore.LastLoginDate.HasValue
                    ? (DateTime.UtcNow - existingScore.LastLoginDate.Value).Days
                    : int.MaxValue;

                existingScore.IsAtRisk = existingScore.DaysSinceLastLogin > 30;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Calculated engagement scores for {MemberCount} members in club {ClubId}",
                members.Count, clubId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating engagement scores for club {ClubId}", clubId);
            return false;
        }
    }

    public async Task<List<MemberEngagementSummary>> GetLowEngagementMembersAsync(int clubId, int scoreThreshold = 40)
    {
        try
        {
            return await _context.MemberEngagementScores
                .Where(s => s.ClubId == clubId && s.OverallScore < scoreThreshold)
                .Include(s => s.Member)
                .Select(s => new MemberEngagementSummary
                {
                    MemberId = s.MemberId,
                    MemberName = s.Member.FullName,
                    OverallScore = s.OverallScore,
                    EngagementLevel = s.EngagementLevel,
                    LastActivity = s.LastLoginDate ?? s.UpdatedAt,
                    DaysSinceLastLogin = s.DaysSinceLastLogin,
                    ScoreBreakdown = new EngagementScoreBreakdown
                    {
                        LoginScore = s.LoginScore,
                        EventScore = s.EventScore,
                        CommunicationScore = s.CommunicationScore,
                        FeatureUsageScore = s.FeatureUsageScore,
                        ProfileCompletenessScore = s.ProfileCompletenessScore
                    }
                })
                .OrderBy(s => s.OverallScore)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting low engagement members for club {ClubId}", clubId);
            throw;
        }
    }

    public async Task<List<FeatureUsageStatistic>> GetTopFeaturesAsync(int clubId, int limit = 10)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-30);

        return await _context.FeatureUsageEvents
            .Where(f => f.ClubId == clubId && f.UsedAt >= cutoffDate)
            .GroupBy(f => f.FeatureName)
            .Select(g => new FeatureUsageStatistic
            {
                FeatureName = g.Key,
                UsageCount = g.Count(),
                UniqueUsers = g.Select(f => f.MemberId).Distinct().Count(),
                TotalSessions = g.Select(f => f.SessionId).Distinct().Count(),
                AverageEngagementScore = g.Average(f => f.EngagementWeight)
            })
            .OrderByDescending(s => s.UsageCount)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<PlatformUsageComparison> GetPlatformUsageComparisonAsync(int clubId, int days = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-days);

        var platformStats = await _context.FeatureUsageEvents
            .Where(f => f.ClubId == clubId && f.UsedAt >= cutoffDate)
            .GroupBy(f => f.Platform)
            .Select(g => new { Platform = g.Key, Count = g.Count(), UniqueUsers = g.Select(f => f.MemberId).Distinct().Count() })
            .ToListAsync();

        var webStats = platformStats.FirstOrDefault(p => p.Platform.ToLower() == "web");
        var mobileStats = platformStats.FirstOrDefault(p => p.Platform.ToLower() == "mobile");

        var totalUsage = platformStats.Sum(p => p.Count);

        return new PlatformUsageComparison
        {
            Web = new PlatformStats
            {
                UsageCount = webStats?.Count ?? 0,
                UniqueUsers = webStats?.UniqueUsers ?? 0,
                TopFeatures = await GetTopFeaturesByPlatformAsync(clubId, "web", 5)
            },
            Mobile = new PlatformStats
            {
                UsageCount = mobileStats?.Count ?? 0,
                UniqueUsers = mobileStats?.UniqueUsers ?? 0,
                TopFeatures = await GetTopFeaturesByPlatformAsync(clubId, "mobile", 5)
            },
            WebToMobileRatio = (mobileStats?.Count ?? 0) == 0 ? 0 : (double)(webStats?.Count ?? 0) / (mobileStats?.Count ?? 1)
        };
    }

    #region Private Helper Methods

    private async Task<(decimal Overall, decimal Login, decimal Events, decimal Communication, decimal Features, decimal Profile)>
        CalculateIndividualEngagementScoreAsync(Member member, DateTime cutoffDate)
    {
        // Login score (0-100)
        var loginScore = await CalculateLoginScoreAsync(member.Id, cutoffDate);

        // Event score (0-100)
        var eventScore = await CalculateEventScoreAsync(member.Id, cutoffDate);

        // Communication score (0-100)
        var communicationScore = await CalculateCommunicationScoreAsync(member.Id, cutoffDate);

        // Feature usage score (0-100)
        var featureScore = await CalculateFeatureUsageScoreAsync(member.Id, cutoffDate);

        // Profile completeness score (0-100)
        var profileScore = CalculateProfileCompletenessScore(member);

        // Calculate weighted overall score
        var overallScore = (loginScore * _engagementWeights["login"]) +
                          (eventScore * _engagementWeights["events"]) +
                          (communicationScore * _engagementWeights["communication"]) +
                          (featureScore * _engagementWeights["features"]) +
                          (profileScore * _engagementWeights["profile"]);

        return (overallScore, loginScore, eventScore, communicationScore, featureScore, profileScore);
    }

    private async Task<decimal> CalculateLoginScoreAsync(int memberId, DateTime cutoffDate)
    {
        var loginCount = await _context.MemberLoginTrackings
            .CountAsync(l => l.MemberId == memberId && l.LoginTimestamp >= cutoffDate);

        var daysSinceLastLogin = await _context.MemberLoginTrackings
            .Where(l => l.MemberId == memberId)
            .OrderByDescending(l => l.LoginTimestamp)
            .Select(l => (DateTime.UtcNow - l.LoginTimestamp).Days)
            .FirstOrDefaultAsync();

        // Score based on frequency and recency
        var frequencyScore = Math.Min(loginCount * 2, 70); // Max 70 points for frequency
        var recencyScore = Math.Max(30 - daysSinceLastLogin, 0); // Max 30 points for recency

        return Math.Min(frequencyScore + recencyScore, 100);
    }

    private async Task<decimal> CalculateEventScoreAsync(int memberId, DateTime cutoffDate)
    {
        var eventAttendance = await _context.EventRsvps
            .CountAsync(r => r.MemberId == memberId && r.CreatedAt >= cutoffDate && r.RsvpStatus == "Attending");

        var eventsAvailable = await _context.Events
            .CountAsync(e => e.Club.Members.Any(m => m.Id == memberId) && e.EventDateTime >= cutoffDate);

        if (eventsAvailable == 0) return 50; // Neutral score if no events

        var attendanceRate = (decimal)eventAttendance / eventsAvailable;
        return Math.Min(attendanceRate * 100, 100);
    }

    private async Task<decimal> CalculateCommunicationScoreAsync(int memberId, DateTime cutoffDate)
    {
        var messageCount = await _context.ClubChatMessages
            .CountAsync(m => m.SenderUserId == memberId && m.SentAt >= cutoffDate);

        // Score based on communication activity
        return Math.Min(messageCount * 5, 100);
    }

    private async Task<decimal> CalculateFeatureUsageScoreAsync(int memberId, DateTime cutoffDate)
    {
        var featureUsage = await _context.FeatureUsageEvents
            .Where(f => f.MemberId == memberId && f.UsedAt >= cutoffDate)
            .GroupBy(f => f.FeatureName)
            .CountAsync();

        var totalUsageCount = await _context.FeatureUsageEvents
            .CountAsync(f => f.MemberId == memberId && f.UsedAt >= cutoffDate);

        // Score based on feature diversity and total usage
        var diversityScore = Math.Min(featureUsage * 10, 60); // Max 60 for diversity
        var usageScore = Math.Min(totalUsageCount * 2, 40); // Max 40 for usage count

        return diversityScore + usageScore;
    }

    private decimal CalculateProfileCompletenessScore(Member member)
    {
        var completionScore = 0m;

        if (!string.IsNullOrEmpty(member.FullName)) completionScore += 20;
        if (!string.IsNullOrEmpty(member.Email)) completionScore += 20;
        if (!string.IsNullOrEmpty(member.PhoneNumber)) completionScore += 20;
        // Add more profile fields as needed
        completionScore += 40; // Base score for having an account

        return Math.Min(completionScore, 100);
    }

    private async Task<List<FeatureAdoptionTrend>> GetFeatureAdoptionTrendsAsync(int clubId, int days)
    {
        var trends = new List<FeatureAdoptionTrend>();
        var cutoffDate = DateTime.UtcNow.AddDays(-days);

        var dailyUsage = await _context.FeatureUsageEvents
            .Where(f => f.ClubId == clubId && f.UsedAt >= cutoffDate)
            .GroupBy(f => new { f.FeatureName, Date = f.UsedAt.Date })
            .Select(g => new { g.Key.FeatureName, g.Key.Date, NewUsers = g.Select(f => f.MemberId).Distinct().Count() })
            .ToListAsync();

        foreach (var group in dailyUsage.GroupBy(d => d.FeatureName))
        {
            var totalUsers = await _context.FeatureUsageEvents
                .Where(f => f.ClubId == clubId && f.FeatureName == group.Key)
                .Select(f => f.MemberId)
                .Distinct()
                .CountAsync();

            foreach (var daily in group)
            {
                trends.Add(new FeatureAdoptionTrend
                {
                    FeatureName = group.Key,
                    Date = daily.Date,
                    NewUsers = daily.NewUsers,
                    TotalUsers = totalUsers,
                    CumulativeAdoptionRate = totalUsers > 0 ? (double)daily.NewUsers / totalUsers * 100 : 0
                });
            }
        }

        return trends.OrderBy(t => t.Date).ThenBy(t => t.FeatureName).ToList();
    }

    private async Task<List<TenureUsagePattern>> GetTenureUsagePatternsAsync(int clubId, int days)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-days);

        var patterns = await _context.FeatureUsageEvents
            .Where(f => f.ClubId == clubId && f.UsedAt >= cutoffDate)
            .GroupBy(f => new
            {
                TenureRange = f.MemberTenureDays < 30 ? "0-30 days" :
                             f.MemberTenureDays < 90 ? "31-90 days" :
                             f.MemberTenureDays < 180 ? "91-180 days" : "180+ days"
            })
            .Select(g => new TenureUsagePattern
            {
                TenureRange = g.Key.TenureRange,
                MemberCount = g.Select(f => f.MemberId).Distinct().Count(),
                AverageFeatureUsage = (decimal)g.Count() / g.Select(f => f.MemberId).Distinct().Count(),
                PreferredFeatures = g.GroupBy(f => f.FeatureName)
                                   .OrderByDescending(fg => fg.Count())
                                   .Take(3)
                                   .Select(fg => fg.Key)
                                   .ToList()
            })
            .ToListAsync();

        return patterns;
    }

    private async Task<ClubEngagementSummary> GetClubEngagementSummaryAsync(int clubId)
    {
        var scores = await _context.MemberEngagementScores
            .Where(s => s.ClubId == clubId)
            .ToListAsync();

        return new ClubEngagementSummary
        {
            AverageEngagementScore = scores.Any() ? scores.Average(s => s.OverallScore) : 0,
            TotalMembers = scores.Count,
            HighlyActiveMembers = scores.Count(s => s.OverallScore >= 80),
            ModerateMembers = scores.Count(s => s.OverallScore >= 40 && s.OverallScore < 80),
            InactiveMembers = scores.Count(s => s.OverallScore < 40),
            RetentionRate = scores.Any() ? (double)scores.Count(s => !s.IsAtRisk) / scores.Count * 100 : 0
        };
    }

    private async Task<List<EngagementTrend>> GetEngagementTrendsAsync(int clubId, int days)
    {
        var trends = new List<EngagementTrend>();
        var startDate = DateTime.UtcNow.AddDays(-days);

        // Generate daily trends for the last N days
        for (int i = 0; i < days; i++)
        {
            var date = startDate.AddDays(i).Date;
            var nextDate = date.AddDays(1);

            var dailyScore = await _context.MemberEngagementScores
                .Where(s => s.ClubId == clubId && s.CalculatedDate >= date && s.CalculatedDate < nextDate)
                .AverageAsync(s => (decimal?)s.OverallScore) ?? 0;

            var activeMembers = await _context.MemberEngagementScores
                .CountAsync(s => s.ClubId == clubId && s.CalculatedDate >= date && s.CalculatedDate < nextDate && s.OverallScore >= 40);

            trends.Add(new EngagementTrend
            {
                Date = date,
                AverageScore = dailyScore,
                ActiveMembers = activeMembers,
                EngagementChangePercent = 0 // Calculate change from previous day if needed
            });
        }

        // Calculate day-over-day change
        for (int i = 1; i < trends.Count; i++)
        {
            var current = trends[i].AverageScore;
            var previous = trends[i - 1].AverageScore;
            trends[i].EngagementChangePercent = previous > 0 ? (double)((current - previous) / previous * 100) : 0;
        }

        return trends;
    }

    private async Task<List<string>> GetTopFeaturesByPlatformAsync(int clubId, string platform, int limit)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-30);

        return await _context.FeatureUsageEvents
            .Where(f => f.ClubId == clubId && f.Platform.ToLower() == platform.ToLower() && f.UsedAt >= cutoffDate)
            .GroupBy(f => f.FeatureName)
            .OrderByDescending(g => g.Count())
            .Take(limit)
            .Select(g => g.Key)
            .ToListAsync();
    }

    private async Task<int> GetLoginCountAsync(int memberId, int days)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-days);
        return await _context.MemberLoginTrackings
            .CountAsync(l => l.MemberId == memberId && l.LoginTimestamp >= cutoffDate);
    }

    private async Task<DateTime?> GetLastLoginDateAsync(int memberId)
    {
        return await _context.MemberLoginTrackings
            .Where(l => l.MemberId == memberId)
            .OrderByDescending(l => l.LoginTimestamp)
            .Select(l => (DateTime?)l.LoginTimestamp)
            .FirstOrDefaultAsync();
    }

    private async Task<int> GetLoginStreakAsync(int memberId)
    {
        var recentLogins = await _context.MemberLoginTrackings
            .Where(l => l.MemberId == memberId)
            .OrderByDescending(l => l.LoginTimestamp)
            .Select(l => l.LoginTimestamp.Date)
            .Distinct()
            .Take(30)
            .ToListAsync();

        if (!recentLogins.Any()) return 0;

        int streak = 1;
        var currentDate = recentLogins[0];

        for (int i = 1; i < recentLogins.Count; i++)
        {
            if (currentDate.AddDays(-1) == recentLogins[i])
            {
                streak++;
                currentDate = recentLogins[i];
            }
            else
            {
                break;
            }
        }

        return streak;
    }

    private async Task<decimal> GetAverageSessionDurationAsync(int memberId)
    {
        var sessions = await _context.MemberActivitySessions
            .Where(s => s.MemberId == memberId && s.EndTime.HasValue)
            .ToListAsync();

        if (!sessions.Any()) return 0;

        var totalMinutes = sessions.Sum(s => (s.EndTime!.Value - s.StartTime).TotalMinutes);
        return (decimal)(totalMinutes / sessions.Count);
    }

    #endregion
}