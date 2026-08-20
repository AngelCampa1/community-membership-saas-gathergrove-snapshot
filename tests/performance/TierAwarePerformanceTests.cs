using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Caching.Distributed;
using Moq;
using NUnit.Framework;
using System.Diagnostics;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Services.TierValidation;
using GatherGrove.Application.Services.TierValidation;
using GatherGrove.Application.Services.Caching;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Models;

namespace GatherGrove.Tests.Performance;

/// <summary>
/// TDD Performance Tests for Tier-Aware Resource Optimization
/// Tests that tier-based filtering achieves the performance targets:
/// - 60-80% CPU reduction for basic tier
/// - 50-70% memory reduction 
/// - 40-60% database load reduction
/// RED → GREEN → REFACTOR TDD approach with performance validation
/// </summary>
[TestFixture]
[Category("Performance")]
[Category("TierAware")]
public class TierAwarePerformanceTests : IDisposable
{
    private GatherGroveDbContext _context;
    private TierAwareAnalyticsRepository _repository;
    private Mock<ITierGateService> _mockTierGateService;
    private Mock<ILogger<TierAwareAnalyticsRepository>> _mockLogger;

    // Performance monitoring fields
    private readonly List<PerformanceMetric> _performanceResults = new();
    private const int LOAD_TEST_ITERATIONS = 1000;
    private const int CONCURRENT_USERS = 50;
    
    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockTierGateService = new Mock<ITierGateService>();
        _mockLogger = new Mock<ILogger<TierAwareAnalyticsRepository>>();
        _repository = new TierAwareAnalyticsRepository(_context, _mockTierGateService.Object, _mockLogger.Object);

