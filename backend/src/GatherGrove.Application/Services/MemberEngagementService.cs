using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using System.Text.Json;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service implementation for managing member engagement scoring and analytics
/// </summary>
public class MemberEngagementService : IMemberEngagementService
{
    private readonly GatherGroveDbContext _context;
    private readonly IEngagementScoringService _scoringService;
    private readonly ILogger<MemberEngagementService> _logger;
    private readonly ICommunicationsService _communicationsService;

    public MemberEngagementService(
        GatherGroveDbContext context,
        IEngagementScoringService scoringService,
        ILogger<MemberEngagementService> logger,
        ICommunicationsService communicationsService)
    {
        _context = context;
        _scoringService = scoringService;
        _logger = logger;
        _communicationsService = communicationsService;
    }

    /// <inheritdoc />
    public async Task<MemberEngagementScore> CalculateEngagementScore(int memberId, bool forceRecalculation = false)
    {
        var member = await _context.Members.FindAsync(memberId);
        if (member == null)
        {
            throw new ArgumentException($"Member with ID {memberId} not found");
        }

        // Check if we have a recent score and force recalculation is not requested
        var existingScore = await _context.MemberEngagementScores
            .FirstOrDefaultAsync(s => s.MemberId == memberId);

        if (existingScore != null && !forceRecalculation &&
            DateTime.UtcNow.Subtract(existingScore.CalculatedDate).TotalHours < 24)
        {
            return existingScore;
        }

        // Calculate component scores
        var overallScore = await _scoringService.CalculateEngagementScoreAsync(memberId);
        var loginScore = await _scoringService.CalculateLoginScoreAsync(memberId);
        var eventScore = await _scoringService.CalculateEventScoreAsync(memberId);
        var communicationScore = await _scoringService.CalculateCommunicationScoreAsync(memberId);
        var featureUsageScore = await _scoringService.CalculateFeatureUsageScoreAsync(memberId);
        var profileCompletenessScore = await _scoringService.CalculateProfileCompletenessScoreAsync(memberId);

        var engagementLevel = _scoringService.DetermineEngagementLevel(overallScore);

        // Update or create engagement score record
        if (existingScore != null)
        {
            existingScore.OverallScore = overallScore;
            existingScore.LoginScore = loginScore;
            existingScore.EventScore = eventScore;
            existingScore.CommunicationScore = communicationScore;
            existingScore.FeatureUsageScore = featureUsageScore;
            existingScore.ProfileCompletenessScore = profileCompletenessScore;
            existingScore.EngagementLevel = engagementLevel.ToString();
            existingScore.CalculatedDate = DateTime.UtcNow;
        }
        else
        {
            existingScore = new MemberEngagementScore
            {
                MemberId = memberId,
                ClubId = member.ClubId,
                OverallScore = overallScore,
                LoginScore = loginScore,
                EventScore = eventScore,
                CommunicationScore = communicationScore,
                FeatureUsageScore = featureUsageScore,
                ProfileCompletenessScore = profileCompletenessScore,
                EngagementLevel = engagementLevel.ToString(),
                CalculatedDate = DateTime.UtcNow
            };

            _context.MemberEngagementScores.Add(existingScore);
        }

        await _context.SaveChangesAsync();

        // Create engagement history record
        await CreateEngagementHistoryRecord(existingScore);

        _logger.LogInformation("Calculated engagement score for member {MemberId}: {Score} ({Level})",
            memberId, overallScore, engagementLevel);

        return existingScore;
    }

    /// <inheritdoc />
    public async Task<MemberEngagementScore?> GetMemberEngagementScore(int memberId)
    {
        return await _context.MemberEngagementScores
            .Include(s => s.Member)
            .FirstOrDefaultAsync(s => s.MemberId == memberId);
    }

