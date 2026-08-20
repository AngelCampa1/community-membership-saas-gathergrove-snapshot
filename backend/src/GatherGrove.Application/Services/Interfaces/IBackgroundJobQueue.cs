using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Interface for background job queue operations
/// US-005 Data Export & Reporting Engine - Background processing queue
/// </summary>
public interface IBackgroundJobQueue
{
    /// <summary>
    /// Enqueue a scheduled report job
    /// </summary>
    Task EnqueueAsync(ScheduledReportJob job, JobPriority priority);

    /// <summary>
    /// Dequeue a scheduled report job
    /// </summary>
    Task<ScheduledReportJob?> DequeueAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Get queue status
    /// </summary>
    Task<QueueStatus> GetQueueStatusAsync();
}