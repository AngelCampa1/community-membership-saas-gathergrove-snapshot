using NUnit.Framework;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.DTOs.Audit;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class ExportHistoryServiceTests
{
    private ExportHistoryService _service = null!;
    private Mock<ILogger<ExportHistoryService>> _mockLogger = null!;
    private Guid _testClubId;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<ExportHistoryService>>();
        _service = new ExportHistoryService(_mockLogger.Object);
        _testClubId = Guid.NewGuid();
    }

    #region CreateHistoryRecordAsync Tests

    [Test]
    public async Task CreateHistoryRecordAsync_ValidRecord_CreatesRecord()
    {
        // Arrange
        var record = new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            Format = ExportFormat.CSV,
            RequestedBy = Guid.NewGuid(),
            RecordCount = 100,
            Status = ExportStatus.Processing
        };

        // Act
        await _service.CreateHistoryRecordAsync(record);

        // Assert
        var records = await _service.GetHistoryRecordsAsync(_testClubId);
        Assert.That(records.Count(), Is.EqualTo(1));
        Assert.That(records.First().ExportType, Is.EqualTo(ExportType.Members));
    }

    [Test]
    public async Task CreateHistoryRecordAsync_EmptyId_AssignsNewId()
    {
        // Arrange
        var record = new ExportHistoryRecord
        {
            Id = Guid.Empty,
            ClubId = _testClubId,
            ExportType = ExportType.Events,
            RecordCount = 50
        };

        // Act
        await _service.CreateHistoryRecordAsync(record);

        // Assert
        var records = await _service.GetHistoryRecordsAsync(_testClubId);
        Assert.That(records.First().Id, Is.Not.EqualTo(Guid.Empty));
    }

    [Test]
    public async Task CreateHistoryRecordAsync_DefaultRequestedAt_AssignsCurrentTime()
    {
        // Arrange
        var record = new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Financials,
            RequestedAt = default,
            RecordCount = 25
        };
        var beforeCreate = DateTime.UtcNow;

        // Act
        await _service.CreateHistoryRecordAsync(record);
        var afterCreate = DateTime.UtcNow;

        // Assert
        var records = await _service.GetHistoryRecordsAsync(_testClubId);
        Assert.That(records.First().RequestedAt, Is.GreaterThanOrEqualTo(beforeCreate));
        Assert.That(records.First().RequestedAt, Is.LessThanOrEqualTo(afterCreate));
    }

    [Test]
    public void CreateHistoryRecordAsync_NullRecord_ThrowsArgumentNullException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentNullException>(
            async () => await _service.CreateHistoryRecordAsync(null!));
    }

    [Test]
    public async Task CreateHistoryRecordAsync_LogsInformation()
    {
        // Arrange
        var record = new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            RecordCount = 100
        };

        // Act
        await _service.CreateHistoryRecordAsync(record);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Export history record created")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task CreateHistoryRecordAsync_AllExportTypes_AreAccepted()
    {
        // Arrange & Act
        var exportTypes = Enum.GetValues<ExportType>();
        foreach (var exportType in exportTypes)
        {
            var record = new ExportHistoryRecord
            {
                ClubId = _testClubId,
                ExportType = exportType,
                RecordCount = 10
            };
            await _service.CreateHistoryRecordAsync(record);
        }

        // Assert
        var records = await _service.GetHistoryRecordsAsync(_testClubId);
        Assert.That(records.Count(), Is.EqualTo(exportTypes.Length));
    }

    [Test]
    public async Task CreateHistoryRecordAsync_AllExportFormats_AreAccepted()
    {
        // Arrange & Act
        var formats = Enum.GetValues<ExportFormat>();
        foreach (var format in formats)
        {
            var record = new ExportHistoryRecord
            {
                ClubId = _testClubId,
                ExportType = ExportType.Members,
                Format = format,
                RecordCount = 10
            };
            await _service.CreateHistoryRecordAsync(record);
        }

        // Assert
        var records = await _service.GetHistoryRecordsAsync(_testClubId);
        Assert.That(records.Count(), Is.EqualTo(formats.Length));
    }

    #endregion

    #region RecordExportFailureAsync Tests

    [Test]
    public async Task RecordExportFailureAsync_ValidRecord_CreatesFailureRecord()
    {
        // Arrange
        var record = new ExportFailureRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            ErrorMessage = "Test error"
        };

        // Act
        await _service.RecordExportFailureAsync(record);

        // Assert
        var failures = await _service.GetFailureRecordsAsync(_testClubId);
        Assert.That(failures.Count(), Is.EqualTo(1));
        Assert.That(failures.First().ErrorMessage, Is.EqualTo("Test error"));
    }

    [Test]
    public async Task RecordExportFailureAsync_EmptyId_AssignsNewId()
    {
        // Arrange
        var record = new ExportFailureRecord
        {
            Id = Guid.Empty,
            ClubId = _testClubId,
            ExportType = ExportType.Events,
            ErrorMessage = "Error"
        };

        // Act
        await _service.RecordExportFailureAsync(record);

        // Assert
        var failures = await _service.GetFailureRecordsAsync(_testClubId);
        Assert.That(failures.First().Id, Is.Not.EqualTo(Guid.Empty));
    }

    [Test]
    public async Task RecordExportFailureAsync_DefaultFailedAt_AssignsCurrentTime()
    {
        // Arrange
        var record = new ExportFailureRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Financials,
            ErrorMessage = "Failed",
            FailedAt = default
        };
        var beforeCreate = DateTime.UtcNow;

        // Act
        await _service.RecordExportFailureAsync(record);
        var afterCreate = DateTime.UtcNow;

        // Assert
        var failures = await _service.GetFailureRecordsAsync(_testClubId);
        Assert.That(failures.First().FailedAt, Is.GreaterThanOrEqualTo(beforeCreate));
        Assert.That(failures.First().FailedAt, Is.LessThanOrEqualTo(afterCreate));
    }

    [Test]
    public async Task RecordExportFailureAsync_SetsStatusToFailed()
    {
        // Arrange
        var record = new ExportFailureRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            ErrorMessage = "Error"
        };

        // Act
        await _service.RecordExportFailureAsync(record);

        // Assert
        var failures = await _service.GetFailureRecordsAsync(_testClubId);
        Assert.That(failures.First().Status, Is.EqualTo(ExportStatus.Failed));
    }

    [Test]
    public void RecordExportFailureAsync_NullRecord_ThrowsArgumentNullException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentNullException>(
            async () => await _service.RecordExportFailureAsync(null!));
    }

    [Test]
    public async Task RecordExportFailureAsync_LogsError()
    {
        // Arrange
        var record = new ExportFailureRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            ErrorMessage = "Test failure"
        };

        // Act
        await _service.RecordExportFailureAsync(record);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Export failure recorded")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task RecordExportFailureAsync_WithStackTrace_RecordsStackTrace()
    {
        // Arrange
        var record = new ExportFailureRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            ErrorMessage = "Error with stack",
            StackTrace = "at SomeMethod() line 123"
        };

        // Act
        await _service.RecordExportFailureAsync(record);

        // Assert
        var failures = await _service.GetFailureRecordsAsync(_testClubId);
        Assert.That(failures.First().StackTrace, Is.EqualTo("at SomeMethod() line 123"));
    }

    #endregion

    #region GetHistoryRecordsAsync Tests

    [Test]
    public async Task GetHistoryRecordsAsync_WithRecords_ReturnsClubRecords()
    {
        // Arrange
        await CreateTestHistoryRecords(5);

        // Act
        var records = await _service.GetHistoryRecordsAsync(_testClubId);

        // Assert
        Assert.That(records.Count(), Is.EqualTo(5));
    }

    [Test]
    public async Task GetHistoryRecordsAsync_NoRecords_ReturnsEmptyList()
    {
        // Act
        var records = await _service.GetHistoryRecordsAsync(Guid.NewGuid());

        // Assert
        Assert.That(records, Is.Empty);
    }

    [Test]
    public async Task GetHistoryRecordsAsync_OnlyReturnsRecordsForSpecifiedClub()
    {
        // Arrange
        var otherClubId = Guid.NewGuid();
        await CreateTestHistoryRecords(3);
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = otherClubId,
            ExportType = ExportType.Members,
            RecordCount = 10
        });

        // Act
        var clubRecords = await _service.GetHistoryRecordsAsync(_testClubId);
        var otherClubRecords = await _service.GetHistoryRecordsAsync(otherClubId);

        // Assert
        Assert.That(clubRecords.Count(), Is.EqualTo(3));
        Assert.That(otherClubRecords.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetHistoryRecordsAsync_RecordsAreOrderedByRequestedAtDescending()
    {
        // Arrange
        for (int i = 0; i < 3; i++)
        {
            await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
            {
                ClubId = _testClubId,
                ExportType = ExportType.Members,
                RecordCount = i,
                RequestedAt = DateTime.UtcNow.AddMinutes(i)
            });
        }

        // Act
        var records = (await _service.GetHistoryRecordsAsync(_testClubId)).ToList();

        // Assert
        Assert.That(records[0].RecordCount, Is.EqualTo(2)); // Most recent
        Assert.That(records[1].RecordCount, Is.EqualTo(1));
        Assert.That(records[2].RecordCount, Is.EqualTo(0)); // Oldest
    }

    [Test]
    public async Task GetHistoryRecordsAsync_WithDateRange_FiltersRecords()
    {
        // Arrange
        var now = DateTime.UtcNow;
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            RecordCount = 1,
            RequestedAt = now.AddDays(-10) // Outside range
        });
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            RecordCount = 2,
            RequestedAt = now.AddDays(-3) // Inside range
        });
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            RecordCount = 3,
            RequestedAt = now.AddDays(-1) // Inside range
        });

        var fromDate = now.AddDays(-5);
        var toDate = now;

        // Act
        var records = await _service.GetHistoryRecordsAsync(_testClubId, fromDate, toDate);

        // Assert
        Assert.That(records.Count(), Is.EqualTo(2));
    }

    #endregion

    #region GetFailureRecordsAsync Tests

    [Test]
    public async Task GetFailureRecordsAsync_WithFailures_ReturnsClubFailures()
    {
        // Arrange
        await CreateTestFailureRecords(3);

        // Act
        var failures = await _service.GetFailureRecordsAsync(_testClubId);

        // Assert
        Assert.That(failures.Count(), Is.EqualTo(3));
    }

    [Test]
    public async Task GetFailureRecordsAsync_NoFailures_ReturnsEmptyList()
    {
        // Act
        var failures = await _service.GetFailureRecordsAsync(Guid.NewGuid());

        // Assert
        Assert.That(failures, Is.Empty);
    }

    [Test]
    public async Task GetFailureRecordsAsync_FailuresAreOrderedByFailedAtDescending()
    {
        // Arrange
        for (int i = 0; i < 3; i++)
        {
            await _service.RecordExportFailureAsync(new ExportFailureRecord
            {
                ClubId = _testClubId,
                ExportType = ExportType.Members,
                ErrorMessage = $"Error {i}",
                FailedAt = DateTime.UtcNow.AddMinutes(i)
            });
        }

        // Act
        var failures = (await _service.GetFailureRecordsAsync(_testClubId)).ToList();

        // Assert
        Assert.That(failures[0].ErrorMessage, Is.EqualTo("Error 2")); // Most recent
        Assert.That(failures[2].ErrorMessage, Is.EqualTo("Error 0")); // Oldest
    }

    #endregion

    #region UpdateExportStatusAsync Tests

    [Test]
    public async Task UpdateExportStatusAsync_ValidExportId_UpdatesStatus()
    {
        // Arrange
        var record = new ExportHistoryRecord
        {
            Id = Guid.NewGuid(),
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            Status = ExportStatus.Processing,
            RecordCount = 100
        };
        await _service.CreateHistoryRecordAsync(record);

        // Act
        await _service.UpdateExportStatusAsync(record.Id, ExportStatus.Completed);

        // Assert
        var records = await _service.GetHistoryRecordsAsync(_testClubId);
        Assert.That(records.First().Status, Is.EqualTo(ExportStatus.Completed));
    }

    [Test]
    public async Task UpdateExportStatusAsync_CompletedStatus_SetsCompletedAt()
    {
        // Arrange
        var record = new ExportHistoryRecord
        {
            Id = Guid.NewGuid(),
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            Status = ExportStatus.Processing,
            RecordCount = 100
        };
        await _service.CreateHistoryRecordAsync(record);
        var beforeUpdate = DateTime.UtcNow;

        // Act
        await _service.UpdateExportStatusAsync(record.Id, ExportStatus.Completed);
        var afterUpdate = DateTime.UtcNow;

        // Assert
        var records = await _service.GetHistoryRecordsAsync(_testClubId);
        Assert.That(records.First().CompletedAt, Is.Not.Null);
        Assert.That(records.First().CompletedAt, Is.GreaterThanOrEqualTo(beforeUpdate));
        Assert.That(records.First().CompletedAt, Is.LessThanOrEqualTo(afterUpdate));
    }

    [Test]
    public async Task UpdateExportStatusAsync_WithErrorMessage_SetsErrorMessage()
    {
        // Arrange
        var record = new ExportHistoryRecord
        {
            Id = Guid.NewGuid(),
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            Status = ExportStatus.Processing,
            RecordCount = 100
        };
        await _service.CreateHistoryRecordAsync(record);

        // Act
        await _service.UpdateExportStatusAsync(record.Id, ExportStatus.Failed, "Export failed due to timeout");

        // Assert
        var records = await _service.GetHistoryRecordsAsync(_testClubId);
        Assert.That(records.First().ErrorMessage, Is.EqualTo("Export failed due to timeout"));
    }

    [Test]
    public async Task UpdateExportStatusAsync_InvalidExportId_DoesNotThrow()
    {
        // Act & Assert - Should not throw, just silently do nothing
        await _service.UpdateExportStatusAsync(Guid.NewGuid(), ExportStatus.Completed);
    }

    [Test]
    public async Task UpdateExportStatusAsync_LogsInformation()
    {
        // Arrange
        var record = new ExportHistoryRecord
        {
            Id = Guid.NewGuid(),
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            RecordCount = 100
        };
        await _service.CreateHistoryRecordAsync(record);

        // Act
        await _service.UpdateExportStatusAsync(record.Id, ExportStatus.Completed);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Export status updated")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region PurgeOldRecordsAsync Tests

    [Test]
    public async Task PurgeOldRecordsAsync_RemovesOldHistoryRecords()
    {
        // Arrange
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            RecordCount = 1,
            RequestedAt = DateTime.UtcNow.AddDays(-30) // Old
        });
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            RecordCount = 2,
            RequestedAt = DateTime.UtcNow // Recent
        });

        var cutoffDate = DateTime.UtcNow.AddDays(-7);

        // Act
        await _service.PurgeOldRecordsAsync(cutoffDate);

        // Assert
        var records = await _service.GetHistoryRecordsAsync(_testClubId);
        Assert.That(records.Count(), Is.EqualTo(1));
        Assert.That(records.First().RecordCount, Is.EqualTo(2)); // Only recent record
    }

    [Test]
    public async Task PurgeOldRecordsAsync_RemovesOldFailureRecords()
    {
        // Arrange
        await _service.RecordExportFailureAsync(new ExportFailureRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            ErrorMessage = "Old failure",
            FailedAt = DateTime.UtcNow.AddDays(-30) // Old
        });
        await _service.RecordExportFailureAsync(new ExportFailureRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            ErrorMessage = "Recent failure",
            FailedAt = DateTime.UtcNow // Recent
        });

        var cutoffDate = DateTime.UtcNow.AddDays(-7);

        // Act
        await _service.PurgeOldRecordsAsync(cutoffDate);

        // Assert
        var failures = await _service.GetFailureRecordsAsync(_testClubId);
        Assert.That(failures.Count(), Is.EqualTo(1));
        Assert.That(failures.First().ErrorMessage, Is.EqualTo("Recent failure"));
    }

    [Test]
    public async Task PurgeOldRecordsAsync_LogsInformation()
    {
        // Arrange
        await CreateTestHistoryRecords(5);
        var cutoffDate = DateTime.UtcNow.AddDays(1); // Cutoff in the future to purge all

        // Act
        await _service.PurgeOldRecordsAsync(cutoffDate);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Purged")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task PurgeOldRecordsAsync_NoRecordsToPurge_DoesNotThrow()
    {
        // Arrange - No records created
        var cutoffDate = DateTime.UtcNow.AddDays(-7);

        // Act & Assert
        Assert.DoesNotThrowAsync(async () => await _service.PurgeOldRecordsAsync(cutoffDate));
    }

    #endregion

    #region GetExportStatisticsAsync Tests

    [Test]
    public async Task GetExportStatisticsAsync_WithRecords_ReturnsCorrectStatistics()
    {
        // Arrange
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            Status = ExportStatus.Completed,
            RecordCount = 100,
            FileSizeBytes = 1024,
            ProcessingTimeMs = 500
        });
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Events,
            Status = ExportStatus.Completed,
            RecordCount = 50,
            FileSizeBytes = 512,
            ProcessingTimeMs = 300
        });
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Financials,
            Status = ExportStatus.Failed,
            RecordCount = 25,
            ProcessingTimeMs = 100
        });

        // Act
        var stats = await _service.GetExportStatisticsAsync(_testClubId);

        // Assert
        Assert.That(stats.TotalExports, Is.EqualTo(3));
        Assert.That(stats.SuccessfulExports, Is.EqualTo(2));
        Assert.That(stats.FailedExports, Is.EqualTo(1));
        Assert.That(stats.TotalDataExported, Is.EqualTo(1536)); // 1024 + 512
        Assert.That(stats.AverageProcessingTimeMs, Is.EqualTo(300)); // (500+300+100)/3
    }

    [Test]
    public async Task GetExportStatisticsAsync_NoRecords_ReturnsZeroStatistics()
    {
        // Act
        var stats = await _service.GetExportStatisticsAsync(Guid.NewGuid());

        // Assert
        Assert.That(stats.TotalExports, Is.EqualTo(0));
        Assert.That(stats.SuccessfulExports, Is.EqualTo(0));
        Assert.That(stats.FailedExports, Is.EqualTo(0));
        Assert.That(stats.TotalDataExported, Is.EqualTo(0));
        Assert.That(stats.AverageProcessingTimeMs, Is.EqualTo(0));
    }

    [Test]
    public async Task GetExportStatisticsAsync_CalculatesSuccessRateCorrectly()
    {
        // Arrange
        for (int i = 0; i < 8; i++)
        {
            await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
            {
                ClubId = _testClubId,
                ExportType = ExportType.Members,
                Status = ExportStatus.Completed,
                RecordCount = 10
            });
        }
        for (int i = 0; i < 2; i++)
        {
            await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
            {
                ClubId = _testClubId,
                ExportType = ExportType.Members,
                Status = ExportStatus.Failed,
                RecordCount = 10
            });
        }

        // Act
        var stats = await _service.GetExportStatisticsAsync(_testClubId);

        // Assert
        Assert.That(stats.SuccessRate, Is.EqualTo(80.0)); // 8/10 * 100
    }

    [Test]
    public async Task GetExportStatisticsAsync_WithDateRange_FiltersRecords()
    {
        // Arrange
        var now = DateTime.UtcNow;
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            Status = ExportStatus.Completed,
            RecordCount = 100,
            RequestedAt = now.AddDays(-10) // Outside range
        });
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            Status = ExportStatus.Completed,
            RecordCount = 50,
            RequestedAt = now.AddDays(-3) // Inside range
        });

        var dateRange = new AuditDateRange
        {
            StartDate = now.AddDays(-5),
            EndDate = now
        };

        // Act
        var stats = await _service.GetExportStatisticsAsync(_testClubId, dateRange);

        // Assert
        Assert.That(stats.TotalExports, Is.EqualTo(1));
        Assert.That(stats.SuccessfulExports, Is.EqualTo(1));
    }

    [Test]
    public async Task GetExportStatisticsAsync_ReturnsLastExportAt()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var expectedLastExport = now.AddHours(-1);
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            Status = ExportStatus.Completed,
            RecordCount = 100,
            RequestedAt = now.AddDays(-10)
        });
        await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
        {
            ClubId = _testClubId,
            ExportType = ExportType.Members,
            Status = ExportStatus.Completed,
            RecordCount = 50,
            RequestedAt = expectedLastExport
        });

        // Act
        var stats = await _service.GetExportStatisticsAsync(_testClubId);

        // Assert
        Assert.That(stats.LastExportAt, Is.EqualTo(expectedLastExport).Within(TimeSpan.FromSeconds(1)));
    }

    #endregion

    #region Helper Methods

    private async Task CreateTestHistoryRecords(int count)
    {
        for (int i = 0; i < count; i++)
        {
            await _service.CreateHistoryRecordAsync(new ExportHistoryRecord
            {
                ClubId = _testClubId,
                ExportType = ExportType.Members,
                Format = ExportFormat.CSV,
                RequestedBy = Guid.NewGuid(),
                RecordCount = i * 10 + 10,
                Status = ExportStatus.Completed
            });
        }
    }

    private async Task CreateTestFailureRecords(int count)
    {
        for (int i = 0; i < count; i++)
        {
            await _service.RecordExportFailureAsync(new ExportFailureRecord
            {
                ClubId = _testClubId,
                ExportType = ExportType.Members,
                ErrorMessage = $"Test error {i + 1}"
            });
        }
    }

    #endregion
}
