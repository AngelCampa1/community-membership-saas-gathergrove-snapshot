namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing comprehensive segment statistics
/// </summary>
public class SegmentStatsResponse
{
    /// <summary>
    /// Segment identifier
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Segment description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Basic member statistics
    /// </summary>
    public SegmentMemberStats MemberStats { get; set; } = new();

    /// <summary>
    /// Engagement statistics
    /// </summary>
    public SegmentEngagementStats EngagementStats { get; set; } = new();

    /// <summary>
    /// Growth and trend statistics
    /// </summary>
    public SegmentGrowthStats GrowthStats { get; set; } = new();

    /// <summary>
    /// Activity and participation statistics
    /// </summary>
    public SegmentActivityStats ActivityStats { get; set; } = new();

    /// <summary>
    /// Demographic breakdown
    /// </summary>
    public SegmentDemographics Demographics { get; set; } = new();

    /// <summary>
    /// Financial and payment statistics
    /// </summary>
    public SegmentFinancialStats FinancialStats { get; set; } = new();

    /// <summary>
    /// Communication statistics
    /// </summary>
    public SegmentCommunicationStats CommunicationStats { get; set; } = new();

    /// <summary>
    /// Comparative statistics with other segments
    /// </summary>
    public SegmentComparativeStats ComparativeStats { get; set; } = new();

    /// <summary>
    /// Health indicators and scores
    /// </summary>
    public SegmentHealthIndicators HealthIndicators { get; set; } = new();

    /// <summary>
    /// Trend indicators and predictions
    /// </summary>
    public SegmentTrendIndicators TrendIndicators { get; set; } = new();

    /// <summary>
    /// Statistics calculation date range
    /// </summary>
    public DateRange CalculationPeriod { get; set; } = new();

    /// <summary>
    /// When these statistics were last calculated
    /// </summary>
    public DateTime LastCalculated { get; set; }

    /// <summary>
    /// Data freshness score (0-100)
    /// </summary>
    public int DataFreshnessScore { get; set; }

    /// <summary>
    /// Any data quality issues or notes
    /// </summary>
    public List<string> DataQualityNotes { get; set; } = new();
}

/// <summary>
/// Basic member statistics for a segment
/// </summary>
public class SegmentMemberStats
{
    /// <summary>
    /// Total number of members
    /// </summary>
    public int TotalMembers { get; set; }

    /// <summary>
    /// Active members count
    /// </summary>
    public int ActiveMembers { get; set; }

    /// <summary>
    /// Inactive members count
    /// </summary>
    public int InactiveMembers { get; set; }

    /// <summary>
    /// Suspended members count
    /// </summary>
    public int SuspendedMembers { get; set; }

    /// <summary>
    /// New members in last 30 days
    /// </summary>
    public int NewMembersLast30Days { get; set; }

    /// <summary>
    /// Members who left in last 30 days
    /// </summary>
    public int LostMembersLast30Days { get; set; }

    /// <summary>
    /// Average member tenure in days
    /// </summary>
    public decimal AverageTenureDays { get; set; }

    /// <summary>
    /// Member distribution by status
    /// </summary>
    public Dictionary<string, int> StatusDistribution { get; set; } = new();

    /// <summary>
    /// Member distribution by membership type
    /// </summary>
    public Dictionary<string, int> MembershipTypeDistribution { get; set; } = new();
}

/// <summary>
/// Engagement statistics for a segment
/// </summary>
public class SegmentEngagementStats
{
    /// <summary>
    /// Average engagement score (0-100)
    /// </summary>
    public decimal AverageEngagementScore { get; set; }

    /// <summary>
    /// Median engagement score
    /// </summary>
    public decimal MedianEngagementScore { get; set; }

    /// <summary>
    /// Highly engaged members (score > 80)
    /// </summary>
    public int HighlyEngagedMembers { get; set; }

    /// <summary>
    /// Moderately engaged members (score 40-80)
    /// </summary>
    public int ModeratelyEngagedMembers { get; set; }

    /// <summary>
    /// Low engaged members (score < 40)
    /// </summary>
    public int LowEngagedMembers { get; set; }

    /// <summary>
    /// Average event attendance rate
    /// </summary>
    public decimal AverageEventAttendanceRate { get; set; }

    /// <summary>
    /// Communication response rate
    /// </summary>
    public decimal CommunicationResponseRate { get; set; }

    /// <summary>
    /// Profile completion rate
    /// </summary>
    public decimal ProfileCompletionRate { get; set; }

    /// <summary>
    /// Engagement trend (improving, stable, declining)
    /// </summary>
    public TrendDirection EngagementTrend { get; set; }

    /// <summary>
    /// Engagement score distribution
    /// </summary>
    public Dictionary<string, int> EngagementScoreDistribution { get; set; } = new();
}

// SegmentGrowthStats class already exists elsewhere - using existing definition

/// <summary>
/// Activity and participation statistics
/// </summary>
public class SegmentActivityStats
{
    /// <summary>
    /// Average events attended per member
    /// </summary>
    public decimal AverageEventsPerMember { get; set; }

