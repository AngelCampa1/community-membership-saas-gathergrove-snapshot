using System.Collections.Concurrent;
using System.Threading.Channels;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Implementation of background job queue for scheduled reports using priority-based channels
/// </summary>
public class BackgroundJobQueue : IBackgroundJobQueue
{
    private readonly ILogger<BackgroundJobQueue> _logger;
    private readonly Dictionary<JobPriority, Channel<ScheduledReportJob>> _priorityQueues;
    private readonly ConcurrentDictionary<string, DateTime> _jobQueuedTimes;
    private readonly ConcurrentDictionary<string, DateTime> _runningJobs;
    private readonly SemaphoreSlim _queueLock = new(1, 1);

    public BackgroundJobQueue(ILogger<BackgroundJobQueue> logger)
    {
        _logger = logger;
        _jobQueuedTimes = new ConcurrentDictionary<string, DateTime>();
        _runningJobs = new ConcurrentDictionary<string, DateTime>();

        // Create priority queues for each priority level
        _priorityQueues = new Dictionary<JobPriority, Channel<ScheduledReportJob>>
        {
            { JobPriority.Critical, Channel.CreateUnbounded<ScheduledReportJob>(new UnboundedChannelOptions { SingleReader = false, SingleWriter = false }) },
            { JobPriority.High, Channel.CreateUnbounded<ScheduledReportJob>(new UnboundedChannelOptions { SingleReader = false, SingleWriter = false }) },
            { JobPriority.Normal, Channel.CreateUnbounded<ScheduledReportJob>(new UnboundedChannelOptions { SingleReader = false, SingleWriter = false }) },
            { JobPriority.Low, Channel.CreateUnbounded<ScheduledReportJob>(new UnboundedChannelOptions { SingleReader = false, SingleWriter = false }) }
        };
    }

    /// <summary>
    /// Enqueue a job with the specified priority
    /// </summary>
    public async Task EnqueueAsync(ScheduledReportJob job, JobPriority priority)
    {
        if (job == null)
        {
            throw new ArgumentNullException(nameof(job));
        }

        if (string.IsNullOrWhiteSpace(job.ScheduleId))
        {
            throw new ArgumentException("ScheduleId cannot be empty", nameof(job));
        }

        _logger.LogInformation(
            "Enqueuing scheduled report job {ScheduleId} with priority {Priority}",
            job.ScheduleId,
            priority
        );

        try
        {
            // Record when the job was queued
            job.QueuedAt = DateTime.UtcNow;
            _jobQueuedTimes[job.ScheduleId] = job.QueuedAt;

            // Add to the appropriate priority queue
            if (!_priorityQueues.TryGetValue(priority, out var queue))
            {
                _logger.LogWarning(
                    "Invalid priority {Priority} for job {ScheduleId}, using Normal priority",
                    priority,
                    job.ScheduleId
                );
                queue = _priorityQueues[JobPriority.Normal];
            }

            await queue.Writer.WriteAsync(job);

            _logger.LogInformation(
                "Successfully enqueued job {ScheduleId} with priority {Priority}",
                job.ScheduleId,
                priority
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to enqueue job {ScheduleId} with priority {Priority}",
                job.ScheduleId,
                priority
            );
            throw;
        }
    }

    /// <summary>
    /// Dequeue the highest priority job available
    /// </summary>
    public async Task<ScheduledReportJob?> DequeueAsync(CancellationToken cancellationToken)
    {

        try
        {
            // Check queues in priority order (Critical -> High -> Normal -> Low)
            foreach (var priority in new[] { JobPriority.Critical, JobPriority.High, JobPriority.Normal, JobPriority.Low })
            {
                if (_priorityQueues[priority].Reader.TryRead(out var job))
                {
                    // Mark as running
                    _runningJobs[job.ScheduleId] = DateTime.UtcNow;

                    _logger.LogInformation(
                        "Dequeued job {ScheduleId} with priority {Priority}, waited {WaitTime:F2}s",
                        job.ScheduleId,
                        priority,
                        (DateTime.UtcNow - job.QueuedAt).TotalSeconds
                    );

                    return job;
                }
            }

            // No jobs available, wait for any job to arrive with timeout
            var readTasks = _priorityQueues.Select(kvp =>
                kvp.Value.Reader.WaitToReadAsync(cancellationToken).AsTask()
            ).ToList();

            try
            {
                // Wait for any queue to have data available (with cancellation support)
                await Task.WhenAny(readTasks);

                // Try to read from queues again in priority order
                foreach (var priority in new[] { JobPriority.Critical, JobPriority.High, JobPriority.Normal, JobPriority.Low })
                {
                    if (_priorityQueues[priority].Reader.TryRead(out var job))
                    {
                        _runningJobs[job.ScheduleId] = DateTime.UtcNow;

                        _logger.LogInformation(
                            "Dequeued job {ScheduleId} with priority {Priority}, waited {WaitTime:F2}s",
                            job.ScheduleId,
                            priority,
                            (DateTime.UtcNow - job.QueuedAt).TotalSeconds
                        );

                        return job;
                    }
                }
            }
            catch (OperationCanceledException)
            {
                return null;
            }

            return null;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error dequeuing job from background queue");
            throw;
        }
    }

    /// <summary>
    /// Get current queue status including pending and running job counts
    /// </summary>
    public async Task<QueueStatus> GetQueueStatusAsync()
    {
        await _queueLock.WaitAsync();
        try
        {

            // Count pending jobs across all priority queues
            var pendingJobCount = _priorityQueues.Sum(kvp =>
                kvp.Value.Reader.Count
            );

            // Count running jobs
            var runningJobCount = _runningJobs.Count;

            // Calculate average wait time from queued jobs
            var currentTime = DateTime.UtcNow;
            var queuedJobs = _jobQueuedTimes
                .Where(kvp => !_runningJobs.ContainsKey(kvp.Key))
                .ToList();

            var averageWaitTime = queuedJobs.Any()
                ? TimeSpan.FromSeconds(queuedJobs.Average(kvp => (currentTime - kvp.Value).TotalSeconds))
                : TimeSpan.Zero;

            _logger.LogInformation(
                "Queue status: {PendingJobs} pending, {RunningJobs} running, {AverageWait:F2}s average wait",
                pendingJobCount,
                runningJobCount,
                averageWaitTime.TotalSeconds
            );

            return await Task.FromResult(new QueueStatus
            {
                PendingJobCount = pendingJobCount,
                RunningJobCount = runningJobCount,
                AverageWaitTime = averageWaitTime
            });
        }
        finally
        {
            _queueLock.Release();
        }
    }

    /// <summary>
    /// Mark a job as completed (removes from running jobs tracking)
    /// </summary>
    public void MarkJobCompleted(string scheduleId)
    {
        _runningJobs.TryRemove(scheduleId, out _);
        _jobQueuedTimes.TryRemove(scheduleId, out _);

        _logger.LogInformation("Job {ScheduleId} marked as completed", scheduleId);
    }
}
