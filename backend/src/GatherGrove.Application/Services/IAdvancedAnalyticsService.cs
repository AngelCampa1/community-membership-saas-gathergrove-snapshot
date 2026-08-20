using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Analytics;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for advanced analytics service providing premium analytics features
/// </summary>
public interface IAdvancedAnalyticsService
{
    // Primary interface methods that match the controller expectations
    Task<List<EngagementTrendDto>> GetEngagementTrendsAsync(int clubId, DateTime startDate, DateTime endDate);
    Task<List<CohortDto>> GetCohortAnalysisAsync(int clubId, DateTime startDate, DateTime endDate);
    Task<List<ROIDto>> GetFinancialROIAsync(int clubId, DateTime startDate, DateTime endDate);
    Task<List<EventComparisonDto>> CompareEventsAsync(int clubId, List<int> eventIds);
    Task<List<MemberSegmentDto>> GetMemberSegmentationAsync(int clubId, List<string> criteria);
    Task<ExportResponseDto> ExportDataAsync(int clubId, int userId, string dataType, string format, DateTime startDate, DateTime endDate);

    // Background processing methods
    Task PrecomputeAnalyticsAsync(int clubId);
    Task<byte[]> GetCachedAnalyticsAsync(int clubId, string dataType);

    // Missing method required by tests
    Task<EventROIMetrics> CalculateROIMetricsAsync(int clubId, int periodMonths);

    // Legacy methods with different signatures - keeping for backward compatibility
    Task<AdvancedEventEngagementTrends> GetEngagementTrendsAsync(int clubId, int userId, int daysBack);
    Task<DTOs.EventEngagementTrends> GetEngagementTrendsWithUserAsync(int clubId, int userId, DateTime startDate, DateTime endDate);
    Task<DTOs.CohortAnalysisResponse> GetCohortAnalysisWithUserAsync(int clubId, int userId, DateTime startDate, DateTime endDate);
    Task<DTOs.FinancialRoiAnalysis> GetFinancialROIWithUserAsync(int clubId, int userId, DateTime startDate, DateTime endDate);
    Task<EventROIMetrics> GetFinancialROIAsync(int clubId, int periodMonths);
    Task<DTOs.EventPerformanceComparison> CompareEventsWithUserAsync(List<int> eventIds, int clubId, int userId);
    Task<DTOs.EventPerformanceComparison> CompareEventsAsync(List<int> eventIds, int clubId, int userId, bool legacy);
    Task<MemberSegmentationResult> GetMemberSegmentationWithUserAsync(int clubId, int userId, MemberSegmentationCriteria criteria);

    // Additional controller methods with userId parameter
    Task<List<EngagementTrendDto>> GetEngagementTrendsAsync(int clubId, int userId, DateTime startDate, DateTime endDate);
    Task<List<CohortDto>> GetCohortAnalysisAsync(int clubId, int userId, DateTime startDate, DateTime endDate);
    Task<List<ROIDto>> GetFinancialROIAsync(int clubId, int userId, DateTime startDate, DateTime endDate);
    Task<List<EventComparisonDto>> CompareEventsAsync(int clubId, int userId, List<int> eventIds);

    // Additional interface method that was missing - causing the return type mismatch
    Task<MemberSegmentationAnalysis> GetMemberSegmentationAsync(int clubId, string segmentationType, DateTime startDate, DateTime endDate, int userId);

    // Additional methods called by wrapper service
    Task<EventComparisonResponse> CompareEventPerformanceAsync(List<int> eventIds, int clubId, int userId);
}