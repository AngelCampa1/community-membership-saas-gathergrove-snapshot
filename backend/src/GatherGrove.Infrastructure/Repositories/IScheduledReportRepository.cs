using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for scheduled report operations
/// US-005 Data Export & Reporting Engine - Data access layer for scheduled reports
/// </summary>
public interface IScheduledReportRepository
{
    /// <summary>
    /// Create a new scheduled report
    /// </summary>
    Task<string> CreateScheduledReportAsync(ScheduledReport scheduledReport);

    /// <summary>
    /// Get scheduled reports by club ID
    /// </summary>
    Task<List<ScheduledReport>> GetScheduledReportsByClubIdAsync(int clubId);

    /// <summary>
    /// Get scheduled report by ID
    /// </summary>
    Task<ScheduledReport> GetScheduledReportByIdAsync(string scheduleId);

    /// <summary>
    /// Update scheduled report
    /// </summary>
    Task UpdateScheduledReportAsync(ScheduledReport scheduledReport);

    /// <summary>
    /// Delete scheduled report
    /// </summary>
    Task<bool> DeleteScheduledReportAsync(string scheduleId);

    /// <summary>
    /// Get due scheduled reports
    /// </summary>
    Task<List<ScheduledReport>> GetDueScheduledReportsAsync();

    /// <summary>
    /// Update last execution time
    /// </summary>
    Task UpdateLastExecutionAsync(string scheduleId, DateTime lastExecuted, DateTime nextRunDate);

    /// <summary>
    /// Get report execution history
    /// </summary>
    Task<List<ReportExecutionHistory>> GetReportExecutionHistoryAsync(string scheduleId, int limit);

    /// <summary>
    /// Get report execution statistics (simplified)
    /// </summary>
    Task<(int totalExecutions, int successfulExecutions, int failedExecutions, decimal successRate, TimeSpan averageExecutionTime, DateTime? lastSuccessfulExecution, DateTime? lastFailedExecution)> GetReportExecutionStatisticsAsync(int clubId);
}