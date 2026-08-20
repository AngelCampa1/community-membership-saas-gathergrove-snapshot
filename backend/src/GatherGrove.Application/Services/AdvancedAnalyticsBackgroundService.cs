using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Caching.Distributed;
using GatherGrove.Application.Services.Interfaces;
using System.Text.Json;
using System.Collections.Concurrent;

namespace GatherGrove.Application.Services;

/// <summary>
/// Background service for processing heavy analytics calculations
/// Implements performance optimizations with Redis caching and job queuing
/// </summary>
public class AdvancedAnalyticsBackgroundService : BackgroundService
{
    private readonly IAdvancedAnalyticsService _analyticsService;
    private readonly IDistributedCache _distributedCache;
    private readonly ILogger<AdvancedAnalyticsBackgroundService> _logger;
    private readonly ConcurrentQueue<AnalyticsJob> _jobQueue;
    private readonly Timer _processingTimer;

    public AdvancedAnalyticsBackgroundService(
        IAdvancedAnalyticsService analyticsService,
        IDistributedCache distributedCache,
        ILogger<AdvancedAnalyticsBackgroundService> logger)
    {
        _analyticsService = analyticsService;
        _distributedCache = distributedCache;
        _logger = logger;
        _jobQueue = new ConcurrentQueue<AnalyticsJob>();
        
        // Initialize processing timer for every 15 minutes
        _processingTimer = new Timer(ProcessQueueCallback, null, TimeSpan.Zero, TimeSpan.FromMinutes(15));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Advanced Analytics Background Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Process any queued analytics jobs
                await ProcessQueuedJobsAsync(stoppingToken);

                // Warmup cache for active clubs (would get from database)
                var activeClubIds = await GetActiveClubIdsAsync();
                await WarmupCacheForClubsAsync(activeClubIds, stoppingToken);

                // Clean up expired cache entries
                await CleanupExpiredCacheAsync(stoppingToken);

                // Wait for next execution cycle
                var delay = GetNextExecutionDelay();
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Advanced Analytics Background Service is stopping due to cancellation");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Advanced Analytics Background Service execution cycle");
                // Continue processing after error
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        _logger.LogInformation("Advanced Analytics Background Service stopped");
    }

    /// <summary>
    /// Process queued analytics jobs
    /// </summary>
    private async Task ProcessQueuedJobsAsync(CancellationToken cancellationToken)
    {
        var processedJobs = 0;
        var maxJobsPerCycle = 10; // Limit processing per cycle

        while (_jobQueue.TryDequeue(out var job) && processedJobs < maxJobsPerCycle && !cancellationToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("Processing analytics job for club {ClubId} with priority {Priority}", 
                    job.ClubId, job.Priority);

                await ProcessAnalyticsJobAsync(job, cancellationToken);
                processedJobs++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing analytics job for club {ClubId}", job.ClubId);
            }
        }

        if (processedJobs > 0)
        {
            _logger.LogInformation("Processed {ProcessedJobs} analytics jobs this cycle", processedJobs);
        }
    }

    /// <summary>
    /// Process individual analytics job
    /// </summary>
    private async Task ProcessAnalyticsJobAsync(AnalyticsJob job, CancellationToken cancellationToken)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            switch (job.JobType)
            {
                case AnalyticsJobType.EngagementTrends:
                    await PrecomputeEngagementTrendsAsync(job.ClubId, cancellationToken);
                    break;

                case AnalyticsJobType.CohortAnalysis:
                    await PrecomputeCohortAnalysisAsync(job.ClubId, cancellationToken);
                    break;

                case AnalyticsJobType.ROIMetrics:
                    await PrecomputeROIMetricsAsync(job.ClubId, cancellationToken);
                    break;

                case AnalyticsJobType.MemberSegmentation:
                    await PrecomputeMemberSegmentationAsync(job.ClubId, cancellationToken);
                    break;

                case AnalyticsJobType.Comprehensive:
                    await PrecomputeAllAnalyticsAsync(job.ClubId, cancellationToken);
                    break;
            }

            stopwatch.Stop();
            _logger.LogInformation("Completed analytics job {JobType} for club {ClubId} in {ElapsedMs}ms", 
                job.JobType, job.ClubId, stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Failed analytics job {JobType} for club {ClubId} after {ElapsedMs}ms", 
                job.JobType, job.ClubId, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    /// <summary>
    /// Precompute engagement trends and cache results
    /// </summary>
    private async Task PrecomputeEngagementTrendsAsync(int clubId, CancellationToken cancellationToken)
    {
        var endDate = DateTime.UtcNow;
        var startDate = endDate.AddMonths(-6); // 6 months of data

        var trends = await _analyticsService.GetEngagementTrendsAsync(clubId, startDate, endDate);
        
        var cacheKey = $"analytics:engagement:{clubId}:6m";
        var cacheValue = JsonSerializer.Serialize(trends);
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(4),
            SlidingExpiration = TimeSpan.FromHours(1)
        };

        await _distributedCache.SetStringAsync(cacheKey, cacheValue, cacheOptions, cancellationToken);
    }

    /// <summary>
    /// Precompute cohort analysis and cache results
    /// </summary>
    private async Task PrecomputeCohortAnalysisAsync(int clubId, CancellationToken cancellationToken)
    {
        var endDate = DateTime.UtcNow;
        var startDate = endDate.AddYears(-2); // 2 years for cohort analysis

        var cohorts = await _analyticsService.GetCohortAnalysisAsync(clubId, startDate, endDate);
        
        var cacheKey = $"analytics:cohorts:{clubId}:2y";
        var cacheValue = JsonSerializer.Serialize(cohorts);
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(12),
            SlidingExpiration = TimeSpan.FromHours(2)
        };

        await _distributedCache.SetStringAsync(cacheKey, cacheValue, cacheOptions, cancellationToken);
    }

    /// <summary>
    /// Precompute ROI metrics and cache results
    /// </summary>
    private async Task PrecomputeROIMetricsAsync(int clubId, CancellationToken cancellationToken)
    {
        var endDate = DateTime.UtcNow;
        var startDate = endDate.AddYears(-1); // 1 year for ROI analysis

        var roiData = await _analyticsService.GetFinancialROIAsync(clubId, startDate, endDate);
        
        var cacheKey = $"analytics:roi:{clubId}:1y";
        var cacheValue = JsonSerializer.Serialize(roiData);
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6),
            SlidingExpiration = TimeSpan.FromHours(1)
        };

        await _distributedCache.SetStringAsync(cacheKey, cacheValue, cacheOptions, cancellationToken);
    }

    /// <summary>
    /// Precompute member segmentation and cache results
    /// </summary>
    private async Task PrecomputeMemberSegmentationAsync(int clubId, CancellationToken cancellationToken)
    {
        var segmentation = await _analyticsService.GetMemberSegmentationAsync(clubId, new List<string>());
        
        var cacheKey = $"analytics:segmentation:{clubId}:current";
        var cacheValue = JsonSerializer.Serialize(segmentation);
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(8),
            SlidingExpiration = TimeSpan.FromHours(2)
        };

        await _distributedCache.SetStringAsync(cacheKey, cacheValue, cacheOptions, cancellationToken);
    }

    /// <summary>
    /// Precompute all analytics data for a club
    /// </summary>
    private async Task PrecomputeAllAnalyticsAsync(int clubId, CancellationToken cancellationToken)
    {
        await Task.WhenAll(
            PrecomputeEngagementTrendsAsync(clubId, cancellationToken),
            PrecomputeCohortAnalysisAsync(clubId, cancellationToken),
            PrecomputeROIMetricsAsync(clubId, cancellationToken),
            PrecomputeMemberSegmentationAsync(clubId, cancellationToken)
        );
    }

    /// <summary>
    /// Process analytics queue for multiple clubs
    /// </summary>
    public async Task ProcessAnalyticsQueueAsync(int[] clubIds, CancellationToken cancellationToken)
    {
        var tasks = clubIds.Select(async clubId =>
        {
            try
            {
                await _analyticsService.PrecomputeAnalyticsAsync(clubId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing analytics for club {ClubId}", clubId);
            }
        });

        await Task.WhenAll(tasks);
    }

    /// <summary>
    /// Warmup cache for a specific club
    /// </summary>
    public async Task WarmupCacheAsync(int clubId, CancellationToken cancellationToken)
    {
        try
        {
            await PrecomputeAllAnalyticsAsync(clubId, cancellationToken);
            _logger.LogInformation("Cache warmed up for club {ClubId}", clubId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error warming up cache for club {ClubId}", clubId);
        }
    }

    /// <summary>
    /// Invalidate cache for a specific club
    /// </summary>
    public async Task InvalidateCacheAsync(int clubId, CancellationToken cancellationToken)
    {
        var cacheKeys = new[]
        {
            $"analytics:engagement:{clubId}:6m",
            $"analytics:cohorts:{clubId}:2y",
            $"analytics:roi:{clubId}:1y",
            $"analytics:segmentation:{clubId}:current"
        };

        var tasks = cacheKeys.Select(key => _distributedCache.RemoveAsync(key, cancellationToken));
        await Task.WhenAll(tasks);

        _logger.LogInformation("Cache invalidated for club {ClubId}", clubId);
    }

    /// <summary>
    /// Schedule analytics processing for a club
    /// </summary>
    public async Task ScheduleClubAnalyticsAsync(int clubId, AnalyticsPriority priority = AnalyticsPriority.Medium)
    {
        var job = new AnalyticsJob
        {
            ClubId = clubId,
            JobType = AnalyticsJobType.Comprehensive,
            Priority = priority,
            ScheduledAt = DateTime.UtcNow
        };

        _jobQueue.Enqueue(job);
        _logger.LogInformation("Scheduled analytics job for club {ClubId} with priority {Priority}", clubId, priority);
        
        await Task.CompletedTask;
    }

    /// <summary>
    /// Get next execution delay based on current time and load
    /// </summary>
    public TimeSpan GetNextExecutionDelay()
    {
        var currentHour = DateTime.UtcNow.Hour;
        
        // Run more frequently during peak hours (9 AM - 6 PM)
        if (currentHour >= 9 && currentHour <= 18)
        {
            return TimeSpan.FromMinutes(15); // Every 15 minutes during peak
        }
        else
        {
            return TimeSpan.FromMinutes(60); // Every hour during off-peak
        }
    }

    /// <summary>
    /// Warmup cache for multiple clubs
    /// </summary>
    private async Task WarmupCacheForClubsAsync(int[] clubIds, CancellationToken cancellationToken)
    {
        const int maxConcurrentWarmups = 3; // Limit concurrent operations
        using var semaphore = new SemaphoreSlim(maxConcurrentWarmups, maxConcurrentWarmups);

        var tasks = clubIds.Select(async clubId =>
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                await WarmupCacheAsync(clubId, cancellationToken);
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);
    }

    /// <summary>
    /// Clean up expired cache entries
    /// </summary>
    private async Task CleanupExpiredCacheAsync(CancellationToken cancellationToken)
    {
        // This would require a cache implementation that supports enumeration
        // For now, log that cleanup would occur here
        await Task.CompletedTask;
    }

    /// <summary>
    /// Get active club IDs (simplified - would query database in real implementation)
    /// </summary>
    private async Task<int[]> GetActiveClubIdsAsync()
    {
        // This would query the database for active clubs with Unlimited tier
        // For now, return a mock set for demonstration
        await Task.CompletedTask;
        return new[] { 1, 2, 3 }; // Mock active club IDs
    }

    /// <summary>
    /// Timer callback for processing queue
    /// </summary>
    private void ProcessQueueCallback(object? state)
    {
        _ = ProcessQueueCallbackAsync();
    }

    /// <summary>
    /// Async implementation of queue processing callback
    /// </summary>
    private async Task ProcessQueueCallbackAsync()
    {
        try
        {
            if (!_jobQueue.IsEmpty)
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));
                await ProcessQueuedJobsAsync(cts.Token);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in processing queue callback");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _processingTimer?.Dispose();
        _logger.LogInformation("Advanced Analytics Background Service is stopping");
        await base.StopAsync(cancellationToken);
    }

    public override void Dispose()
    {
        _processingTimer?.Dispose();
        base.Dispose();
    }
}

/// <summary>
/// Analytics job for background processing
/// </summary>
public class AnalyticsJob
{
    public int ClubId { get; set; }
    public AnalyticsJobType JobType { get; set; }
    public AnalyticsPriority Priority { get; set; }
    public DateTime ScheduledAt { get; set; }
}

/// <summary>
/// Types of analytics jobs
/// </summary>
public enum AnalyticsJobType
{
    EngagementTrends,
    CohortAnalysis,
    ROIMetrics,
    MemberSegmentation,
    Comprehensive
}

/// <summary>
/// Analytics processing priority levels
/// </summary>
public enum AnalyticsPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}