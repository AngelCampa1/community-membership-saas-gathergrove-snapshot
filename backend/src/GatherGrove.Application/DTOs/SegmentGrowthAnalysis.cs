using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for segment growth and churn analysis
/// </summary>
public class SegmentGrowthAnalysis
{
    /// <summary>
    /// Club identifier
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Analysis period
    /// </summary>
    public DateRange AnalysisPeriod { get; set; } = new();

    /// <summary>
    /// Overall growth statistics for the club
    /// </summary>
    public OverallGrowthStats OverallStats { get; set; } = new();

    /// <summary>
    /// Growth analysis for each segment
    /// </summary>
    public List<SegmentGrowthStats> SegmentGrowthStats { get; set; } = new();

    /// <summary>
    /// Cohort analysis data
    /// </summary>
    public List<CohortAnalysis> CohortAnalyses { get; set; } = new();

    /// <summary>
    /// Churn analysis results
    /// </summary>
    public ChurnAnalysis ChurnAnalysis { get; set; } = new();

    /// <summary>
    /// Retention analysis by segment
    /// </summary>
    public List<RetentionAnalysis> RetentionAnalyses { get; set; } = new();

    /// <summary>
    /// Growth predictions and forecasts
    /// </summary>
    public List<GrowthForecast> GrowthForecasts { get; set; } = new();

    /// <summary>
    /// Key insights and recommendations
    /// </summary>
    public List<GrowthInsight> GrowthInsights { get; set; } = new();

    /// <summary>
    /// When the analysis was performed
    /// </summary>
    public DateTime AnalysisDate { get; set; }
}

/// <summary>
/// Request for segment growth analysis
/// </summary>
public class SegmentGrowthAnalysisRequest
{
    /// <summary>
    /// Club ID (set by controller)
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Analysis start date
    /// </summary>
    [Required]
    public DateTime StartDate { get; set; }

    /// <summary>
    /// Analysis end date
    /// </summary>
    [Required]
    public DateTime EndDate { get; set; }

    /// <summary>
    /// Specific segment IDs to analyze (optional - analyzes all if not provided)
    /// </summary>
    public List<int>? SegmentIds { get; set; }

    /// <summary>
    /// Include cohort analysis in results
    /// </summary>
    public bool IncludeCohortAnalysis { get; set; } = true;

    /// <summary>
    /// Include churn prediction modeling
    /// </summary>
    public bool IncludeChurnPrediction { get; set; } = true;

    /// <summary>
    /// Include growth forecasting
    /// </summary>
    public bool IncludeForecasting { get; set; } = false;

    /// <summary>
    /// Cohort period type (monthly, quarterly, yearly)
    /// </summary>
    public string CohortPeriod { get; set; } = "monthly";

    /// <summary>
    /// Minimum segment size to include in analysis
    /// </summary>
    [Range(1, 10000)]
    public int MinimumSegmentSize { get; set; } = 10;
}

/// <summary>
/// Overall growth statistics for the club
/// </summary>
public class OverallGrowthStats
{
    /// <summary>
    /// Total members at start of period
    /// </summary>
    public int StartingMemberCount { get; set; }

    /// <summary>
    /// Total members at end of period
    /// </summary>
    public int EndingMemberCount { get; set; }

    /// <summary>
    /// Net growth (new - churned)
    /// </summary>
    public int NetGrowth { get; set; }

    /// <summary>
    /// Growth rate percentage
    /// </summary>
    public decimal GrowthRate { get; set; }

    /// <summary>
    /// New members added
    /// </summary>
    public int NewMembers { get; set; }

    /// <summary>
    /// Members who churned
    /// </summary>
    public int ChurnedMembers { get; set; }

    /// <summary>
    /// Overall churn rate percentage
    /// </summary>
    public decimal ChurnRate { get; set; }

    /// <summary>
    /// Average member lifetime (in days)
    /// </summary>
    public decimal AverageMemberLifetime { get; set; }
}

/// <summary>
/// Growth statistics for a specific segment
/// </summary>
public class SegmentGrowthStats
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
    /// Starting member count
    /// </summary>
    public int StartingCount { get; set; }

    /// <summary>
    /// Ending member count
    /// </summary>
    public int EndingCount { get; set; }

    /// <summary>
    /// Net growth
    /// </summary>
    public int NetGrowth { get; set; }

    /// <summary>
    /// Growth rate percentage
    /// </summary>
    public decimal GrowthRate { get; set; }

    /// <summary>
    /// New members in segment
    /// </summary>
    public int NewMembers { get; set; }

    /// <summary>
    /// Members who left segment
    /// </summary>
    public int LostMembers { get; set; }

    /// <summary>
    /// Churn rate for this segment
    /// </summary>
    public decimal ChurnRate { get; set; }

    /// <summary>
    /// Growth trend (accelerating, steady, declining)
    /// </summary>
    public TrendDirection GrowthTrend { get; set; }

    /// <summary>
    /// Monthly growth data points
    /// </summary>
    public List<GrowthDataPoint> GrowthData { get; set; } = new();
}

/// <summary>
/// Cohort analysis for member groups
/// </summary>
public class CohortAnalysis
{
    /// <summary>
    /// Cohort identifier (e.g., "2024-01" for January 2024 cohort)
    /// </summary>
    public string CohortId { get; set; } = string.Empty;

    /// <summary>
    /// Cohort period start date
    /// </summary>
    public DateTime CohortStartDate { get; set; }

