using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Interface for scheduled reports service operations
/// US-005 Data Export & Reporting Engine - Automated report scheduling and execution
/// </summary>
public interface IScheduledReportsService
{
    /// <summary>
    /// Create a new scheduled report
    /// </summary>
    Task<ScheduledReportResult> CreateScheduledReport(int clubId, ScheduledReportRequest request, int userId);

    /// <summary>
    /// Get all scheduled reports for a club
    /// </summary>
    Task<List<ScheduledReport>> GetScheduledReports(int clubId);

    /// <summary>
    /// Update an existing scheduled report
    /// </summary>
    Task<ScheduledReport> UpdateScheduledReport(string scheduleId, int clubId, UpdateScheduledReportRequest request);

    /// <summary>
    /// Delete a scheduled report
    /// </summary>
    Task<bool> DeleteScheduledReport(string scheduleId, int clubId);

    /// <summary>
    /// Toggle scheduled report active status
    /// </summary>
    Task<ScheduledReport> ToggleScheduledReport(string scheduleId, bool isActive);

    /// <summary>
    /// Execute a scheduled report
    /// </summary>
    Task<ReportExecutionResult> ExecuteScheduledReport(string scheduleId);

    /// <summary>
    /// Process pending scheduled reports
    /// </summary>
    Task<ScheduledReportProcessingResult> ProcessPendingScheduledReports();

    /// <summary>
    /// Queue a scheduled report for background processing
    /// </summary>
    Task QueueScheduledReport(string scheduleId, JobPriority priority);

    /// <summary>
    /// Process a scheduled report from background queue
    /// </summary>
    Task<ReportExecutionResult> ProcessScheduledReportQueue(ScheduledReportJob job);

    /// <summary>
    /// Get execution history for a scheduled report
    /// </summary>
    Task<List<Domain.Entities.ReportExecutionHistory>> GetScheduledReportHistory(string scheduleId, int limit);

    /// <summary>
    /// Get report execution statistics for a club
    /// </summary>
    Task<ReportExecutionStatistics> GetReportExecutionStatistics(int clubId);

    /// <summary>
    /// Create a scheduled report with the specified request parameters
    /// </summary>
    Task<ScheduledReportResult> CreateScheduledReportAsync(int clubId, CreateScheduledReportRequest request);

    /// <summary>
    /// Get scheduled reports for a club
    /// </summary>
    Task<List<ScheduledReportSummary>> GetScheduledReportsAsync(int clubId);

    /// <summary>
    /// Remove a scheduled report by ID
    /// </summary>
    Task RemoveScheduledReportAsync(string scheduleId);
}
