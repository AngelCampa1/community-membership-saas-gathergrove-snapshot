using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for segment insights and recommendations
/// </summary>
public class SegmentInsightsResponse
{
    /// <summary>
    /// Club identifier
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Specific segment ID analyzed (null if analyzing all segments)
    /// </summary>
    public int? SegmentId { get; set; }

    /// <summary>
    /// Segment name (if specific segment analyzed)
    /// </summary>
    public string? SegmentName { get; set; }

    /// <summary>
    /// Focus area for the insights analysis
    /// </summary>
    public string? FocusArea { get; set; }

    /// <summary>
    /// Generated insights and observations
    /// </summary>
    public List<SegmentInsight> Insights { get; set; } = new();

    /// <summary>
    /// Actionable recommendations based on analysis
    /// </summary>
    public List<ActionableRecommendation> Recommendations { get; set; } = new();

    /// <summary>
    /// Key performance indicators summary
    /// </summary>
    public InsightsKPISummary KPISummary { get; set; } = new();

    /// <summary>
    /// Identified opportunities for improvement
    /// </summary>
    public List<ImprovementOpportunity> Opportunities { get; set; } = new();

    /// <summary>
    /// Risk factors and warnings
    /// </summary>
    public List<RiskFactor> RiskFactors { get; set; } = new();

    /// <summary>
    /// Comparative insights with other segments
    /// </summary>
    public List<ComparativeInsight> ComparativeInsights { get; set; } = new();

    /// <summary>
    /// Trend analysis insights
    /// </summary>
    public List<TrendInsight> TrendInsights { get; set; } = new();

    /// <summary>
    /// Overall health score for analyzed segments
    /// </summary>
    public decimal OverallHealthScore { get; set; }

    /// <summary>
    /// Confidence level of the insights (0-1)
    /// </summary>
    public decimal ConfidenceLevel { get; set; }

    /// <summary>
    /// When the insights were generated
    /// </summary>
    public DateTime GeneratedAt { get; set; }

    /// <summary>
    /// Data freshness indicator
    /// </summary>
    public DataFreshness DataFreshness { get; set; } = new();

    /// <summary>
    /// Analysis methodology used
    /// </summary>
    public string AnalysisMethod { get; set; } = string.Empty;

    /// <summary>
    /// Next recommended analysis date
    /// </summary>
    public DateTime? NextAnalysisRecommended { get; set; }
}

/// <summary>
/// Actionable recommendation with priority and implementation details
/// </summary>
public class ActionableRecommendation
{
    /// <summary>
    /// Recommendation title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description of the recommendation
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Priority level
    /// </summary>
    public ActionPriority Priority { get; set; }

    /// <summary>
    /// Category of recommendation
    /// </summary>
    public RecommendationCategory Category { get; set; }

    /// <summary>
    /// Estimated impact if implemented
    /// </summary>
    public ImpactEstimate EstimatedImpact { get; set; } = new();

    /// <summary>
    /// Implementation complexity
    /// </summary>
    public ImplementationComplexity Complexity { get; set; }

    /// <summary>
    /// Specific action steps
    /// </summary>
    public List<ActionStep> ActionSteps { get; set; } = new();

    /// <summary>
    /// Success metrics to track
    /// </summary>
    public List<string> SuccessMetrics { get; set; } = new();

    /// <summary>
    /// Estimated timeline for implementation
    /// </summary>
    public string EstimatedTimeline { get; set; } = string.Empty;

    /// <summary>
    /// Required resources
    /// </summary>
    public List<string> RequiredResources { get; set; } = new();

    /// <summary>
    /// Related segments affected by this recommendation
    /// </summary>
    public List<int> AffectedSegments { get; set; } = new();
}

/// <summary>
/// Key performance indicators summary for insights
/// </summary>
public class InsightsKPISummary
{
    /// <summary>
    /// Total number of segments analyzed
    /// </summary>
    public int SegmentsAnalyzed { get; set; }

    /// <summary>
    /// Total members across analyzed segments
    /// </summary>
    public int TotalMembers { get; set; }

    /// <summary>
    /// Average engagement score across segments
    /// </summary>
    public decimal AverageEngagementScore { get; set; }

