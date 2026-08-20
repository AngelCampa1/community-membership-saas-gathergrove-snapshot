using GatherGrove.Application.DTOs.Audit;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Implementation of export history service for tracking export operations
/// </summary>
public class ExportHistoryService : IExportHistoryService
{
    private readonly ILogger<ExportHistoryService> _logger;
    private readonly List<ExportHistoryRecord> _historyRecords;
    private readonly List<ExportFailureRecord> _failureRecords;
    private readonly TimeSpan _retentionPeriod = TimeSpan.FromDays(2555); // 7 years

    public ExportHistoryService(ILogger<ExportHistoryService> logger)
    {
        _logger = logger;
        _historyRecords = new List<ExportHistoryRecord>();
        _failureRecords = new List<ExportFailureRecord>();
    }

    public async Task CreateHistoryRecordAsync(ExportHistoryRecord record)
    {
        if (record == null)
            throw new ArgumentNullException(nameof(record));

        // Ensure proper initialization
        if (record.Id == Guid.Empty)
            record.Id = Guid.NewGuid();

        if (record.RequestedAt == default)
            record.RequestedAt = DateTime.UtcNow;

        _historyRecords.Add(record);

        _logger.LogInformation("Export history record created: {ExportType} for club {ClubId} with {RecordCount} records",
            record.ExportType, record.ClubId, record.RecordCount);

        await Task.CompletedTask;
    }

    public async Task RecordExportFailureAsync(ExportFailureRecord record)
    {
        if (record == null)
            throw new ArgumentNullException(nameof(record));

        // Ensure proper initialization
        if (record.Id == Guid.Empty)
            record.Id = Guid.NewGuid();

        if (record.FailedAt == default)
            record.FailedAt = DateTime.UtcNow;

        record.Status = ExportStatus.Failed;
        _failureRecords.Add(record);

        _logger.LogError("Export failure recorded: {ExportType} for club {ClubId} - {ErrorMessage}",
            record.ExportType, record.ClubId, record.ErrorMessage);

        await Task.CompletedTask;
    }

    public async Task<IEnumerable<ExportHistoryRecord>> GetHistoryRecordsAsync(Guid clubId)
    {
        await Task.CompletedTask;

        var cutoffDate = DateTime.UtcNow.Subtract(_retentionPeriod);

        return _historyRecords
            .Where(record => record.ClubId == clubId && record.RequestedAt >= cutoffDate)
            .OrderByDescending(record => record.RequestedAt)
            .ToList();
    }

    public async Task<IEnumerable<ExportHistoryRecord>> GetHistoryRecordsAsync(Guid clubId, DateTime fromDate, DateTime toDate)
    {
        await Task.CompletedTask;

        return _historyRecords
            .Where(record => record.ClubId == clubId &&
                           record.RequestedAt >= fromDate &&
                           record.RequestedAt <= toDate)
            .OrderByDescending(record => record.RequestedAt)
            .ToList();
    }

    public async Task<IEnumerable<ExportFailureRecord>> GetFailureRecordsAsync(Guid clubId)
    {
        await Task.CompletedTask;

        return _failureRecords
            .Where(record => record.ClubId == clubId)
            .OrderByDescending(record => record.FailedAt)
            .ToList();
    }

    public async Task UpdateExportStatusAsync(Guid exportId, ExportStatus status, string? errorMessage = null)
    {
        var record = _historyRecords.FirstOrDefault(r => r.Id == exportId);
        if (record != null)
        {
            record.Status = status;
            if (status == ExportStatus.Completed)
            {
                record.CompletedAt = DateTime.UtcNow;
            }

            if (!string.IsNullOrEmpty(errorMessage))
            {
                record.ErrorMessage = errorMessage;
            }

            _logger.LogInformation("Export status updated: {ExportId} -> {Status}", exportId, status);
        }

        await Task.CompletedTask;
    }

    public async Task PurgeOldRecordsAsync(DateTime cutoffDate)
    {
        var recordsToRemove = _historyRecords
            .Where(record => record.RequestedAt < cutoffDate)
            .ToList();

        foreach (var record in recordsToRemove)
        {
            _historyRecords.Remove(record);
        }

        var failuresToRemove = _failureRecords
            .Where(record => record.FailedAt < cutoffDate)
            .ToList();

        foreach (var failure in failuresToRemove)
        {
            _failureRecords.Remove(failure);
        }

        _logger.LogInformation("Purged {HistoryCount} history records and {FailureCount} failure records older than {CutoffDate}",
            recordsToRemove.Count, failuresToRemove.Count, cutoffDate);

        await Task.CompletedTask;
    }

    public async Task<ExportStatistics> GetExportStatisticsAsync(Guid clubId, AuditDateRange? dateRange = null)
    {
        await Task.CompletedTask;

        var query = _historyRecords.Where(record => record.ClubId == clubId);

        if (dateRange != null)
        {
            query = query.Where(record => record.RequestedAt >= dateRange.StartDate &&
                                        record.RequestedAt <= dateRange.EndDate);
        }

        var records = query.ToList();
        var successfulExports = records.Count(r => r.Status == ExportStatus.Completed);
        var failedExports = records.Count(r => r.Status == ExportStatus.Failed);

        return new ExportStatistics
        {
            TotalExports = records.Count,
            SuccessfulExports = successfulExports,
            FailedExports = failedExports,
            TotalDataExported = records.Where(r => r.Status == ExportStatus.Completed).Sum(r => r.FileSizeBytes),
            AverageProcessingTimeMs = records.Any() ? (int)records.Average(r => r.ProcessingTimeMs) : 0,
            LastExportAt = records.Any() ? records.Max(r => r.RequestedAt) : DateTime.MinValue
        };
    }
}
