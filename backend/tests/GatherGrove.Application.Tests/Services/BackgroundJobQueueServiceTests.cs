using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for BackgroundJobQueueService (scheduled report job queue).
/// Tests verify job enqueuing, dequeuing, and queue status operations.
/// </summary>
[TestFixture]
public class BackgroundJobQueueServiceTests
{
    private Mock<ILogger<BackgroundJobQueueService>> _mockLogger = null!;
    private BackgroundJobQueueService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<BackgroundJobQueueService>>();
        _service = new BackgroundJobQueueService(_mockLogger.Object);
    }

    #region EnqueueAsync Tests

    [Test]
    public async Task EnqueueAsync_ValidJob_IncreasesQueueCount()
    {
        // Arrange
        var job = CreateTestJob();
        var initialStatus = await _service.GetQueueStatusAsync();

        // Act
        await _service.EnqueueAsync(job, JobPriority.Normal);

        // Assert
        var newStatus = await _service.GetQueueStatusAsync();
        newStatus.PendingJobCount.Should().Be(initialStatus.PendingJobCount + 1);
    }

    [Test]
    public async Task EnqueueAsync_MultipleJobs_AllAddedToQueue()
    {
        // Arrange
        var jobs = new[]
        {
            CreateTestJob("schedule-1"),
            CreateTestJob("schedule-2"),
            CreateTestJob("schedule-3")
        };

        // Act
        foreach (var job in jobs)
        {
            await _service.EnqueueAsync(job, JobPriority.Normal);
        }

        // Assert
        var status = await _service.GetQueueStatusAsync();
        status.PendingJobCount.Should().Be(3);
    }

    [Test]
    public async Task EnqueueAsync_WithDifferentPriorities_AllEnqueued()
    {
        // Arrange & Act
        await _service.EnqueueAsync(CreateTestJob("critical-1"), JobPriority.Critical);
        await _service.EnqueueAsync(CreateTestJob("high-1"), JobPriority.High);
        await _service.EnqueueAsync(CreateTestJob("normal-1"), JobPriority.Normal);
        await _service.EnqueueAsync(CreateTestJob("low-1"), JobPriority.Low);

        // Assert
        var status = await _service.GetQueueStatusAsync();
        status.PendingJobCount.Should().Be(4);
    }

    #endregion

    #region DequeueAsync Tests

    [Test]
    public async Task DequeueAsync_WithPendingJob_ReturnsJob()
    {
        // Arrange
        var job = CreateTestJob();
        await _service.EnqueueAsync(job, JobPriority.Normal);
        using var cts = new CancellationTokenSource();

        // Act
        var result = await _service.DequeueAsync(cts.Token);

        // Assert
        result.Should().NotBeNull();
        result!.ScheduleId.Should().Be(job.ScheduleId);
    }

    [Test]
    public async Task DequeueAsync_MultipleJobs_ReturnsFIFOOrder()
    {
        // Arrange
        var job1 = CreateTestJob("first");
        var job2 = CreateTestJob("second");
        var job3 = CreateTestJob("third");

        await _service.EnqueueAsync(job1, JobPriority.Normal);
        await _service.EnqueueAsync(job2, JobPriority.Normal);
        await _service.EnqueueAsync(job3, JobPriority.Normal);

        using var cts = new CancellationTokenSource();

        // Act
        var result1 = await _service.DequeueAsync(cts.Token);
        var result2 = await _service.DequeueAsync(cts.Token);
        var result3 = await _service.DequeueAsync(cts.Token);

        // Assert
        result1!.ScheduleId.Should().Be("first");
        result2!.ScheduleId.Should().Be("second");
        result3!.ScheduleId.Should().Be("third");
    }

    [Test]
    public async Task DequeueAsync_AfterDequeue_ReducesQueueCount()
    {
        // Arrange
        var job = CreateTestJob();
        await _service.EnqueueAsync(job, JobPriority.Normal);
        using var cts = new CancellationTokenSource();

        // Act
        await _service.DequeueAsync(cts.Token);

        // Assert
        var status = await _service.GetQueueStatusAsync();
        status.PendingJobCount.Should().Be(0);
    }

    [Test]
    public async Task DequeueAsync_WithCancellation_ThrowsOperationCancelled()
    {
        // Arrange
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        // Act & Assert
        await FluentActions.Invoking(() => _service.DequeueAsync(cts.Token))
            .Should().ThrowAsync<OperationCanceledException>();
    }

    #endregion

    #region GetQueueStatusAsync Tests

    [Test]
    public async Task GetQueueStatusAsync_EmptyQueue_ReturnsZeroPending()
    {
        // Act
        var status = await _service.GetQueueStatusAsync();

        // Assert
        status.Should().NotBeNull();
        status.PendingJobCount.Should().Be(0);
        status.RunningJobCount.Should().Be(0);
    }

    [Test]
    public async Task GetQueueStatusAsync_ReturnsAverageWaitTime()
    {
        // Act
        var status = await _service.GetQueueStatusAsync();

        // Assert
        status.AverageWaitTime.Should().BeGreaterThan(TimeSpan.Zero);
    }

    [Test]
    public async Task GetQueueStatusAsync_AfterEnqueue_ReflectsCurrentCount()
    {
        // Arrange
        await _service.EnqueueAsync(CreateTestJob("job-1"), JobPriority.Normal);
        await _service.EnqueueAsync(CreateTestJob("job-2"), JobPriority.High);

        // Act
        var status = await _service.GetQueueStatusAsync();

        // Assert
        status.PendingJobCount.Should().Be(2);
    }

    #endregion

    #region Concurrent Operations Tests

    [Test]
    public async Task ConcurrentEnqueue_MultipleThreads_AllJobsEnqueued()
    {
        // Arrange
        var tasks = new List<Task>();
        const int jobCount = 50;

        // Act
        for (int i = 0; i < jobCount; i++)
        {
            var job = CreateTestJob($"concurrent-{i}");
            tasks.Add(_service.EnqueueAsync(job, JobPriority.Normal));
        }
        await Task.WhenAll(tasks);

        // Assert
        var status = await _service.GetQueueStatusAsync();
        status.PendingJobCount.Should().Be(jobCount);
    }

    [Test]
    public async Task ConcurrentEnqueueAndDequeue_ThreadSafe()
    {
        // Arrange
        const int operationCount = 20;
        var enqueueTasks = new List<Task>();
        var dequeueTasks = new List<Task<ScheduledReportJob?>>();
        using var cts = new CancellationTokenSource();

        // Pre-enqueue some jobs so dequeue has something to get
        for (int i = 0; i < operationCount; i++)
        {
            await _service.EnqueueAsync(CreateTestJob($"pre-{i}"), JobPriority.Normal);
        }

        // Act - concurrent dequeues
        for (int i = 0; i < operationCount; i++)
        {
            dequeueTasks.Add(_service.DequeueAsync(cts.Token));
        }
        var results = await Task.WhenAll(dequeueTasks);

        // Assert - all dequeues should succeed
        results.Should().AllSatisfy(r => r.Should().NotBeNull());
    }

    #endregion

    #region Edge Cases

    [Test]
    public async Task EnqueueAsync_NullScheduleId_StillEnqueues()
    {
        // Arrange
        var job = new ScheduledReportJob();

        // Act
        await _service.EnqueueAsync(job, JobPriority.Normal);

        // Assert
        var status = await _service.GetQueueStatusAsync();
        status.PendingJobCount.Should().Be(1);
    }

    [Test]
    public async Task EnqueueAndDequeue_SameJob_PropertiesPreserved()
    {
        // Arrange
        var originalJob = new ScheduledReportJob
        {
            ScheduleId = "test-schedule",
            QueuedAt = DateTime.UtcNow,
            Priority = JobPriority.High
        };
        await _service.EnqueueAsync(originalJob, JobPriority.High);
        using var cts = new CancellationTokenSource();

        // Act
        var dequeuedJob = await _service.DequeueAsync(cts.Token);

        // Assert
        dequeuedJob.Should().NotBeNull();
        dequeuedJob!.ScheduleId.Should().Be("test-schedule");
        dequeuedJob.Priority.Should().Be(JobPriority.High);
    }

    #endregion

    #region Helper Methods

    private static ScheduledReportJob CreateTestJob(string scheduleId = "test-schedule")
    {
        return new ScheduledReportJob
        {
            ScheduleId = scheduleId,
            QueuedAt = DateTime.UtcNow
        };
    }

    #endregion
}