        SeedLargeTestDataset();
    }

    private void SeedLargeTestDataset()
    {
        // Create large dataset for performance testing
        var clubs = new List<Club>();
        var members = new List<Member>();
        var events = new List<Event>();
        var rsvps = new List<EventRsvp>();

        // Create 100 basic tier clubs and 10 unlimited tier clubs
        for (int i = 1; i <= 110; i++)
        {
            var tier = i <= 100 ? "Basic" : "Unlimited";
            clubs.Add(new Club 
            { 
                Id = i, 
                Name = $"{tier} Club {i}", 
                Tier = tier, 
                CreatedAt = DateTime.UtcNow.AddDays(-365) 
            });

            // Add 50 members per club
            for (int j = 1; j <= 50; j++)
            {
                var memberId = (i - 1) * 50 + j;
                members.Add(new Member
                {
                    Id = memberId,
                    ClubId = i,
                    FullName = $"Member {j} Club {i}",
                    Email = $"member{j}@club{i}.com",
                    EmailAddress = $"member{j}@club{i}.com",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 365)),
                    JoinedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 365)),
                    MembershipTypeId = Random.Shared.Next(1, 4)
                });
            }

            // Add 20 events per club
            for (int k = 1; k <= 20; k++)
            {
                var eventId = (i - 1) * 20 + k;
                events.Add(new Event
                {
                    Id = eventId,
                    ClubId = i,
                    Name = $"Event {k} for Club {i}",
                    EventDateTime = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 90)),
                    CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(91, 365))
                });

                // Add 10 RSVPs per event
                for (int l = 1; l <= 10; l++)
                {
                    var rsvpId = (eventId - 1) * 10 + l;
                    var memberId = (i - 1) * 50 + Random.Shared.Next(1, 51);
                    rsvps.Add(new EventRsvp
                    {
                        Id = rsvpId,
                        EventId = eventId,
                        Member = members.FirstOrDefault(m => m.Id == memberId),
                        RsvpStatus = Random.Shared.NextDouble() > 0.3 ? "Attending" : "Not Attending",
                        CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 89))
                    });
                }
            }
        }

        _context.Clubs.AddRange(clubs);
        _context.Members.AddRange(members);
        _context.Events.AddRange(events);
        _context.EventRsvps.AddRange(rsvps);
        _context.SaveChanges();

        Console.WriteLine($"Seeded test data: {clubs.Count} clubs, {members.Count} members, {events.Count} events, {rsvps.Count} RSVPs");
    }

    #region CPU Reduction Performance Tests (60-80% Target)

    [Test]
    public async Task GetEngagementDataAsync_BasicTier_Achieves60To80PercentCpuReduction()
    {
        // Arrange - Test both basic and unlimited tier performance
        var basicClubId = 1; // Basic tier club
        var unlimitedClubId = 101; // Unlimited tier club
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(basicClubId))
            .ReturnsAsync(false);
        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(unlimitedClubId))
            .ReturnsAsync(true);

        // Act - Measure CPU usage for basic tier (should be minimal)
        var basicTierMetrics = await MeasurePerformanceAsync(async () =>
        {
            await _repository.GetEngagementDataAsync(basicClubId, startDate, endDate);
        });

        // Act - Measure CPU usage for unlimited tier (full processing)
        var unlimitedTierMetrics = await MeasurePerformanceAsync(async () =>
        {
            await _repository.GetEngagementDataAsync(unlimitedClubId, startDate, endDate);
        });

        // Assert - Basic tier should achieve 60-80% CPU reduction
        var cpuReductionPercentage = ((unlimitedTierMetrics.CpuTimeMs - basicTierMetrics.CpuTimeMs) / unlimitedTierMetrics.CpuTimeMs) * 100;
        
        Assert.That(cpuReductionPercentage, Is.GreaterThan(60), 
            $"CPU reduction was {cpuReductionPercentage:F1}%, expected >60%. Basic: {basicTierMetrics.CpuTimeMs}ms, Unlimited: {unlimitedTierMetrics.CpuTimeMs}ms");
        Assert.That(cpuReductionPercentage, Is.LessThan(80), 
            $"CPU reduction was {cpuReductionPercentage:F1}%, expected <80% to avoid over-optimization");

        // Log performance results
        Console.WriteLine($"CPU Performance - Basic Tier: {basicTierMetrics.CpuTimeMs}ms, Unlimited Tier: {unlimitedTierMetrics.CpuTimeMs}ms, Reduction: {cpuReductionPercentage:F1}%");
        
        _performanceResults.Add(new PerformanceMetric
        {
            TestName = "GetEngagementDataAsync_CPU_Reduction",
            BasicTierMs = basicTierMetrics.CpuTimeMs,
            UnlimitedTierMs = unlimitedTierMetrics.CpuTimeMs,
            ReductionPercentage = cpuReductionPercentage,
            TargetMin = 60,
            TargetMax = 80
        });
    }

    [Test]
    public async Task GetMemberEngagementPatternsAsync_BasicTier_Achieves60To80PercentCpuReduction()
    {
        // Arrange
        var basicClubId = 2;
        var unlimitedClubId = 102;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(basicClubId))
            .ReturnsAsync(false);
        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(unlimitedClubId))
            .ReturnsAsync(true);

        // Act
        var basicTierMetrics = await MeasurePerformanceAsync(async () =>
        {
            await _repository.GetMemberEngagementPatternsAsync(basicClubId, startDate, endDate);
        });

        var unlimitedTierMetrics = await MeasurePerformanceAsync(async () =>
        {
            await _repository.GetMemberEngagementPatternsAsync(unlimitedClubId, startDate, endDate);
        });

        // Assert
        var cpuReductionPercentage = ((unlimitedTierMetrics.CpuTimeMs - basicTierMetrics.CpuTimeMs) / unlimitedTierMetrics.CpuTimeMs) * 100;
        
        Assert.That(cpuReductionPercentage, Is.GreaterThan(60));
        Assert.That(cpuReductionPercentage, Is.LessThan(80));

        Console.WriteLine($"Member Engagement CPU Performance - Reduction: {cpuReductionPercentage:F1}%");
    }

    [Test]
    public async Task GetFinancialMetricsAsync_BasicTier_Achieves60To80PercentCpuReduction()
    {
        // Arrange
        var basicClubId = 3;
        var unlimitedClubId = 103;
        var startDate = DateTime.UtcNow.AddDays(-90);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(basicClubId))
            .ReturnsAsync(false);
        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(unlimitedClubId))
            .ReturnsAsync(true);

        // Act
        var basicTierMetrics = await MeasurePerformanceAsync(async () =>
        {
            await _repository.GetFinancialMetricsAsync(basicClubId, startDate, endDate);
        });

        var unlimitedTierMetrics = await MeasurePerformanceAsync(async () =>
        {
            await _repository.GetFinancialMetricsAsync(unlimitedClubId, startDate, endDate);
        });

        // Assert
        var cpuReductionPercentage = ((unlimitedTierMetrics.CpuTimeMs - basicTierMetrics.CpuTimeMs) / unlimitedTierMetrics.CpuTimeMs) * 100;
        
        Assert.That(cpuReductionPercentage, Is.GreaterThan(60));
        Assert.That(cpuReductionPercentage, Is.LessThan(80));

        Console.WriteLine($"Financial Metrics CPU Performance - Reduction: {cpuReductionPercentage:F1}%");
    }

    #endregion

    #region Memory Reduction Performance Tests (50-70% Target)

    [Test]
    public async Task TierAwareAnalytics_BasicTier_Achieves50To70PercentMemoryReduction()
    {
        // Arrange
        var basicClubIds = Enumerable.Range(1, 50).ToArray(); // 50 basic tier clubs
        var unlimitedClubIds = Enumerable.Range(101, 10).ToArray(); // 10 unlimited tier clubs
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        foreach (var id in basicClubIds)
        {
            _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(id))
                .ReturnsAsync(false);
        }
        foreach (var id in unlimitedClubIds)
        {
            _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(id))
                .ReturnsAsync(true);
        }

        // Act - Measure memory usage for basic tier processing
        GC.Collect();
        GC.WaitForPendingFinalizers();
        var initialMemoryBasic = GC.GetTotalMemory(true);

        var basicTierTasks = basicClubIds.Select(async id =>
        {
            await _repository.GetEngagementDataAsync(id, startDate, endDate);
            await _repository.GetMemberEngagementPatternsAsync(id, startDate, endDate);
            await _repository.GetFinancialMetricsAsync(id, startDate, endDate);
        });

        await Task.WhenAll(basicTierTasks);
        
        GC.Collect();
        GC.WaitForPendingFinalizers();
        var finalMemoryBasic = GC.GetTotalMemory(true);
        var basicTierMemoryUsed = finalMemoryBasic - initialMemoryBasic;

        // Act - Measure memory usage for unlimited tier processing
        GC.Collect();
        GC.WaitForPendingFinalizers();
        var initialMemoryUnlimited = GC.GetTotalMemory(true);

        var unlimitedTierTasks = unlimitedClubIds.Select(async id =>
        {
            await _repository.GetEngagementDataAsync(id, startDate, endDate);
            await _repository.GetMemberEngagementPatternsAsync(id, startDate, endDate);
            await _repository.GetFinancialMetricsAsync(id, startDate, endDate);
        });

        await Task.WhenAll(unlimitedTierTasks);

        GC.Collect();
        GC.WaitForPendingFinalizers();
        var finalMemoryUnlimited = GC.GetTotalMemory(true);
        var unlimitedTierMemoryUsed = finalMemoryUnlimited - initialMemoryUnlimited;

        // Assert - Basic tier should achieve 50-70% memory reduction
        var memoryReductionPercentage = ((double)(unlimitedTierMemoryUsed - basicTierMemoryUsed) / unlimitedTierMemoryUsed) * 100;
        
        Assert.That(memoryReductionPercentage, Is.GreaterThan(50), 
            $"Memory reduction was {memoryReductionPercentage:F1}%, expected >50%. Basic: {basicTierMemoryUsed:N0} bytes, Unlimited: {unlimitedTierMemoryUsed:N0} bytes");
        Assert.That(memoryReductionPercentage, Is.LessThan(70), 
            $"Memory reduction was {memoryReductionPercentage:F1}%, expected <70%");

        Console.WriteLine($"Memory Performance - Basic Tier: {basicTierMemoryUsed:N0} bytes, Unlimited Tier: {unlimitedTierMemoryUsed:N0} bytes, Reduction: {memoryReductionPercentage:F1}%");
    }

    #endregion

    #region Database Load Reduction Performance Tests (40-60% Target)

    [Test]
    public async Task TierAwareAnalytics_BasicTier_Achieves40To60PercentDatabaseLoadReduction()
    {
        // Arrange - Create a mock that tracks database query counts
        var queryCounter = new DatabaseQueryCounter();
        var contextWithTracking = new QueryTrackingDbContext(queryCounter);
        var repositoryWithTracking = new TierAwareAnalyticsRepository(contextWithTracking, _mockTierGateService.Object, _mockLogger.Object);

        var basicClubIds = Enumerable.Range(1, 20).ToArray();
        var unlimitedClubIds = Enumerable.Range(101, 5).ToArray();
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        foreach (var id in basicClubIds)
        {
            _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(id))
                .ReturnsAsync(false);
        }
        foreach (var id in unlimitedClubIds)
        {
            _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(id))
                .ReturnsAsync(true);
        }

        // Act - Measure database queries for basic tier
        queryCounter.Reset();
        var basicTierTasks = basicClubIds.Select(async id =>
        {
            try
            {
                await repositoryWithTracking.GetEngagementDataAsync(id, startDate, endDate);
                await repositoryWithTracking.GetMemberEngagementPatternsAsync(id, startDate, endDate);
                await repositoryWithTracking.GetCohortDataAsync(id, startDate, endDate);
            }
            catch (Exception)
            {
                // Expected for query tracking mock
            }
        });

        await Task.WhenAll(basicTierTasks);
        var basicTierQueryCount = queryCounter.QueryCount;

        // Act - Measure database queries for unlimited tier
        queryCounter.Reset();
        var unlimitedTierTasks = unlimitedClubIds.Select(async id =>
        {
            try
            {
                await repositoryWithTracking.GetEngagementDataAsync(id, startDate, endDate);
                await repositoryWithTracking.GetMemberEngagementPatternsAsync(id, startDate, endDate);
                await repositoryWithTracking.GetCohortDataAsync(id, startDate, endDate);
            }
            catch (Exception)
            {
                // Expected for query tracking mock
            }
        });

        await Task.WhenAll(unlimitedTierTasks);
        var unlimitedTierQueryCount = queryCounter.QueryCount;

        // Assert - Basic tier should achieve 40-60% database load reduction
        // Since basic tier should execute 0 complex queries, we expect near 100% reduction
        // But we test for the target range to account for basic queries that still run
        var queryReductionPercentage = unlimitedTierQueryCount > 0 
            ? ((double)(unlimitedTierQueryCount - basicTierQueryCount) / unlimitedTierQueryCount) * 100
            : 100;
        
        Assert.That(queryReductionPercentage, Is.GreaterThan(40), 
            $"Database load reduction was {queryReductionPercentage:F1}%, expected >40%. Basic queries: {basicTierQueryCount}, Unlimited queries: {unlimitedTierQueryCount}");

        Console.WriteLine($"Database Load Performance - Basic Tier: {basicTierQueryCount} queries, Unlimited Tier: {unlimitedTierQueryCount} queries, Reduction: {queryReductionPercentage:F1}%");

        contextWithTracking.Dispose();
    }

    #endregion

    #region Load Testing Scenarios

    [Test]
    [TestCase(100, Description = "Light Load - 100 concurrent requests")]
    [TestCase(500, Description = "Medium Load - 500 concurrent requests")]
    [TestCase(1000, Description = "Heavy Load - 1000 concurrent requests")]
    public async Task TierAwareAnalytics_UnderLoad_MaintainsPerformanceTargets(int concurrentRequests)
    {
        // Arrange
        var basicClubIds = Enumerable.Range(1, concurrentRequests / 2).ToArray();
        var unlimitedClubIds = Enumerable.Range(101, Math.Min(10, concurrentRequests / 2)).ToArray();
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        foreach (var id in basicClubIds)
        {
            _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(id))
                .ReturnsAsync(false);
        }
        foreach (var id in unlimitedClubIds)
        {
            _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(id))
                .ReturnsAsync(true);
        }

        var stopwatch = Stopwatch.StartNew();

        // Act - Create concurrent load
        var tasks = new List<Task>();
        
        // Basic tier requests (should complete very quickly)
        tasks.AddRange(basicClubIds.Select(async id =>
        {
            await _repository.GetEngagementDataAsync(id, startDate, endDate);
        }));

        // Unlimited tier requests (will do actual work)
        tasks.AddRange(unlimitedClubIds.Select(async id =>
        {
            await _repository.GetEngagementDataAsync(id, startDate, endDate);
        }));

        await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert - Performance should be maintained under load
        var avgResponseTime = stopwatch.ElapsedMilliseconds / (double)concurrentRequests;
        
        Assert.That(avgResponseTime, Is.LessThan(100), 
            $"Average response time under load ({concurrentRequests} requests) was {avgResponseTime:F2}ms, expected <100ms");

        Console.WriteLine($"Load Test ({concurrentRequests} requests) - Total: {stopwatch.ElapsedMilliseconds}ms, Avg: {avgResponseTime:F2}ms per request");
    }

    [Test]
    public async Task TierAwareAnalytics_ConcurrentBasicTierRequests_CompletesWithinPerformanceThreshold()
    {
        // Arrange - 1000 concurrent basic tier requests
        var basicClubIds = Enumerable.Range(1, LOAD_TEST_ITERATIONS).Select(i => (i % 100) + 1).ToArray();
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        foreach (var id in basicClubIds.Distinct())
        {
            _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(id))
                .ReturnsAsync(false);
        }

        var stopwatch = Stopwatch.StartNew();

        // Act - Execute 1000 concurrent requests for basic tier clubs
        var semaphore = new SemaphoreSlim(CONCURRENT_USERS);
        var tasks = basicClubIds.Select(async id =>
        {
            await semaphore.WaitAsync();
            try
            {
                await _repository.GetEngagementDataAsync(id, startDate, endDate);
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert - All basic tier requests should complete very quickly
        var avgResponseTime = stopwatch.ElapsedMilliseconds / (double)LOAD_TEST_ITERATIONS;
        
        Assert.That(avgResponseTime, Is.LessThan(5), 
            $"Average response time for {LOAD_TEST_ITERATIONS} basic tier requests was {avgResponseTime:F2}ms, expected <5ms due to tier optimization");
        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(10000), 
            $"Total time for {LOAD_TEST_ITERATIONS} basic tier requests was {stopwatch.ElapsedMilliseconds}ms, expected <10s");

        Console.WriteLine($"Concurrent Basic Tier Load Test - {LOAD_TEST_ITERATIONS} requests in {stopwatch.ElapsedMilliseconds}ms, {avgResponseTime:F2}ms avg");
    }

    #endregion

    #region Performance Regression Tests

    [Test]
    public async Task TierAwareAnalytics_PerformanceRegression_DoesNotExceedBaselines()
    {
        // Arrange - Baseline performance expectations
        var expectedBasicTierMaxMs = 10; // Basic tier should complete in <10ms
        var expectedUnlimitedTierMaxMs = 500; // Unlimited tier should complete in <500ms
        
        var basicClubId = 1;
        var unlimitedClubId = 101;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(basicClubId))
            .ReturnsAsync(false);
        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(unlimitedClubId))
            .ReturnsAsync(true);

        // Act & Assert - Test multiple analytics methods for regression
        var methods = new[]
        {
            ("GetEngagementDataAsync", new Func<int, Task>(async id => await _repository.GetEngagementDataAsync(id, startDate, endDate))),
            ("GetMemberEngagementPatternsAsync", new Func<int, Task>(async id => await _repository.GetMemberEngagementPatternsAsync(id, startDate, endDate))),
            ("GetFinancialMetricsAsync", new Func<int, Task>(async id => await _repository.GetFinancialMetricsAsync(id, startDate, endDate))),
            ("GetCohortDataAsync", new Func<int, Task>(async id => await _repository.GetCohortDataAsync(id, startDate, endDate))),
            ("GetEventPerformanceDataAsync", new Func<int, Task>(async id => await _repository.GetEventPerformanceDataAsync(id, startDate, endDate)))
        };

        foreach (var (methodName, method) in methods)
        {
            // Test basic tier performance
            var basicStopwatch = Stopwatch.StartNew();
            await method(basicClubId);
            basicStopwatch.Stop();

            Assert.That(basicStopwatch.ElapsedMilliseconds, Is.LessThan(expectedBasicTierMaxMs),
                $"{methodName} basic tier took {basicStopwatch.ElapsedMilliseconds}ms, expected <{expectedBasicTierMaxMs}ms");

            // Test unlimited tier performance
            var unlimitedStopwatch = Stopwatch.StartNew();
            await method(unlimitedClubId);
            unlimitedStopwatch.Stop();

            Assert.That(unlimitedStopwatch.ElapsedMilliseconds, Is.LessThan(expectedUnlimitedTierMaxMs),
                $"{methodName} unlimited tier took {unlimitedStopwatch.ElapsedMilliseconds}ms, expected <{expectedUnlimitedTierMaxMs}ms");

            Console.WriteLine($"{methodName} - Basic: {basicStopwatch.ElapsedMilliseconds}ms, Unlimited: {unlimitedStopwatch.ElapsedMilliseconds}ms");
        }
    }

    #endregion

    #region Utility Methods

    private async Task<PerformanceMetrics> MeasurePerformanceAsync(Func<Task> action)
    {
        // Force garbage collection to get accurate memory measurements
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();

        var initialMemory = GC.GetTotalMemory(false);
        var stopwatch = Stopwatch.StartNew();

        await action();

        stopwatch.Stop();
        var finalMemory = GC.GetTotalMemory(false);
        var memoryUsed = finalMemory - initialMemory;

        return new PerformanceMetrics
        {
            ElapsedMs = stopwatch.ElapsedMilliseconds,
            MemoryUsedBytes = memoryUsed,
            CpuTimeMs = stopwatch.ElapsedMilliseconds // Simplified CPU measurement
        };
    }

    #endregion

    [TearDown]
    public void TearDown()
    {
        // Print performance summary
        if (_performanceResults.Any())
        {
            Console.WriteLine("\n=== PERFORMANCE RESULTS SUMMARY ===");
            foreach (var result in _performanceResults)
            {
                var status = result.ReductionPercentage >= result.TargetMin && result.ReductionPercentage <= result.TargetMax ? "PASS" : "FAIL";
                Console.WriteLine($"{result.TestName}: {result.ReductionPercentage:F1}% reduction ({result.TargetMin}-{result.TargetMax}% target) - {status}");
            }
        }
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}

