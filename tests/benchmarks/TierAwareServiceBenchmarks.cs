using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Caching.Distributed;
using Moq;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Services.TierValidation;
using GatherGrove.Application.Services.TierValidation;
using GatherGrove.Application.Services.Caching;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Models;

namespace GatherGrove.Tests.Benchmarks;

/// <summary>
/// BenchmarkDotNet performance benchmarks for tier-aware services
/// Measures actual performance impact of tier-based resource optimization
/// Validates the performance targets:
/// - 60-80% CPU reduction for basic tier
/// - 50-70% memory reduction 
/// - 40-60% database load reduction
/// </summary>
[MemoryDiagnoser]
[SimpleJob(BenchmarkDotNet.Jobs.RuntimeMoniker.Net90)]
[RankColumn]
public class TierAwareServiceBenchmarks
{
    private GatherGroveDbContext _context;
    private TierAwareAnalyticsRepository _repository;
    private TierAwareCacheService _cacheService;
    private TierGateService _tierGateService;
    private Mock<ITierGateService> _mockTierGateService;
    private Mock<ILogger<TierAwareAnalyticsRepository>> _mockLogger;
    private Mock<ILogger<TierAwareCacheService>> _mockCacheLogger;
    private Mock<ILogger<TierGateService>> _mockTierLogger;
    private Mock<IMemoryCache> _mockMemoryCache;
    private Mock<IDistributedCache> _mockDistributedCache;
    private DateTime _startDate;
    private DateTime _endDate;

    // Test data constants
    private const int BASIC_CLUB_ID = 1;
    private const int UNLIMITED_CLUB_ID = 101;
    private const int BATCH_SIZE = 100;

    [GlobalSetup]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockTierGateService = new Mock<ITierGateService>();
        _mockLogger = new Mock<ILogger<TierAwareAnalyticsRepository>>();
        _mockCacheLogger = new Mock<ILogger<TierAwareCacheService>>();
        _mockTierLogger = new Mock<ILogger<TierGateService>>();
        _mockMemoryCache = new Mock<IMemoryCache>();
        _mockDistributedCache = new Mock<IDistributedCache>();

        _repository = new TierAwareAnalyticsRepository(_context, _mockTierGateService.Object, _mockLogger.Object);
        _cacheService = new TierAwareCacheService(_mockMemoryCache.Object, _mockDistributedCache.Object, _mockTierGateService.Object, _mockCacheLogger.Object);

        _startDate = DateTime.UtcNow.AddDays(-30);
        _endDate = DateTime.UtcNow;

