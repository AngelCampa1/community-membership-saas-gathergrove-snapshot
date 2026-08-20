using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for tracking event interactions
/// </summary>
public class TrackEventInteractionRequest
{
    [Required]
    public int EventId { get; set; }

    [Required]
    public int MemberId { get; set; }

    [Required]
    [StringLength(50)]
    public string InteractionType { get; set; } = string.Empty; // sign_up, check_in, check_out, cancel, no_show

    public Dictionary<string, object>? InteractionData { get; set; }
}

/// <summary>
/// Response DTO for event engagement metrics
/// </summary>
public class EventEngagementMetricsDto
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }

    // Attendance Metrics
    public int TotalRegistrations { get; set; }
    public int TotalAttendees { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal NoShowRate { get; set; }

    // Engagement Metrics
    public decimal AverageParticipationScore { get; set; }
    public int AverageSessionDurationMinutes { get; set; }
    public int TotalInteractions { get; set; }
    public int NetworkingConnections { get; set; }

    // Satisfaction Metrics
    public decimal? AverageSatisfactionRating { get; set; }
    public decimal? AverageNPS { get; set; }
    public decimal SurveyResponseRate { get; set; }

    // Comparison Metrics
    public decimal? ComparedToClubAverage { get; set; }
    public decimal? ComparedToEventType { get; set; }
    public decimal EventSuccessScore { get; set; }

    public DateTime CalculatedAt { get; set; }
}

/// <summary>
/// DTO for member event engagement scores
/// </summary>
public class MemberEventEngagementDto
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;

    // Overall Metrics
    public int TotalEventsAttended { get; set; }
    public decimal EventAttendanceRate { get; set; }
    public decimal AverageEventEngagementScore { get; set; }

    // Participation Patterns
    public List<string> PreferredEventTypes { get; set; } = new();
    public string? PreferredEventTimes { get; set; }
    public decimal ConsistencyScore { get; set; }

    // Engagement Quality
    public int HighEngagementEventsCount { get; set; }
    public int LowEngagementEventsCount { get; set; }
    public decimal? AverageSatisfactionRating { get; set; }

    // Social Engagement
    public decimal NetworkingScore { get; set; }
    public decimal PeerInfluenceScore { get; set; }
    public decimal CommunityContribution { get; set; }

    // Predictive Metrics
    public decimal EventRetentionProbability { get; set; }
    public string EngagementTrend { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = string.Empty;

    // Rolling Window Metrics
    public int Recent90DayEvents { get; set; }
    public decimal Recent90DayEngagementScore { get; set; }
    public decimal Recent90DayTrend { get; set; }

    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// DTO for engagement analytics report
/// </summary>
public class EventEngagementAnalyticsReportDto
{
    public int ClubId { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public DateTime ReportPeriodStart { get; set; }
    public DateTime ReportPeriodEnd { get; set; }

    // Analysis Period Information
    public AnalysisPeriod AnalysisPeriod { get; set; } = new();

    // Overview Metrics
    public int TotalEvents { get; set; }
    public int TotalRegistrations { get; set; }
    public int TotalAttendees { get; set; }
    public decimal OverallAttendanceRate { get; set; }
    public decimal OverallNoShowRate { get; set; }

    // Overall Statistics
    public OverallStats OverallStats { get; set; } = new();

    // Engagement Trends
    public List<EventEngagementMetricsDto> EventMetrics { get; set; } = new();
    public List<MemberEventEngagementDto> TopEngagedMembers { get; set; } = new();
    public List<MemberEventEngagementDto> AtRiskMembers { get; set; } = new();

    // Member Engagement Summary
    public List<MemberEngagementSummary> MemberEngagement { get; set; } = new();

    // Event Type Analysis
    public Dictionary<string, EventTypeEngagementDto> EventTypeAnalysis { get; set; } = new();

    // No-Show Patterns
    public NoShowPatternAnalysisDto NoShowPatterns { get; set; } = new();

    // Recommendations
    public List<string> Recommendations { get; set; } = new();

    public DateTime GeneratedAt { get; set; }
}

/// <summary>
/// DTO for event type engagement analysis
/// </summary>
public class EventTypeEngagementDto
{
    public string EventType { get; set; } = string.Empty;
    public int EventCount { get; set; }
    public decimal AverageAttendanceRate { get; set; }
    public decimal AverageEngagementScore { get; set; }
    public decimal AverageSatisfactionRating { get; set; }
    public string PerformanceTrend { get; set; } = string.Empty;
}

/// <summary>
/// DTO for no-show pattern analysis
/// </summary>
public class NoShowPatternAnalysisDto
{
    public decimal OverallNoShowRate { get; set; }
    public Dictionary<string, decimal> NoShowRateByEventType { get; set; } = new();
    public Dictionary<string, decimal> NoShowRateByDayOfWeek { get; set; } = new();
    public Dictionary<string, decimal> NoShowRateByTimeOfDay { get; set; } = new();
    public Dictionary<int, decimal> NoShowRateByAdvanceRegistration { get; set; } = new(); // Days in advance

    // Member-specific patterns
    public List<MemberNoShowPatternDto> HighRiskMembers { get; set; } = new();
    public List<string> CommonNoShowReasons { get; set; } = new();

    // Insights
    public List<string> PatternInsights { get; set; } = new();
}

/// <summary>
/// DTO for member-specific no-show patterns
/// </summary>
public class MemberNoShowPatternDto
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public int TotalRegistrations { get; set; }
    public int NoShowCount { get; set; }
    public decimal NoShowRate { get; set; }
    public List<string> PreferredCancellationReasons { get; set; } = new();
    public string RiskLevel { get; set; } = string.Empty;
}

/// <summary>
/// Request DTO for engagement analytics queries
/// </summary>
public class EventEngagementAnalyticsQuery
{
    public int ClubId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public List<string>? EventTypes { get; set; }
    public List<int>? EventIds { get; set; }
    public bool IncludeAtRiskMembers { get; set; } = true;
    public bool IncludeNoShowAnalysis { get; set; } = true;
    public bool IncludeRecommendations { get; set; } = true;
    public int TopMembersLimit { get; set; } = 10;
}

/// <summary>
/// DTO for real-time engagement tracking
/// </summary>
public class RealTimeEngagementDto
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public bool IsLive { get; set; }

    // Real-time metrics
    public int CurrentAttendees { get; set; }
    public int ExpectedAttendees { get; set; }
    public int ActiveParticipants { get; set; }
    public decimal CurrentEngagementScore { get; set; }

    // Live interaction metrics
    public int QuestionsAsked { get; set; }
    public int PollsActive { get; set; }
    public int ChatMessages { get; set; }
    public int NetworkingConnections { get; set; }

    // Technology metrics
    public Dictionary<string, int> PlatformUsage { get; set; } = new();
    public int TechnicalIssuesCount { get; set; }
    public Dictionary<string, int> ConnectionQualityDistribution { get; set; } = new();

    public DateTime LastUpdated { get; set; }
}