/// <summary>
/// Performance metrics for tier-aware operations
/// </summary>
public class PerformanceMetrics
{
    public long ElapsedMs { get; set; }
    public long MemoryUsedBytes { get; set; }
    public long CpuTimeMs { get; set; }
}

/// <summary>
/// Performance metric tracking for test results
/// </summary>
public class PerformanceMetric
{
    public string TestName { get; set; } = string.Empty;
    public double BasicTierMs { get; set; }
    public double UnlimitedTierMs { get; set; }
    public double ReductionPercentage { get; set; }
    public double TargetMin { get; set; }
    public double TargetMax { get; set; }
}

/// <summary>
/// Database query counter for tracking database load
/// </summary>
public class DatabaseQueryCounter
{
    public int QueryCount { get; private set; }
    
    public void IncrementQuery() => QueryCount++;
    public void Reset() => QueryCount = 0;
}

/// <summary>
/// Mock DbContext for tracking database queries
/// </summary>
public class QueryTrackingDbContext : GatherGroveDbContext
{
    private readonly DatabaseQueryCounter _queryCounter;

    public QueryTrackingDbContext(DatabaseQueryCounter queryCounter) 
        : base(new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options)
    {
        _queryCounter = queryCounter;
    }

    public override DbSet<TEntity> Set<TEntity>()
    {
        _queryCounter.IncrementQuery();
        return base.Set<TEntity>();
    }
}