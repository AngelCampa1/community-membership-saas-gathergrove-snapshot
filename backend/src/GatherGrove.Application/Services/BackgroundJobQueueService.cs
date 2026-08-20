using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for background job queue operations
/// US-005 Data Export & Reporting Engine - Implementation
/// </summary>
public class BackgroundJobQueueService : IBackgroundJobQueue
{
    private readonly ILogger<BackgroundJobQueueService> _logger;
    private readonly ConcurrentQueue<(ScheduledReportJob job, JobPriority priority)> _jobs;
    private readonly SemaphoreSlim _semaphore;

    public BackgroundJobQueueService(ILogger<BackgroundJobQueueService> logger)
    {
        _logger = logger;
        _jobs = new ConcurrentQueue<(ScheduledReportJob job, JobPriority priority)>();
        _semaphore = new SemaphoreSlim(0);
    }

    public Task EnqueueAsync(ScheduledReportJob job, JobPriority priority)
    {
        _logger.LogInformation("Enqueueing scheduled report job {ScheduleId} with priority {Priority}", job.ScheduleId, priority);

        _jobs.Enqueue((job, priority));
        _semaphore.Release();

        return Task.CompletedTask;
    }

    public async Task<ScheduledReportJob?> DequeueAsync(CancellationToken cancellationToken)
    {
        await _semaphore.WaitAsync(cancellationToken);

        if (_jobs.TryDequeue(out var jobWithPriority))
        {
            _logger.LogInformation("Dequeued scheduled report job {ScheduleId}", jobWithPriority.job.ScheduleId);
            return jobWithPriority.job;
        }

        return null;
    }

    public Task<QueueStatus> GetQueueStatusAsync()
    {
        var status = new QueueStatus
        {
            PendingJobCount = _jobs.Count,
            RunningJobCount = 0, // Simplified - would track running jobs in real implementation
            AverageWaitTime = TimeSpan.FromMinutes(2) // Mock value
        };

        return Task.FromResult(status);
    }
}