using GatherGrove.Application.DTOs.Export;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Repositories;

/// <summary>
/// Repository implementation for scheduled report operations
/// Wraps the Infrastructure repository to match the Application interface
/// </summary>
public class ScheduledReportRepository : IScheduledReportRepository
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<ScheduledReportRepository> _logger;
    private readonly GatherGrove.Infrastructure.Repositories.IScheduledReportRepository _infrastructureRepository;

    public ScheduledReportRepository(
        GatherGroveDbContext context,
        ILogger<ScheduledReportRepository> logger,
        GatherGrove.Infrastructure.Repositories.IScheduledReportRepository infrastructureRepository)
    {
        _context = context;
        _logger = logger;
        _infrastructureRepository = infrastructureRepository;
    }

    public async Task<string> CreateScheduledReportAsync(ScheduledReport scheduledReport)
    {
        return await _infrastructureRepository.CreateScheduledReportAsync(scheduledReport);
    }

    public async Task<List<ScheduledReport>> GetScheduledReportsByClubIdAsync(int clubId)
    {
        return await _infrastructureRepository.GetScheduledReportsByClubIdAsync(clubId);
    }

    public async Task<ScheduledReport> GetScheduledReportByIdAsync(string scheduleId)
    {
        return await _infrastructureRepository.GetScheduledReportByIdAsync(scheduleId);
    }

    public async Task UpdateScheduledReportAsync(ScheduledReport scheduledReport)
    {
        await _infrastructureRepository.UpdateScheduledReportAsync(scheduledReport);
    }

    public async Task<bool> DeleteScheduledReportAsync(string scheduleId)
    {
        return await _infrastructureRepository.DeleteScheduledReportAsync(scheduleId);
    }

    public async Task<List<ScheduledReport>> GetDueScheduledReportsAsync()
    {
        return await _infrastructureRepository.GetDueScheduledReportsAsync();
    }

    public async Task UpdateLastExecutionAsync(string scheduleId, DateTime lastExecuted, DateTime nextRunDate)
    {
        await _infrastructureRepository.UpdateLastExecutionAsync(scheduleId, lastExecuted, nextRunDate);
    }

    public async Task<List<Domain.Entities.ReportExecutionHistory>> GetReportExecutionHistoryAsync(string scheduleId, int limit)
    {
        return await _infrastructureRepository.GetReportExecutionHistoryAsync(scheduleId, limit);
    }

    public async Task<ReportExecutionStatistics> GetReportExecutionStatisticsAsync(int clubId)
    {
        _logger.LogInformation("Getting report execution statistics for club {ClubId}", clubId);

        // Get statistics from infrastructure repository (returns a tuple)
        var (totalExecutions, successfulExecutions, failedExecutions, successRate, averageExecutionTime, lastSuccessfulExecution, lastFailedExecution)
            = await _infrastructureRepository.GetReportExecutionStatisticsAsync(clubId);

        // Convert tuple to ReportExecutionStatistics object
        return new ReportExecutionStatistics
        {
            TotalExecutions = totalExecutions,
            SuccessfulExecutions = successfulExecutions,
            FailedExecutions = failedExecutions,
            SuccessRate = successRate,
            AverageExecutionTime = averageExecutionTime,
            LastSuccessfulExecution = lastSuccessfulExecution,
            LastFailedExecution = lastFailedExecution
        };
    }
}