    /// <inheritdoc />
    public async Task<List<MemberEngagementScore>> GetEngagementScores(int clubId, EngagementLevel? level = null)
    {
        var query = _context.MemberEngagementScores
            .Include(s => s.Member)
            .Where(s => s.ClubId == clubId);

        if (level.HasValue)
        {
            query = query.Where(s => s.EngagementLevel == level.Value.ToString());
        }

        return await query
            .OrderByDescending(s => s.OverallScore)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<List<MemberEngagementScore>> GetAtRiskMembers(int clubId, decimal threshold = 40m)
    {
        return await _context.MemberEngagementScores
            .Include(s => s.Member)
            .Where(s => s.ClubId == clubId && s.OverallScore < threshold)
            .OrderBy(s => s.OverallScore)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<List<MemberEngagementHistory>> GetEngagementHistory(int memberId, int daysBack = 90)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysBack);

        return await _context.MemberEngagementHistories
            .Where(h => h.MemberId == memberId && h.RecordedAt >= cutoffDate)
            .OrderByDescending(h => h.RecordedAt)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<MemberEngagementScore> UpdateEngagementOnActivity(int memberId, string activityType, object? metadata = null)
    {
        _logger.LogInformation("Updating engagement for member {MemberId} on activity {ActivityType}",
            memberId, activityType);

        // For real-time updates, we recalculate the score
        return await CalculateEngagementScore(memberId, forceRecalculation: true);
    }

    /// <inheritdoc />
    public async Task<List<MemberEngagementAlert>> ProcessEngagementAlerts(int clubId)
    {
        var atRiskMembers = await GetAtRiskMembers(clubId, 30m); // Members with score < 30
        var alerts = new List<MemberEngagementAlert>();

        foreach (var member in atRiskMembers)
        {
            // Check if we already have a recent alert for this member
            var existingAlert = await _context.MemberEngagementAlerts
                .FirstOrDefaultAsync(a => a.MemberId == member.MemberId &&
                                        a.IsResolved == false &&
                                        DateTime.UtcNow.Subtract(a.CreatedAt).TotalDays < 7);

            if (existingAlert != null) continue;

            var severity = member.OverallScore switch
            {
                < 10 => AlertSeverity.Critical,
                < 20 => AlertSeverity.High,
                < 30 => AlertSeverity.Medium,
                _ => AlertSeverity.Low
            };

            var alert = new MemberEngagementAlert
            {
                MemberId = member.MemberId,
                Type = AlertType.AtRisk,
                Severity = severity,
                TriggerScore = member.OverallScore,
                ScoreChange = 0, // Calculate based on previous score if available
                Message = $"Member engagement score is {member.OverallScore:F1} - requires attention",
                RecommendedActions = "Consider personal outreach or re-engagement campaign",
                CreatedAt = DateTime.UtcNow,
                IsResolved = false
            };

            _context.MemberEngagementAlerts.Add(alert);
            alerts.Add(alert);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Processed {AlertCount} engagement alerts for club {ClubId}",
            alerts.Count, clubId);

        return alerts;
    }

    /// <inheritdoc />
    public async Task<List<MemberEngagementAlert>> GetEngagementAlerts(int clubId, AlertSeverity? severity = null)
    {
        var query = _context.MemberEngagementAlerts
            .Include(a => a.Member)
            .Where(a => a.Member.ClubId == clubId && !a.IsResolved);

        if (severity.HasValue)
        {
            query = query.Where(a => a.Severity == severity.Value);
        }

        return await query
            .OrderByDescending(a => a.Severity)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<MemberEngagementAlert> ResolveAlert(int alertId, int resolvedByUserId, string? resolutionNotes = null)
    {
        var alert = await _context.MemberEngagementAlerts.FindAsync(alertId);
        if (alert == null)
        {
            throw new ArgumentException($"Alert with ID {alertId} not found");
        }

        alert.IsResolved = true;
        alert.ResolvedAt = DateTime.UtcNow;
        alert.ResolvedByUserId = resolvedByUserId;
        alert.ResolutionNotes = resolutionNotes;

        await _context.SaveChangesAsync();

        return alert;
    }

    /// <inheritdoc />
    public async Task<BulkActionResult> ExecuteBulkAction(int clubId, BulkActionType actionType, EngagementLevel targetLevel, BulkActionOptions? options = null)
    {
        var targetMembers = await GetEngagementScores(clubId, targetLevel);

        var result = new BulkActionResult
        {
            TotalTargeted = targetMembers.Count,
            ActionType = actionType.ToString(),
            ExecutedAt = DateTime.UtcNow
        };

        foreach (var memberScore in targetMembers)
        {
            try
            {
                await ExecuteSingleBulkAction(memberScore, actionType, options);
                result.SuccessfulActions++;
            }
            catch (Exception ex)
            {
                result.FailedActions++;
                result.Errors.Add($"Member {memberScore.MemberId}: {ex.Message}");
                _logger.LogError(ex, "Failed to execute bulk action {ActionType} for member {MemberId}",
                    actionType, memberScore.MemberId);
            }
        }

        return result;
    }

    /// <inheritdoc />
    public async Task<EngagementTrends> GetEngagementTrends(int clubId, int daysBack = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysBack);

        var currentScores = await _context.MemberEngagementScores
            .Where(s => s.ClubId == clubId)
            .ToListAsync();

        // First get raw historical data
        var rawHistoricalData = await _context.MemberEngagementHistories
            .Where(h => h.Member.ClubId == clubId && h.RecordedAt >= cutoffDate)
            .Select(h => new { h.RecordedAt.Date, h.OverallScore, h.Level })
            .ToListAsync();

        // Process in memory to create trend data with dictionary
        var historicalData = rawHistoricalData
            .GroupBy(h => h.Date)
            .Select(g => new DailyEngagementTrend
            {
                Date = g.Key,
                AverageScore = g.Average(h => h.OverallScore),
                ActiveMembers = g.Count(),
                LevelDistribution = g.GroupBy(h => h.Level)
                    .ToDictionary(lg => lg.Key, lg => lg.Count())
            })
            .OrderBy(t => t.Date)
            .ToList();

        return new EngagementTrends
        {
            TotalMembers = currentScores.Count,
            AverageScore = currentScores.Any() ? currentScores.Average(s => s.OverallScore) : 0,
            // BUG FIX: Use TryParse to handle invalid/legacy EngagementLevel values like "Unknown"
            MembersByLevel = currentScores
                .GroupBy(s => Enum.TryParse<EngagementLevel>(s.EngagementLevel, out var level) ? level : EngagementLevel.Red)
                .ToDictionary(g => g.Key, g => g.Count()),
            DailyTrends = historicalData,
            AtRiskMembers = currentScores.Count(s => s.OverallScore < 40),
            // Calculate trends and improvements would require more complex logic
            ScoreChange = 0, // Placeholder
            NewlyAtRisk = 0, // Placeholder
            ImprovedMembers = 0 // Placeholder
        };
    }

    /// <inheritdoc />
    public async Task<int> RecalculateClubEngagementScores(int clubId)
    {
        var members = await _context.Members
            .Where(m => m.ClubId == clubId && m.Status == "Active")
            .Select(m => m.Id)
            .ToListAsync();

        var recalculatedCount = 0;
        foreach (var memberId in members)
        {
            try
            {
                await CalculateEngagementScore(memberId, forceRecalculation: true);
                recalculatedCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to recalculate engagement score for member {MemberId}", memberId);
            }
        }

        _logger.LogInformation("Recalculated engagement scores for {Count} members in club {ClubId}",
            recalculatedCount, clubId);

        return recalculatedCount;
    }

    /// <inheritdoc />
    public async Task<MemberLoginTracking> TrackMemberLogin(int memberId, string sessionId, string platform, object? metadata = null)
    {
        var loginTracking = new MemberLoginTracking
        {
            MemberId = memberId,
            SessionId = sessionId,
            LoginTimestamp = DateTime.UtcNow,
            Platform = platform,
            IsSuccessful = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<MemberLoginTracking>().Add(loginTracking);
        await _context.SaveChangesAsync();

        // Update engagement score for real-time tracking
        _ = Task.Run(async () =>
        {
            try
            {
                await UpdateEngagementOnActivity(memberId, "login", metadata);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update engagement score after login for member {MemberId}", memberId);
            }
        });

        return loginTracking;
    }

    /// <inheritdoc />
    public async Task<ProfileCompletenessTracking> UpdateProfileCompleteness(int memberId)
    {
        var member = await _context.Members
            .Include(m => m.CustomFieldValues)
            .ThenInclude(cfv => cfv.CustomField)
            .FirstOrDefaultAsync(m => m.Id == memberId);

        if (member == null)
        {
            throw new ArgumentException($"Member with ID {memberId} not found");
        }

        // Calculate completeness
        var requiredFields = new[] { "FullName", "Email" };
        var optionalFields = new[] { "PhoneNumber", "Address" };

        var completedRequired = 0;
        var completedOptional = 0;

        // Check built-in fields
        if (!string.IsNullOrWhiteSpace(member.FullName)) completedRequired++;
        if (!string.IsNullOrWhiteSpace(member.Email)) completedRequired++;
        if (!string.IsNullOrWhiteSpace(member.PhoneNumber)) completedOptional++;
        if (!string.IsNullOrWhiteSpace(member.Address)) completedOptional++;

        // Add custom fields
        var customFieldCount = member.CustomFieldValues.Count;
        var clubCustomFields = await _context.ClubCustomFields
            .Where(cf => cf.ClubId == member.ClubId)
            .CountAsync();

        var tracking = new ProfileCompletenessTracking
        {
            MemberId = memberId,
            RequiredFieldsTotal = requiredFields.Length,
            RequiredFieldsCompleted = completedRequired,
            OptionalFieldsTotal = optionalFields.Length + clubCustomFields,
            OptionalFieldsCompleted = completedOptional + customFieldCount,
            CalculatedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        tracking.CalculateCompletionPercentage();

        // Update or create tracking record
        var existingTracking = await _context.Set<ProfileCompletenessTracking>()
            .FirstOrDefaultAsync(t => t.MemberId == memberId);

        if (existingTracking != null)
        {
            existingTracking.RequiredFieldsCompleted = tracking.RequiredFieldsCompleted;
            existingTracking.OptionalFieldsCompleted = tracking.OptionalFieldsCompleted;
            existingTracking.CompletionPercentage = tracking.CompletionPercentage;
            existingTracking.CalculatedAt = tracking.CalculatedAt;
            existingTracking.UpdatedAt = tracking.UpdatedAt;
            tracking = existingTracking;
        }
        else
        {
            _context.Set<ProfileCompletenessTracking>().Add(tracking);
        }

        await _context.SaveChangesAsync();

        return tracking;
    }

    /// <inheritdoc />
    public async Task<EngagementOverview> GetEngagementOverview(int clubId)
    {
        var scores = await _context.MemberEngagementScores
            .Where(s => s.ClubId == clubId)
            .ToListAsync();

        var alerts = await _context.MemberEngagementAlerts
            .Include(a => a.Member)
            .Where(a => a.Member.ClubId == clubId && !a.IsResolved)
            .ToListAsync();

        var weights = _scoringService.GetScoreWeights();

        return new EngagementOverview
        {
            TotalMembers = scores.Count,
            AverageScore = scores.Any() ? scores.Average(s => s.OverallScore) : 0,
            HighlyEngaged = scores.Count(s => s.OverallScore >= 80),
            ModeratelyEngaged = scores.Count(s => s.OverallScore >= 60 && s.OverallScore < 80),
            AtRisk = scores.Count(s => s.OverallScore < 40),
            ActiveAlerts = alerts.Count(),
            CriticalAlerts = alerts.Count(a => a.Severity == AlertSeverity.Critical),
            LastCalculated = scores.Any() ? scores.Max(s => s.CalculatedDate) : DateTime.MinValue,
            ComponentBreakdown = weights.ToDictionary(
                kvp => kvp.Key,
                kvp => scores.Any() ? kvp.Key switch
                {
                    "Login" => scores.Average(s => s.LoginScore),
                    "Event" => scores.Average(s => s.EventScore),
                    "Communication" => scores.Average(s => s.CommunicationScore),
                    "FeatureUsage" => scores.Average(s => s.FeatureUsageScore),
                    "ProfileCompleteness" => scores.Average(s => s.ProfileCompletenessScore),
                    _ => 0m
                } : 0m)
        };
    }

    #region Private Helper Methods

    private async Task CreateEngagementHistoryRecord(MemberEngagementScore score)
    {
        var history = new MemberEngagementHistory
        {
            MemberId = score.MemberId,
            OverallScore = score.OverallScore,
            LoginFrequencyScore = score.LoginScore,
            EventParticipationScore = score.EventScore,
            CommunicationScore = score.CommunicationScore,
            FeatureUsageScore = score.FeatureUsageScore,
            ProfileCompletenessScore = score.ProfileCompletenessScore,
            // BUG FIX: Use TryParse to handle invalid/legacy EngagementLevel values like "Unknown"
            Level = Enum.TryParse<EngagementLevel>(score.EngagementLevel, out var level) ? level : EngagementLevel.Red,
            RecordedAt = DateTime.UtcNow,
            MetricsSnapshot = JsonSerializer.Serialize(new Dictionary<string, decimal>
            {
                ["LoginScore"] = score.LoginScore,
                ["EventScore"] = score.EventScore,
                ["CommunicationScore"] = score.CommunicationScore,
                ["FeatureUsageScore"] = score.FeatureUsageScore,
                ["ProfileCompletenessScore"] = score.ProfileCompletenessScore
            })
        };

        _context.MemberEngagementHistories.Add(history);
        await _context.SaveChangesAsync();
    }

    private async Task ExecuteSingleBulkAction(MemberEngagementScore memberScore, BulkActionType actionType, BulkActionOptions? options)
    {
        switch (actionType)
        {
            case BulkActionType.SendReEngagementEmail:
                await ExecuteSendReEngagementEmail(memberScore, options);
                break;
            case BulkActionType.CreateFollowUpTask:
                await ExecuteCreateFollowUpTask(memberScore, options);
                break;
            case BulkActionType.AssignPersonalOutreach:
                await ExecuteAssignPersonalOutreach(memberScore, options);
                break;
            case BulkActionType.AddToSpecialCampaign:
                await ExecuteAddToSpecialCampaign(memberScore, options);
                break;
            case BulkActionType.UpdateMembershipStatus:
                await ExecuteUpdateMembershipStatus(memberScore, options);
                break;
            case BulkActionType.SchedulePhoneCall:
                await ExecuteSchedulePhoneCall(memberScore, options);
                break;
            case BulkActionType.InviteToSpecialEvent:
                await ExecuteInviteToSpecialEvent(memberScore, options);
                break;
            default:
                throw new NotImplementedException($"Bulk action {actionType} is not implemented");
        }
    }

    private async Task ExecuteSendReEngagementEmail(MemberEngagementScore memberScore, BulkActionOptions? options)
    {
        var member = await _context.Members.FindAsync(memberScore.MemberId);
        if (member == null)
            throw new ArgumentException($"Member with ID {memberScore.MemberId} not found");

        var emailTemplate = options?.EmailTemplate ?? "re-engagement-default";
        var customContent = options?.MessageContent ?? GenerateReEngagementMessage(memberScore);

        // Create a communications log entry
        var commLog = new CommunicationsLog
        {
            ClubId = memberScore.ClubId,
            CommunicationType = "Email",
            Subject = "We miss you! Let's reconnect",
            Body = customContent,
            RecipientCount = 1,
            Recipients = member.Email,
            SentByUserId = 1, // System user or admin
            SentAt = DateTime.UtcNow,
            Status = "Sent",
            CreatedAt = DateTime.UtcNow
        };

        _context.CommunicationsLogs.Add(commLog);
        await _context.SaveChangesAsync();

        // Log the engagement activity
        _logger.LogInformation("Sent re-engagement email to member {MemberId} with score {Score}",
            memberScore.MemberId, memberScore.OverallScore);
    }

    private async Task ExecuteCreateFollowUpTask(MemberEngagementScore memberScore, BulkActionOptions? options)
    {
        var member = await _context.Members.FindAsync(memberScore.MemberId);
        if (member == null)
            throw new ArgumentException($"Member with ID {memberScore.MemberId} not found");

        // Create an engagement alert that acts as a follow-up task
        var alert = new MemberEngagementAlert
        {
            MemberId = memberScore.MemberId,
            Type = AlertType.FollowUp,
            Severity = memberScore.OverallScore < 20 ? AlertSeverity.Critical :
                      memberScore.OverallScore < 40 ? AlertSeverity.High : AlertSeverity.Medium,
            TriggerScore = memberScore.OverallScore,
            Message = options?.MessageContent ?? $"Follow up with {member.FullName} - engagement score: {memberScore.OverallScore:F1}",
            RecommendedActions = "Personal outreach, phone call, or meeting recommended",
            CreatedAt = DateTime.UtcNow,
            IsResolved = false
        };

        _context.MemberEngagementAlerts.Add(alert);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created follow-up task for member {MemberId} with score {Score}",
            memberScore.MemberId, memberScore.OverallScore);
    }

    private async Task ExecuteAssignPersonalOutreach(MemberEngagementScore memberScore, BulkActionOptions? options)
    {
        var member = await _context.Members.FindAsync(memberScore.MemberId);
        if (member == null)
            throw new ArgumentException($"Member with ID {memberScore.MemberId} not found");

        // Create a high-priority engagement alert for personal outreach
        var alert = new MemberEngagementAlert
        {
            MemberId = memberScore.MemberId,
            Type = AlertType.PersonalOutreach,
            Severity = AlertSeverity.High,
            TriggerScore = memberScore.OverallScore,
            Message = $"Personal outreach assigned for {member.FullName}",
            RecommendedActions = options?.MessageContent ?? "Schedule 1-on-1 meeting or personal call",
            CreatedAt = DateTime.UtcNow,
            IsResolved = false
        };

        // If a specific user is assigned, record it
        if (options?.AssignedUserId.HasValue == true)
        {
            alert.ResolvedByUserId = options.AssignedUserId.Value;
            alert.ResolutionNotes = $"Assigned to user ID: {options.AssignedUserId.Value}";
        }

        _context.MemberEngagementAlerts.Add(alert);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Assigned personal outreach for member {MemberId} to user {UserId}",
            memberScore.MemberId, options?.AssignedUserId);
    }

    private async Task ExecuteAddToSpecialCampaign(MemberEngagementScore memberScore, BulkActionOptions? options)
    {
        var member = await _context.Members.FindAsync(memberScore.MemberId);
        if (member == null)
            throw new ArgumentException($"Member with ID {memberScore.MemberId} not found");

        // Create a custom field value or update member notes to track campaign membership
        var campaignName = options?.CustomProperties.GetValueOrDefault("CampaignName")?.ToString() ?? "Re-engagement Campaign";

        // Log the campaign assignment as a communication entry
        var commLog = new CommunicationsLog
        {
            ClubId = memberScore.ClubId,
            CommunicationType = "Campaign",
            Subject = $"Added to {campaignName}",
            Body = $"Member {member.FullName} added to special campaign due to engagement score: {memberScore.OverallScore:F1}",
            RecipientCount = 1,
            Recipients = member.Email,
            SentByUserId = 1, // System user or admin
            SentAt = DateTime.UtcNow,
            Status = "Processed",
            CreatedAt = DateTime.UtcNow
        };

        _context.CommunicationsLogs.Add(commLog);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Added member {MemberId} to campaign {CampaignName}",
            memberScore.MemberId, campaignName);
    }

