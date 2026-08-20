using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GatherGrove.Application.Services.TierValidation;
using GatherGrove.Application.Services.Caching;
using System.Collections.Concurrent;
using System.Diagnostics;

namespace GatherGrove.Application.Services.Monitoring;

/// <summary>
/// Resource optimization monitoring service
/// Tracks and validates tier-based resource savings in real-time
/// Key component for measuring 60-80% CPU, 50-70% memory, 40-60% database load reductions
/// </summary>
public class ResourceOptimizationMonitor : IResourceOptimizationMonitor
{
    private readonly ITierGateService _tierGateService;
    private readonly ITierAwareCacheService _cacheService;
    private readonly ILogger<ResourceOptimizationMonitor> _logger;
    private readonly ConcurrentDictionary<string, ResourceMetrics> _metrics;
    private readonly Timer _reportingTimer;

    // Resource tracking counters
    private long _blockedBasicTierOperations = 0;
    private long _allowedUnlimitedOperations = 0;
    private long _cacheMissesPrevented = 0;
    private long _databaseQueriesSkipped = 0;
    private long _backgroundJobsFiltered = 0;

    // Performance tracking
#pragma warning disable CA1416 // PerformanceCounter is Windows-only; this service is Windows-only deployment
    private readonly PerformanceCounter _cpuCounter;
    private readonly PerformanceCounter _memoryCounter;
#pragma warning restore CA1416
    private DateTime _trackingStartTime = DateTime.UtcNow;

    public ResourceOptimizationMonitor(
        ITierGateService tierGateService,
        ITierAwareCacheService cacheService,
        ILogger<ResourceOptimizationMonitor> logger)
    {
        _tierGateService = tierGateService;
        _cacheService = cacheService;
        _logger = logger;
        _metrics = new ConcurrentDictionary<string, ResourceMetrics>();

        // Initialize performance counters
#pragma warning disable CA1416 // PerformanceCounter is Windows-only; this service is Windows-only deployment
        _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
        _memoryCounter = new PerformanceCounter("Memory", "Available MBytes");
#pragma warning restore CA1416

        // Report metrics every 5 minutes
        _reportingTimer = new Timer(GenerateResourceReport, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));

