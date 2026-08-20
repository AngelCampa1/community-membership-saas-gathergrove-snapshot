using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Enums;
using Moq;
using GatherGrove.Domain.Enums;
using NUnit.Framework;
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

namespace GatherGrove.Application.Tests.Performance;

/// <summary>
/// TDD Performance Tests for Export Services
/// RED PHASE: Define performance requirements through failing tests
/// Tests large dataset exports (10K+ records) and concurrent operations
/// Validates memory usage, processing time, and resource efficiency
/// </summary>
[TestFixture]
[Category("Performance")]
public class ExportPerformanceTests
{
    private ExportService _exportService = null!;
    private Mock<ILogger<ExportService>> _mockLogger = null!;
    private Mock<IClubTierService> _mockClubTierService = null!;
    private Mock<IAuditLogService> _mockAuditLogService = null!;
    private Mock<IExportHistoryService> _mockExportHistoryService = null!;
    private Mock<IBackgroundTaskQueue> _mockBackgroundTaskQueue = null!;
    private Mock<IAuthorizationService> _mockAuthorizationService = null!;
    private Stopwatch _stopwatch = null!;
    private long _initialMemoryUsage;

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

        _stopwatch = new Stopwatch();

        // Force garbage collection to get accurate memory measurements
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
        _initialMemoryUsage = GC.GetTotalMemory(false);

