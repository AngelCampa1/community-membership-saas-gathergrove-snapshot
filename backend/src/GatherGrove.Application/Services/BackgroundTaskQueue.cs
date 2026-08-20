using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace GatherGrove.Application.Services;

public class BackgroundTaskQueue : IBackgroundTaskQueue
{
    private readonly ILogger<BackgroundTaskQueue> _logger;
    private readonly ConcurrentDictionary<string, BackgroundExportTask> _tasks = new();

    public BackgroundTaskQueue(ILogger<BackgroundTaskQueue> logger)
    {
        _logger = logger;
    }

    public Task<string> EnqueueTaskAsync(BackgroundExportTask task)
    {
        task.TaskId = Guid.NewGuid().ToString();
        task.Status = BackgroundTaskStatus.Pending;
        task.CreatedAt = DateTime.UtcNow;

        _tasks[task.TaskId] = task;

        _logger.LogInformation("Enqueued background task {TaskId} for club {ClubId} - {ExportType}",
            task.TaskId, task.ClubId, task.ExportType);

        // Simulate background processing
        _ = Task.Run(async () => await ProcessTaskAsync(task.TaskId));

        return Task.FromResult(task.TaskId);
    }

    public async Task<BackgroundExportTask?> GetCompletedTaskAsync(string taskId)
    {
        await Task.Delay(1); // Simulate async operation

        if (_tasks.TryGetValue(taskId, out var task))
        {
            _logger.LogInformation("Retrieved task {TaskId} with status {Status}", taskId, task.Status);
            return task;
        }

        _logger.LogWarning("Task {TaskId} not found", taskId);
        return null;
    }

    public async Task<BackgroundTaskStatus> GetTaskStatusAsync(string taskId)
    {
        await Task.Delay(1); // Simulate async operation

        if (_tasks.TryGetValue(taskId, out var task))
        {
            return task.Status;
        }

        return BackgroundTaskStatus.Failed;
    }

    public async Task<List<BackgroundExportTask>> GetPendingTasksAsync()
    {
        await Task.Delay(1); // Simulate async operation

        return _tasks.Values
            .Where(t => t.Status == BackgroundTaskStatus.Pending || t.Status == BackgroundTaskStatus.Processing)
            .ToList();
    }

    public async Task<bool> CancelTaskAsync(string taskId)
    {
        await Task.Delay(1); // Simulate async operation

        if (_tasks.TryGetValue(taskId, out var task))
        {
            task.Status = BackgroundTaskStatus.Cancelled;
            _logger.LogInformation("Cancelled task {TaskId}", taskId);
            return true;
        }

        return false;
    }

    private async Task ProcessTaskAsync(string taskId)
    {
        try
        {
            if (!_tasks.TryGetValue(taskId, out var task))
                return;

            // Skip processing if task was cancelled before it started
            if (task.Status == BackgroundTaskStatus.Cancelled)
                return;

            task.Status = BackgroundTaskStatus.Processing;
            _logger.LogInformation("Processing task {TaskId}", taskId);

            // Simulate processing time based on priority
            var delay = task.Priority switch
            {
                BackgroundTaskPriority.Critical => 100,
                BackgroundTaskPriority.High => 200,
                BackgroundTaskPriority.Normal => 500,
                BackgroundTaskPriority.Low => 1000,
                _ => 500
            };

            await Task.Delay(delay);

            // Simulate successful completion
            task.Status = BackgroundTaskStatus.Completed;
            task.CompletedAt = DateTime.UtcNow;
            task.ResultFileUrl = $"https://storage.example.com/exports/{task.ExportType}-{DateTime.UtcNow:yyyyMMdd}.csv";

            _logger.LogInformation("Completed task {TaskId} - result available at {Url}",
                taskId, task.ResultFileUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process task {TaskId}", taskId);

            if (_tasks.TryGetValue(taskId, out var task))
            {
                task.Status = BackgroundTaskStatus.Failed;
            }
        }
    }
}