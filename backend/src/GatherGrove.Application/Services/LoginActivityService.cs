using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for tracking and analyzing member login activity
/// </summary>
public class LoginActivityService : ILoginActivityService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<LoginActivityService> _logger;

    public LoginActivityService(GatherGroveDbContext context, ILogger<LoginActivityService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task RecordLoginEventAsync(int userId, int? memberId, int? clubId, string platform, string? deviceType, string sessionId)
    {
        try
        {
            // Update or create analytics session with login tracking
            var session = await _context.AnalyticsSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session != null)
            {
                session.IsLoginSession = true;
                session.LastLoginAt = DateTime.UtcNow;
                session.IsSuccessfulLogin = true;
                session.LoginMethod = "email"; // Default, could be enhanced
            }
            else
            {
                session = new AnalyticsSession
                {
                    Id = sessionId,
                    UserId = userId,
                    MemberId = memberId,
                    ClubId = clubId,
                    Platform = platform,
                    DeviceType = deviceType,
                    StartedAt = DateTime.UtcNow,
                    LastActivityAt = DateTime.UtcNow,
                    IsLoginSession = true,
                    LastLoginAt = DateTime.UtcNow,
                    IsSuccessfulLogin = true,
                    LoginMethod = "email"
                };
                _context.AnalyticsSessions.Add(session);
            }

            // Record login event
            var loginEvent = new AnalyticsEvent
            {
                EventType = "Login",
                Category = "Authentication",
                Action = "Login_Success",
                Label = platform,
                UserId = userId,
                MemberId = memberId,
                ClubId = clubId,
                SessionId = sessionId,
                Platform = platform,
                DeviceType = deviceType,
                CreatedAt = DateTime.UtcNow
            };
            _context.AnalyticsEvents.Add(loginEvent);

            // Update login streak if member exists
            if (memberId.HasValue)
            {
                await UpdateLoginStreakAsync(memberId.Value);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Recorded login event for user {UserId}, member {MemberId}, club {ClubId}",
                userId, memberId, clubId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record login event for user {UserId}", userId);
        }
    }

    public async Task RecordFailedLoginAsync(string email, string reason, string platform, string? deviceType)
    {
        try
        {
            var failedLoginEvent = new AnalyticsEvent
            {
                EventType = "Login",
                Category = "Authentication",
                Action = "Login_Failed",
                Label = reason,
                SessionId = Guid.NewGuid().ToString(),
                Platform = platform,
                DeviceType = deviceType,
                CreatedAt = DateTime.UtcNow,
                Properties = System.Text.Json.JsonSerializer.Serialize(new { Email = email, Reason = reason })
            };

            _context.AnalyticsEvents.Add(failedLoginEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Recorded failed login attempt for email {Email}, reason: {Reason}", email, reason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record failed login event for email {Email}", email);
        }
    }

    public async Task<LoginActivityStatsDto> GetClubLoginStatsAsync(int clubId, int days = 30)
    {
        var startDate = DateTime.UtcNow.AddDays(-days);

        var stats = await _context.AnalyticsEvents
            .Where(e => e.ClubId == clubId &&
                       e.EventType == "Login" &&
                       e.Action == "Login_Success" &&
                       e.CreatedAt >= startDate)
            .GroupBy(e => new { e.MemberId })
            .Select(g => new
            {
                MemberId = g.Key.MemberId,
                LoginCount = g.Count(),
                LastLogin = g.Max(e => e.CreatedAt),
                Platforms = g.Select(e => e.Platform).Distinct().Count()
            })
            .ToListAsync();

        var totalMembers = await _context.Members.CountAsync(m => m.ClubId == clubId && m.Status == "Active");

        var loginTrends = await GetLoginTrendsAsync(clubId, days);

        return new LoginActivityStatsDto
        {
            ClubId = clubId,
            PeriodDays = days,
            TotalMembers = totalMembers,
            MembersWithLogins = stats.Count,
            TotalLogins = stats.Sum(s => s.LoginCount),
            AverageLoginsPerMember = stats.Any() ? (decimal)stats.Average(s => s.LoginCount) : 0,
            DailyActiveUsers = stats.Count(s => s.LastLogin >= DateTime.UtcNow.AddDays(-1)),
            WeeklyActiveUsers = stats.Count(s => s.LastLogin >= DateTime.UtcNow.AddDays(-7)),
            MonthlyActiveUsers = stats.Count(s => s.LastLogin >= DateTime.UtcNow.AddDays(-30)),
            InactiveMembers = totalMembers - stats.Count(s => s.LastLogin >= DateTime.UtcNow.AddDays(-30)),
            LoginTrends = loginTrends
        };
    }

    public async Task<List<MemberLoginActivityDto>> GetMemberLoginActivityAsync(int clubId, int days = 30)
    {
        var startDate = DateTime.UtcNow.AddDays(-days);

        var members = await _context.Members
            .Where(m => m.ClubId == clubId && m.Status == "Active")
            .ToListAsync();

        var result = new List<MemberLoginActivityDto>();

        foreach (var member in members)
        {
            var loginEvents = await _context.AnalyticsEvents
                .Where(e => e.MemberId == member.Id &&
                           e.EventType == "Login" &&
                           e.Action == "Login_Success" &&
                           e.CreatedAt >= startDate)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();
            var lastLogin = loginEvents.FirstOrDefault()?.CreatedAt;
            var daysSinceLastLogin = lastLogin.HasValue ?
                (int)(DateTime.UtcNow - lastLogin.Value).TotalDays : int.MaxValue;

            var activityLevel = ClassifyActivityLevel(loginEvents.Count, daysSinceLastLogin);

            result.Add(new MemberLoginActivityDto
            {
                MemberId = member.Id,
                MemberName = member.FullName,
                Email = member.Email,
                LastLoginDate = lastLogin,
                LoginCount = loginEvents.Count,
                DaysSinceLastLogin = daysSinceLastLogin == int.MaxValue ? null : daysSinceLastLogin,
                ActivityLevel = activityLevel,
                IsAtRisk = daysSinceLastLogin >= 30,
                LoginFrequency = CalculateLoginFrequency(loginEvents, days),
                PlatformsUsed = loginEvents.Select(e => e.Platform).Distinct().ToList()
            });
        }

        return result.OrderByDescending(r => r.LastLoginDate ?? DateTime.MinValue).ToList();
    }

    public async Task<List<MemberLoginActivityDto>> GetInactiveMembersAsync(int clubId, int inactiveDays = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-inactiveDays);

        var inactiveMembers = await (from m in _context.Members
                                     where m.ClubId == clubId && m.Status == "Active"
                                     let lastLogin = _context.AnalyticsEvents
                                         .Where(e => e.MemberId == m.Id &&
                                                    e.EventType == "Login" &&
                                                    e.Action == "Login_Success")
                                         .OrderByDescending(e => e.CreatedAt)
                                         .Select(e => e.CreatedAt)
                                         .FirstOrDefault()
                                     where lastLogin == default(DateTime) || lastLogin < cutoffDate
                                     select new MemberLoginActivityDto
                                     {
                                         MemberId = m.Id,
                                         MemberName = m.FullName,
                                         Email = m.Email,
                                         LastLoginDate = lastLogin == default(DateTime) ? null : lastLogin,
                                         LoginCount = 0,
                                         DaysSinceLastLogin = lastLogin == default(DateTime) ?
                                             null : (int)(DateTime.UtcNow - lastLogin).TotalDays,
                                         ActivityLevel = "Inactive",
                                         IsAtRisk = true,
                                         LoginFrequency = "Never",
                                         PlatformsUsed = new List<string>()
                                     })
                                   .ToListAsync();

        return inactiveMembers;
    }

    public async Task<List<LoginTrendDto>> GetLoginTrendsAsync(int clubId, int days = 90)
    {
        var startDate = DateTime.UtcNow.AddDays(-days).Date;

        var dailyLogins = await _context.AnalyticsEvents
            .Where(e => e.ClubId == clubId &&
                       e.EventType == "Login" &&
                       e.Action == "Login_Success" &&
                       e.CreatedAt >= startDate)
            .GroupBy(e => e.CreatedAt.Date)
            .Select(g => new LoginTrendDto
            {
                Date = g.Key,
                TotalLogins = g.Count(),
                UniqueUsers = g.Select(e => e.MemberId).Distinct().Count(),
                WebLogins = g.Count(e => e.Platform == "web"),
                MobileLogins = g.Count(e => e.Platform == "mobile")
            })
            .OrderBy(t => t.Date)
            .ToListAsync();

        // Fill in missing days with zero values
        var allDays = Enumerable.Range(0, days)
            .Select(i => startDate.AddDays(i))
            .ToList();

        var result = allDays.Select(date =>
        {
            var existing = dailyLogins.FirstOrDefault(d => d.Date == date);
            return existing ?? new LoginTrendDto
            {
                Date = date,
                TotalLogins = 0,
                UniqueUsers = 0,
                WebLogins = 0,
                MobileLogins = 0
            };
        }).ToList();

        return result;
    }

    public async Task UpdateLoginStreakAsync(int memberId)
    {
        try
        {
            var member = await _context.Members.FindAsync(memberId);
            if (member == null) return;

            // Get member's login history
            var recentLogins = await _context.AnalyticsEvents
                .Where(e => e.MemberId == memberId &&
                           e.EventType == "Login" &&
                           e.Action == "Login_Success")
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => e.CreatedAt.Date)
                .Distinct()
                .Take(100) // Limit for performance
                .ToListAsync();

            if (!recentLogins.Any()) return;

            // Calculate login streak
            var streak = CalculateLoginStreak(recentLogins);

            // Update engagement score if it exists
            var today = DateTime.UtcNow.Date;
            var engagementScore = await _context.MemberEngagementScores
                .FirstOrDefaultAsync(s => s.MemberId == memberId && s.CalculatedDate.Date == today);

            if (engagementScore != null)
            {
                engagementScore.LoginStreakDays = streak;
                engagementScore.LastLoginDate = recentLogins.First();
                engagementScore.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update login streak for member {MemberId}", memberId);
        }
    }

    public async Task UpdateMemberEngagementScoresAsync(int clubId)
    {
        try
        {
            var members = await _context.Members
                .Where(m => m.ClubId == clubId && m.Status == "Active")
                .ToListAsync();

            var today = DateTime.UtcNow.Date;

            foreach (var member in members)
            {
                var loginStats = await GetMemberLoginStatsAsync(member.Id);
                var engagementScore = await CalculateMemberEngagementScoreAsync(member.Id, loginStats);

                var existingScore = await _context.MemberEngagementScores
                    .FirstOrDefaultAsync(s => s.MemberId == member.Id && s.CalculatedDate.Date == today);

                if (existingScore != null)
                {
                    // Update existing score
                    existingScore.OverallScore = engagementScore.OverallScore;
                    existingScore.LoginScore = engagementScore.LoginScore;
                    existingScore.LoginCount7Days = engagementScore.LoginCount7Days;
                    existingScore.LoginCount30Days = engagementScore.LoginCount30Days;
                    existingScore.LoginCount90Days = engagementScore.LoginCount90Days;
                    existingScore.LastLoginDate = engagementScore.LastLoginDate;
                    existingScore.LoginStreakDays = engagementScore.LoginStreakDays;
                    existingScore.ActivityLevel = engagementScore.ActivityLevel;
                    existingScore.DaysSinceLastLogin = engagementScore.DaysSinceLastLogin;
                    existingScore.IsAtRisk = engagementScore.IsAtRisk;
                    existingScore.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Create new score
                    engagementScore.MemberId = member.Id;
                    engagementScore.ClubId = clubId;
                    engagementScore.CalculatedDate = today;
                    engagementScore.CreatedAt = DateTime.UtcNow;
                    engagementScore.UpdatedAt = DateTime.UtcNow;

                    _context.MemberEngagementScores.Add(engagementScore);
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated engagement scores for {MemberCount} members in club {ClubId}",
                members.Count, clubId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update member engagement scores for club {ClubId}", clubId);
        }
    }

    private async Task<MemberLoginStatsDto> GetMemberLoginStatsAsync(int memberId)
    {
        var now = DateTime.UtcNow;
        var sevenDaysAgo = now.AddDays(-7);
        var thirtyDaysAgo = now.AddDays(-30);
        var ninetyDaysAgo = now.AddDays(-90);

        var loginEvents = await _context.AnalyticsEvents
            .Where(e => e.MemberId == memberId &&
                       e.EventType == "Login" &&
                       e.Action == "Login_Success" &&
                       e.CreatedAt >= ninetyDaysAgo)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        var lastLogin = loginEvents.FirstOrDefault()?.CreatedAt;
        var daysSinceLastLogin = lastLogin.HasValue ? (int)(now - lastLogin.Value).TotalDays : int.MaxValue;

        return new MemberLoginStatsDto
        {
            LoginCount7Days = loginEvents.Count(e => e.CreatedAt >= sevenDaysAgo),
            LoginCount30Days = loginEvents.Count(e => e.CreatedAt >= thirtyDaysAgo),
            LoginCount90Days = loginEvents.Count(),
            LastLoginDate = lastLogin,
            DaysSinceLastLogin = daysSinceLastLogin == int.MaxValue ? null : daysSinceLastLogin,
            LoginDates = loginEvents.Select(e => e.CreatedAt.Date).Distinct().ToList()
        };
    }

    private async Task<MemberEngagementScore> CalculateMemberEngagementScoreAsync(int memberId, MemberLoginStatsDto loginStats)
    {
        // Login score calculation (25% of total)
        var loginScore = CalculateLoginScore(loginStats);

        // TODO: Calculate other engagement factors
        var eventScore = 0m; // 30% weight - event participation
        var communicationScore = 0m; // 20% weight - email/communication engagement  
        var featureUsageScore = 0m; // 15% weight - platform feature usage
        var profileCompletenessScore = 0m; // 10% weight - profile completion

        var overallScore = (loginScore * 0.25m) +
                          (eventScore * 0.30m) +
                          (communicationScore * 0.20m) +
                          (featureUsageScore * 0.15m) +
                          (profileCompletenessScore * 0.10m);

        var activityLevel = ClassifyActivityLevel(loginStats.LoginCount30Days, loginStats.DaysSinceLastLogin ?? int.MaxValue);

        return new MemberEngagementScore
        {
            OverallScore = Math.Round(overallScore, 2),
            LoginScore = Math.Round(loginScore, 2),
            EventScore = eventScore,
            CommunicationScore = communicationScore,
            FeatureUsageScore = featureUsageScore,
            ProfileCompletenessScore = profileCompletenessScore,
            LoginCount7Days = loginStats.LoginCount7Days,
            LoginCount30Days = loginStats.LoginCount30Days,
            LoginCount90Days = loginStats.LoginCount90Days,
            LastLoginDate = loginStats.LastLoginDate,
            LoginStreakDays = CalculateLoginStreak(loginStats.LoginDates),
            ActivityLevel = activityLevel,
            DaysSinceLastLogin = loginStats.DaysSinceLastLogin ?? 0,
            IsAtRisk = (loginStats.DaysSinceLastLogin ?? 0) >= 30
        };
    }

    private decimal CalculateLoginScore(MemberLoginStatsDto stats)
    {
        // Base score on login frequency over different periods
        var score = 0m;

        // Recent activity (last 7 days) - high weight
        if (stats.LoginCount7Days >= 5) score += 40m;
        else if (stats.LoginCount7Days >= 3) score += 30m;
        else if (stats.LoginCount7Days >= 1) score += 20m;

        // Monthly activity (last 30 days)
        if (stats.LoginCount30Days >= 20) score += 35m;
        else if (stats.LoginCount30Days >= 10) score += 25m;
        else if (stats.LoginCount30Days >= 5) score += 15m;
        else if (stats.LoginCount30Days >= 1) score += 10m;

        // Consistency bonus (login streak)
        var streak = CalculateLoginStreak(stats.LoginDates);
        if (streak >= 7) score += 15m;
        else if (streak >= 3) score += 10m;
        else if (streak >= 2) score += 5m;

        // Recency penalty
        var daysSinceLogin = stats.DaysSinceLastLogin ?? int.MaxValue;
        if (daysSinceLogin > 30) score *= 0.1m;
        else if (daysSinceLogin > 14) score *= 0.5m;
        else if (daysSinceLogin > 7) score *= 0.8m;

        return Math.Min(100m, Math.Max(0m, score));
    }

    private int CalculateLoginStreak(List<DateTime> loginDates)
    {
        if (!loginDates.Any()) return 0;

        var sortedDates = loginDates.OrderByDescending(d => d).ToList();
        var streak = 1;
        var currentDate = sortedDates[0];

        for (int i = 1; i < sortedDates.Count; i++)
        {
            var previousDate = sortedDates[i];
            var daysDiff = (currentDate - previousDate).TotalDays;

            if (daysDiff <= 1) // Allow for same day or consecutive days
            {
                if (daysDiff > 0) streak++; // Only increment if it's actually a different day
                currentDate = previousDate;
            }
            else
            {
                break;
            }
        }

        return streak;
    }

    private string ClassifyActivityLevel(int loginCount30Days, int daysSinceLastLogin)
    {
        if (daysSinceLastLogin >= 30) return "Inactive";
        if (loginCount30Days >= 15) return "HighlyActive";
        if (loginCount30Days >= 5) return "Moderate";
        return "LowActivity";
    }

    private string CalculateLoginFrequency(List<AnalyticsEvent> loginEvents, int periodDays)
    {
        if (!loginEvents.Any()) return "Never";

        var avgDaysBetweenLogins = periodDays / (double)loginEvents.Count;

        if (avgDaysBetweenLogins <= 1.5) return "Daily";
        if (avgDaysBetweenLogins <= 7) return "Weekly";
        if (avgDaysBetweenLogins <= 30) return "Monthly";
        return "Rarely";
    }
}