    private async Task ExecuteUpdateMembershipStatus(MemberEngagementScore memberScore, BulkActionOptions? options)
    {
        var member = await _context.Members.FindAsync(memberScore.MemberId);
        if (member == null)
            throw new ArgumentException($"Member with ID {memberScore.MemberId} not found");

        var newStatus = options?.CustomProperties.GetValueOrDefault("NewStatus")?.ToString();

        if (string.IsNullOrWhiteSpace(newStatus))
        {
            // Default status based on engagement score
            newStatus = memberScore.OverallScore < 20 ? "At Risk" :
                       memberScore.OverallScore < 40 ? "Needs Attention" : "Active";
        }

        var oldStatus = member.Status;
        member.Status = newStatus;
        member.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Log the status change
        var commLog = new CommunicationsLog
        {
            ClubId = memberScore.ClubId,
            CommunicationType = "Status Update",
            Subject = "Member Status Updated",
            Body = $"Member {member.FullName} status changed from '{oldStatus}' to '{newStatus}' based on engagement score: {memberScore.OverallScore:F1}",
            RecipientCount = 1,
            Recipients = member.Email,
            SentByUserId = 1, // System user or admin
            SentAt = DateTime.UtcNow,
            Status = "Processed",
            CreatedAt = DateTime.UtcNow
        };

        _context.CommunicationsLogs.Add(commLog);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated member {MemberId} status from {OldStatus} to {NewStatus}",
            memberScore.MemberId, oldStatus, newStatus);
    }

    private async Task ExecuteSchedulePhoneCall(MemberEngagementScore memberScore, BulkActionOptions? options)
    {
        var member = await _context.Members.FindAsync(memberScore.MemberId);
        if (member == null)
            throw new ArgumentException($"Member with ID {memberScore.MemberId} not found");

        // Create a high-priority alert for phone call scheduling
        var scheduledDate = options?.CustomProperties.GetValueOrDefault("ScheduledDate")?.ToString();
        var callNotes = options?.MessageContent ?? "Phone call needed due to low engagement";

        var alert = new MemberEngagementAlert
        {
            MemberId = memberScore.MemberId,
            Type = AlertType.PhoneCallScheduled,
            Severity = AlertSeverity.Medium,
            TriggerScore = memberScore.OverallScore,
            Message = $"Phone call scheduled for {member.FullName}",
            RecommendedActions = callNotes + (scheduledDate != null ? $" - Scheduled for: {scheduledDate}" : ""),
            CreatedAt = DateTime.UtcNow,
            IsResolved = false
        };

        if (options?.AssignedUserId.HasValue == true)
        {
            alert.ResolvedByUserId = options.AssignedUserId.Value;
        }

        _context.MemberEngagementAlerts.Add(alert);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Scheduled phone call for member {MemberId} with score {Score}",
            memberScore.MemberId, memberScore.OverallScore);
    }

    private async Task ExecuteInviteToSpecialEvent(MemberEngagementScore memberScore, BulkActionOptions? options)
    {
        var member = await _context.Members.FindAsync(memberScore.MemberId);
        if (member == null)
            throw new ArgumentException($"Member with ID {memberScore.MemberId} not found");

        var eventName = options?.CustomProperties.GetValueOrDefault("EventName")?.ToString() ?? "Special Re-engagement Event";
        var invitation = options?.MessageContent ?? GenerateEventInvitationMessage(member, eventName, memberScore);

        // Create a communications log entry for the event invitation
        var commLog = new CommunicationsLog
        {
            ClubId = memberScore.ClubId,
            CommunicationType = "Event Invitation",
            Subject = $"Special invitation to {eventName}",
            Body = invitation,
            RecipientCount = 1,
            Recipients = member.Email,
            SentByUserId = 1, // System user or admin
            SentAt = DateTime.UtcNow,
            Status = "Sent",
            CreatedAt = DateTime.UtcNow
        };

        _context.CommunicationsLogs.Add(commLog);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Sent special event invitation to member {MemberId} for event {EventName}",
            memberScore.MemberId, eventName);
    }

    private string GenerateReEngagementMessage(MemberEngagementScore memberScore)
    {
        var member = _context.Members.FirstOrDefault(m => m.Id == memberScore.MemberId);
        var memberName = member?.FullName ?? "Member";

        return $"Hi {memberName},\n\n" +
               "We've noticed you haven't been as active with us lately, and we miss you! " +
               "Your engagement and participation are important to our club community.\n\n" +
               "We'd love to reconnect and see how we can better serve you. " +
               "Please don't hesitate to reach out if there's anything we can help with.\n\n" +
               "Looking forward to seeing you again soon!\n\n" +
               "Best regards,\nYour Club Team";
    }

    private string GenerateEventInvitationMessage(Member member, string eventName, MemberEngagementScore memberScore)
    {
        return $"Hi {member.FullName},\n\n" +
               $"You're cordially invited to our special event: {eventName}\n\n" +
               "As a valued member, we'd love to have you join us for this exclusive gathering. " +
               "It's a great opportunity to reconnect with fellow members and enjoy some great activities.\n\n" +
               "We hope to see you there!\n\n" +
               "Best regards,\nYour Club Team";
    }

    #endregion
}