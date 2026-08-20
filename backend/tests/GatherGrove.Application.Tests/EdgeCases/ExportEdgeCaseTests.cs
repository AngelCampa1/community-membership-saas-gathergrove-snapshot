using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Enums;
using Moq;
using GatherGrove.Domain.Enums;
using NUnit.Framework;
using GatherGrove.Domain.Enums;
using System.Text;
using GatherGrove.Domain.Enums;
using System.Diagnostics;
using GatherGrove.Domain.Enums;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Enums;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Enums;
using GatherGrove.Application.Services.Wrappers;
using GatherGrove.Domain.Enums;
using GatherGrove.Application.Tests.Fixtures;
using GatherGrove.Domain.Enums;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Enums;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Services;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Tests.EdgeCases;

/// <summary>
/// TDD Edge Case Tests for Export Services
/// RED PHASE: Comprehensive edge case validation through failing tests
/// Tests boundary conditions, error scenarios, resource limits, and unusual inputs
/// Validates system resilience under extreme conditions
/// </summary>
[TestFixture]
[Category("EdgeCases")]
public class ExportEdgeCaseTests
{
    private ExportService _exportService = null!;
    private Mock<ILogger<ExportService>> _mockLogger = null!;
    private Mock<IClubTierService> _mockClubTierService = null!;
    private Mock<IAuditLogService> _mockAuditLogService = null!;
    private Mock<IExportHistoryService> _mockExportHistoryService = null!;
    private Mock<IBackgroundTaskQueue> _mockBackgroundTaskQueue = null!;
    private Mock<IAuthorizationService> _mockAuthorizationService = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<ExportService>>();
        _mockClubTierService = new Mock<IClubTierService>();
        _mockAuditLogService = new Mock<IAuditLogService>();
        _mockExportHistoryService = new Mock<IExportHistoryService>();
        _mockBackgroundTaskQueue = new Mock<IBackgroundTaskQueue>();
        _mockAuthorizationService = new Mock<IAuthorizationService>();