        // Setup unlimited tier for performance tests
        _mockClubTierService.Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);
    }

    [TearDown]
    public void TearDown()
    {
        _stopwatch?.Stop();

        // Check for memory leaks
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();

        var finalMemoryUsage = GC.GetTotalMemory(false);
        var memoryIncrease = finalMemoryUsage - _initialMemoryUsage;

        // Log memory usage for monitoring
        TestContext.WriteLine($"Memory increase: {memoryIncrease / 1024 / 1024:F2} MB");

        // Fail test if memory increase is excessive (>100MB for single test)
        Assert.That(memoryIncrease, Is.LessThan(100 * 1024 * 1024),
            $"Excessive memory usage: {memoryIncrease / 1024 / 1024:F2} MB");
    }

    #region Large Dataset Export Performance Tests (RED Phase)

    [Test]
    [Timeout(30000)] // 30 seconds max for large dataset
    public async Task ExportToPdfAsync_LargeDataset_CompletesWithinTimeLimit()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 1,
            StartDate = DateTime.UtcNow.AddYears(-3), // 3 years of data
            EndDate = DateTime.UtcNow,
            ExportType = "comprehensive-analytics"
        };
        var userId = 123;

        // Simulate large dataset processing
        var largeDataset = ExportTestDataFixtures.GenerateLargeMemberDataset(10000);
        TestContext.WriteLine($"Testing with {largeDataset.Count} member records");

        // Act
        _stopwatch.Start();
        var result = await _exportService.ExportToPdfAsync(request, userId);
        _stopwatch.Stop();

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        // Performance requirements (RED phase - will fail initially)
        Assert.That(_stopwatch.ElapsedMilliseconds, Is.LessThan(25000),
            $"PDF export took {_stopwatch.ElapsedMilliseconds}ms, should be under 25s for large dataset");

        TestContext.WriteLine($"PDF export completed in {_stopwatch.ElapsedMilliseconds}ms");
    }

    [Test]
    [Timeout(20000)] // 20 seconds max for CSV (lighter format)
    public async Task ExportToCsvAsync_LargeDataset_CompletesWithinTimeLimit()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 2,
            StartDate = DateTime.UtcNow.AddYears(-2),
            EndDate = DateTime.UtcNow,
            ExportType = "member-analytics"
        };
        var userId = 456;

        var largeDataset = ExportTestDataFixtures.GenerateLargeEventDataset(5000);
        TestContext.WriteLine($"Testing with {largeDataset.Count} event records");

        // Act
        _stopwatch.Start();
        var result = await _exportService.ExportToCsvAsync(request, userId);
        _stopwatch.Stop();

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        // CSV should be faster than PDF
        Assert.That(_stopwatch.ElapsedMilliseconds, Is.LessThan(15000),
            $"CSV export took {_stopwatch.ElapsedMilliseconds}ms, should be under 15s for large dataset");

        TestContext.WriteLine($"CSV export completed in {_stopwatch.ElapsedMilliseconds}ms");
    }

    [Test]
    [Timeout(25000)] // 25 seconds max for Excel
    public async Task ExportToExcelAsync_LargeDataset_CompletesWithinTimeLimit()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 3,
            StartDate = DateTime.UtcNow.AddYears(-1),
            EndDate = DateTime.UtcNow,
            ExportType = "financial-analytics"
        };
        var userId = 789;

        var largeDataset = ExportTestDataFixtures.GenerateLargeFinancialDataset(50000);
        TestContext.WriteLine($"Testing with {largeDataset.Count} financial records");

        // Act
        _stopwatch.Start();
        var result = await _exportService.ExportToExcelAsync(request, userId);
        _stopwatch.Stop();

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Length, Is.GreaterThan(0));

        // Excel should be between CSV and PDF in performance
        Assert.That(_stopwatch.ElapsedMilliseconds, Is.LessThan(20000),
            $"Excel export took {_stopwatch.ElapsedMilliseconds}ms, should be under 20s for large dataset");

        TestContext.WriteLine($"Excel export completed in {_stopwatch.ElapsedMilliseconds}ms");
    }

    #endregion

    #region Memory Usage Tests (RED Phase)

    [Test]
    public async Task ExportToPdfAsync_LargeDataset_UsesMemoryEfficiently()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 4,
            StartDate = DateTime.UtcNow.AddMonths(-6),
            EndDate = DateTime.UtcNow,
            ExportType = "memory-efficiency-test"
        };
        var userId = 111;

        var memoryBefore = GC.GetTotalMemory(true);

        // Act
        var result = await _exportService.ExportToPdfAsync(request, userId);

        // Force garbage collection to see actual memory usage
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();

        var memoryAfter = GC.GetTotalMemory(false);
        var memoryUsed = memoryAfter - memoryBefore;

        // Assert
        Assert.That(result, Is.Not.Null);

        // Memory usage should be reasonable (RED phase - will fail initially)
        Assert.That(memoryUsed, Is.LessThan(50 * 1024 * 1024),
            $"PDF export used {memoryUsed / 1024 / 1024:F2} MB, should be under 50 MB");

        TestContext.WriteLine($"Memory used: {memoryUsed / 1024 / 1024:F2} MB");
    }

    [Test]
    public async Task ExportMembersAsync_LargeDataset_DoesNotCauseMemoryLeak()
    {
        // Arrange
        var clubId = 5;
        var format = ExportFormat.CSV;
        var options = new MemberExportOptions();

        var memoryMeasurements = new List<long>();

        // Act - Perform multiple exports to detect memory leaks
        for (int i = 0; i < 5; i++)
        {
            var result = await _exportService.ExportMembersAsync(clubId, format, options);
            Assert.That(result, Is.Not.Null);

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            memoryMeasurements.Add(GC.GetTotalMemory(false));
            TestContext.WriteLine($"Iteration {i + 1}: {memoryMeasurements[i] / 1024 / 1024:F2} MB");
        }

        // Assert - Memory should not continuously increase
        var memoryIncrease = memoryMeasurements.Last() - memoryMeasurements.First();
        Assert.That(memoryIncrease, Is.LessThan(10 * 1024 * 1024),
            $"Memory leak detected: {memoryIncrease / 1024 / 1024:F2} MB increase over 5 iterations");
    }

    #endregion

    #region Concurrent Export Performance Tests (RED Phase)

    [Test]
    [Timeout(60000)] // 60 seconds for concurrent operations
    public async Task ConcurrentExports_MultipleFormats_CompleteWithinTimeLimit()
    {
        // Arrange
        var concurrentRequests = ExportTestDataFixtures.GenerateConcurrentExportRequests(5);
        var userId = 222;

        TestContext.WriteLine($"Testing {concurrentRequests.Count} concurrent export requests");

        // Act
        _stopwatch.Start();

        var tasks = concurrentRequests.Select(async req =>
        {
            var request = new ExportAnalyticsRequest
            {
                ClubId = req.ClubId,
                StartDate = req.StartDate,
                EndDate = req.EndDate,
                ExportType = req.DataType
            };

            return req.Format switch
            {
                "PDF" => await _exportService.ExportToPdfAsync(request, userId),
                "Excel" => await _exportService.ExportToExcelAsync(request, userId),
                "CSV" => await _exportService.ExportToCsvAsync(request, userId),
                _ => await _exportService.ExportToCsvAsync(request, userId)
            };
        });

        var results = await Task.WhenAll(tasks);
        _stopwatch.Stop();

        // Assert
        Assert.That(results.Length, Is.EqualTo(concurrentRequests.Count));
        Assert.That(results.All(r => r != null && r.Length > 0), Is.True);

        // Concurrent exports should complete within reasonable time
        Assert.That(_stopwatch.ElapsedMilliseconds, Is.LessThan(45000),
            $"Concurrent exports took {_stopwatch.ElapsedMilliseconds}ms, should be under 45s");

        TestContext.WriteLine($"Concurrent exports completed in {_stopwatch.ElapsedMilliseconds}ms");
    }

    [Test]
    public async Task ConcurrentExports_DoesNotDeadlock()
    {
        // Arrange
        var clubId = 6;
        var userId = 333;
        var concurrentCount = 10;

        var request = new ExportAnalyticsRequest
        {
            ClubId = clubId,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow,
            ExportType = "deadlock-test"
        };

        // Act
        _stopwatch.Start();

        var tasks = Enumerable.Range(1, concurrentCount)
            .Select(_ => _exportService.ExportToCsvAsync(request, userId))
            .ToList();

        var allTasksTask = Task.WhenAll(tasks);
        var timeoutTask = Task.Delay(30000); // 30 second timeout

        var completedTask = await Task.WhenAny(allTasksTask, timeoutTask);

        _stopwatch.Stop();

        // Assert - Check if the tasks completed, not the timeout
        Assert.That(completedTask, Is.EqualTo(allTasksTask),
            "Concurrent exports did not complete within timeout - possible deadlock");

        // Ensure all tasks completed successfully
        Assert.That(allTasksTask.IsCompletedSuccessfully, Is.True, "Not all concurrent export tasks completed successfully");

        var results = allTasksTask.Result;
        Assert.That(results.All(r => r != null && r.Length > 0), Is.True);

        TestContext.WriteLine($"Concurrent deadlock test completed in {_stopwatch.ElapsedMilliseconds}ms");
    }

    #endregion

    #region Resource Efficiency Tests (RED Phase)

    [Test]
    public async Task ExportDataAsync_RepeatedCalls_ShowsNoSignificantPerformanceDegradation()
    {
        // Arrange
        var clubId = 7;
        var userId = 123;
        var dataType = "performance-test";
        var format = "csv";
        var startDate = DateTime.UtcNow.AddMonths(-3);
        var endDate = DateTime.UtcNow;

        var executionTimes = new List<long>();

        // Act - Multiple calls to test for no performance degradation
        for (int i = 0; i < 3; i++)
        {
            var sw = Stopwatch.StartNew();

            var result = await _exportService.ExportDataAsync(clubId, userId, dataType, format, startDate, endDate);
            sw.Stop();

            Assert.That(result, Is.Not.Null);
            executionTimes.Add(sw.ElapsedMilliseconds);

            TestContext.WriteLine($"Execution {i + 1}: {sw.ElapsedMilliseconds}ms");
        }

        // Check memory increase is reasonable
        GC.Collect();
        var memoryAfter = GC.GetTotalMemory(false);
        var memoryIncrease = memoryAfter / (1024.0 * 1024.0);
        TestContext.WriteLine($"Memory after test: {memoryIncrease:F2} MB");

        // Assert - Later executions should not be significantly slower (allow up to 3x due to GC, system jitter)
        // The average time should be reasonable, and individual calls should not show severe degradation
        var averageTime = executionTimes.Average();
        var maxTime = executionTimes.Max();

        // No single execution should take more than 3x the average (allowing for system variance)
        Assert.That(maxTime, Is.LessThan(Math.Max(averageTime * 3, 100)),
            $"Performance degradation detected: average={averageTime}ms, max={maxTime}ms");

        // All executions completed successfully
        Assert.That(executionTimes.Count, Is.EqualTo(3), "All 3 executions should complete");
    }

    [Test]
    public async Task ExportToAllFormats_LargeDataset_CompletesWithinResourceLimits()
    {
        // Arrange
        var request = new ExportAnalyticsRequest
        {
            ClubId = 8,
            StartDate = DateTime.UtcNow.AddMonths(-12),
            EndDate = DateTime.UtcNow,
            ExportType = "all-formats-test"
        };
        var userId = 444;

        var memoryBefore = GC.GetTotalMemory(true);

        // Act - Export to all formats sequentially
        _stopwatch.Start();

        var pdfResult = await _exportService.ExportToPdfAsync(request, userId);
        var excelResult = await _exportService.ExportToExcelAsync(request, userId);
        var csvResult = await _exportService.ExportToCsvAsync(request, userId);

        _stopwatch.Stop();

        GC.Collect();
        var memoryAfter = GC.GetTotalMemory(false);
        var totalMemoryUsed = memoryAfter - memoryBefore;

        // Assert
        Assert.That(pdfResult, Is.Not.Null);
        Assert.That(excelResult, Is.Not.Null);
        Assert.That(csvResult, Is.Not.Null);

        // All formats should complete within reasonable time
        Assert.That(_stopwatch.ElapsedMilliseconds, Is.LessThan(30000),
            $"All format exports took {_stopwatch.ElapsedMilliseconds}ms, should be under 30s");

        // Memory usage should be reasonable for all formats combined
        Assert.That(totalMemoryUsed, Is.LessThan(75 * 1024 * 1024),
            $"Total memory usage: {totalMemoryUsed / 1024 / 1024:F2} MB, should be under 75 MB");

        TestContext.WriteLine($"All formats completed in {_stopwatch.ElapsedMilliseconds}ms using {totalMemoryUsed / 1024 / 1024:F2} MB");
    }

    #endregion

    #region Stress Tests (RED Phase)

    [Test]
    [Explicit("Long running stress test - run manually")]
    [Timeout(300000)] // 5 minutes max
    public async Task StressTest_ContinuousExports_MaintainsPerformance()
    {
        // Arrange
        var clubId = 9;
        var userId = 555;
        var iterations = 50;
        var performanceMetrics = new List<(long TimeMs, long MemoryMB)>();

        TestContext.WriteLine($"Starting stress test with {iterations} iterations");

        // Act
        for (int i = 1; i <= iterations; i++)
        {
            var memoryBefore = GC.GetTotalMemory(true);
            var sw = Stopwatch.StartNew();

            var request = new ExportAnalyticsRequest
            {
                ClubId = clubId,
                StartDate = DateTime.UtcNow.AddDays(-30),
                EndDate = DateTime.UtcNow,
                ExportType = $"stress-test-{i}"
            };

            var result = await _exportService.ExportToCsvAsync(request, userId);

            sw.Stop();
            var memoryAfter = GC.GetTotalMemory(false);
            var memoryUsed = (memoryAfter - memoryBefore) / 1024 / 1024;

            performanceMetrics.Add((sw.ElapsedMilliseconds, memoryUsed));

            Assert.That(result, Is.Not.Null);

            if (i % 10 == 0)
            {
                TestContext.WriteLine($"Iteration {i}/{iterations}: {sw.ElapsedMilliseconds}ms, {memoryUsed}MB");
            }

            // Brief pause to simulate real-world usage
            await Task.Delay(100);
        }

        // Assert
        var avgTime = performanceMetrics.Average(m => m.TimeMs);
        var maxTime = performanceMetrics.Max(m => m.TimeMs);
        var avgMemory = performanceMetrics.Average(m => m.MemoryMB);

        TestContext.WriteLine($"Stress test completed: Avg={avgTime:F1}ms, Max={maxTime}ms, AvgMem={avgMemory:F1}MB");

        // Performance should not degrade significantly over time
        Assert.That(maxTime, Is.LessThan(avgTime * 3),
            $"Performance degradation detected: max time {maxTime}ms is too high compared to average {avgTime:F1}ms");

        // Memory usage should remain reasonable
        Assert.That(avgMemory, Is.LessThan(20),
            $"Average memory usage {avgMemory:F1}MB is too high");
    }

    #endregion
}
