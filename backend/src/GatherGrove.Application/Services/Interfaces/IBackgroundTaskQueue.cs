using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

public interface IBackgroundTaskQueue
{
    Task<string> EnqueueTaskAsync(BackgroundExportTask task);
    Task<BackgroundExportTask?> GetCompletedTaskAsync(string taskId);
    Task<BackgroundTaskStatus> GetTaskStatusAsync(string taskId);
    Task<List<BackgroundExportTask>> GetPendingTasksAsync();
    Task<bool> CancelTaskAsync(string taskId);
}

public class BackgroundExportTask
{
    public string TaskId { get; set; } = string.Empty;
    public int ClubId { get; set; }
    public string ExportType { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public BackgroundTaskStatus Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ResultFileUrl { get; set; }
    public string NotificationEmail { get; set; } = string.Empty;
    public BackgroundTaskPriority Priority { get; set; } = BackgroundTaskPriority.Normal;
    public bool IncludeLargeDatasets { get; set; } = false;
    public bool SendCompletionNotification { get; set; } = true;
}