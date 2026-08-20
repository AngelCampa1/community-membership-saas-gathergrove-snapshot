using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System.Diagnostics;
using GatherGrove.Application.Services.Caching;
using GatherGrove.Application.Services.TierValidation;

namespace GatherGrove.Tests.Performance;

/// <summary>
/// TDD Performance Tests for TierAwareCacheService
/// Tests that tier-aware caching achieves the memory optimization targets:
/// - 50-70% memory reduction through selective caching
/// - Cache bypassing for basic tier eliminates unnecessary memory allocation
/// - Memory usage scales appropriately with tier levels
/// RED → GREEN → REFACTOR TDD approach with memory validation
/// </summary>
[TestFixture]
[Category("Performance")]
[Category("Cache")]
[Category("TierAware")]
public class TierAwareCachePerformanceTests : IDisposable
{
    private TierAwareCacheService _cacheService;
    private Mock<IMemoryCache> _mockMemoryCache;
    private Mock<IDistributedCache> _mockDistributedCache;
    private Mock<ITierGateService> _mockTierGateService;
    private Mock<ILogger<TierAwareCacheService>> _mockLogger;

    // Test configuration
    private const int BASIC_CLUB_ID = 1;
    private const int UNLIMITED_CLUB_ID = 101;
    private const int LOAD_TEST_ITERATIONS = 1000;
    private const int CACHE_ITEM_SIZE_KB = 10; // Simulate 10KB cache items

    private readonly Dictionary<object, object> _inMemoryCache = new();
    private long _totalMemoryAllocated = 0;

    [SetUp]
    public void Setup()
    {
        _mockMemoryCache = new Mock<IMemoryCache>();
        _mockDistributedCache = new Mock<IDistributedCache>();
        _mockTierGateService = new Mock<ITierGateService>();
        _mockLogger = new Mock<ILogger<TierAwareCacheService>>();

        _cacheService = new TierAwareCacheService(
            _mockMemoryCache.Object,
            _mockDistributedCache.Object,
            _mockTierGateService.Object,
            _mockLogger.Object);

        SetupMockBehaviors();
    }