        SeedBenchmarkData();
        SetupMockBehaviors();
    }

    private void SeedBenchmarkData()
    {
        var clubs = new[]
        {
            new Club { Id = BASIC_CLUB_ID, Name = "Basic Benchmark Club", Tier = "Basic", CreatedAt = DateTime.UtcNow },
            new Club { Id = UNLIMITED_CLUB_ID, Name = "Unlimited Benchmark Club", Tier = "Unlimited", CreatedAt = DateTime.UtcNow }
        };
        _context.Clubs.AddRange(clubs);

        var members = new List<Member>();
        var events = new List<Event>();
        var rsvps = new List<EventRsvp>();

        // Create extensive test data for both clubs
        foreach (var club in clubs)
        {
            for (int i = 1; i <= 1000; i++) // 1000 members per club
            {
                var memberId = club.Id * 1000 + i;
                members.Add(new Member
                {
                    Id = memberId,
                    ClubId = club.Id,
                    FullName = $"Member {i} Club {club.Id}",
                    Email = $"member{i}@club{club.Id}.com",
                    EmailAddress = $"member{i}@club{club.Id}.com",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 365)),
                    JoinedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 365)),
                    MembershipTypeId = Random.Shared.Next(1, 4)
                });
            }

            for (int j = 1; j <= 500; j++) // 500 events per club
            {
                var eventId = club.Id * 500 + j;
                events.Add(new Event
                {
                    Id = eventId,
                    ClubId = club.Id,
                    Name = $"Event {j} for Club {club.Id}",
                    EventDateTime = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 90)),
                    CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(91, 365))
                });

                // Add multiple RSVPs per event
                for (int k = 1; k <= 20; k++)
                {
                    var rsvpId = eventId * 20 + k;
                    var memberId = club.Id * 1000 + Random.Shared.Next(1, 1001);
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

        _context.Members.AddRange(members);
        _context.Events.AddRange(events);
        _context.EventRsvps.AddRange(rsvps);
        _context.SaveChanges();
    }

    private void SetupMockBehaviors()
    {
        // Setup tier validation mocks
        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(BASIC_CLUB_ID))
            .ReturnsAsync(false);
        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(UNLIMITED_CLUB_ID))
            .ReturnsAsync(true);

        _mockTierGateService.Setup(x => x.GetTierAwareCacheKey(It.IsAny<int>(), It.IsAny<string>()))
            .Returns((int clubId, string key) => $"{(clubId == UNLIMITED_CLUB_ID ? "Unlimited" : "Basic")}:{clubId}:{key}");
    }

    #region Analytics Repository Benchmarks

    [Benchmark(Description = "Basic Tier - Engagement Data (Should be fast due to tier blocking)")]
    public async Task BasicTier_GetEngagementDataAsync()
    {
        await _repository.GetEngagementDataAsync(BASIC_CLUB_ID, _startDate, _endDate);
    }

    [Benchmark(Baseline = true, Description = "Unlimited Tier - Engagement Data (Full processing)")]
    public async Task UnlimitedTier_GetEngagementDataAsync()
    {
        await _repository.GetEngagementDataAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
    }

    [Benchmark(Description = "Basic Tier - Member Engagement Patterns (Should be fast due to tier blocking)")]
    public async Task BasicTier_GetMemberEngagementPatternsAsync()
    {
        await _repository.GetMemberEngagementPatternsAsync(BASIC_CLUB_ID, _startDate, _endDate);
    }

    [Benchmark(Description = "Unlimited Tier - Member Engagement Patterns (Full processing)")]
    public async Task UnlimitedTier_GetMemberEngagementPatternsAsync()
    {
        await _repository.GetMemberEngagementPatternsAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
    }

    [Benchmark(Description = "Basic Tier - Financial Metrics (Should be fast due to tier blocking)")]
    public async Task BasicTier_GetFinancialMetricsAsync()
    {
        await _repository.GetFinancialMetricsAsync(BASIC_CLUB_ID, _startDate, _endDate);
    }

    [Benchmark(Description = "Unlimited Tier - Financial Metrics (Full processing)")]
    public async Task UnlimitedTier_GetFinancialMetricsAsync()
    {
        await _repository.GetFinancialMetricsAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
    }

    [Benchmark(Description = "Basic Tier - Cohort Data (Should be fast due to tier blocking)")]
    public async Task BasicTier_GetCohortDataAsync()
    {
        await _repository.GetCohortDataAsync(BASIC_CLUB_ID, _startDate, _endDate);
    }

    [Benchmark(Description = "Unlimited Tier - Cohort Data (Full processing)")]
    public async Task UnlimitedTier_GetCohortDataAsync()
    {
        await _repository.GetCohortDataAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
    }

    [Benchmark(Description = "Basic Tier - Event Performance (Should be fast due to tier blocking)")]
    public async Task BasicTier_GetEventPerformanceDataAsync()
    {
        await _repository.GetEventPerformanceDataAsync(BASIC_CLUB_ID, _startDate, _endDate);
    }

    [Benchmark(Description = "Unlimited Tier - Event Performance (Full processing)")]
    public async Task UnlimitedTier_GetEventPerformanceDataAsync()
    {
        await _repository.GetEventPerformanceDataAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
    }

    [Benchmark(Description = "All Tiers - Basic Analytics Summary (No tier blocking)")]
    public async Task AllTiers_GetBasicAnalyticsSummaryAsync()
    {
        await _repository.GetBasicAnalyticsSummaryAsync(BASIC_CLUB_ID, _startDate, _endDate);
        await _repository.GetBasicAnalyticsSummaryAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
    }

    #endregion

    #region Cache Service Benchmarks

    [Benchmark(Description = "Basic Tier - Cache Get (Should bypass cache)")]
    public async Task BasicTier_CacheGetAsync()
    {
        await _cacheService.GetAsync<string>("test-key", BASIC_CLUB_ID);
    }

    [Benchmark(Description = "Unlimited Tier - Cache Get (Uses cache)")]
    public async Task UnlimitedTier_CacheGetAsync()
    {
        await _cacheService.GetAsync<string>("test-key", UNLIMITED_CLUB_ID);
    }

    [Benchmark(Description = "Basic Tier - Cache Set (Should bypass cache)")]
    public async Task BasicTier_CacheSetAsync()
    {
        await _cacheService.SetAsync("test-key", "test-value", BASIC_CLUB_ID);
    }

    [Benchmark(Description = "Unlimited Tier - Cache Set (Uses cache)")]
    public async Task UnlimitedTier_CacheSetAsync()
    {
        await _cacheService.SetAsync("test-key", "test-value", UNLIMITED_CLUB_ID);
    }

    #endregion

    #region Batch Processing Benchmarks

    [Benchmark(Description = "Batch - Mixed Tier Analytics (90% Basic, 10% Unlimited)")]
    public async Task Batch_MixedTierAnalytics()
    {
        var tasks = new List<Task>();
        
        // 90 basic tier requests (should be very fast)
        for (int i = 0; i < 90; i++)
        {
            tasks.Add(_repository.GetEngagementDataAsync(BASIC_CLUB_ID, _startDate, _endDate));
        }
        
        // 10 unlimited tier requests (full processing)
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(_repository.GetEngagementDataAsync(UNLIMITED_CLUB_ID, _startDate, _endDate));
        }
        
        await Task.WhenAll(tasks);
    }

    [Benchmark(Description = "Batch - All Basic Tier Analytics (Should be very fast)")]
    public async Task Batch_AllBasicTierAnalytics()
    {
        var tasks = new List<Task>();
        
        for (int i = 0; i < BATCH_SIZE; i++)
        {
            tasks.Add(_repository.GetEngagementDataAsync(BASIC_CLUB_ID, _startDate, _endDate));
        }
        
        await Task.WhenAll(tasks);
    }

    [Benchmark(Description = "Batch - All Unlimited Tier Analytics (Full processing load)")]
    public async Task Batch_AllUnlimitedTierAnalytics()
    {
        var tasks = new List<Task>();
        
        // Reduced batch size for unlimited tier to prevent overwhelming
        for (int i = 0; i < Math.Min(BATCH_SIZE / 10, 10); i++)
        {
            tasks.Add(_repository.GetEngagementDataAsync(UNLIMITED_CLUB_ID, _startDate, _endDate));
        }
        
        await Task.WhenAll(tasks);
    }

    #endregion

    #region Comprehensive Analytics Benchmarks

    [Benchmark(Description = "Basic Tier - Full Analytics Suite (All methods)")]
    public async Task BasicTier_FullAnalyticsSuite()
    {
        await _repository.GetEngagementDataAsync(BASIC_CLUB_ID, _startDate, _endDate);
        await _repository.GetMemberEngagementPatternsAsync(BASIC_CLUB_ID, _startDate, _endDate);
        await _repository.GetFinancialMetricsAsync(BASIC_CLUB_ID, _startDate, _endDate);
        await _repository.GetCohortDataAsync(BASIC_CLUB_ID, _startDate, _endDate);
        await _repository.GetEventPerformanceDataAsync(BASIC_CLUB_ID, _startDate, _endDate);
        await _repository.GetComplexEngagementMetricsAsync(BASIC_CLUB_ID, _startDate, _endDate);
    }

    [Benchmark(Description = "Unlimited Tier - Full Analytics Suite (All methods)")]
    public async Task UnlimitedTier_FullAnalyticsSuite()
    {
        await _repository.GetEngagementDataAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
        await _repository.GetMemberEngagementPatternsAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
        await _repository.GetFinancialMetricsAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
        await _repository.GetCohortDataAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
        await _repository.GetEventPerformanceDataAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
        await _repository.GetComplexEngagementMetricsAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
    }

    #endregion

    #region Memory Allocation Benchmarks

    [Benchmark(Description = "Basic Tier - Memory Usage Pattern")]
    public async Task BasicTier_MemoryPattern()
    {
        var results = new List<object>();
        
        for (int i = 0; i < 50; i++)
        {
            var engagement = await _repository.GetEngagementDataAsync(BASIC_CLUB_ID, _startDate, _endDate);
            var patterns = await _repository.GetMemberEngagementPatternsAsync(BASIC_CLUB_ID, _startDate, _endDate);
            var financial = await _repository.GetFinancialMetricsAsync(BASIC_CLUB_ID, _startDate, _endDate);
            
            results.Add(engagement);
            results.Add(patterns);
            results.Add(financial);
        }
        
        // Force results to be used to prevent optimization
        if (results.Count > 0) { /* consume results */ }
    }

    [Benchmark(Description = "Unlimited Tier - Memory Usage Pattern")]
    public async Task UnlimitedTier_MemoryPattern()
    {
        var results = new List<object>();
        
        // Reduced iterations for unlimited tier due to higher processing cost
        for (int i = 0; i < 5; i++)
        {
            var engagement = await _repository.GetEngagementDataAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
            var patterns = await _repository.GetMemberEngagementPatternsAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
            var financial = await _repository.GetFinancialMetricsAsync(UNLIMITED_CLUB_ID, _startDate, _endDate);
            
            results.Add(engagement);
            results.Add(patterns);
            results.Add(financial);
        }
        
        // Force results to be used to prevent optimization
        if (results.Count > 0) { /* consume results */ }
    }

    #endregion

    [GlobalCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }
}

/// <summary>
/// Benchmark runner program
/// </summary>
public class BenchmarkRunner
{
    public static void Main(string[] args)
    {
        var summary = BenchmarkRunner.Run<TierAwareServiceBenchmarks>();
        
        // Print summary with performance analysis
        Console.WriteLine("\n=== TIER-AWARE PERFORMANCE ANALYSIS ===");
        Console.WriteLine("Expected Performance Targets:");
        Console.WriteLine("- Basic Tier should be 60-80% faster than Unlimited Tier (CPU reduction)");
        Console.WriteLine("- Basic Tier should use 50-70% less memory than Unlimited Tier");
        Console.WriteLine("- Basic Tier should execute 40-60% fewer database queries");
        Console.WriteLine("\nReview the benchmark results above to validate these targets are met.");
    }
}