    /// <summary>
    /// Initial cohort size
    /// </summary>
    public int InitialSize { get; set; }

    /// <summary>
    /// Current cohort size
    /// </summary>
    public int CurrentSize { get; set; }

    /// <summary>
    /// Retention rate by segment
    /// </summary>
    public Dictionary<int, decimal> SegmentRetentionRates { get; set; } = new();

    /// <summary>
    /// Overall cohort retention rate
    /// </summary>
    public decimal OverallRetentionRate { get; set; }

    /// <summary>
    /// Monthly retention data
    /// </summary>
    public List<RetentionDataPoint> RetentionData { get; set; } = new();
}

/// <summary>
/// Churn analysis results
/// </summary>
public class ChurnAnalysis
{
    /// <summary>
    /// Overall churn rate
    /// </summary>
    public decimal OverallChurnRate { get; set; }

    /// <summary>
    /// Churn rate by segment
    /// </summary>
    public Dictionary<int, decimal> SegmentChurnRates { get; set; } = new();

    /// <summary>
    /// Top churn risk factors
    /// </summary>
    public List<ChurnRiskFactor> ChurnRiskFactors { get; set; } = new();

    /// <summary>
    /// Members at high risk of churning
    /// </summary>
    public List<ChurnRiskMember> HighRiskMembers { get; set; } = new();

    /// <summary>
    /// Predicted churn for next period
    /// </summary>
    public decimal PredictedChurnRate { get; set; }
}

/// <summary>
/// Retention analysis for segments
/// </summary>
public class RetentionAnalysis
{
    /// <summary>
    /// Segment ID
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// 30-day retention rate
    /// </summary>
    public decimal Retention30Day { get; set; }

    /// <summary>
    /// 60-day retention rate
    /// </summary>
    public decimal Retention60Day { get; set; }

    /// <summary>
    /// 90-day retention rate
    /// </summary>
    public decimal Retention90Day { get; set; }

    /// <summary>
    /// 1-year retention rate
    /// </summary>
    public decimal Retention1Year { get; set; }

    /// <summary>
    /// Retention curve data points
    /// </summary>
    public List<RetentionCurvePoint> RetentionCurve { get; set; } = new();
}

/// <summary>
/// Growth forecast for segments
/// </summary>
public class GrowthForecast
{
    /// <summary>
    /// Segment ID
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Forecasted growth data points
    /// </summary>
    public List<ForecastDataPoint> ForecastData { get; set; } = new();

    /// <summary>
    /// Forecast confidence level
    /// </summary>
    public decimal Confidence { get; set; }

    /// <summary>
    /// Expected growth rate for next period
    /// </summary>
    public decimal ExpectedGrowthRate { get; set; }
}

/// <summary>
/// Growth insight from analysis
/// </summary>
public class GrowthInsight
{
    /// <summary>
    /// Insight title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Insight description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Insight type
    /// </summary>
    public InsightType Type { get; set; }

    /// <summary>
    /// Affected segments
    /// </summary>
    public List<int> AffectedSegments { get; set; } = new();

    /// <summary>
    /// Impact level (High, Medium, Low)
    /// </summary>
    public string ImpactLevel { get; set; } = string.Empty;

    /// <summary>
    /// Recommended actions
    /// </summary>
    public List<string> RecommendedActions { get; set; } = new();
}

/// <summary>
/// Growth data point for time series
/// </summary>
public class GrowthDataPoint
{
    /// <summary>
    /// Date of data point
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Member count at this date
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Growth rate at this date
    /// </summary>
    public decimal GrowthRate { get; set; }

    /// <summary>
    /// New members added in this period
    /// </summary>
    public int NewMembers { get; set; }

    /// <summary>
    /// Members lost in this period
    /// </summary>
    public int LostMembers { get; set; }
}

/// <summary>
/// Retention data point for cohort analysis
/// </summary>
public class RetentionDataPoint
{
    /// <summary>
    /// Months since cohort start
    /// </summary>
    public int MonthsFromStart { get; set; }

    /// <summary>
    /// Retention rate at this point
    /// </summary>
    public decimal RetentionRate { get; set; }

    /// <summary>
    /// Number of members retained
    /// </summary>
    public int MembersRetained { get; set; }
}

/// <summary>
/// Churn risk factor
/// </summary>
public class ChurnRiskFactor
{
    /// <summary>
    /// Risk factor name
    /// </summary>
    public string FactorName { get; set; } = string.Empty;

    /// <summary>
    /// Impact on churn probability
    /// </summary>
    public decimal ChurnImpact { get; set; }

    /// <summary>
    /// Percentage of churned members with this factor
    /// </summary>
    public decimal Prevalence { get; set; }
}

/// <summary>
/// Member at risk of churning
/// </summary>
public class ChurnRiskMember
{
    /// <summary>
    /// Member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Churn risk score (0-1)
    /// </summary>
    public decimal RiskScore { get; set; }

    /// <summary>
    /// Primary risk factors
    /// </summary>
    public List<string> RiskFactors { get; set; } = new();

    /// <summary>
    /// Recommended interventions
    /// </summary>
    public List<string> RecommendedActions { get; set; } = new();
}

/// <summary>
/// Retention curve data point
/// </summary>
public class RetentionCurvePoint
{
    /// <summary>
    /// Days since joining
    /// </summary>
    public int DaysFromJoin { get; set; }

    /// <summary>
    /// Retention rate at this point
    /// </summary>
    public decimal RetentionRate { get; set; }
}