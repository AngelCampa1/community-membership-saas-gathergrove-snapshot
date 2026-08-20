using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for scheduled report operations
/// US-005 Data Export & Reporting Engine - Data access layer for scheduled reports
/// </summary>
public class ScheduledReportRepository : IScheduledReportRepository
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<ScheduledReportRepository> _logger;

    public ScheduledReportRepository(
        GatherGroveDbContext context,
        ILogger<ScheduledReportRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Create a new scheduled report
    /// </summary>
    public async Task<string> CreateScheduledReportAsync(ScheduledReport scheduledReport)
    {
        try
        {
            _logger.LogInformation("Creating scheduled report {ReportName} for club {ClubId}",
                scheduledReport.ReportName, scheduledReport.ClubId);

            _context.ScheduledReports.Add(scheduledReport);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created scheduled report with ID {ScheduleId}", scheduledReport.Id);
            return scheduledReport.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating scheduled report for club {ClubId}", scheduledReport.ClubId);
            throw;
        }
    }

    /// <summary>
    /// Get scheduled reports by club ID
    /// </summary>
    public async Task<List<ScheduledReport>> GetScheduledReportsByClubIdAsync(int clubId)
    {
        try
        {
            return await _context.ScheduledReports
                .Where(sr => sr.ClubId == clubId)
                .OrderBy(sr => sr.ReportName)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting scheduled reports for club {ClubId}", clubId);
            return new List<ScheduledReport>();
        }
    }

    /// <summary>
    /// Get scheduled report by ID
    /// </summary>
    public async Task<ScheduledReport> GetScheduledReportByIdAsync(string scheduleId)
    {
        try
        {
            var report = await _context.ScheduledReports
                .FirstOrDefaultAsync(sr => sr.Id == scheduleId);

            if (report == null)
            {
                _logger.LogWarning("Scheduled report {ScheduleId} not found", scheduleId);
            }

            return report;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting scheduled report {ScheduleId}", scheduleId);
            throw;
        }
    }

    /// <summary>
    /// Update scheduled report
    /// </summary>
    public async Task UpdateScheduledReportAsync(ScheduledReport scheduledReport)
    {
        try
        {
            _context.ScheduledReports.Update(scheduledReport);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated scheduled report {ScheduleId}", scheduledReport.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating scheduled report {ScheduleId}", scheduledReport.Id);
            throw;
        }
    }

    /// <summary>
    /// Delete scheduled report
    /// </summary>
    public async Task<bool> DeleteScheduledReportAsync(string scheduleId)
    {
        try
        {
            var report = await _context.ScheduledReports
                .FirstOrDefaultAsync(sr => sr.Id == scheduleId);

            if (report == null)
            {
                _logger.LogWarning("Scheduled report {ScheduleId} not found for deletion", scheduleId);
                return false;
            }

            _context.ScheduledReports.Remove(report);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted scheduled report {ScheduleId}", scheduleId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting scheduled report {ScheduleId}", scheduleId);
            return false;
        }
    }

    /// <summary>
    /// Get due scheduled reports
    /// </summary>
    public async Task<List<ScheduledReport>> GetDueScheduledReportsAsync()
    {
        try
        {
            var now = DateTime.UtcNow;

            return await _context.ScheduledReports
                .Where(sr => sr.IsActive && sr.NextRunDate <= now)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting due scheduled reports");
            return new List<ScheduledReport>();
        }
    }

    /// <summary>
    /// Update last execution time
    /// </summary>
    public async Task UpdateLastExecutionAsync(string scheduleId, DateTime lastExecuted, DateTime nextRunDate)
    {
        try
        {
            var report = await _context.ScheduledReports
                .FirstOrDefaultAsync(sr => sr.Id == scheduleId);

            if (report != null)
            {
                report.LastExecuted = lastExecuted;
                report.NextRunDate = nextRunDate;
                report.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                _logger.LogInformation("Updated execution times for scheduled report {ScheduleId}", scheduleId);
            }
            else
            {
                _logger.LogWarning("Scheduled report {ScheduleId} not found for execution update", scheduleId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating execution times for scheduled report {ScheduleId}", scheduleId);
            throw;
        }
    }

    /// <summary>
    /// Get report execution history
    /// </summary>
    public async Task<List<ReportExecutionHistory>> GetReportExecutionHistoryAsync(string scheduleId, int limit)
    {
        try
        {
            return await _context.ReportExecutionHistories
                .Where(reh => reh.ScheduleId == scheduleId)
                .OrderByDescending(reh => reh.ExecutedAt)
                .Take(limit)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting execution history for scheduled report {ScheduleId}", scheduleId);
            return new List<ReportExecutionHistory>();
        }
    }

    /// <summary>
    /// Get report execution statistics (simplified)
    /// </summary>
    public async Task<(int totalExecutions, int successfulExecutions, int failedExecutions, decimal successRate, TimeSpan averageExecutionTime, DateTime? lastSuccessfulExecution, DateTime? lastFailedExecution)> GetReportExecutionStatisticsAsync(int clubId)
    {
        try
        {
            var executions = await _context.ReportExecutionHistories
                .Join(_context.ScheduledReports,
                    reh => reh.ScheduleId,
                    sr => sr.Id,
                    (reh, sr) => new { reh, sr })
                .Where(joined => joined.sr.ClubId == clubId)
                .Select(joined => joined.reh)
                .ToListAsync();

            var totalExecutions = executions.Count;
            var successfulExecutions = executions.Count(e => e.Status == ScheduledReportExecutionStatus.Completed);
            var failedExecutions = executions.Count(e => e.Status == ScheduledReportExecutionStatus.Failed);
            var successRate = totalExecutions > 0 ? (decimal)successfulExecutions / totalExecutions * 100m : 0m;
            var averageExecutionTime = executions.Any()
                ? TimeSpan.FromSeconds(executions.Average(e => e.ExecutionTimeSeconds))
                : TimeSpan.Zero;

            var lastSuccessfulExecution = executions
                .Where(e => e.Status == ScheduledReportExecutionStatus.Completed)
                .OrderByDescending(e => e.ExecutedAt)
                .FirstOrDefault()?.ExecutedAt;

            var lastFailedExecution = executions
                .Where(e => e.Status == ScheduledReportExecutionStatus.Failed)
                .OrderByDescending(e => e.ExecutedAt)
                .FirstOrDefault()?.ExecutedAt;

            return (totalExecutions, successfulExecutions, failedExecutions, successRate, averageExecutionTime, lastSuccessfulExecution, lastFailedExecution);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting execution statistics for club {ClubId}", clubId);
            return (0, 0, 0, 0m, TimeSpan.Zero, null, null);
        }
    }
}