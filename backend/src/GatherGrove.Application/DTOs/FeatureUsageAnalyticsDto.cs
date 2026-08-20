namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to track feature usage
/// </summary>
public class TrackFeatureUsageRequest
{
    /// <summary>
    /// Club ID for the feature usage tracking
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Name of the feature being used
    /// </summary>
    public string FeatureName { get; set; } = string.Empty;

    /// <summary>
    /// Platform where feature was used (web/mobile)
    /// </summary>
    public string Platform { get; set; } = string.Empty;

    /// <summary>
    /// Session ID for tracking
    /// </summary>
    public string? SessionId { get; set; }

    /// <summary>
    /// Additional metadata as JSON
    /// </summary>
    public string? Metadata { get; set; }

    /// <summary>
    /// Member ID (will be extracted from claims if not provided)
    /// </summary>
    public int? MemberId { get; set; }
}

/// <summary>
/// Feature usage analytics response
/// </summary>
public class FeatureUsageAnalyticsResponse
{
    /// <summary>
    /// Feature usage statistics by feature
    /// </summary>
    public List<FeatureUsageStatistic> FeatureUsage { get; set; } = new();

    /// <summary>
    /// Platform usage comparison
    /// </summary>
    public PlatformUsageComparison PlatformUsage { get; set; } = new();

    /// <summary>
    /// Feature adoption rates over time
    /// </summary>
    public List<FeatureAdoptionTrend> AdoptionTrends { get; set; } = new();

    /// <summary>
    /// Member tenure-based usage patterns
    /// </summary>
    public List<TenureUsagePattern> TenurePatterns { get; set; } = new();
}

/// <summary>
/// Usage statistics for a specific feature
/// </summary>
public class FeatureUsageStatistic
{
    public string FeatureName { get; set; } = string.Empty;
    public int UsageCount { get; set; }
    public int UniqueUsers { get; set; }
    public double AdoptionRate { get; set; }
    public decimal AverageEngagementScore { get; set; }
    public int TotalSessions { get; set; }
}

/// <summary>
/// Platform usage comparison data
/// </summary>
public class PlatformUsageComparison
{
    public PlatformStats Web { get; set; } = new();
    public PlatformStats Mobile { get; set; } = new();
    public double WebToMobileRatio { get; set; }
}

/// <summary>
/// Platform-specific usage statistics
/// </summary>
public class PlatformStats
{
    public int UsageCount { get; set; }
    public int UniqueUsers { get; set; }
    public List<string> TopFeatures { get; set; } = new();
}

/// <summary>
/// Feature adoption trend over time
/// </summary>
public class FeatureAdoptionTrend
{
    public string FeatureName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int NewUsers { get; set; }
    public int TotalUsers { get; set; }
    public double CumulativeAdoptionRate { get; set; }
}

/// <summary>
/// Usage patterns by member tenure
/// </summary>
public class TenureUsagePattern
{
    public string TenureRange { get; set; } = string.Empty; // e.g., "0-30 days", "31-90 days"
    public int MemberCount { get; set; }
    public decimal AverageFeatureUsage { get; set; }
    public List<string> PreferredFeatures { get; set; } = new();
}

/// <summary>
/// Member engagement analytics response
/// </summary>
public class MemberEngagementAnalyticsResponse
{
    /// <summary>
    /// Club-wide engagement summary
    /// </summary>
    public ClubEngagementSummary ClubSummary { get; set; } = new();

    /// <summary>
    /// Individual member engagement scores
    /// </summary>
    public List<MemberEngagementSummary> MemberEngagement { get; set; } = new();

    /// <summary>
    /// Engagement distribution
    /// </summary>
    public EngagementDistribution Distribution { get; set; } = new();

    /// <summary>
    /// Engagement trends over time
    /// </summary>
    public List<EngagementTrend> Trends { get; set; } = new();
}

/// <summary>
/// Individual member engagement summary
/// </summary>
public class MemberEngagementSummary
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public decimal OverallScore { get; set; }
    public string EngagementLevel { get; set; } = string.Empty;
    public DateTime LastActivity { get; set; }
    public int DaysSinceLastLogin { get; set; }
    public EngagementScoreBreakdown ScoreBreakdown { get; set; } = new();
}

/// <summary>
/// Club-wide engagement summary
/// </summary>
public class ClubEngagementSummary
{
    public decimal AverageEngagementScore { get; set; }
    public int TotalMembers { get; set; }
    public int HighlyActiveMembers { get; set; }
    public int ModerateMembers { get; set; }
    public int InactiveMembers { get; set; }
    public double RetentionRate { get; set; }
}

/// <summary>
/// Engagement score breakdown by component
/// </summary>
public class EngagementScoreBreakdown
{
    public decimal LoginScore { get; set; }
    public decimal EventScore { get; set; }
    public decimal CommunicationScore { get; set; }
    public decimal FeatureUsageScore { get; set; }
    public decimal ProfileCompletenessScore { get; set; }
}

/// <summary>
/// Engagement distribution across levels
/// </summary>
public class EngagementDistribution
{
    public int HighlyActive { get; set; } // 80-100
    public int Active { get; set; } // 60-79
    public int Moderate { get; set; } // 40-59
    public int LowEngagement { get; set; } // 20-39
    public int Inactive { get; set; } // 0-19
}

/// <summary>
/// Engagement trends over time
/// </summary>
public class EngagementTrend
{
    public DateTime Date { get; set; }
    public decimal AverageScore { get; set; }
    public int ActiveMembers { get; set; }
    public double EngagementChangePercent { get; set; }
}

/// <summary>
/// Request to track blocked feature access attempts
/// </summary>
public class TrackBlockedFeatureRequest
{
    /// <summary>
    /// Club ID attempting to access the feature
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Name of the feature that was blocked
    /// </summary>
    public string Feature { get; set; } = string.Empty;

    /// <summary>
    /// Tier required to access the feature
    /// </summary>
    public string RequiredTier { get; set; } = string.Empty;

    /// <summary>
    /// Current tier of the club
    /// </summary>
    public string? CurrentTier { get; set; }

    /// <summary>
    /// Timestamp of the blocked access attempt
    /// </summary>
    public DateTime? Timestamp { get; set; }
}