        _logger.LogInformation("Resource Optimization Monitor initialized - tracking tier-based resource savings");
    }

    /// <summary>
    /// Records blocked operation for basic tier club
    /// KEY METRIC: Each blocked operation represents resource savings
    /// </summary>
    public async Task RecordBlockedOperationAsync(int clubId, string operationType, TimeSpan estimatedCost)
    {
        Interlocked.Increment(ref _blockedBasicTierOperations);

        var key = $"blocked:{operationType}";
        _metrics.AddOrUpdate(key,
            new ResourceMetrics
            {
                OperationType = operationType,
                Count = 1,
                TotalEstimatedCost = estimatedCost,
                LastRecorded = DateTime.UtcNow
            },
            (k, existing) => new ResourceMetrics
            {
                OperationType = operationType,
                Count = existing.Count + 1,
                TotalEstimatedCost = existing.TotalEstimatedCost + estimatedCost,
                LastRecorded = DateTime.UtcNow
            });

        _logger.LogDebug("Recorded prevented operation: {OperationType} for club {ClubId}, estimated cost {Cost}ms",
            operationType, clubId, estimatedCost.TotalMilliseconds);

        await Task.CompletedTask;
    }

    /// <summary>
    /// Records allowed operation for unlimited tier club
    /// </summary>
    public async Task RecordAllowedOperationAsync(int clubId, string operationType, TimeSpan actualCost)
    {
        Interlocked.Increment(ref _allowedUnlimitedOperations);

        var key = $"allowed:{operationType}";
        _metrics.AddOrUpdate(key,
            new ResourceMetrics
            {
                OperationType = operationType,
                Count = 1,
                TotalEstimatedCost = actualCost,
                LastRecorded = DateTime.UtcNow
            },
            (k, existing) => new ResourceMetrics
            {
                OperationType = operationType,
                Count = existing.Count + 1,
                TotalEstimatedCost = existing.TotalEstimatedCost + actualCost,
                LastRecorded = DateTime.UtcNow
            });

        _logger.LogDebug("Recorded allowed operation: {OperationType} for club {ClubId}, actual cost {Cost}ms",
            operationType, clubId, actualCost.TotalMilliseconds);

        await Task.CompletedTask;
    }

    /// <summary>
    /// Records database query optimization savings
    /// Tracks 40-60% database load reduction target
    /// </summary>
    public async Task RecordDatabaseOptimizationAsync(int clubId, string queryType, bool wasExecuted, TimeSpan estimatedCost)
    {
        if (!wasExecuted)
        {
            Interlocked.Increment(ref _databaseQueriesSkipped);
            await RecordBlockedOperationAsync(clubId, $"db:{queryType}", estimatedCost);
        }
        else
        {
            await RecordAllowedOperationAsync(clubId, $"db:{queryType}", estimatedCost);
        }
    }

    /// <summary>
    /// Records cache optimization savings
    /// Tracks 50-70% memory reduction target
    /// </summary>
    public async Task RecordCacheOptimizationAsync(int clubId, string cacheKey, bool wasCached, long estimatedSize)
    {
        if (!wasCached)
        {
            Interlocked.Increment(ref _cacheMissesPrevented);
            await RecordBlockedOperationAsync(clubId, "cache:skip", TimeSpan.FromMilliseconds(estimatedSize / 1000)); // Estimate cache cost
        }
        else
        {
            await RecordAllowedOperationAsync(clubId, "cache:hit", TimeSpan.FromMilliseconds(estimatedSize / 1000));
        }
    }

    /// <summary>
    /// Records background service optimization
    /// Tracks CPU reduction from filtered processing
    /// </summary>
    public async Task RecordBackgroundServiceOptimizationAsync(int clubId, string serviceType, bool wasProcessed, TimeSpan estimatedCost)
    {
        if (!wasProcessed)
        {
            Interlocked.Increment(ref _backgroundJobsFiltered);
            await RecordBlockedOperationAsync(clubId, $"bg:{serviceType}", estimatedCost);
        }
        else
        {
            await RecordAllowedOperationAsync(clubId, $"bg:{serviceType}", estimatedCost);
        }
    }

    /// <summary>
    /// Gets comprehensive resource optimization report
    /// </summary>
    public async Task<ResourceOptimizationReport> GetOptimizationReportAsync()
    {
        var totalOperations = _blockedBasicTierOperations + _allowedUnlimitedOperations;
        var optimizationRate = totalOperations > 0 ? (double)_blockedBasicTierOperations / totalOperations * 100 : 0;

        var cacheStats = await _cacheService.GetCacheStatisticsAsync();

        var report = new ResourceOptimizationReport
        {
            TrackingPeriod = DateTime.UtcNow - _trackingStartTime,

            // Core metrics
            BlockedOperations = _blockedBasicTierOperations,
            AllowedOperations = _allowedUnlimitedOperations,
            TotalOperations = totalOperations,
            OptimizationRate = Math.Round(optimizationRate, 1),

            // Specific optimization metrics
            DatabaseQueriesSkipped = _databaseQueriesSkipped,
            CacheMissesPrevented = _cacheMissesPrevented,
            BackgroundJobsFiltered = _backgroundJobsFiltered,

            // Calculated savings
            EstimatedCpuSavings = Math.Round(optimizationRate * 0.75, 1), // CPU scales with operation blocking
            EstimatedMemorySavings = Math.Round(cacheStats.MemorySavingsPercentage, 1),
            EstimatedDatabaseSavings = totalOperations > 0
                ? Math.Round((double)_databaseQueriesSkipped / totalOperations * 100, 1)
                : 0,

            // System performance
            CurrentCpuUsage = GetCurrentCpuUsage(),
            CurrentMemoryAvailable = GetCurrentMemoryAvailable(),

            // Cache statistics
            CacheHitRatio = cacheStats.TotalRequests > 0
                ? Math.Round((double)cacheStats.CacheHitsUnlimited / cacheStats.TotalRequests * 100, 1)
                : 0,

            ReportGeneratedAt = DateTime.UtcNow
        };

        _logger.LogInformation("Resource Optimization Report: {OptimizationRate}% operations optimized, " +
            "Est. CPU savings: {CpuSavings}%, Memory savings: {MemorySavings}%, DB savings: {DbSavings}%",
            report.OptimizationRate, report.EstimatedCpuSavings,
            report.EstimatedMemorySavings, report.EstimatedDatabaseSavings);

        return report;
    }

    /// <summary>
    /// Gets detailed metrics breakdown by operation type
    /// </summary>
    public async Task<Dictionary<string, ResourceMetrics>> GetDetailedMetricsAsync()
    {
        await Task.CompletedTask;
        return new Dictionary<string, ResourceMetrics>(_metrics);
    }

    /// <summary>
    /// Resets all tracking metrics
    /// </summary>
    public async Task ResetMetricsAsync()
    {
        _blockedBasicTierOperations = 0;
        _allowedUnlimitedOperations = 0;
        _cacheMissesPrevented = 0;
        _databaseQueriesSkipped = 0;
        _backgroundJobsFiltered = 0;
        _trackingStartTime = DateTime.UtcNow;
        _metrics.Clear();

        _logger.LogInformation("Resource optimization metrics reset at {ResetTime}", _trackingStartTime);
        await Task.CompletedTask;
    }

    /// <summary>
    /// Validates if optimization targets are being met
    /// Target: 60-80% CPU, 50-70% memory, 40-60% database load reduction
    /// </summary>
    public async Task<OptimizationTargetStatus> ValidateOptimizationTargetsAsync()
    {
        var report = await GetOptimizationReportAsync();

        var status = new OptimizationTargetStatus
        {
            CpuTarget = new TargetStatus
            {
                Target = "60-80%",
                Actual = report.EstimatedCpuSavings,
                IsMet = report.EstimatedCpuSavings >= 60 && report.EstimatedCpuSavings <= 80,
                Status = GetTargetStatusText(report.EstimatedCpuSavings, 60, 80)
            },
            MemoryTarget = new TargetStatus
            {
                Target = "50-70%",
                Actual = report.EstimatedMemorySavings,
                IsMet = report.EstimatedMemorySavings >= 50 && report.EstimatedMemorySavings <= 70,
                Status = GetTargetStatusText(report.EstimatedMemorySavings, 50, 70)
            },
            DatabaseTarget = new TargetStatus
            {
                Target = "40-60%",
                Actual = report.EstimatedDatabaseSavings,
                IsMet = report.EstimatedDatabaseSavings >= 40 && report.EstimatedDatabaseSavings <= 60,
                Status = GetTargetStatusText(report.EstimatedDatabaseSavings, 40, 60)
            },
            OverallOptimizationRate = report.OptimizationRate,
            ValidationTime = DateTime.UtcNow
        };

        var allTargetsMet = status.CpuTarget.IsMet && status.MemoryTarget.IsMet && status.DatabaseTarget.IsMet;

        _logger.LogInformation("Optimization Target Validation: CPU {CpuStatus}, Memory {MemoryStatus}, DB {DbStatus}, Overall: {OverallStatus}",
            status.CpuTarget.Status, status.MemoryTarget.Status, status.DatabaseTarget.Status,
            allTargetsMet ? "TARGETS MET" : "TARGETS NOT MET");

        return status;
    }

    /// <summary>
    /// Timer callback for automated reporting
    /// </summary>
    private void GenerateResourceReport(object? state)
    {
        _ = GenerateResourceReportAsync();
    }

    /// <summary>
    /// Async implementation of resource report generation
    /// </summary>
    private async Task GenerateResourceReportAsync()
    {
        try
        {
            var report = await GetOptimizationReportAsync();
            var targetStatus = await ValidateOptimizationTargetsAsync();

            _logger.LogInformation("=== RESOURCE OPTIMIZATION REPORT ===");
            _logger.LogInformation("Period: {Period} hours", Math.Round(report.TrackingPeriod.TotalHours, 1));
            _logger.LogInformation("Operations: {Blocked} blocked, {Allowed} allowed ({OptimizationRate}% optimization)",
                report.BlockedOperations, report.AllowedOperations, report.OptimizationRate);
            _logger.LogInformation("Savings: CPU {Cpu}%, Memory {Memory}%, Database {Db}%",
                report.EstimatedCpuSavings, report.EstimatedMemorySavings, report.EstimatedDatabaseSavings);
            _logger.LogInformation("Targets: {TargetsMet}",
                targetStatus.CpuTarget.IsMet && targetStatus.MemoryTarget.IsMet && targetStatus.DatabaseTarget.IsMet
                    ? "ALL MET ✓" : "SOME NOT MET ✗");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating automated resource report");
        }
    }

    private string GetTargetStatusText(double actual, double min, double max)
    {
        if (actual < min) return $"BELOW TARGET ({actual}% < {min}%)";
        if (actual > max) return $"ABOVE TARGET ({actual}% > {max}%)";
        return $"TARGET MET ({actual}%)";
    }

    private double GetCurrentCpuUsage()
    {
        try
        {
#pragma warning disable CA1416 // PerformanceCounter is Windows-only; this service is Windows-only deployment
            return Math.Round(_cpuCounter.NextValue(), 1);
#pragma warning restore CA1416
        }
        catch
        {
            return -1; // Unable to measure
        }
    }

    private double GetCurrentMemoryAvailable()
    {
        try
        {
#pragma warning disable CA1416 // PerformanceCounter is Windows-only; this service is Windows-only deployment
            return Math.Round(_memoryCounter.NextValue(), 1);
#pragma warning restore CA1416
        }
        catch
        {
            return -1; // Unable to measure
        }
    }

    public void Dispose()
    {
        _reportingTimer?.Dispose();
        _cpuCounter?.Dispose();
        _memoryCounter?.Dispose();
    }
}