    /// <summary>
    /// Best performing segment
    /// </summary>
    public SegmentPerformanceSummary? BestPerformingSegment { get; set; }

    /// <summary>
    /// Underperforming segments needing attention
    /// </summary>
    public List<SegmentPerformanceSummary> UnderperformingSegments { get; set; } = new();

    /// <summary>
    /// Key metrics comparison with previous period
    /// </summary>
    public Dictionary<string, MetricComparison> MetricComparisons { get; set; } = new();
}

/// <summary>
/// Improvement opportunity identified in analysis
/// </summary>
public class ImprovementOpportunity
{
    /// <summary>
    /// Opportunity title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Opportunity description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Opportunity type
    /// </summary>
    public OpportunityType Type { get; set; }

    /// <summary>
    /// Potential impact level
    /// </summary>
    public ImpactLevel PotentialImpact { get; set; }

    /// <summary>
    /// Effort required to realize opportunity
    /// </summary>
    public EffortLevel RequiredEffort { get; set; }

    /// <summary>
    /// Specific segments this opportunity applies to
    /// </summary>
    public List<int> ApplicableSegments { get; set; } = new();

    /// <summary>
    /// Supporting data and evidence
    /// </summary>
    public List<string> SupportingEvidence { get; set; } = new();

    /// <summary>
    /// Quantified benefits if opportunity is pursued
    /// </summary>
    public OpportunityBenefits? QuantifiedBenefits { get; set; }
}

/// <summary>
/// Risk factor identified in segment analysis
/// </summary>
public class RiskFactor
{
    /// <summary>
    /// Risk title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Risk description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Risk level
    /// </summary>
    public RiskLevel Level { get; set; }

    /// <summary>
    /// Risk category
    /// </summary>
    public RiskCategory Category { get; set; }

    /// <summary>
    /// Probability of risk occurring
    /// </summary>
    public decimal Probability { get; set; }

    /// <summary>
    /// Potential impact if risk occurs
    /// </summary>
    public ImpactLevel PotentialImpact { get; set; }

    /// <summary>
    /// Segments affected by this risk
    /// </summary>
    public List<int> AffectedSegments { get; set; } = new();

    /// <summary>
    /// Mitigation strategies
    /// </summary>
    public List<string> MitigationStrategies { get; set; } = new();

    /// <summary>
    /// Warning indicators to monitor
    /// </summary>
    public List<string> WarningIndicators { get; set; } = new();
}

/// <summary>
/// Comparative insight between segments
/// </summary>
public class ComparativeInsight
{
    /// <summary>
    /// Insight title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Comparison description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Primary segment in comparison
    /// </summary>
    public int PrimarySegmentId { get; set; }

    /// <summary>
    /// Comparison segment ID
    /// </summary>
    public int ComparisonSegmentId { get; set; }

    /// <summary>
    /// Metric being compared
    /// </summary>
    public string ComparedMetric { get; set; } = string.Empty;

    /// <summary>
    /// Primary segment value
    /// </summary>
    public decimal PrimaryValue { get; set; }

    /// <summary>
    /// Comparison segment value
    /// </summary>
    public decimal ComparisonValue { get; set; }

    /// <summary>
    /// Percentage difference
    /// </summary>
    public decimal PercentageDifference { get; set; }

    /// <summary>
    /// Statistical significance of the difference
    /// </summary>
    public bool IsStatisticallySignificant { get; set; }

    /// <summary>
    /// Potential reasons for the difference
    /// </summary>
    public List<string> PotentialReasons { get; set; } = new();
}

/// <summary>
/// Trend-based insight
/// </summary>
public class TrendInsight
{
    /// <summary>
    /// Trend insight title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Trend description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Trend direction and magnitude
    /// </summary>
    public TrendDirection Direction { get; set; }

    /// <summary>
    /// Trend strength (0-1)
    /// </summary>
    public decimal Strength { get; set; }

    /// <summary>
    /// Metric experiencing the trend
    /// </summary>
    public string TrendingMetric { get; set; } = string.Empty;

    /// <summary>
    /// Time period of the trend
    /// </summary>
    public DateRange TrendPeriod { get; set; } = new();

    /// <summary>
    /// Segments showing this trend
    /// </summary>
    public List<int> TrendingSegments { get; set; } = new();