    /// <summary>
    /// Total event attendance in last 90 days
    /// </summary>
    public int TotalEventAttendanceLast90Days { get; set; }

    /// <summary>
    /// Unique members who attended events
    /// </summary>
    public int UniqueEventAttendees { get; set; }

    /// <summary>
    /// Event attendance rate percentage
    /// </summary>
    public decimal EventAttendanceRate { get; set; }

    /// <summary>
    /// Average participation score
    /// </summary>
    public decimal AverageParticipationScore { get; set; }

    /// <summary>
    /// Members with recent activity (last 30 days)
    /// </summary>
    public int MembersWithRecentActivity { get; set; }

    /// <summary>
    /// Average days since last activity
    /// </summary>
    public decimal AverageDaysSinceLastActivity { get; set; }

    /// <summary>
    /// Most popular activities
    /// </summary>
    public List<ActivityPopularity> PopularActivities { get; set; } = new();

    /// <summary>
    /// Activity participation trends
    /// </summary>
    public Dictionary<string, TrendDirection> ActivityTrends { get; set; } = new();
}

/// <summary>
/// Financial and payment statistics
/// </summary>
public class SegmentFinancialStats
{
    /// <summary>
    /// Total revenue from this segment
    /// </summary>
    public decimal TotalRevenue { get; set; }

    /// <summary>
    /// Average revenue per member
    /// </summary>
    public decimal AverageRevenuePerMember { get; set; }

    /// <summary>
    /// Payment compliance rate percentage
    /// </summary>
    public decimal PaymentComplianceRate { get; set; }

    /// <summary>
    /// Members with outstanding payments
    /// </summary>
    public int MembersWithOutstandingPayments { get; set; }

    /// <summary>
    /// Total outstanding amount
    /// </summary>
    public decimal TotalOutstandingAmount { get; set; }

    /// <summary>
    /// Average payment amount
    /// </summary>
    public decimal AveragePaymentAmount { get; set; }

    /// <summary>
    /// Payment frequency distribution
    /// </summary>
    public Dictionary<string, int> PaymentFrequencyDistribution { get; set; } = new();

    /// <summary>
    /// Revenue trend
    /// </summary>
    public TrendDirection RevenueTrend { get; set; }

    /// <summary>
    /// Member lifetime value
    /// </summary>
    public decimal AverageLifetimeValue { get; set; }
}

/// <summary>
/// Communication statistics
/// </summary>
public class SegmentCommunicationStats
{
    /// <summary>
    /// Email open rate percentage
    /// </summary>
    public decimal EmailOpenRate { get; set; }

    /// <summary>
    /// Email click rate percentage
    /// </summary>
    public decimal EmailClickRate { get; set; }

    /// <summary>
    /// Legacy SMS delivery rate percentage. Retained for compatibility.
    /// </summary>
    public decimal SMSDeliveryRate { get; set; }

    /// <summary>
    /// Legacy WhatsApp delivery rate percentage. Retained for compatibility.
    /// </summary>
    public decimal WhatsAppDeliveryRate { get; set; }

    /// <summary>
    /// Average communication response time (hours)
    /// </summary>
    public decimal AverageResponseTimeHours { get; set; }

    /// <summary>
    /// Members subscribed to communications
    /// </summary>
    public int MembersSubscribedToCommunications { get; set; }

    /// <summary>
    /// Communication engagement score
    /// </summary>
    public decimal CommunicationEngagementScore { get; set; }

    /// <summary>
    /// Preferred communication channels
    /// </summary>
    public Dictionary<string, int> PreferredChannels { get; set; } = new();

    /// <summary>
    /// Communication frequency preferences
    /// </summary>
    public Dictionary<string, int> FrequencyPreferences { get; set; } = new();
}

/// <summary>
/// Comparative statistics with other segments
/// </summary>
public class SegmentComparativeStats
{
    /// <summary>
    /// Ranking among all segments by size (1 = largest)
    /// </summary>
    public int SizeRanking { get; set; }

    /// <summary>
    /// Ranking by engagement score (1 = highest)
    /// </summary>
    public int EngagementRanking { get; set; }

    /// <summary>
    /// Ranking by growth rate (1 = fastest growing)
    /// </summary>
    public int GrowthRanking { get; set; }

    /// <summary>
    /// Percentage of total club membership
    /// </summary>
    public decimal PercentageOfTotalMembership { get; set; }

    /// <summary>
    /// Comparison with club average engagement
    /// </summary>
    public decimal EngagementVsClubAverage { get; set; }

    /// <summary>
    /// Comparison with club average growth
    /// </summary>
    public decimal GrowthVsClubAverage { get; set; }

    /// <summary>
    /// Performance relative to similar segments
    /// </summary>
    public string PerformanceVsSimilarSegments { get; set; } = string.Empty;

    /// <summary>
    /// Key differentiators from other segments
    /// </summary>
    public List<string> KeyDifferentiators { get; set; } = new();
}