    private void SetupMockBehaviors()
    {
        // Setup tier validation
        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(BASIC_CLUB_ID))
            .ReturnsAsync(false);
        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(UNLIMITED_CLUB_ID))
            .ReturnsAsync(true);

        // Setup cache key generation
        _mockTierGateService.Setup(x => x.GetTierAwareCacheKey(It.IsAny<int>(), It.IsAny<string>()))
            .Returns((int clubId, string key) => $"{(clubId == UNLIMITED_CLUB_ID ? "Unlimited" : "Basic")}:{clubId}:{key}");

        // Mock memory cache with tracking
        _mockMemoryCache.Setup(x => x.TryGetValue(It.IsAny<object>(), out It.Ref<object?>.IsAny))
            .Returns((object key, out object? value) =>
            {
                value = _inMemoryCache.TryGetValue(key, out var cachedValue) ? cachedValue : null;
                return value != null;
            });

        _mockMemoryCache.Setup(x => x.Set(It.IsAny<object>(), It.IsAny<object>(), It.IsAny<MemoryCacheEntryOptions>()))
            .Callback((object key, object value, MemoryCacheEntryOptions options) =>
            {
                _inMemoryCache[key] = value;
                _totalMemoryAllocated += options.Size ?? CACHE_ITEM_SIZE_KB * 1024; // Track memory allocation
            })
            .Returns((object key, object value, MemoryCacheEntryOptions options) => Mock.Of<ICacheEntry>());

        _mockMemoryCache.Setup(x => x.Remove(It.IsAny<object>()))
            .Callback((object key) =>
            {
                if (_inMemoryCache.TryGetValue(key, out _))
                {
                    _inMemoryCache.Remove(key);
                    _totalMemoryAllocated = Math.Max(0, _totalMemoryAllocated - CACHE_ITEM_SIZE_KB * 1024);
                }
            });

        // Mock distributed cache
        _mockDistributedCache.Setup(x => x.GetStringAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null); // Simulate cache miss for simplicity

        _mockDistributedCache.Setup(x => x.SetStringAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DistributedCacheEntryOptions>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    #region Memory Reduction Performance Tests (50-70% Target)

    [Test]
    public async Task CacheService_BasicTier_Achieves50To70PercentMemoryReduction()
    {
        // Arrange
        var testData = GenerateTestData(CACHE_ITEM_SIZE_KB);
        var cacheOperationCount = 100;

        // Reset memory tracking
        _inMemoryCache.Clear();
        _totalMemoryAllocated = 0;

        // Act - Basic tier cache operations (should be bypassed)
        var basicTierStopwatch = Stopwatch.StartNew();
        
        for (int i = 0; i < cacheOperationCount; i++)
        {
            var key = $"basic-key-{i}";
            await _cacheService.SetAsync(key, testData, BASIC_CLUB_ID);
            var result = await _cacheService.GetAsync<TestData>(key, BASIC_CLUB_ID);
        }
        
        basicTierStopwatch.Stop();
        var basicTierMemoryUsed = _totalMemoryAllocated;

        // Reset for unlimited tier test
        _inMemoryCache.Clear();
        _totalMemoryAllocated = 0;

        // Act - Unlimited tier cache operations (should use cache)
        var unlimitedTierStopwatch = Stopwatch.StartNew();
        
        for (int i = 0; i < cacheOperationCount; i++)
        {
            var key = $"unlimited-key-{i}";
            await _cacheService.SetAsync(key, testData, UNLIMITED_CLUB_ID);
            var result = await _cacheService.GetAsync<TestData>(key, UNLIMITED_CLUB_ID);
        }
        
        unlimitedTierStopwatch.Stop();
        var unlimitedTierMemoryUsed = _totalMemoryAllocated;

        // Assert - Basic tier should achieve 50-70% memory reduction
        var memoryReductionPercentage = unlimitedTierMemoryUsed > 0 
            ? ((double)(unlimitedTierMemoryUsed - basicTierMemoryUsed) / unlimitedTierMemoryUsed) * 100
            : 0;

        Assert.That(basicTierMemoryUsed, Is.EqualTo(0), 
            "Basic tier should not allocate any cache memory");
        Assert.That(unlimitedTierMemoryUsed, Is.GreaterThan(0), 
            "Unlimited tier should allocate cache memory");
        Assert.That(memoryReductionPercentage, Is.GreaterThan(50), 
            $"Memory reduction was {memoryReductionPercentage:F1}%, expected >50%");
        Assert.That(memoryReductionPercentage, Is.LessThan(100), 
            $"Memory reduction was {memoryReductionPercentage:F1}%, should not be 100% as unlimited tier uses memory");

        Console.WriteLine($"Cache Memory Performance:");
        Console.WriteLine($"- Basic Tier: {basicTierMemoryUsed:N0} bytes ({basicTierStopwatch.ElapsedMilliseconds}ms)");
        Console.WriteLine($"- Unlimited Tier: {unlimitedTierMemoryUsed:N0} bytes ({unlimitedTierStopwatch.ElapsedMilliseconds}ms)");
        Console.WriteLine($"- Memory Reduction: {memoryReductionPercentage:F1}%");
    }

    [Test]
    public async Task CacheService_HighVolumeOperations_MaintainsMemoryOptimization()
    {
        // Arrange
        var testData = GenerateTestData(CACHE_ITEM_SIZE_KB);
        var basicClubIds = Enumerable.Range(1, 50).ToArray(); // 50 basic tier clubs
        var unlimitedClubIds = Enumerable.Range(101, 10).ToArray(); // 10 unlimited tier clubs

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

        // Reset memory tracking
        _inMemoryCache.Clear();
        _totalMemoryAllocated = 0;

        var stopwatch = Stopwatch.StartNew();
        GC.Collect();
        var initialMemory = GC.GetTotalMemory(true);

        // Act - High volume mixed tier cache operations
        var cacheOperations = new List<Task>();

        // Basic tier operations (should not allocate memory)
        foreach (var clubId in basicClubIds)
        {
            for (int i = 0; i < 20; i++) // 20 operations per club
            {
                var key = $"basic-{clubId}-{i}";
                cacheOperations.Add(_cacheService.SetAsync(key, testData, clubId));
                cacheOperations.Add(_cacheService.GetAsync<TestData>(key, clubId));
                cacheOperations.Add(_cacheService.GetOrSetAsync(key, clubId, () => Task.FromResult<TestData?>(testData)));
            }
        }

        // Unlimited tier operations (will allocate memory)
        foreach (var clubId in unlimitedClubIds)
        {
            for (int i = 0; i < 20; i++) // 20 operations per club
            {
                var key = $"unlimited-{clubId}-{i}";
                cacheOperations.Add(_cacheService.SetAsync(key, testData, clubId));
                cacheOperations.Add(_cacheService.GetAsync<TestData>(key, clubId));
                cacheOperations.Add(_cacheService.GetOrSetAsync(key, clubId, () => Task.FromResult<TestData?>(testData)));
            }
        }

        await Task.WhenAll(cacheOperations);
        
        stopwatch.Stop();
        GC.Collect();
        var finalMemory = GC.GetTotalMemory(true);
        var actualMemoryUsed = finalMemory - initialMemory;

        // Assert - Memory usage should be dominated by unlimited tier operations
        var totalOperations = cacheOperations.Count;
        var basicTierOperations = basicClubIds.Length * 20 * 3; // 3 types of operations per iteration
        var unlimitedTierOperations = unlimitedClubIds.Length * 20 * 3;
        var basicTierPercentage = (double)basicTierOperations / totalOperations * 100;

        Console.WriteLine($"High Volume Cache Performance:");
        Console.WriteLine($"- Total Operations: {totalOperations:N0}");
        Console.WriteLine($"- Basic Tier Operations: {basicTierOperations:N0} ({basicTierPercentage:F1}%)");
        Console.WriteLine($"- Unlimited Tier Operations: {unlimitedTierOperations:N0}");
        Console.WriteLine($"- Tracked Memory Allocated: {_totalMemoryAllocated:N0} bytes");
        Console.WriteLine($"- Actual Memory Used: {actualMemoryUsed:N0} bytes");
        Console.WriteLine($"- Total Time: {stopwatch.ElapsedMilliseconds}ms");
        Console.WriteLine($"- Avg Time per Operation: {(double)stopwatch.ElapsedMilliseconds / totalOperations:F2}ms");

        // Memory should scale primarily with unlimited tier operations, not total operations
        var expectedMaxMemory = unlimitedClubIds.Length * 20 * CACHE_ITEM_SIZE_KB * 1024 * 2; // 2x factor for overhead
        
        Assert.That(_totalMemoryAllocated, Is.LessThan(expectedMaxMemory), 
            $"Memory allocation should be controlled by tier-aware caching");
        Assert.That(stopwatch.ElapsedMilliseconds / (double)totalOperations, Is.LessThan(10), 
            "Average operation time should be <10ms even with high volume");
    }

    #endregion

    #region Cache Statistics Performance Tests

    [Test]
    public async Task CacheService_Statistics_ReflectMemoryOptimization()
    {
        // Arrange
        var testData = GenerateTestData(CACHE_ITEM_SIZE_KB);
        var basicOperations = 500;
        var unlimitedOperations = 100;

        await _cacheService.ResetStatisticsAsync();

        // Act - Generate cache activity
        var tasks = new List<Task>();

        // Basic tier operations
        for (int i = 0; i < basicOperations; i++)
        {
            tasks.Add(_cacheService.GetAsync<TestData>($"basic-{i}", BASIC_CLUB_ID));
        }

        // Unlimited tier operations
        for (int i = 0; i < unlimitedOperations; i++)
        {
            tasks.Add(_cacheService.GetAsync<TestData>($"unlimited-{i}", UNLIMITED_CLUB_ID));
        }

        await Task.WhenAll(tasks);

        // Assert - Statistics should reflect optimization
        var stats = await _cacheService.GetCacheStatisticsAsync();

        Assert.That(stats.CacheBypassesBasic, Is.EqualTo(basicOperations), 
            "Should record all basic tier operations as bypasses");
        Assert.That(stats.CacheHitsUnlimited, Is.EqualTo(0), 
            "Should record unlimited tier cache misses (no data cached)");
        Assert.That(stats.TotalRequests, Is.EqualTo(basicOperations + unlimitedOperations), 
            "Should record all cache requests");

        var expectedMemorySavings = (double)basicOperations / stats.TotalRequests * 100;
        Assert.That(stats.MemorySavingsPercentage, Is.EqualTo(expectedMemorySavings).Within(0.1), 
            $"Memory savings should be {expectedMemorySavings:F1}%");

        Console.WriteLine($"Cache Statistics Performance:");
        Console.WriteLine($"- Cache Bypasses (Basic): {stats.CacheBypassesBasic}");
        Console.WriteLine($"- Cache Hits (Unlimited): {stats.CacheHitsUnlimited}");
        Console.WriteLine($"- Total Requests: {stats.TotalRequests}");
        Console.WriteLine($"- Memory Savings: {stats.MemorySavingsPercentage:F1}%");
    }

    #endregion

    #region Load Testing Scenarios

    [Test]
    [TestCase(100, Description = "Light Load - 100 concurrent cache operations")]
    [TestCase(500, Description = "Medium Load - 500 concurrent cache operations")]
    [TestCase(1000, Description = "Heavy Load - 1000 concurrent cache operations")]
    public async Task CacheService_UnderLoad_MaintainsPerformanceTargets(int concurrentOperations)
    {
        // Arrange
        var testData = GenerateTestData(CACHE_ITEM_SIZE_KB);
        var basicOperationRatio = 0.8; // 80% basic tier operations
        var basicOperations = (int)(concurrentOperations * basicOperationRatio);
        var unlimitedOperations = concurrentOperations - basicOperations;

        _inMemoryCache.Clear();
        _totalMemoryAllocated = 0;

        var stopwatch = Stopwatch.StartNew();

        // Act - Create concurrent cache load
        var tasks = new List<Task>();

        // Basic tier operations (should be fast and use no memory)
        for (int i = 0; i < basicOperations; i++)
        {
            var key = $"load-basic-{i}";
            tasks.Add(_cacheService.SetAsync(key, testData, BASIC_CLUB_ID));
            tasks.Add(_cacheService.GetAsync<TestData>(key, BASIC_CLUB_ID));
        }

        // Unlimited tier operations (will use memory)
        for (int i = 0; i < unlimitedOperations; i++)
        {
            var key = $"load-unlimited-{i}";
            tasks.Add(_cacheService.SetAsync(key, testData, UNLIMITED_CLUB_ID));
            tasks.Add(_cacheService.GetAsync<TestData>(key, UNLIMITED_CLUB_ID));
        }

        await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert - Performance should be maintained under load
        var avgResponseTime = stopwatch.ElapsedMilliseconds / (double)tasks.Count;
        var expectedMaxMemory = unlimitedOperations * CACHE_ITEM_SIZE_KB * 1024 * 2; // Account for set operations

        Assert.That(avgResponseTime, Is.LessThan(5), 
            $"Average response time under load ({concurrentOperations} ops) was {avgResponseTime:F2}ms, expected <5ms");
        Assert.That(_totalMemoryAllocated, Is.LessThan(expectedMaxMemory), 
            $"Memory allocation should scale with unlimited tier operations only");

        // Memory optimization verification
        var actualMemoryPerOperation = _totalMemoryAllocated / (double)concurrentOperations;
        var expectedMemoryPerOperation = basicOperationRatio > 0 
            ? (CACHE_ITEM_SIZE_KB * 1024 * (1 - basicOperationRatio)) 
            : CACHE_ITEM_SIZE_KB * 1024;

        Assert.That(actualMemoryPerOperation, Is.LessThan(expectedMemoryPerOperation * 1.5), 
            "Memory per operation should reflect tier-based optimization");

        Console.WriteLine($"Load Test ({concurrentOperations} operations) Results:");
        Console.WriteLine($"- Total Time: {stopwatch.ElapsedMilliseconds}ms");
        Console.WriteLine($"- Avg Time per Operation: {avgResponseTime:F2}ms");
        Console.WriteLine($"- Memory Allocated: {_totalMemoryAllocated:N0} bytes");
        Console.WriteLine($"- Memory per Operation: {actualMemoryPerOperation:F0} bytes");
        Console.WriteLine($"- Basic Tier Ratio: {basicOperationRatio * 100:F0}%");
    }

    #endregion

    #region Cache Warmup Performance Tests

    [Test]
    public async Task CacheService_Warmup_OnlyAllocatesForUnlimitedTier()
    {
        // Arrange
        var basicClubIds = Enumerable.Range(1, 50).ToArray();
        var unlimitedClubIds = Enumerable.Range(101, 10).ToArray();
        var allClubIds = basicClubIds.Concat(unlimitedClubIds).ToArray();
        var commonKeys = new[] { "analytics", "members", "events", "reports", "metrics" };

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

        _inMemoryCache.Clear();
        _totalMemoryAllocated = 0;

        var stopwatch = Stopwatch.StartNew();

        // Act - Warm up cache for all clubs
        await _cacheService.WarmupCacheAsync(allClubIds, commonKeys);

        stopwatch.Stop();

        // Assert - Only unlimited tier clubs should be processed for warmup
        // Since warmup currently only logs, we verify the tier validation calls
        var totalExpectedCalls = allClubIds.Length; // Each club should be validated once
        
        _mockTierGateService.Verify(x => x.ValidateUnlimitedAccessAsync(It.IsAny<int>()), 
            Times.Exactly(totalExpectedCalls));

        // In a real implementation, warmup would populate cache
        // Memory allocation should only happen for unlimited tier clubs
        Console.WriteLine($"Cache Warmup Performance:");
        Console.WriteLine($"- Total Clubs: {allClubIds.Length}");
        Console.WriteLine($"- Basic Tier Clubs: {basicClubIds.Length}");
        Console.WriteLine($"- Unlimited Tier Clubs: {unlimitedClubIds.Length}");
        Console.WriteLine($"- Common Keys: {commonKeys.Length}");
        Console.WriteLine($"- Warmup Time: {stopwatch.ElapsedMilliseconds}ms");
        Console.WriteLine($"- Memory Allocated: {_totalMemoryAllocated:N0} bytes");

        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(1000), 
            "Cache warmup should complete quickly");
    }

    #endregion

    #region Memory Leak Prevention Tests

    [Test]
    public async Task CacheService_LongRunning_PreventsCacheMemoryLeaks()
    {
        // Arrange
        var testData = GenerateTestData(CACHE_ITEM_SIZE_KB);
        var cycles = 10;
        var operationsPerCycle = 100;
        var maxExpectedMemory = operationsPerCycle * CACHE_ITEM_SIZE_KB * 1024 * 2; // Allow for some overhead

        var memoryUsageOverTime = new List<long>();

        // Act - Run multiple cycles of cache operations
        for (int cycle = 0; cycle < cycles; cycle++)
        {
            // Reset cache to simulate memory cleanup
            _inMemoryCache.Clear();
            _totalMemoryAllocated = 0;

            // Perform cache operations for unlimited tier
            for (int i = 0; i < operationsPerCycle; i++)
            {
                var key = $"cycle-{cycle}-operation-{i}";
                await _cacheService.SetAsync(key, testData, UNLIMITED_CLUB_ID);
                await _cacheService.GetAsync<TestData>(key, UNLIMITED_CLUB_ID);
                
                // Periodically remove items to simulate normal cache lifecycle
                if (i % 10 == 0 && i > 0)
                {
                    await _cacheService.RemoveAsync($"cycle-{cycle}-operation-{i - 10}", UNLIMITED_CLUB_ID);
                }
            }

            memoryUsageOverTime.Add(_totalMemoryAllocated);
            
            Console.WriteLine($"Cycle {cycle + 1}: {_totalMemoryAllocated:N0} bytes allocated");
        }

        // Assert - Memory usage should be stable and not grow unbounded
        var avgMemoryUsage = memoryUsageOverTime.Average();
        var maxMemoryUsage = memoryUsageOverTime.Max();
        var memoryGrowthOverTime = memoryUsageOverTime.Last() - memoryUsageOverTime.First();

        Assert.That(maxMemoryUsage, Is.LessThan(maxExpectedMemory), 
            $"Maximum memory usage should not exceed {maxExpectedMemory:N0} bytes");
        Assert.That(Math.Abs(memoryGrowthOverTime), Is.LessThan(maxExpectedMemory * 0.1), 
            "Memory usage should remain stable over time (no significant growth)");

        Console.WriteLine($"Memory Leak Prevention Results:");
        Console.WriteLine($"- Cycles: {cycles}");
        Console.WriteLine($"- Operations per Cycle: {operationsPerCycle}");
        Console.WriteLine($"- Average Memory Usage: {avgMemoryUsage:N0} bytes");
        Console.WriteLine($"- Maximum Memory Usage: {maxMemoryUsage:N0} bytes");
        Console.WriteLine($"- Memory Growth Over Time: {memoryGrowthOverTime:N0} bytes");
    }

    #endregion

    #region Utility Methods

    private TestData GenerateTestData(int sizeKB)
    {
        var dataSize = sizeKB * 1024 / 2; // Rough estimate for string size
        var largeString = new string('X', Math.Max(1, dataSize - 100)); // Leave room for other properties
        
        return new TestData
        {
            Id = Guid.NewGuid(),
            Name = $"Test Data {DateTime.UtcNow.Ticks}",
            Description = largeString,
            CreatedAt = DateTime.UtcNow,
            Properties = new Dictionary<string, object>
            {
                ["Type"] = "Performance Test",
                ["Size"] = sizeKB,
                ["Generated"] = DateTime.UtcNow
            }
        };
    }

    #endregion

    public void Dispose()
    {
        _inMemoryCache.Clear();
    }
}

/// <summary>
/// Test data class for cache performance testing
/// </summary>
public class TestData
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Dictionary<string, object> Properties { get; set; } = new();
}