/// <summary>
/// Interface for resource optimization monitoring
/// </summary>
public interface IResourceOptimizationMonitor : IDisposable
{
    Task RecordBlockedOperationAsync(int clubId, string operationType, TimeSpan estimatedCost);
    Task RecordAllowedOperationAsync(int clubId, string operationType, TimeSpan actualCost);
    Task RecordDatabaseOptimizationAsync(int clubId, string queryType, bool wasExecuted, TimeSpan estimatedCost);
    Task RecordCacheOptimizationAsync(int clubId, string cacheKey, bool wasCached, long estimatedSize);
    Task RecordBackgroundServiceOptimizationAsync(int clubId, string serviceType, bool wasProcessed, TimeSpan estimatedCost);
    Task<ResourceOptimizationReport> GetOptimizationReportAsync();
    Task<Dictionary<string, ResourceMetrics>> GetDetailedMetricsAsync();
    Task ResetMetricsAsync();
    Task<OptimizationTargetStatus> ValidateOptimizationTargetsAsync();
}

/// <summary>
/// Resource optimization report model
/// </summary>
public class ResourceOptimizationReport
{
    public TimeSpan TrackingPeriod { get; set; }
    public long BlockedOperations { get; set; }
    public long AllowedOperations { get; set; }
    public long TotalOperations { get; set; }
    public double OptimizationRate { get; set; }
    public long DatabaseQueriesSkipped { get; set; }
    public long CacheMissesPrevented { get; set; }
    public long BackgroundJobsFiltered { get; set; }
    public double EstimatedCpuSavings { get; set; }
    public double EstimatedMemorySavings { get; set; }
    public double EstimatedDatabaseSavings { get; set; }
    public double CurrentCpuUsage { get; set; }
    public double CurrentMemoryAvailable { get; set; }
    public double CacheHitRatio { get; set; }
    public DateTime ReportGeneratedAt { get; set; }
}

/// <summary>
/// Optimization target validation status
/// </summary>
public class OptimizationTargetStatus
{
    public TargetStatus CpuTarget { get; set; } = new();
    public TargetStatus MemoryTarget { get; set; } = new();
    public TargetStatus DatabaseTarget { get; set; } = new();
    public double OverallOptimizationRate { get; set; }
    public DateTime ValidationTime { get; set; }
}

public class TargetStatus
{
    public string Target { get; set; } = string.Empty;
    public double Actual { get; set; }
    public bool IsMet { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Resource metrics tracking model
/// </summary>
public class ResourceMetrics
{
    public string OperationType { get; set; } = string.Empty;
    public long Count { get; set; }
    public TimeSpan TotalEstimatedCost { get; set; }
    public DateTime LastRecorded { get; set; }
}