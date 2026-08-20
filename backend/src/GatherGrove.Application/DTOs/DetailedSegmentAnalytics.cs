using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Detailed analytics response for a specific segment
/// </summary>
public class DetailedSegmentAnalytics
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
    /// Total number of members in the segment
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Growth rate percentage
    /// </summary>
    public decimal GrowthRate { get; set; }

    /// <summary>
    /// Overall health score (0-100)
    /// </summary>
    public decimal HealthScore { get; set; }

    /// <summary>
    /// Engagement metrics for the segment
    /// </summary>
    public SegmentEngagementMetrics EngagementMetrics { get; set; } = new();

    /// <summary>
    /// Member demographics breakdown
    /// </summary>
    public SegmentDemographics Demographics { get; set; } = new();

    /// <summary>
    /// Activity patterns and trends
    /// </summary>
    public List<ActivityPattern> ActivityPatterns { get; set; } = new();

    /// <summary>
    /// Performance metrics over time
    /// </summary>
    public List<PerformanceDataPoint> PerformanceTrends { get; set; } = new();

    /// <summary>
    /// Key insights and recommendations
    /// </summary>
    public List<SegmentInsight> Insights { get; set; } = new();

    /// <summary>
    /// Comparison with other segments
    /// </summary>
    public SegmentComparison? Comparison { get; set; }

    /// <summary>
    /// Detailed member list (if requested)
    /// </summary>
    public List<MemberResponse>? Members { get; set; }

    /// <summary>
    /// Analysis date range
    /// </summary>
    public DateRange AnalysisPeriod { get; set; } = new();

    /// <summary>
    /// When the analytics were last calculated
    /// </summary>
    public DateTime LastCalculated { get; set; }
}

/// <summary>
/// Engagement metrics for a segment
/// </summary>
public class SegmentEngagementMetrics
{
    /// <summary>
    /// Average engagement score (0-100)
    /// </summary>
    public decimal AverageEngagementScore { get; set; }

    /// <summary>
    /// Event attendance rate percentage
    /// </summary>
    public decimal EventAttendanceRate { get; set; }

    /// <summary>
    /// Communication activity score
    /// </summary>
    public decimal CommunicationActivityScore { get; set; }

    /// <summary>
    /// Profile update frequency
    /// </summary>
    public decimal ProfileUpdateFrequency { get; set; }

    /// <summary>
    /// Payment compliance rate percentage
    /// </summary>
    public decimal PaymentComplianceRate { get; set; }
}

/// <summary>
/// Demographics breakdown for a segment
/// </summary>
public class SegmentDemographics
{
    /// <summary>
    /// Age distribution
    /// </summary>
    public Dictionary<string, int> AgeDistribution { get; set; } = new();

    /// <summary>
    /// Gender distribution
    /// </summary>
    public Dictionary<string, int> GenderDistribution { get; set; } = new();

    /// <summary>
    /// Location distribution
    /// </summary>
    public Dictionary<string, int> LocationDistribution { get; set; } = new();

    /// <summary>
    /// Membership type distribution
    /// </summary>
    public Dictionary<string, int> MembershipTypeDistribution { get; set; } = new();
}

/// <summary>
/// Activity pattern for a segment
/// </summary>
public class ActivityPattern
{
    /// <summary>
    /// Pattern name (e.g., "Peak Event Attendance")
    /// </summary>
    public string PatternName { get; set; } = string.Empty;

    /// <summary>
    /// Pattern description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Pattern strength (0-1)
    /// </summary>
    public decimal Strength { get; set; }

    /// <summary>
    /// Time periods where pattern is observed
    /// </summary>
    public List<TimePeriod> TimePeriods { get; set; } = new();
}

/// <summary>
/// Performance data point for trend analysis
/// </summary>
public class PerformanceDataPoint
{
    /// <summary>
    /// Date of the data point
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Member count at this point
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Engagement score at this point
    /// </summary>
    public decimal EngagementScore { get; set; }

    /// <summary>
    /// Activity level at this point
    /// </summary>
    public decimal ActivityLevel { get; set; }
}

/// <summary>
/// Segment comparison data
/// </summary>
public class SegmentComparison
{
    /// <summary>
    /// Average metrics across all segments
    /// </summary>
    public SegmentEngagementMetrics ClubAverage { get; set; } = new();

    /// <summary>
    /// Ranking among all segments (1 = best)
    /// </summary>
    public int Ranking { get; set; }

    /// <summary>
    /// Total number of segments in the club
    /// </summary>
    public int TotalSegments { get; set; }
}

/// <summary>
/// Time period for patterns
/// </summary>
public class TimePeriod
{
    /// <summary>
    /// Start time
    /// </summary>
    public DateTime StartTime { get; set; }

    /// <summary>
    /// End time
    /// </summary>
    public DateTime EndTime { get; set; }

    /// <summary>
    /// Frequency of occurrence
    /// </summary>
    public string Frequency { get; set; } = string.Empty;
}