using System;
using System.Collections.Generic;

namespace GatherGrove.Domain.Models;

/// <summary>
/// Base financial metrics data for ROI analysis
/// </summary>
public class FinancialMetricsData
{
    public double TotalRevenue { get; set; }
    public double ExpenseAmount { get; set; }
    public double NetProfit { get; set; }
    public double ROI { get; set; }
    public double RevenueGrowthRate { get; set; }
    public double AvgRevenuePerMember { get; set; }
    public double AvgRevenuePerEvent { get; set; }
    public double ConversionRate { get; set; }
    public double ChurnRate { get; set; }
    public double LifetimeValue { get; set; }
    public Dictionary<string, double> RevenueBySource { get; set; } = new();
}

/// <summary>
/// Advanced cohort retention data for detailed analysis
/// </summary>
public class CohortRetentionData
{
    public string CohortName { get; set; } = string.Empty;
    public DateTime CohortStartDate { get; set; }
    public int InitialSize { get; set; }
    public Dictionary<string, double> RetentionByPeriod { get; set; } = new();
    public double AverageRetentionRate { get; set; }
    public int ChurnedMembers { get; set; }
    public TimeSpan AverageLifespan { get; set; }
}

/// <summary>
/// Member lifetime value calculation data
/// </summary>
public class MemberLifetimeValueData
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public decimal LifetimeValue { get; set; }
    public int MonthsActive { get; set; }
    public decimal AverageMonthlyValue { get; set; }
    public decimal TotalPayments { get; set; }
    public DateTime JoinDate { get; set; }
    public DateTime? LastActivityDate { get; set; }
    public bool IsActive { get; set; }
    public string ValueSegment { get; set; } = string.Empty; // High, Medium, Low
}

/// <summary>
/// Event-specific ROI analysis data
/// </summary>
public class EventROIData
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public decimal Revenue { get; set; }
    public decimal Costs { get; set; }
    public decimal Profit { get; set; }
    public double ROIPercentage { get; set; }
    public int AttendeeCount { get; set; }
    public decimal CostPerAttendee { get; set; }
    public decimal RevenuePerAttendee { get; set; }
    public Dictionary<string, decimal> CostBreakdown { get; set; } = new();
    public Dictionary<string, decimal> RevenueBreakdown { get; set; } = new();
    public string PerformanceRating { get; set; } = string.Empty; // Excellent, Good, Fair, Poor
}

/// <summary>
/// Advanced member segmentation with behavioral analysis
/// </summary>
public class AdvancedMemberSegment
{
    public string SegmentName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public double EngagementScore { get; set; }
    public decimal AverageRevenue { get; set; }
    public double ChurnRisk { get; set; }
    public Dictionary<string, object> Characteristics { get; set; } = new();
    public Dictionary<string, double> BehaviorPatterns { get; set; } = new();
    public List<string> RecommendedActions { get; set; } = new();
    public string GrowthTrend { get; set; } = string.Empty;
    public DateTime LastAnalyzed { get; set; }
}

/// <summary>
/// Advanced segmentation criteria
/// </summary>
public class AdvancedSegmentationCriteria
{
    public double EngagementThreshold { get; set; } = 70.0;
    public double AttendanceThreshold { get; set; } = 60.0;
    public decimal RevenueThreshold { get; set; } = 100.0m;
    public int PeriodMonths { get; set; } = 6;
    public List<string> CustomCriteria { get; set; } = new();
    public bool IncludeBehavioralAnalysis { get; set; } = true;
    public bool IncludeRiskAssessment { get; set; } = true;
}

/// <summary>
/// Enhanced financial metrics with comprehensive analysis
/// </summary>
public class EnhancedFinancialMetricsData : FinancialMetricsData
{
    public Dictionary<DateTime, double> MonthlyTrends { get; set; } = new();
    public Dictionary<string, decimal> CostBreakdown { get; set; } = new();
    public decimal TotalCosts { get; set; }
    public double ROIPercentage { get; set; }
    public double GrowthRate { get; set; }
    public double ProfitMargin { get; set; }
    public Dictionary<string, double> KPIs { get; set; } = new();
    public List<string> Insights { get; set; } = new();
    public Dictionary<string, double> Benchmarks { get; set; } = new();
}

/// <summary>
/// Real-time analytics update data for SignalR streaming
/// </summary>
public class RealTimeAnalyticsUpdate
{
    public int ClubId { get; set; }
    public string UpdateType { get; set; } = string.Empty; // engagement, cohort, roi, segmentation
    public DateTime Timestamp { get; set; }
    public object Data { get; set; } = new();
    public Dictionary<string, object> Metadata { get; set; } = new();
    public string Source { get; set; } = string.Empty; // background_job, user_request, scheduled_update
}

/// <summary>
/// Event engagement data for analytics
/// </summary>
public class EventEngagementData
{
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public int TotalRsvps { get; set; }
    public int CheckedInCount { get; set; }
    public int TotalShares { get; set; }
    public int TotalViews { get; set; }
    public int TotalReactions { get; set; }
    public double EngagementScore { get; set; }
    public double CheckInRate { get; set; }
    public TimeSpan AvgTimeSpent { get; set; }
    public int FeedbackCount { get; set; }
    public double AvgRating { get; set; }
}

/// <summary>
/// Member cohort data for analysis
/// </summary>
public class MemberCohortData
{
    public string CohortName { get; set; } = string.Empty;
    public DateTime JoinDate { get; set; }
    public int MemberCount { get; set; }
    public int ActiveMembers { get; set; }
    public double RetentionRate { get; set; }
    public double EngagementScore { get; set; }
    public int EventAttendance { get; set; }
    public TimeSpan AvgTimeActive { get; set; }
    public double RevenueContribution { get; set; }
    public int ReferralCount { get; set; }
}

/// <summary>
/// Member engagement pattern for analysis
/// </summary>
public class MemberEngagementPattern
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public double EngagementScore { get; set; }
    public int EventsAttended { get; set; }
    public TimeSpan AvgSessionDuration { get; set; }
    public DateTime LastActivity { get; set; }
    public string EngagementLevel { get; set; } = string.Empty;
    public List<string> PreferredEventTypes { get; set; } = new();
    public Dictionary<string, int> ActivityBreakdown { get; set; } = new();
    public bool IsAtRisk { get; set; }
    public string RecommendedActions { get; set; } = string.Empty;
}

/// <summary>
/// Complex engagement metric for advanced analysis
/// </summary>
public class ComplexEngagementMetric
{
    public string MetricName { get; set; } = string.Empty;
    public double CurrentValue { get; set; }
    public double PreviousValue { get; set; }
    public double ChangePercentage { get; set; }
    public string Trend { get; set; } = string.Empty;
    public Dictionary<DateTime, double> HistoricalData { get; set; } = new();
    public double Benchmark { get; set; }
    public string PerformanceRating { get; set; } = string.Empty;
    public List<string> Insights { get; set; } = new();
}

/// <summary>
/// Event performance data for comparison
/// </summary>
public class EventPerformanceData
{
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public string EventType { get; set; } = string.Empty;
    public double PerformanceScore { get; set; }
    public double AttendanceRate { get; set; }
    public double EngagementRate { get; set; }
    public double SatisfactionScore { get; set; }
    public double RevenueGenerated { get; set; }
    public double CostEfficiency { get; set; }
    public Dictionary<string, double> Metrics { get; set; } = new();
    public List<string> SuccessFactors { get; set; } = new();
    public List<string> ImprovementAreas { get; set; } = new();
}