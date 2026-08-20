using NUnit.Framework;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace Domain.Tests.Entities;

[TestFixture]
public class ReportExecutionHistoryTests
{
    #region Default Value Tests (2 tests)

    [Test]
    public void Id_DefaultsToGuid()
    {
        var history = new ReportExecutionHistory();
        Assert.That(history.Id, Is.Not.Null);
        Assert.That(history.Id, Is.Not.EqualTo(string.Empty));
        Assert.That(Guid.Parse(history.Id), Is.Not.EqualTo(Guid.Empty));
    }

    [Test]
    public void ScheduleId_DefaultsToEmptyString()
    {
        var history = new ReportExecutionHistory();
        Assert.That(history.ScheduleId, Is.EqualTo(string.Empty));
    }

    #endregion

    #region Status Tests (5 tests)

    [Test]
    public void Status_CanBePending()
    {
        var history = new ReportExecutionHistory { Status = ScheduledReportExecutionStatus.Pending };
        Assert.That(history.Status, Is.EqualTo(ScheduledReportExecutionStatus.Pending));
    }

    [Test]
    public void Status_CanBeRunning()
    {
        var history = new ReportExecutionHistory { Status = ScheduledReportExecutionStatus.Running };
        Assert.That(history.Status, Is.EqualTo(ScheduledReportExecutionStatus.Running));
    }

    [Test]
    public void Status_CanBeCompleted()
    {
        var history = new ReportExecutionHistory { Status = ScheduledReportExecutionStatus.Completed };
        Assert.That(history.Status, Is.EqualTo(ScheduledReportExecutionStatus.Completed));
    }

    [Test]
    public void Status_CanBeFailed()
    {
        var history = new ReportExecutionHistory { Status = ScheduledReportExecutionStatus.Failed };
        Assert.That(history.Status, Is.EqualTo(ScheduledReportExecutionStatus.Failed));
    }

    [Test]
    public void Status_CanBeCancelled()
    {
        var history = new ReportExecutionHistory { Status = ScheduledReportExecutionStatus.Cancelled };
        Assert.That(history.Status, Is.EqualTo(ScheduledReportExecutionStatus.Cancelled));
    }

    #endregion

    #region Timestamp Tests (4 tests)

    [Test]
    public void ExecutedAt_CanBeSet()
    {
        var executionTime = DateTime.UtcNow;
        var history = new ReportExecutionHistory { ExecutedAt = executionTime };
        Assert.That(history.ExecutedAt, Is.EqualTo(executionTime));
    }

    [Test]
    public void CompletedAt_CanBeSet()
    {
        var completionTime = DateTime.UtcNow;
        var history = new ReportExecutionHistory { CompletedAt = completionTime };
        Assert.That(history.CompletedAt, Is.EqualTo(completionTime));
    }

    [Test]
    public void CompletedAt_CanBeNull()
    {
        var history = new ReportExecutionHistory { CompletedAt = null };
        Assert.That(history.CompletedAt, Is.Null);
    }

    [Test]
    public void CompletedAt_ShouldBeAfterExecutedAt()
    {
        var history = new ReportExecutionHistory
        {
            ExecutedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow
        };

        Assert.That(history.CompletedAt, Is.GreaterThan(history.ExecutedAt));
    }

    #endregion

    #region Performance Metrics Tests (4 tests)

    [Test]
    public void ExecutionTimeSeconds_CanBeSet()
    {
        var history = new ReportExecutionHistory { ExecutionTimeSeconds = 45 };
        Assert.That(history.ExecutionTimeSeconds, Is.EqualTo(45));
    }

    [Test]
    public void FastExecution_UnderOneMinute()
    {
        var history = new ReportExecutionHistory { ExecutionTimeSeconds = 30 };
        Assert.That(history.ExecutionTimeSeconds, Is.LessThan(60));
    }

    [Test]
    public void SlowExecution_OverFiveMinutes()
    {
        var history = new ReportExecutionHistory { ExecutionTimeSeconds = 350 };
        Assert.That(history.ExecutionTimeSeconds, Is.GreaterThan(300));
    }

    [Test]
    public void ReportSizeBytes_CanBeSet()
    {
        var history = new ReportExecutionHistory { ReportSizeBytes = 2048576 };
        Assert.That(history.ReportSizeBytes, Is.EqualTo(2048576));
    }

    #endregion

    #region Report Output Tests (3 tests)

    [Test]
    public void ReportFilePath_CanBeSet()
    {
        var history = new ReportExecutionHistory { ReportFilePath = "/reports/monthly-2025-01.pdf" };
        Assert.That(history.ReportFilePath, Is.EqualTo("/reports/monthly-2025-01.pdf"));
    }

