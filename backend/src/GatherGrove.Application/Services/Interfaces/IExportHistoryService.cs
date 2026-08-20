using GatherGrove.Application.DTOs.Audit;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Service interface for managing export history and tracking
/// </summary>
public interface IExportHistoryService
{
    /// <summary>
    /// Create a new export history record
    /// </summary>
    Task CreateHistoryRecordAsync(ExportHistoryRecord record);

    /// <summary>
    /// Record export failure details
    /// </summary>
    Task RecordExportFailureAsync(ExportFailureRecord record);

    /// <summary>
    /// Get export history records for a specific club
    /// </summary>
    Task<IEnumerable<ExportHistoryRecord>> GetHistoryRecordsAsync(Guid clubId);

    /// <summary>
    /// Get export history records with date filtering
    /// </summary>
    Task<IEnumerable<ExportHistoryRecord>> GetHistoryRecordsAsync(Guid clubId, DateTime fromDate, DateTime toDate);

    /// <summary>
    /// Get export failure records for troubleshooting
    /// </summary>
    Task<IEnumerable<ExportFailureRecord>> GetFailureRecordsAsync(Guid clubId);

    /// <summary>
    /// Update export record status
    /// </summary>
    Task UpdateExportStatusAsync(Guid exportId, Domain.Enums.ExportStatus status, string? errorMessage = null);

    /// <summary>
    /// Purge old export history records based on retention policy
    /// </summary>
    Task PurgeOldRecordsAsync(DateTime cutoffDate);

    /// <summary>
    /// Get export statistics for a club
    /// </summary>
    Task<ExportStatistics> GetExportStatisticsAsync(Guid clubId, AuditDateRange? dateRange = null);
}

/// <summary>
/// Export statistics summary
/// </summary>
public class ExportStatistics
{
    public int TotalExports { get; set; }
    public int SuccessfulExports { get; set; }
    public int FailedExports { get; set; }
    public double SuccessRate => TotalExports > 0 ? (double)SuccessfulExports / TotalExports * 100 : 0;
    public long TotalDataExported { get; set; }
    public int AverageProcessingTimeMs { get; set; }
    public DateTime LastExportAt { get; set; }
}