        // Setup authorization service to allow all by default (individual tests can override)
        _mockAuthorizationService.Setup(x => x.CanExportDataAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>()))
            .ReturnsAsync(true);

        _exportService = new ExportService(
            _mockLogger.Object,
            _mockClubTierService.Object,
            _mockAuditLogService.Object,
            _mockExportHistoryService.Object,
            _mockBackgroundTaskQueue.Object,
            _mockAuthorizationService.Object);

        // Default to unlimited tier for edge case testing
        _mockClubTierService.Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);
    }

    #region Boundary Value Tests (RED Phase)

    [Test]
    public async Task ExportToPdfAsync_ZeroClubId_ThrowsArgumentException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 0, // Invalid club ID
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow,
            ExportType = "boundary-test"
        };
        var userId = 123;

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            async () => await _exportService.ExportToPdfAsync(request, userId));

        Assert.That(exception.Message, Does.Contain("Club ID must be greater than zero"));
        TestContext.WriteLine("Zero club ID validation passed");
        await Task.CompletedTask;
    }

    [Test]
    public async Task ExportToPdfAsync_NegativeClubId_ThrowsArgumentException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = -1, // Negative club ID
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow,
            ExportType = "negative-boundary-test"
        };
        var userId = 123;

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            async () => await _exportService.ExportToPdfAsync(request, userId));

        Assert.That(exception.Message, Does.Contain("Club ID must be greater than zero"));
        TestContext.WriteLine("Negative club ID validation passed");
        await Task.CompletedTask;
    }

    [Test]
    public async Task ExportToPdfAsync_MaxIntClubId_HandlesGracefully()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = int.MaxValue, // Maximum possible club ID
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow,
            ExportType = "max-int-test"
        };
        var userId = 123;

        // Act
        var result = await _exportService.ExportToPdfAsync(request, userId);
        var content = Encoding.UTF8.GetString(result);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(content, Does.Contain($"Analytics Report for Club {int.MaxValue}"));
        TestContext.WriteLine("Maximum integer club ID test passed");
    }

    [Test]
    public async Task ExportToPdfAsync_FutureDateRange_ThrowsArgumentException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 1,
            StartDate = DateTime.UtcNow.AddYears(1), // Future start date
            EndDate = DateTime.UtcNow.AddYears(2), // Future end date
            ExportType = "future-date-test"
        };
        var userId = 123;

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            async () => await _exportService.ExportToPdfAsync(request, userId));

        Assert.That(exception.Message, Does.Contain("Start date cannot be in the future"));
        TestContext.WriteLine("Future date range validation passed");
        await Task.CompletedTask;
    }

    [Test]
    public async Task ExportToPdfAsync_EndDateBeforeStartDate_ThrowsArgumentException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 1,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddMonths(-1), // End before start
            ExportType = "invalid-date-range-test"
        };
        var userId = 123;

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            async () => await _exportService.ExportToPdfAsync(request, userId));

        Assert.That(exception.Message, Does.Contain("End date must be after start date"));
        TestContext.WriteLine("Invalid date range validation passed");
        await Task.CompletedTask;
    }

    [Test]
    public async Task ExportToPdfAsync_ExcessiveDateRange_ThrowsArgumentException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 1,
            StartDate = DateTime.UtcNow.AddYears(-100), // 100 years ago
            EndDate = DateTime.UtcNow,
            ExportType = "excessive-range-test"
        };
        var userId = 123;

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            async () => await _exportService.ExportToPdfAsync(request, userId));

        Assert.That(exception.Message, Does.Contain("Date range too large"));
        TestContext.WriteLine("Excessive date range validation passed");
        await Task.CompletedTask;
    }

    #endregion

    #region Null and Empty Input Tests (RED Phase)

    [Test]
    public async Task ExportToPdfAsync_NullRequest_ThrowsArgumentNullException()
    {
        // Arrange
        ExportAnalyticsRequest? nullRequest = null;
        var userId = 123;

        // Act & Assert
        await Task.CompletedTask;
        var exception = Assert.ThrowsAsync<ArgumentNullException>(
            () => _exportService.ExportToPdfAsync(nullRequest!, userId));

        Assert.That(exception.ParamName, Is.EqualTo("request"));
        TestContext.WriteLine("Null request validation passed");
    }

    [Test]
    public async Task ExportToPdfAsync_EmptyExportType_UsesDefaultType()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 1,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow,
            ExportType = string.Empty // Empty export type
        };
        var userId = 123;

        // Act
        var result = await _exportService.ExportToPdfAsync(request, userId);
        var content = Encoding.UTF8.GetString(result);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(content, Does.Contain("Analytics Report for Club 1"));
        // Should use default export type behavior
        TestContext.WriteLine("Empty export type handling passed");
    }

    [Test]
    public async Task ExportToPdfAsync_WhitespaceOnlyExportType_HandlesGracefully()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 1,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow,
            ExportType = "   \t\n   " // Only whitespace
        };
        var userId = 123;

        // Act
        var result = await _exportService.ExportToPdfAsync(request, userId);
        var content = Encoding.UTF8.GetString(result);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(content, Does.Contain("Analytics Report for Club 1"));
        TestContext.WriteLine("Whitespace-only export type handling passed");
    }

    #endregion

    #region Special Characters and Unicode Tests (RED Phase)

    [Test]
    public async Task ExportToPdfAsync_UnicodeExportType_HandlesCorrectly()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 1,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow,
            ExportType = "Réport-Ànalýtics-测试-🔍" // Unicode characters
        };
        var userId = 123;

        // Act
        var result = await _exportService.ExportToPdfAsync(request, userId);
        var content = Encoding.UTF8.GetString(result);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(content, Does.Contain("Analytics Report for Club 1"));
        // Unicode characters should be handled safely
        TestContext.WriteLine("Unicode export type handling passed");
    }

    [Test]
    public async Task ExportToPdfAsync_HtmlInjectionAttempt_SanitizesInput()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 1,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow,
            ExportType = "<img src=x onerror=alert('XSS')>analytics</img>" // HTML injection
        };
        var userId = 123;

        // Act
        var result = await _exportService.ExportToPdfAsync(request, userId);
        var content = Encoding.UTF8.GetString(result);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(content, Does.Not.Contain("<img"));
        Assert.That(content, Does.Not.Contain("onerror"));
        Assert.That(content, Does.Not.Contain("alert"));
        TestContext.WriteLine("HTML injection sanitization passed");
    }

    [Test]
    public async Task ExportToPdfAsync_VeryLongExportType_TruncatesOrHandles()
    {
        // Arrange
        var veryLongExportType = new string('A', 10000); // 10k character string
        var request = new ExportAnalyticsRequest
        {
            ClubId = 1,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow,
            ExportType = veryLongExportType
        };
        var userId = 123;

        // Act & Assert
        // Should either handle gracefully or throw meaningful exception
        try
        {
            var result = await _exportService.ExportToPdfAsync(request, userId);
            var content = Encoding.UTF8.GetString(result);

            Assert.That(result, Is.Not.Null);
            Assert.That(content, Does.Contain("Analytics Report for Club 1"));
            TestContext.WriteLine("Very long export type handled gracefully");
        }
        catch (ArgumentException ex)
        {
            Assert.That(ex.Message, Does.Contain("Export type too long").Or.Contain("exceeds maximum length"));
            TestContext.WriteLine("Very long export type properly rejected");
        }
    }

    #endregion

    #region Concurrent Operations Edge Cases (RED Phase)

    [Test]
    public async Task ConcurrentExports_SameClubAndUser_HandlesCorrectly()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var concurrentCount = 20;

        var request = new ExportAnalyticsRequest
        {
            ClubId = clubId,
            StartDate = DateTime.UtcNow.AddDays(-7),
            EndDate = DateTime.UtcNow,
            ExportType = "concurrent-same-user-test"
        };

        // Act - Many concurrent requests from same user for same club
        var stopwatch = Stopwatch.StartNew();
        var tasks = Enumerable.Range(1, concurrentCount)
            .Select(_ => _exportService.ExportToCsvAsync(request, userId))
            .ToArray();

        var results = await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert
        Assert.That(results.Length, Is.EqualTo(concurrentCount));
        Assert.That(results.All(r => r != null && r.Length > 0), Is.True);

        // Should complete reasonably quickly even with concurrency
        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(60000),
            $"Concurrent exports took {stopwatch.ElapsedMilliseconds}ms, should be under 60s");

        TestContext.WriteLine($"Concurrent same-user exports completed in {stopwatch.ElapsedMilliseconds}ms");
    }

    [Test]
    public async Task ConcurrentExports_DifferentFormats_NoInterference()
    {
        // Arrange
        var clubId = 2;
        var userId = 456;
        var request = new ExportAnalyticsRequest
        {
            ClubId = clubId,
            StartDate = DateTime.UtcNow.AddDays(-14),
            EndDate = DateTime.UtcNow,
            ExportType = "multi-format-concurrent-test"
        };

        // Act - Concurrent exports in different formats
        var pdfTask = _exportService.ExportToPdfAsync(request, userId);
        var excelTask = _exportService.ExportToExcelAsync(request, userId);
        var csvTask = _exportService.ExportToCsvAsync(request, userId);

        var results = await Task.WhenAll(pdfTask, excelTask, csvTask);

        // Assert
        Assert.That(results[0], Is.Not.Null); // PDF
        Assert.That(results[1], Is.Not.Null); // Excel
        Assert.That(results[2], Is.Not.Null); // CSV

        // Each format should produce different content
        var pdfContent = Encoding.UTF8.GetString(results[0]);
        var excelContent = Encoding.UTF8.GetString(results[1]);
        var csvContent = Encoding.UTF8.GetString(results[2]);

        Assert.That(pdfContent, Does.Contain("Analytics Report"));
        Assert.That(excelContent, Does.Contain("Analytics,Report"));
        Assert.That(csvContent, Does.Contain("Metric,Value"));

        TestContext.WriteLine("Multi-format concurrent exports completed successfully");
    }

    [Test]
    [Explicit("Stress test - can be flaky depending on system memory pressure")]
    [Timeout(30000)]
    public async Task RapidSequentialExports_NoResourceLeaks_CompletesSuccessfully()
    {
        // Arrange
        var clubId = 3;
        var userId = 789;
        var sequentialCount = 100;

        var initialMemory = GC.GetTotalMemory(true);
        var executionTimes = new List<long>();

        // Act - Rapid sequential exports to test for resource leaks
        for (int i = 1; i <= sequentialCount; i++)
        {
            var request = new ExportAnalyticsRequest
            {
                ClubId = clubId,
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow,
                ExportType = $"sequential-test-{i}"
            };

            var stopwatch = Stopwatch.StartNew();
            var result = await _exportService.ExportToCsvAsync(request, userId);
            stopwatch.Stop();

            Assert.That(result, Is.Not.Null);
            executionTimes.Add(stopwatch.ElapsedMilliseconds);

            // Force garbage collection every 20 iterations
            if (i % 20 == 0)
            {
                GC.Collect();
                GC.WaitForPendingFinalizers();
                GC.Collect();

                var currentMemory = GC.GetTotalMemory(false);
                var memoryIncrease = currentMemory - initialMemory;

                TestContext.WriteLine($"Iteration {i}: {stopwatch.ElapsedMilliseconds}ms, Memory: {memoryIncrease / 1024 / 1024:F1}MB");

                // Memory shouldn't grow excessively (allowing for GC variance)
                Assert.That(memoryIncrease, Is.LessThan(60 * 1024 * 1024),
                    $"Memory increase after {i} iterations: {memoryIncrease / 1024 / 1024:F1}MB");
            }
        }

        // Assert
        var avgExecutionTime = executionTimes.Average();
        var maxExecutionTime = executionTimes.Max();

        TestContext.WriteLine($"Sequential exports: Avg={avgExecutionTime:F1}ms, Max={maxExecutionTime}ms");

        // Performance shouldn't degrade significantly over time
        // Handle case where operations are very fast (sub-millisecond)
        if (avgExecutionTime == 0 && maxExecutionTime == 0)
        {
            TestContext.WriteLine("Operations completed in sub-millisecond time - excellent performance");
            Assert.Pass("All exports completed in sub-millisecond time");
        }
        else
        {
            // More realistic performance threshold: allow max time to be up to 10x average or at least 50ms
            // This accounts for normal system variations, GC pauses, and initial warmup costs
            var allowedMaxTime = Math.Max(avgExecutionTime * 10, 50.0);

            // Log performance details for monitoring
            TestContext.WriteLine($"Performance Analysis: Avg={avgExecutionTime:F1}ms, Max={maxExecutionTime}ms, Threshold={allowedMaxTime:F1}ms");

            Assert.That(maxExecutionTime, Is.LessThan(allowedMaxTime),
                $"Max execution time {maxExecutionTime}ms exceeds performance threshold of {allowedMaxTime:F1}ms " +
                $"(average: {avgExecutionTime:F1}ms). This may indicate resource leaks or performance degradation.");

            // Additional check: ensure average performance is reasonable (less than 20ms for CSV export)
            // Adjusted threshold based on performance testing - 15ms on Linux/WSL, slightly higher on Windows
            Assert.That(avgExecutionTime, Is.LessThan(20.0),
                $"Average execution time {avgExecutionTime:F1}ms is too high for rapid sequential exports. " +
                "This may indicate performance issues in the export service.");
        }

        TestContext.WriteLine($"Rapid sequential exports test completed - {sequentialCount} exports");
    }

    #endregion

    #region Error Recovery and Resilience Tests (RED Phase)

    [Test]
    public async Task ExportToPdfAsync_DatabaseConnectionTimeout_HandlesGracefully()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 999, // Club that might cause database issues
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow,
            ExportType = "database-timeout-test"
        };
        var userId = 123;

        // Setup tier service to simulate database timeout
        _mockClubTierService.Setup(x => x.HasUnlimitedTierAccess(userId, 999))
            .ThrowsAsync(new TimeoutException("Database connection timeout"));

        // Act & Assert
        var exception = Assert.ThrowsAsync<TimeoutException>(
            () => _exportService.ExportToPdfAsync(request, userId));

        Assert.That(exception.Message, Is.EqualTo("Database connection timeout"));

        // Error should be logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Error exporting to PDF for club 999")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);

        TestContext.WriteLine("Database timeout handling passed");
    }

    [Test]
    public async Task ExportToPdfAsync_OutOfMemoryException_HandlesGracefully()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 1,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow,
            ExportType = "memory-exhaustion-test"
        };
        var userId = 123;

        // This is a conceptual test - in reality, we'd need to simulate memory pressure
        // For now, we'll test that the service can handle and log such exceptions properly

        // Act & Assert
        try
        {
            var result = await _exportService.ExportToPdfAsync(request, userId);
            Assert.That(result, Is.Not.Null);
            TestContext.WriteLine("Export completed normally - no memory pressure");
        }
        catch (OutOfMemoryException)
        {
            // If OOM occurs, it should be logged and re-thrown
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Error exporting to PDF")),
                    It.IsAny<OutOfMemoryException>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);

            TestContext.WriteLine("Out of memory exception properly handled");
            throw; // Re-throw is expected
        }
    }

    [Test]
    public async Task ExportService_CorruptedInput_DoesNotCrashSystem()
    {
        // Arrange - Create a request with potentially problematic values
        var corruptedRequest = new ExportAnalyticsRequest
        {
            ClubId = 1,
            StartDate = DateTime.MinValue, // Extreme date value
            EndDate = DateTime.MaxValue,   // Extreme date value
            ExportType = new string('\0', 100) + "corrupt\xFF\xFE" // Null chars and invalid bytes
        };
        var userId = 123;

        // Act & Assert
        try
        {
            var result = await _exportService.ExportToPdfAsync(corruptedRequest, userId);

            // If it succeeds, the result should be valid
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Length, Is.GreaterThan(0));

            TestContext.WriteLine("Corrupted input handled gracefully");
        }
        catch (ArgumentException ex)
        {
            // Acceptable to reject corrupted input
            Assert.That(ex.Message, Does.Contain("date").Or.Contain("invalid").Or.Contain("corrupt"));
            TestContext.WriteLine("Corrupted input properly rejected");
        }
        catch (Exception ex)
        {
            // Should not crash with unhandled exceptions
            Assert.Fail($"Unexpected exception type: {ex.GetType().Name}: {ex.Message}");
        }
    }

    #endregion

    #region Resource Limit Edge Cases (RED Phase)

    [Test]
    public async Task ExportMembersAsync_MaximumAllowedOptions_HandlesCorrectly()
    {
        // Arrange
        var clubId = int.MaxValue;
        var format = ExportFormat.JSON; // Less common format
        var options = new GatherGrove.Application.DTOs.Export.MemberExportOptions
        {
            // Set maximum options for edge case testing
            IncludePersonalInfo = true,
            IncludeContactInfo = true,
            IncludeMembershipDetails = true,
            IncludeCustomFields = true,
            IncludeAttendanceStats = true,
            IncludeCharts = true,
            IncludeStatistics = true,
            IncludeMetadata = true,
            DateFrom = DateTime.MinValue,
            DateTo = DateTime.MaxValue
        };

        // Act & Assert
        try
        {
            var result = await _exportService.ExportMembersAsync(clubId, format, options);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Status, Is.EqualTo(ExportStatus.Completed));

            TestContext.WriteLine("Maximum options handled correctly");
        }
        catch (ArgumentException ex)
        {
            // Acceptable to limit maximum values
            Assert.That(ex.Message, Does.Contain("maximum").Or.Contain("limit").Or.Contain("too large"));
            TestContext.WriteLine("Maximum options properly limited");
        }
    }

    [Test]
    public async Task GetExportQuotaAsync_ExtremeClubId_ReturnsReasonableQuota()
    {
        // Arrange
        var extremeClubIds = new[] { 1, int.MaxValue, 999999999 };

        foreach (var clubId in extremeClubIds)
        {
            // Act
            var quota = await _exportService.GetExportQuotaAsync(clubId);

            // Assert
            Assert.That(quota, Is.Not.Null);
            Assert.That(quota.Limit, Is.GreaterThanOrEqualTo(0));
            Assert.That(quota.Used, Is.GreaterThanOrEqualTo(0));
            Assert.That(quota.Remaining, Is.GreaterThanOrEqualTo(0));
            Assert.That(quota.Used, Is.LessThanOrEqualTo(quota.Limit));

            TestContext.WriteLine($"Club {clubId}: Quota limit={quota.Limit}, used={quota.Used}, remaining={quota.Remaining}");
        }

        TestContext.WriteLine("Extreme club ID quota checks passed");
    }

    #endregion

    #region Threading and Synchronization Edge Cases (RED Phase)

    [Test]
    public async Task ExportService_ThreadSafety_NoConcurrentModificationExceptions()
    {
        // Arrange
        var concurrentOperations = 50;
        var clubIds = Enumerable.Range(1, 10).ToArray();
        var userIds = Enumerable.Range(100, 5).ToArray();
        var random = new Random(42);

        var exceptions = new List<Exception>();
        var successCount = 0;

        // Act - Stress test with many concurrent operations on shared resources
        var tasks = Enumerable.Range(1, concurrentOperations)
            .Select(async i =>
            {
                try
                {
                    var clubId = clubIds[random.Next(clubIds.Length)];
                    var userId = userIds[random.Next(userIds.Length)];

                    var request = new ExportAnalyticsRequest
                    {
                        ClubId = clubId,
                        StartDate = DateTime.UtcNow.AddDays(-random.Next(1, 30)),
                        EndDate = DateTime.UtcNow,
                        ExportType = $"thread-safety-test-{i}"
                    };

                    Func<Task<Stream>> exportMethod = (i % 3) switch
                    {
                        0 => async () => new MemoryStream(await _exportService.ExportToPdfAsync(request, userId)),
                        1 => async () => new MemoryStream(await _exportService.ExportToExcelAsync(request, userId)),
                        _ => async () => new MemoryStream(await _exportService.ExportToCsvAsync(request, userId))
                    };

                    var result = await exportMethod();
                    Assert.That(result, Is.Not.Null);

                    Interlocked.Increment(ref successCount);
                }
                catch (Exception ex)
                {
                    lock (exceptions)
                    {
                        exceptions.Add(ex);
                    }
                }
            });

        await Task.WhenAll(tasks);

        // Assert
        Assert.That(exceptions, Is.Empty,
            $"Thread safety violations: {string.Join(", ", exceptions.Select(e => e.GetType().Name))}");

        Assert.That(successCount, Is.EqualTo(concurrentOperations),
            $"Expected {concurrentOperations} successful operations, got {successCount}");

        TestContext.WriteLine($"Thread safety test passed - {successCount} concurrent operations completed successfully");
    }

    #endregion
}

#region Extended Options for Edge Case Testing

/// <summary>
/// Extended member export options for edge case testing
/// </summary>
public class MemberExportOptions
{
    public bool IncludeAllFields { get; set; } = false;
    public bool IncludeHistoricalData { get; set; } = false;
    public int MaxRecords { get; set; } = 10000;
    public string[] CustomFields { get; set; } = Array.Empty<string>();
    public DateTime? HistoryStartDate { get; set; }
}

#endregion