    [Test]
    public void ReportFilePath_CanBeNull()
    {
        var history = new ReportExecutionHistory { ReportFilePath = null };
        Assert.That(history.ReportFilePath, Is.Null);
    }

    [Test]
    public void JobId_CanBeSet()
    {
        var history = new ReportExecutionHistory { JobId = "job_abc123" };
        Assert.That(history.JobId, Is.EqualTo("job_abc123"));
    }

    #endregion

    #region Error Handling Tests (3 tests)

    [Test]
    public void ErrorMessage_CanBeSet()
    {
        var history = new ReportExecutionHistory { ErrorMessage = "Database connection timeout" };
        Assert.That(history.ErrorMessage, Is.EqualTo("Database connection timeout"));
    }

    [Test]
    public void ErrorMessage_CanBeNull()
    {
        var history = new ReportExecutionHistory { ErrorMessage = null };
        Assert.That(history.ErrorMessage, Is.Null);
    }

    [Test]
    public void FailedExecution_HasErrorMessage()
    {
        var history = new ReportExecutionHistory
        {
            Status = ScheduledReportExecutionStatus.Failed,
            ErrorMessage = "Report generation failed due to missing data"
        };

        Assert.That(history.Status, Is.EqualTo(ScheduledReportExecutionStatus.Failed));
        Assert.That(history.ErrorMessage, Is.Not.Null);
    }

    #endregion

    #region Complete Execution Scenarios Tests (5 tests)

    [Test]
    public void SuccessfulExecution_TracksAllMetrics()
    {
        var history = new ReportExecutionHistory
        {
            ScheduleId = "schedule_123",
            Status = ScheduledReportExecutionStatus.Completed,
            ExecutedAt = DateTime.UtcNow.AddMinutes(-10),
            CompletedAt = DateTime.UtcNow,
            ExecutionTimeSeconds = 120,
            ReportSizeBytes = 1024000,
            ReportFilePath = "/exports/weekly-report-2025-01.xlsx",
            JobId = "job_xyz789"
        };

        Assert.That(history.Status, Is.EqualTo(ScheduledReportExecutionStatus.Completed));
        Assert.That(history.CompletedAt, Is.Not.Null);
        Assert.That(history.ErrorMessage, Is.Null);
        Assert.That(history.ReportFilePath, Is.Not.Null);
    }

    [Test]
    public void FailedExecution_RecordsError()
    {
        var history = new ReportExecutionHistory
        {
            ScheduleId = "schedule_456",
            Status = ScheduledReportExecutionStatus.Failed,
            ExecutedAt = DateTime.UtcNow.AddMinutes(-3),
            CompletedAt = DateTime.UtcNow,
            ExecutionTimeSeconds = 45,
            ErrorMessage = "Failed to access financial data - permission denied"
        };

        Assert.That(history.Status, Is.EqualTo(ScheduledReportExecutionStatus.Failed));
        Assert.That(history.ErrorMessage, Contains.Substring("permission denied"));
        Assert.That(history.ReportFilePath, Is.Null);
    }

    [Test]
    public void RunningExecution_HasNoCompletionTime()
    {
        var history = new ReportExecutionHistory
        {
            Status = ScheduledReportExecutionStatus.Running,
            ExecutedAt = DateTime.UtcNow.AddMinutes(-2),
            CompletedAt = null
        };

        Assert.That(history.Status, Is.EqualTo(ScheduledReportExecutionStatus.Running));
        Assert.That(history.CompletedAt, Is.Null);
    }

    [Test]
    public void CancelledExecution_NoOutputGenerated()
    {
        var history = new ReportExecutionHistory
        {
            Status = ScheduledReportExecutionStatus.Cancelled,
            ExecutedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-4),
            ReportFilePath = null,
            ErrorMessage = "Report cancelled by user"
        };

        Assert.That(history.Status, Is.EqualTo(ScheduledReportExecutionStatus.Cancelled));
        Assert.That(history.ReportFilePath, Is.Null);
    }

    [Test]
    public void LargeReport_TracksFileSize()
    {
        var history = new ReportExecutionHistory
        {
            Status = ScheduledReportExecutionStatus.Completed,
            ReportSizeBytes = 15728640, // 15 MB
            ExecutionTimeSeconds = 180 // 3 minutes
        };

        Assert.That(history.ReportSizeBytes, Is.GreaterThan(10000000)); // > 10 MB
        Assert.That(history.ExecutionTimeSeconds, Is.GreaterThan(60)); // > 1 minute
    }

    #endregion
}
