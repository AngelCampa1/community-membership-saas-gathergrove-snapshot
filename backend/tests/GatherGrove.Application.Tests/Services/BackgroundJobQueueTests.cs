using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Comprehensive tests for BackgroundJobQueue service.
/// Tests priority-based job queue operations for scheduled reports.
///
/// Test categories:
/// - EnqueueAsync: validation, priority handling
/// - DequeueAsync: priority ordering, cancellation
/// - GetQueueStatusAsync: pending/running counts, wait times
/// - MarkJobCompleted: cleanup operations
/// - Concurrent access: thread safety
/// </summary>
[TestFixture]
public class BackgroundJobQueueTests
{
    private Mock<ILogger<BackgroundJobQueue>> _mockLogger;
    private BackgroundJobQueue _queue;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<BackgroundJobQueue>>();
        _queue = new BackgroundJobQueue(_mockLogger.Object);
    }

    #region EnqueueAsync Tests

    [Test]
    public async Task EnqueueAsync_ValidJob_QueuesSuccessfully()
    {
        // Arrange
        var job = CreateTestJob("job-1");

        // Act
        await _queue.EnqueueAsync(job, JobPriority.Normal);

        // Assert
        var status = await _queue.GetQueueStatusAsync();
        status.PendingJobCount.Should().Be(1);
    }

    [Test]
    public void EnqueueAsync_NullJob_ThrowsArgumentNullException()
    {
        // Act & Assert
        var act = async () => await _queue.EnqueueAsync(null!, JobPriority.Normal);
        act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("job");
    }

    [Test]
    public void EnqueueAsync_EmptyScheduleId_ThrowsArgumentException()
    {
        // Arrange
        var job = new ScheduledReportJob { ScheduleId = "" };

        // Act & Assert
        var act = async () => await _queue.EnqueueAsync(job, JobPriority.Normal);
        act.Should().ThrowAsync<ArgumentException>().WithParameterName("job");
    }

    [Test]
    public void EnqueueAsync_WhitespaceScheduleId_ThrowsArgumentException()
    {
        // Arrange
        var job = new ScheduledReportJob { ScheduleId = "   " };

        // Act & Assert
        var act = async () => await _queue.EnqueueAsync(job, JobPriority.Normal);
        act.Should().ThrowAsync<ArgumentException>();
    }

    [Test]
    public async Task EnqueueAsync_SetsQueuedAtTimestamp()
    {
        // Arrange
        var job = CreateTestJob("job-timestamp");
        var beforeEnqueue = DateTime.UtcNow;

        // Act
        await _queue.EnqueueAsync(job, JobPriority.Normal);

        // Assert
        job.QueuedAt.Should().BeOnOrAfter(beforeEnqueue);
        job.QueuedAt.Should().BeOnOrBefore(DateTime.UtcNow);
    }

    [Test]
    public async Task EnqueueAsync_AllPriorities_WorkCorrectly()
    {
        // Arrange & Act
        await _queue.EnqueueAsync(CreateTestJob("critical-1"), JobPriority.Critical);
        await _queue.EnqueueAsync(CreateTestJob("high-1"), JobPriority.High);
        await _queue.EnqueueAsync(CreateTestJob("normal-1"), JobPriority.Normal);
        await _queue.EnqueueAsync(CreateTestJob("low-1"), JobPriority.Low);

        // Assert
        var status = await _queue.GetQueueStatusAsync();
        status.PendingJobCount.Should().Be(4);
    }

    [Test]
    public async Task EnqueueAsync_LogsInformation()
    {
        // Arrange
        var job = CreateTestJob("log-test");

        // Act
        await _queue.EnqueueAsync(job, JobPriority.Normal);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Enqueuing")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    #endregion

    #region DequeueAsync Tests

    [Test]
    public async Task DequeueAsync_EmptyQueue_WaitsForJob()
    {
        // Arrange
        using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(100));

        // Act
        var result = await _queue.DequeueAsync(cts.Token);

        // Assert - should return null after cancellation timeout
        result.Should().BeNull();
    }

    [Test]
    public async Task DequeueAsync_SingleJob_ReturnsJob()
    {
        // Arrange
        var job = CreateTestJob("dequeue-1");
        await _queue.EnqueueAsync(job, JobPriority.Normal);
        using var cts = new CancellationTokenSource();

        // Act
        var result = await _queue.DequeueAsync(cts.Token);

        // Assert
        result.Should().NotBeNull();
        result!.ScheduleId.Should().Be("dequeue-1");
    }

    [Test]
    public async Task DequeueAsync_CriticalBeforeHigh()
    {
        // Arrange - enqueue low first, then critical
        await _queue.EnqueueAsync(CreateTestJob("high-priority"), JobPriority.High);
        await _queue.EnqueueAsync(CreateTestJob("critical-priority"), JobPriority.Critical);

        using var cts = new CancellationTokenSource();

        // Act - first dequeue should return critical
        var result = await _queue.DequeueAsync(cts.Token);

        // Assert
        result.Should().NotBeNull();
        result!.ScheduleId.Should().Be("critical-priority");
    }

    [Test]
    public async Task DequeueAsync_HighBeforeNormal()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("normal-priority"), JobPriority.Normal);
        await _queue.EnqueueAsync(CreateTestJob("high-priority"), JobPriority.High);

        using var cts = new CancellationTokenSource();

        // Act
        var result = await _queue.DequeueAsync(cts.Token);

        // Assert
        result.Should().NotBeNull();
        result!.ScheduleId.Should().Be("high-priority");
    }

    [Test]
    public async Task DequeueAsync_NormalBeforeLow()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("low-priority"), JobPriority.Low);
        await _queue.EnqueueAsync(CreateTestJob("normal-priority"), JobPriority.Normal);

        using var cts = new CancellationTokenSource();

        // Act
        var result = await _queue.DequeueAsync(cts.Token);

        // Assert
        result.Should().NotBeNull();
        result!.ScheduleId.Should().Be("normal-priority");
    }

    [Test]
    public async Task DequeueAsync_FullPriorityOrder()
    {
        // Arrange - add in reverse priority order
        await _queue.EnqueueAsync(CreateTestJob("low"), JobPriority.Low);
        await _queue.EnqueueAsync(CreateTestJob("normal"), JobPriority.Normal);
        await _queue.EnqueueAsync(CreateTestJob("high"), JobPriority.High);
        await _queue.EnqueueAsync(CreateTestJob("critical"), JobPriority.Critical);

        using var cts = new CancellationTokenSource();

        // Act & Assert - should dequeue in priority order
        var result1 = await _queue.DequeueAsync(cts.Token);
        result1!.ScheduleId.Should().Be("critical");

        var result2 = await _queue.DequeueAsync(cts.Token);
        result2!.ScheduleId.Should().Be("high");

        var result3 = await _queue.DequeueAsync(cts.Token);
        result3!.ScheduleId.Should().Be("normal");

        var result4 = await _queue.DequeueAsync(cts.Token);
        result4!.ScheduleId.Should().Be("low");
    }

    [Test]
    public async Task DequeueAsync_MarksJobAsRunning()
    {
        // Arrange
        var job = CreateTestJob("running-test");
        await _queue.EnqueueAsync(job, JobPriority.Normal);

        using var cts = new CancellationTokenSource();

        // Act
        await _queue.DequeueAsync(cts.Token);

        // Assert - status should show running job
        var status = await _queue.GetQueueStatusAsync();
        status.RunningJobCount.Should().Be(1);
        status.PendingJobCount.Should().Be(0);
    }

    [Test]
    public async Task DequeueAsync_CancellationRequested_ReturnsNull()
    {
        // Arrange - immediately cancelled token
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        // Act
        var result = await _queue.DequeueAsync(cts.Token);

        // Assert
        result.Should().BeNull();
    }

    [Test]
    public async Task DequeueAsync_LogsDequeuedJob()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("log-dequeue"), JobPriority.Normal);
        using var cts = new CancellationTokenSource();

        // Act
        await _queue.DequeueAsync(cts.Token);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Dequeued")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    #endregion

    #region GetQueueStatusAsync Tests

    [Test]
    public async Task GetQueueStatusAsync_EmptyQueue_ReturnsZeroCounts()
    {
        // Act
        var status = await _queue.GetQueueStatusAsync();

        // Assert
        status.PendingJobCount.Should().Be(0);
        status.RunningJobCount.Should().Be(0);
        status.AverageWaitTime.Should().Be(TimeSpan.Zero);
    }

    [Test]
    public async Task GetQueueStatusAsync_WithPendingJobs_ReturnsCorrectCount()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("job-1"), JobPriority.Normal);
        await _queue.EnqueueAsync(CreateTestJob("job-2"), JobPriority.High);
        await _queue.EnqueueAsync(CreateTestJob("job-3"), JobPriority.Low);

        // Act
        var status = await _queue.GetQueueStatusAsync();

        // Assert
        status.PendingJobCount.Should().Be(3);
        status.RunningJobCount.Should().Be(0);
    }

    [Test]
    public async Task GetQueueStatusAsync_WithRunningJobs_ReturnsCorrectCount()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("job-1"), JobPriority.Normal);
        await _queue.EnqueueAsync(CreateTestJob("job-2"), JobPriority.Normal);

        using var cts = new CancellationTokenSource();

        // Dequeue one job to mark it as running
        await _queue.DequeueAsync(cts.Token);

        // Act
        var status = await _queue.GetQueueStatusAsync();

        // Assert
        status.PendingJobCount.Should().Be(1);
        status.RunningJobCount.Should().Be(1);
    }

    [Test]
    public async Task GetQueueStatusAsync_CalculatesAverageWaitTime()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("wait-test-1"), JobPriority.Normal);

        // Wait a bit to accumulate some wait time
        await Task.Delay(100);

        // Act
        var status = await _queue.GetQueueStatusAsync();

        // Assert - wait time should be at least the delay
        status.AverageWaitTime.TotalMilliseconds.Should().BeGreaterOrEqualTo(50); // Allow some tolerance
    }

    [Test]
    public async Task GetQueueStatusAsync_MixedPriorities_CountsAll()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("critical"), JobPriority.Critical);
        await _queue.EnqueueAsync(CreateTestJob("high"), JobPriority.High);
        await _queue.EnqueueAsync(CreateTestJob("normal"), JobPriority.Normal);
        await _queue.EnqueueAsync(CreateTestJob("low"), JobPriority.Low);

        // Act
        var status = await _queue.GetQueueStatusAsync();

        // Assert
        status.PendingJobCount.Should().Be(4);
    }

    [Test]
    public async Task GetQueueStatusAsync_LogsStatus()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("status-log"), JobPriority.Normal);

        // Act
        await _queue.GetQueueStatusAsync();

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Queue status")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    #endregion

    #region MarkJobCompleted Tests

    [Test]
    public async Task MarkJobCompleted_RemovesJobFromRunningCount()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("complete-test"), JobPriority.Normal);
        using var cts = new CancellationTokenSource();

        var job = await _queue.DequeueAsync(cts.Token);

        // Verify it's running first
        var statusBefore = await _queue.GetQueueStatusAsync();
        statusBefore.RunningJobCount.Should().Be(1);

        // Act
        _queue.MarkJobCompleted("complete-test");

        // Assert
        var statusAfter = await _queue.GetQueueStatusAsync();
        statusAfter.RunningJobCount.Should().Be(0);
    }

    [Test]
    public void MarkJobCompleted_NonExistentJob_DoesNotThrow()
    {
        // Act - should not throw
        var act = () => _queue.MarkJobCompleted("non-existent-job");

        // Assert
        act.Should().NotThrow();
    }

    [Test]
    public async Task MarkJobCompleted_RemovesFromQueuedTimes()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("queued-time-test"), JobPriority.Normal);
        using var cts = new CancellationTokenSource();

        await _queue.DequeueAsync(cts.Token);

        // Act
        _queue.MarkJobCompleted("queued-time-test");

        // Assert - should not affect average wait time calculation
        var status = await _queue.GetQueueStatusAsync();
        status.AverageWaitTime.Should().Be(TimeSpan.Zero);
    }

    [Test]
    public async Task MarkJobCompleted_LogsCompletion()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("log-complete"), JobPriority.Normal);
        using var cts = new CancellationTokenSource();
        await _queue.DequeueAsync(cts.Token);

        // Act
        _queue.MarkJobCompleted("log-complete");

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("marked as completed")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Concurrent Access Tests

    [Test]
    public async Task EnqueueAsync_ConcurrentEnqueues_AllJobsQueued()
    {
        // Arrange
        var tasks = new List<Task>();

        // Act - enqueue 50 jobs concurrently
        for (int i = 0; i < 50; i++)
        {
            var jobId = i;
            tasks.Add(_queue.EnqueueAsync(CreateTestJob($"concurrent-{jobId}"), JobPriority.Normal));
        }

        await Task.WhenAll(tasks);

        // Assert - all should be queued
        var status = await _queue.GetQueueStatusAsync();
        status.PendingJobCount.Should().Be(50);
    }

    [Test]
    public async Task DequeueAsync_ConcurrentDequeues_NoJobProcessedTwice()
    {
        // Arrange
        var jobIds = Enumerable.Range(1, 20).Select(i => $"concurrent-dequeue-{i}").ToList();
        foreach (var id in jobIds)
        {
            await _queue.EnqueueAsync(CreateTestJob(id), JobPriority.Normal);
        }

        var dequeuedIds = new System.Collections.Concurrent.ConcurrentBag<string>();
        using var cts = new CancellationTokenSource();

        // Act - concurrent dequeues
        var tasks = Enumerable.Range(0, 20).Select(_ =>
            Task.Run(async () =>
            {
                var job = await _queue.DequeueAsync(cts.Token);
                if (job != null)
                {
                    dequeuedIds.Add(job.ScheduleId);
                }
            })
        ).ToList();

        await Task.WhenAll(tasks);

        // Assert - each job should be dequeued exactly once
        dequeuedIds.Should().HaveCount(20);
        dequeuedIds.Distinct().Should().HaveCount(20);
    }

    [Test]
    public async Task GetQueueStatusAsync_ConcurrentCalls_ThreadSafe()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("status-concurrent"), JobPriority.Normal);

        var tasks = new List<Task<QueueStatus>>();

        // Act - call status 20 times concurrently
        for (int i = 0; i < 20; i++)
        {
            tasks.Add(_queue.GetQueueStatusAsync());
        }

        var results = await Task.WhenAll(tasks);

        // Assert - all should complete without exception
        results.Should().HaveCount(20);
        results.Should().OnlyContain(s => s.PendingJobCount >= 0);
    }

    [Test]
    public async Task MixedOperations_Concurrent_ThreadSafe()
    {
        // Arrange
        var enqueueCount = 0;
        var dequeueCount = 0;

        using var cts = new CancellationTokenSource();
        var tasks = new List<Task>();

        // Act - mix of operations concurrently
        for (int i = 0; i < 30; i++)
        {
            if (i % 3 == 0)
            {
                var id = Interlocked.Increment(ref enqueueCount);
                tasks.Add(_queue.EnqueueAsync(CreateTestJob($"mixed-{id}"), JobPriority.Normal));
            }
            else if (i % 3 == 1)
            {
                tasks.Add(Task.Run(async () =>
                {
                    var job = await _queue.DequeueAsync(cts.Token);
                    if (job != null)
                    {
                        Interlocked.Increment(ref dequeueCount);
                    }
                }));
            }
            else
            {
                tasks.Add(_queue.GetQueueStatusAsync());
            }
        }

        // Cancel any waiting dequeues
        await Task.Delay(100);
        await cts.CancelAsync();

        await Task.WhenAll(tasks);

        // Assert - operations should complete without exception
        var status = await _queue.GetQueueStatusAsync();
        status.PendingJobCount.Should().BeGreaterOrEqualTo(0);
    }

    #endregion

    #region Edge Cases

    [Test]
    public async Task EnqueueAsync_MultipleJobsSameId_AllQueued()
    {
        // Arrange & Act - same ID multiple times (edge case)
        await _queue.EnqueueAsync(CreateTestJob("duplicate-id"), JobPriority.Normal);
        await _queue.EnqueueAsync(CreateTestJob("duplicate-id"), JobPriority.Normal);

        // Assert - both should be queued (queue doesn't enforce uniqueness)
        var status = await _queue.GetQueueStatusAsync();
        status.PendingJobCount.Should().Be(2);
    }

    [Test]
    public async Task DequeueAsync_SamePriorityFIFO()
    {
        // Arrange - same priority, should maintain order
        await _queue.EnqueueAsync(CreateTestJob("first"), JobPriority.Normal);
        await Task.Delay(10);
        await _queue.EnqueueAsync(CreateTestJob("second"), JobPriority.Normal);

        using var cts = new CancellationTokenSource();

        // Act
        var result1 = await _queue.DequeueAsync(cts.Token);
        var result2 = await _queue.DequeueAsync(cts.Token);

        // Assert - FIFO within same priority
        result1!.ScheduleId.Should().Be("first");
        result2!.ScheduleId.Should().Be("second");
    }

    [Test]
    public async Task GetQueueStatusAsync_AfterCompleteAll_ReturnsEmpty()
    {
        // Arrange
        await _queue.EnqueueAsync(CreateTestJob("complete-all-1"), JobPriority.Normal);
        await _queue.EnqueueAsync(CreateTestJob("complete-all-2"), JobPriority.Normal);

        using var cts = new CancellationTokenSource();

        // Dequeue all
        var job1 = await _queue.DequeueAsync(cts.Token);
        var job2 = await _queue.DequeueAsync(cts.Token);

        // Complete all
        _queue.MarkJobCompleted(job1!.ScheduleId);
        _queue.MarkJobCompleted(job2!.ScheduleId);

        // Act
        var status = await _queue.GetQueueStatusAsync();

        // Assert
        status.PendingJobCount.Should().Be(0);
        status.RunningJobCount.Should().Be(0);
    }

    [Test]
    public async Task FullWorkflow_EnqueueDequeueComplete()
    {
        // Arrange
        var job = CreateTestJob("full-workflow");

        // Act - full lifecycle
        await _queue.EnqueueAsync(job, JobPriority.High);

        var statusQueued = await _queue.GetQueueStatusAsync();
        statusQueued.PendingJobCount.Should().Be(1);

        using var cts = new CancellationTokenSource();
        var dequeued = await _queue.DequeueAsync(cts.Token);

        var statusRunning = await _queue.GetQueueStatusAsync();
        statusRunning.RunningJobCount.Should().Be(1);

        _queue.MarkJobCompleted(dequeued!.ScheduleId);

        var statusComplete = await _queue.GetQueueStatusAsync();

        // Assert
        statusComplete.PendingJobCount.Should().Be(0);
        statusComplete.RunningJobCount.Should().Be(0);
    }

    #endregion

    #region Helper Methods

    private static ScheduledReportJob CreateTestJob(string scheduleId)
    {
        return new ScheduledReportJob
        {
            ScheduleId = scheduleId,
            Priority = JobPriority.Normal
        };
    }

    #endregion
}