/// <summary>
/// Health indicators for a segment
/// </summary>
public class SegmentHealthIndicators
{
    /// <summary>
    /// Overall health score (0-100)
    /// </summary>
    public decimal OverallHealthScore { get; set; }

    /// <summary>
    /// Health grade (A, B, C, D, F)
    /// </summary>
    public string HealthGrade { get; set; } = string.Empty;

    /// <summary>
    /// Growth health score
    /// </summary>
    public decimal GrowthHealthScore { get; set; }

    /// <summary>
    /// Engagement health score
    /// </summary>
    public decimal EngagementHealthScore { get; set; }

    /// <summary>
    /// Retention health score
    /// </summary>
    public decimal RetentionHealthScore { get; set; }

    /// <summary>
    /// Financial health score
    /// </summary>
    public decimal FinancialHealthScore { get; set; }

    /// <summary>
    /// Risk factors identified
    /// </summary>
    public List<HealthRiskFactor> RiskFactors { get; set; } = new();

    /// <summary>
    /// Strengths identified
    /// </summary>
    public List<string> Strengths { get; set; } = new();

    /// <summary>
    /// Improvement recommendations
    /// </summary>
    public List<string> ImprovementRecommendations { get; set; } = new();
}

/// <summary>
/// Trend indicators and predictions
/// </summary>
public class SegmentTrendIndicators
{
    /// <summary>
    /// Short-term trend (next 30 days)
    /// </summary>
    public TrendDirection ShortTermTrend { get; set; }

    /// <summary>
    /// Medium-term trend (next 90 days)
    /// </summary>
    public TrendDirection MediumTermTrend { get; set; }

    /// <summary>
    /// Long-term trend (next 12 months)
    /// </summary>
    public TrendDirection LongTermTrend { get; set; }

    /// <summary>
    /// Trend confidence level (0-100)
    /// </summary>
    public decimal TrendConfidence { get; set; }

    /// <summary>
    /// Key trend drivers
    /// </summary>
    public List<string> TrendDrivers { get; set; } = new();

    /// <summary>
    /// Seasonal patterns detected
    /// </summary>
    public List<SeasonalPattern> SeasonalPatterns { get; set; } = new();

    /// <summary>
    /// Trend anomalies or outliers
    /// </summary>
    public List<TrendAnomaly> TrendAnomalies { get; set; } = new();

    /// <summary>
    /// Forecasted metrics for next quarter
    /// </summary>
    public Dictionary<string, decimal> ForecastedMetrics { get; set; } = new();
}

/// <summary>
/// Monthly member count data point
/// </summary>
public class MonthlyMemberCount
{
    /// <summary>
    /// Month and year
    /// </summary>
    public DateTime Month { get; set; }

    /// <summary>
    /// Member count at end of month
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Net change from previous month
    /// </summary>
    public int NetChange { get; set; }

    /// <summary>
    /// Growth rate for the month
    /// </summary>
    public decimal GrowthRate { get; set; }
}

/// <summary>
/// Activity popularity information
/// </summary>
public class ActivityPopularity
{
    /// <summary>
    /// Activity name or type
    /// </summary>
    public string ActivityName { get; set; } = string.Empty;

    /// <summary>
    /// Number of participants
    /// </summary>
    public int ParticipantCount { get; set; }

    /// <summary>
    /// Participation rate percentage
    /// </summary>
    public decimal ParticipationRate { get; set; }

    /// <summary>
    /// Trend direction for this activity
    /// </summary>
    public TrendDirection Trend { get; set; }
}

/// <summary>
/// Health risk factor
/// </summary>
public class HealthRiskFactor
{
    /// <summary>
    /// Risk factor name
    /// </summary>
    public string FactorName { get; set; } = string.Empty;

    /// <summary>
    /// Risk level
    /// </summary>
    public RiskLevel RiskLevel { get; set; }

    /// <summary>
    /// Description of the risk
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Impact on segment health
    /// </summary>
    public decimal ImpactScore { get; set; }

    /// <summary>
    /// Recommended actions to mitigate risk
    /// </summary>
    public List<string> RecommendedActions { get; set; } = new();
}

/// <summary>
/// Trend anomaly information
/// </summary>
public class TrendAnomaly
{
    /// <summary>
    /// Date when anomaly occurred
    /// </summary>
    public DateTime AnomalyDate { get; set; }

    /// <summary>
    /// Metric affected by anomaly
    /// </summary>
    public string AffectedMetric { get; set; } = string.Empty;

    /// <summary>
    /// Expected value
    /// </summary>
    public decimal ExpectedValue { get; set; }

    /// <summary>
    /// Actual value
    /// </summary>
    public decimal ActualValue { get; set; }

    /// <summary>
    /// Deviation percentage
    /// </summary>
    public decimal DeviationPercentage { get; set; }

    /// <summary>
    /// Anomaly severity
    /// </summary>
    public AnomalySeverity Severity { get; set; }

    /// <summary>
    /// Possible explanation for the anomaly
    /// </summary>
    public string? PossibleCause { get; set; }
}
