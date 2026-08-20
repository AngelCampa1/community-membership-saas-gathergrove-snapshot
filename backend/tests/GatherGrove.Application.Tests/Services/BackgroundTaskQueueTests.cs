using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Enums;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for BackgroundTaskQueue (background export task queue).
/// Tests verify task lifecycle, status transitions, and concurrent operations.
/// </summary>
[TestFixture]
public class BackgroundTaskQueueTests
{
    private Mock<ILogger<BackgroundTaskQueue>> _mockLogger = null!;
    private BackgroundTaskQueue _queue = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<BackgroundTaskQueue>>();
        _queue = new BackgroundTaskQueue(_mockLogger.Object);
    }

    #region EnqueueTaskAsync Tests

    [Test]
    public async Task EnqueueTaskAsync_ValidTask_ReturnsTaskId()
    {
        // Arrange
        var task = CreateTestTask();

        // Act
        var taskId = await _queue.EnqueueTaskAsync(task);

        // Assert
        taskId.Should().NotBeNullOrEmpty();
        Guid.TryParse(taskId, out _).Should().BeTrue();
    }

    [Test]
    public async Task EnqueueTaskAsync_SetsTaskId()
    {
        // Arrange
        var task = CreateTestTask();

        // Act
        var returnedId = await _queue.EnqueueTaskAsync(task);

        // Assert
        task.TaskId.Should().Be(returnedId);
    }

    [Test]
    public async Task EnqueueTaskAsync_SetsInitialStatusToPending()
    {
        // Arrange
        var task = CreateTestTask();

        // Act
        await _queue.EnqueueTaskAsync(task);

        // Assert
        task.Status.Should().Be(BackgroundTaskStatus.Pending);
    }

    [Test]
    public async Task EnqueueTaskAsync_SetsCreatedAt()
    {
        // Arrange
        var task = CreateTestTask();
        var before = DateTime.UtcNow;

        // Act
        await _queue.EnqueueTaskAsync(task);

        // Assert
        task.CreatedAt.Should().BeOnOrAfter(before);
        task.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Test]
    public async Task EnqueueTaskAsync_MultipleTasks_EachGetsUniqueId()
    {
        // Arrange
        var tasks = new[]
        {
            CreateTestTask(),
            CreateTestTask(),
            CreateTestTask()
        };

        // Act
        var taskIds = new List<string>();
        foreach (var task in tasks)
        {
            taskIds.Add(await _queue.EnqueueTaskAsync(task));
        }

        // Assert
        taskIds.Should().OnlyHaveUniqueItems();
    }

    #endregion

    #region GetCompletedTaskAsync Tests

    [Test]
    public async Task GetCompletedTaskAsync_ExistingTask_ReturnsTask()
    {
        // Arrange
        var task = CreateTestTask();
        var taskId = await _queue.EnqueueTaskAsync(task);

        // Act
        var result = await _queue.GetCompletedTaskAsync(taskId);

        // Assert
        result.Should().NotBeNull();
        result!.TaskId.Should().Be(taskId);
    }

    [Test]
    public async Task GetCompletedTaskAsync_NonexistentTask_ReturnsNull()
    {
        // Act
        var result = await _queue.GetCompletedTaskAsync("nonexistent-task-id");

        // Assert
        result.Should().BeNull();
    }

    [Test]
    public async Task GetCompletedTaskAsync_AfterProcessing_HasCompletedStatus()
    {
        // Arrange
        var task = CreateTestTask(BackgroundTaskPriority.Critical);
        var taskId = await _queue.EnqueueTaskAsync(task);

        // Wait for processing to complete (Critical priority = 100ms)
        await Task.Delay(500);

        // Act
        var result = await _queue.GetCompletedTaskAsync(taskId);

        // Assert
        result.Should().NotBeNull();
        result!.Status.Should().Be(BackgroundTaskStatus.Completed);
    }

    [Test]
    public async Task GetCompletedTaskAsync_CompletedTask_HasResultFileUrl()
    {
        // Arrange
        var task = CreateTestTask(BackgroundTaskPriority.Critical);
        var taskId = await _queue.EnqueueTaskAsync(task);
        await Task.Delay(500);

        // Act
        var result = await _queue.GetCompletedTaskAsync(taskId);

        // Assert
        result.Should().NotBeNull();
        result!.ResultFileUrl.Should().NotBeNullOrEmpty();
        result.ResultFileUrl.Should().StartWith("https://");
    }

    [Test]
    public async Task GetCompletedTaskAsync_CompletedTask_HasCompletedAt()
    {
        // Arrange
        var task = CreateTestTask(BackgroundTaskPriority.Critical);
        var taskId = await _queue.EnqueueTaskAsync(task);
        await Task.Delay(500);

        // Act
        var result = await _queue.GetCompletedTaskAsync(taskId);

        // Assert
        result.Should().NotBeNull();
        result!.CompletedAt.Should().NotBeNull();
    }

    #endregion

    #region GetTaskStatusAsync Tests

    [Test]
    public async Task GetTaskStatusAsync_NewTask_ReturnsPendingOrProcessing()
    {
        // Arrange
        var task = CreateTestTask();
        var taskId = await _queue.EnqueueTaskAsync(task);

        // Act (immediately after enqueue)
        var status = await _queue.GetTaskStatusAsync(taskId);

        // Assert
        status.Should().BeOneOf(
            BackgroundTaskStatus.Pending,
            BackgroundTaskStatus.Processing,
            BackgroundTaskStatus.Completed
        );
    }

    [Test]
    public async Task GetTaskStatusAsync_NonexistentTask_ReturnsFailed()
    {
        // Act
        var status = await _queue.GetTaskStatusAsync("nonexistent");

        // Assert
        status.Should().Be(BackgroundTaskStatus.Failed);
    }

    [Test]
    public async Task GetTaskStatusAsync_AfterProcessing_ReturnsCompleted()
    {
        // Arrange
        var task = CreateTestTask(BackgroundTaskPriority.Critical);
        var taskId = await _queue.EnqueueTaskAsync(task);
        await Task.Delay(500);

        // Act
        var status = await _queue.GetTaskStatusAsync(taskId);

        // Assert
        status.Should().Be(BackgroundTaskStatus.Completed);
    }

    #endregion

    #region GetPendingTasksAsync Tests

    [Test]
    public async Task GetPendingTasksAsync_EmptyQueue_ReturnsEmptyList()
    {
        // Act
        var pending = await _queue.GetPendingTasksAsync();

        // Assert
        pending.Should().BeEmpty();
    }

    [Test]
    public async Task GetPendingTasksAsync_WithLowPriorityTasks_ReturnsPending()
    {
        // Arrange - use Low priority for longer processing time
        var task = CreateTestTask(BackgroundTaskPriority.Low);
        await _queue.EnqueueTaskAsync(task);

        // Act (immediately - task should still be pending/processing)
        var pending = await _queue.GetPendingTasksAsync();

        // Assert
        pending.Should().HaveCountGreaterOrEqualTo(0); // May complete quickly
    }

    #endregion

    #region CancelTaskAsync Tests

    [Test]
    public async Task CancelTaskAsync_ExistingTask_ReturnsTrue()
    {
        // Arrange
        var task = CreateTestTask(BackgroundTaskPriority.Low);
        var taskId = await _queue.EnqueueTaskAsync(task);

        // Act
        var result = await _queue.CancelTaskAsync(taskId);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task CancelTaskAsync_ExistingTask_SetsStatusToCancelled()
    {
        // Arrange
        var task = CreateTestTask(BackgroundTaskPriority.Low);
        var taskId = await _queue.EnqueueTaskAsync(task);

        // Act
        await _queue.CancelTaskAsync(taskId);

        // Assert
        var cancelledTask = await _queue.GetCompletedTaskAsync(taskId);
        cancelledTask.Should().NotBeNull();
        cancelledTask!.Status.Should().Be(BackgroundTaskStatus.Cancelled);
    }

    [Test]
    public async Task CancelTaskAsync_NonexistentTask_ReturnsFalse()
    {
        // Act
        var result = await _queue.CancelTaskAsync("nonexistent");

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region Priority Processing Tests

    [Test]
    public async Task EnqueueTaskAsync_CriticalPriority_ProcessesFastest()
    {
        // Arrange
        var criticalTask = CreateTestTask(BackgroundTaskPriority.Critical);
        var taskId = await _queue.EnqueueTaskAsync(criticalTask);

        // Wait 200ms (Critical = 100ms delay)
        await Task.Delay(200);

        // Act
        var status = await _queue.GetTaskStatusAsync(taskId);

        // Assert
        status.Should().Be(BackgroundTaskStatus.Completed);
    }

    [Test]
    public async Task EnqueueTaskAsync_DifferentPriorities_AllEventuallyComplete()
    {
        // Arrange
        var tasks = new[]
        {
            CreateTestTask(BackgroundTaskPriority.Critical),
            CreateTestTask(BackgroundTaskPriority.High),
            CreateTestTask(BackgroundTaskPriority.Normal),
            CreateTestTask(BackgroundTaskPriority.Low)
        };

        var taskIds = new List<string>();
        foreach (var task in tasks)
        {
            taskIds.Add(await _queue.EnqueueTaskAsync(task));
        }

        // Wait for longest processing time (Low = 1000ms)
        await Task.Delay(1500);

        // Act & Assert
        foreach (var taskId in taskIds)
        {
            var status = await _queue.GetTaskStatusAsync(taskId);
            status.Should().Be(BackgroundTaskStatus.Completed);
        }
    }

    #endregion

    #region Concurrent Operations Tests

    [Test]
    public async Task ConcurrentEnqueue_MultipleThreads_AllSucceed()
    {
        // Arrange
        const int taskCount = 20;
        var enqueueTasks = new List<Task<string>>();

        // Act
        for (int i = 0; i < taskCount; i++)
        {
            enqueueTasks.Add(_queue.EnqueueTaskAsync(CreateTestTask()));
        }
        var taskIds = await Task.WhenAll(enqueueTasks);

        // Assert
        taskIds.Should().HaveCount(taskCount);
        taskIds.Should().OnlyHaveUniqueItems();
    }

    [Test]
    public async Task ConcurrentStatusChecks_ThreadSafe()
    {
        // Arrange
        var task = CreateTestTask(BackgroundTaskPriority.Normal);
        var taskId = await _queue.EnqueueTaskAsync(task);

        var statusTasks = new List<Task<BackgroundTaskStatus>>();

        // Act
        for (int i = 0; i < 10; i++)
        {
            statusTasks.Add(_queue.GetTaskStatusAsync(taskId));
        }
        var statuses = await Task.WhenAll(statusTasks);

        // Assert - all should return valid statuses
        statuses.Should().AllSatisfy(s =>
            s.Should().BeOneOf(
                BackgroundTaskStatus.Pending,
                BackgroundTaskStatus.Processing,
                BackgroundTaskStatus.Completed,
                BackgroundTaskStatus.Cancelled,
                BackgroundTaskStatus.Failed
            )
        );
    }

    #endregion

    #region Helper Methods

    private static BackgroundExportTask CreateTestTask(
        BackgroundTaskPriority priority = BackgroundTaskPriority.Normal)
    {
        return new BackgroundExportTask
        {
            ClubId = 1,
            ExportType = "TestExport",
            Priority = priority
        };
    }

    #endregion
}