    /// <summary>
    /// Forecasted continuation of trend
    /// </summary>
    public TrendForecast? Forecast { get; set; }
}

/// <summary>
/// Data freshness information
/// </summary>
public class DataFreshness
{
    /// <summary>
    /// Last data update timestamp
    /// </summary>
    public DateTime LastDataUpdate { get; set; }

    /// <summary>
    /// Data age in hours
    /// </summary>
    public int DataAgeHours { get; set; }

    /// <summary>
    /// Data completeness percentage
    /// </summary>
    public decimal CompletenessPercentage { get; set; }

    /// <summary>
    /// Any data quality issues
    /// </summary>
    public List<string> QualityIssues { get; set; } = new();
}

/// <summary>
/// Action step for implementing recommendation
/// </summary>
public class ActionStep
{
    /// <summary>
    /// Step sequence number
    /// </summary>
    public int StepNumber { get; set; }

    /// <summary>
    /// Step description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Responsible role or person
    /// </summary>
    public string ResponsibleRole { get; set; } = string.Empty;

    /// <summary>
    /// Estimated time to complete
    /// </summary>
    public string EstimatedTime { get; set; } = string.Empty;

    /// <summary>
    /// Prerequisites for this step
    /// </summary>
    public List<string> Prerequisites { get; set; } = new();
}

/// <summary>
/// Impact estimate for recommendations
/// </summary>
public class ImpactEstimate
{
    /// <summary>
    /// Expected improvement in engagement
    /// </summary>
    public decimal? EngagementImprovement { get; set; }

    /// <summary>
    /// Expected improvement in retention
    /// </summary>
    public decimal? RetentionImprovement { get; set; }

    /// <summary>
    /// Expected member growth impact
    /// </summary>
    public decimal? MemberGrowthImpact { get; set; }

    /// <summary>
    /// Confidence level of impact estimate
    /// </summary>
    public decimal Confidence { get; set; }

    /// <summary>
    /// Timeframe for seeing impact
    /// </summary>
    public string Timeframe { get; set; } = string.Empty;
}

/// <summary>
/// Quantified benefits of pursuing an opportunity
/// </summary>
public class OpportunityBenefits
{
    /// <summary>
    /// Estimated additional members
    /// </summary>
    public int? EstimatedAdditionalMembers { get; set; }

    /// <summary>
    /// Estimated engagement score improvement
    /// </summary>
    public decimal? EngagementImprovement { get; set; }

    /// <summary>
    /// Estimated retention rate improvement
    /// </summary>
    public decimal? RetentionImprovement { get; set; }

    /// <summary>
    /// Estimated revenue impact
    /// </summary>
    public decimal? RevenueImpact { get; set; }

    /// <summary>
    /// ROI calculation if applicable
    /// </summary>
    public decimal? ROI { get; set; }
}

/// <summary>
/// Metric comparison with previous period
/// </summary>
public class MetricComparison
{
    /// <summary>
    /// Current period value
    /// </summary>
    public decimal CurrentValue { get; set; }

    /// <summary>
    /// Previous period value
    /// </summary>
    public decimal PreviousValue { get; set; }

    /// <summary>
    /// Change amount
    /// </summary>
    public decimal Change { get; set; }

    /// <summary>
    /// Percentage change
    /// </summary>
    public decimal PercentageChange { get; set; }

    /// <summary>
    /// Trend direction
    /// </summary>
    public TrendDirection Trend { get; set; }
}

// Enumerations

public enum RecommendationCategory
{
    Engagement,
    Retention,
    Growth,
    Operations,
    Communication,
    Events,
    Technology
}

public enum ImplementationComplexity
{
    Low,
    Medium,
    High,
    VeryHigh
}

public enum OpportunityType
{
    EngagementIncrease,
    MemberGrowth,
    RetentionImprovement,
    OperationalEfficiency,
    RevenueGrowth,
    CostReduction
}

public enum ImpactLevel
{
    Low,
    Medium,
    High,
    VeryHigh
}

public enum EffortLevel
{
    Low,
    Medium,
    High,
    VeryHigh
}

public enum RiskCategory
{
    Engagement,
    Retention,
    Growth,
    Financial,
    Operational,
    Competitive
}