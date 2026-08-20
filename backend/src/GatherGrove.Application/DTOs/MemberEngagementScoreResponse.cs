using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs
{
    /// <summary>
    /// Response DTO for member engagement score data
    /// </summary>
    public class MemberEngagementScoreResponse
    {
        /// <summary>
        /// Member ID
        /// </summary>
        public int MemberId { get; set; }

        /// <summary>
        /// Member's full name
        /// </summary>
        public string MemberName { get; set; } = string.Empty;

        /// <summary>
        /// Member's email address
        /// </summary>
        public string MemberEmail { get; set; } = string.Empty;

        /// <summary>
        /// Overall engagement score (0-100)
        /// </summary>
        public decimal OverallScore { get; set; }

        /// <summary>
        /// Communication engagement score (0-100)
        /// </summary>
        public decimal CommunicationScore { get; set; }

        /// <summary>
        /// Event participation score (0-100)
        /// </summary>
        public decimal EventParticipationScore { get; set; }

        /// <summary>
        /// Feature usage score (0-100)
        /// </summary>
        public decimal FeatureUsageScore { get; set; }

        /// <summary>
        /// Activity frequency score (0-100)
        /// </summary>
        public decimal ActivityFrequencyScore { get; set; }

        /// <summary>
        /// Engagement level (Green, Yellow, Red)
        /// </summary>
        public string EngagementLevel { get; set; } = string.Empty;

        /// <summary>
        /// Engagement level color code
        /// </summary>
        public string EngagementColor => EngagementLevel switch
        {
            "Green" => "#22c55e",
            "Yellow" => "#eab308",
            "Red" => "#ef4444",
            _ => "#6b7280"
        };

        /// <summary>
        /// Number of messages sent in the last 30 days
        /// </summary>
        public int MessagesCount { get; set; }

        /// <summary>
        /// Number of events attended in the last 30 days
        /// </summary>
        public int EventsAttended { get; set; }

        /// <summary>
        /// Number of unique features used in the last 30 days
        /// </summary>
        public int UniqueFeatures { get; set; }

        /// <summary>
        /// Number of active days in the last 30 days
        /// </summary>
        public int ActiveDays { get; set; }

        /// <summary>
        /// Last activity timestamp
        /// </summary>
        public DateTime LastActivity { get; set; }

        /// <summary>
        /// When this score was calculated
        /// </summary>
        public DateTime CalculatedAt { get; set; }

        /// <summary>
        /// Trend compared to previous period (up, down, stable)
        /// </summary>
        public string Trend { get; set; } = "stable";

        /// <summary>
        /// Percentage change from previous period
        /// </summary>
        public decimal? TrendPercentage { get; set; }

        /// <summary>
        /// Recent activity summary
        /// </summary>
        public ActivitySummary RecentActivity { get; set; } = new();

        /// <summary>
        /// Engagement breakdown by category
        /// </summary>
        public List<EngagementCategoryScore> CategoryScores { get; set; } = new();

        /// <summary>
        /// Recommendations for improving engagement
        /// </summary>
        public List<string> Recommendations { get; set; } = new();

        /// <summary>
        /// Check if the member is at risk (red level)
        /// </summary>
        public bool IsAtRisk => EngagementLevel == "Red";

        /// <summary>
        /// Check if the member needs attention (yellow level)
        /// </summary>
        public bool NeedsAttention => EngagementLevel == "Yellow";

        /// <summary>
        /// Check if the member is highly engaged (green level)
        /// </summary>
        public bool IsHighlyEngaged => EngagementLevel == "Green";

        /// <summary>
        /// Get a human-readable description of the engagement level
        /// </summary>
        public string GetEngagementDescription()
        {
            return EngagementLevel switch
            {
                "Green" => "Highly engaged member with consistent activity",
                "Yellow" => "Moderately engaged member, could benefit from encouragement",
                "Red" => "At-risk member requiring immediate attention",
                _ => "Engagement level not determined"
            };
        }
    }

    /// <summary>
    /// Summary of recent member activity
    /// </summary>
    public class ActivitySummary
    {
        /// <summary>
        /// Total sessions in the last 30 days
        /// </summary>
        public int TotalSessions { get; set; }

        /// <summary>
        /// Average session duration in minutes
        /// </summary>
        public decimal AverageSessionDuration { get; set; }

        /// <summary>
        /// Most used feature category
        /// </summary>
        public string TopFeatureCategory { get; set; } = string.Empty;

        /// <summary>
        /// Days since last login
        /// </summary>
        public int DaysSinceLastLogin { get; set; }

        /// <summary>
        /// Peak activity day of the week
        /// </summary>
        public string PeakActivityDay { get; set; } = string.Empty;

        /// <summary>
        /// Peak activity hour (0-23)
        /// </summary>
        public int PeakActivityHour { get; set; }
    }

    /// <summary>
    /// Engagement score breakdown by category
    /// </summary>
    public class EngagementCategoryScore
    {
        /// <summary>
        /// Category name
        /// </summary>
        public string Category { get; set; } = string.Empty;

        /// <summary>
        /// Score for this category (0-100)
        /// </summary>
        public decimal Score { get; set; }

        /// <summary>
        /// Weight of this category in overall score
        /// </summary>
        public decimal Weight { get; set; }

        /// <summary>
        /// Contribution to overall score
        /// </summary>
        public decimal Contribution => Score * Weight;

        /// <summary>
        /// Trend for this category
        /// </summary>
        public string Trend { get; set; } = "stable";
    }
}