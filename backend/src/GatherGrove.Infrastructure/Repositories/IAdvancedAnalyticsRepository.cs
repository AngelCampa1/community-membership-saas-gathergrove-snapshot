using GatherGrove.Domain.Models;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Interface for advanced analytics repository
/// </summary>
public interface IAdvancedAnalyticsRepository
{
    /// <summary>
    /// Get event engagement data for analytics with optimized performance
    /// </summary>
    Task<List<EventEngagementData>> GetEngagementDataAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get member cohort data for analysis
    /// </summary>
    Task<List<MemberCohortData>> GetCohortDataAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get financial metrics data
    /// </summary>
    Task<FinancialMetricsData> GetFinancialMetricsAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get member engagement patterns
    /// </summary>
    Task<List<MemberEngagementPattern>> GetMemberEngagementPatternsAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get complex engagement metrics
    /// </summary>
    Task<List<ComplexEngagementMetric>> GetComplexEngagementMetricsAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get event performance data for comparison
    /// </summary>
    Task<List<EventPerformanceData>> GetEventPerformanceDataAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get advanced cohort data with detailed retention analysis
    /// </summary>
    Task<List<MemberCohortData>> GetAdvancedCohortDataAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get cohort retention rates by time periods
    /// </summary>
    Task<List<CohortRetentionData>> GetCohortRetentionRatesAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Calculate member lifetime value for cohort analysis
    /// </summary>
    Task<List<MemberLifetimeValueData>> CalculateMemberLifetimeValueAsync(int clubId);

    /// <summary>
    /// Get detailed financial metrics with comprehensive ROI analysis
    /// </summary>
    Task<FinancialMetricsData> GetDetailedFinancialMetricsAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Calculate event-specific ROI metrics
    /// </summary>
    Task<List<EventROIData>> CalculateEventROIAsync(int clubId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get advanced member segmentation with behavioral analysis
    /// </summary>
    Task<List<AdvancedMemberSegment>> GetAdvancedMemberSegmentationAsync(int clubId, AdvancedSegmentationCriteria criteria);
}