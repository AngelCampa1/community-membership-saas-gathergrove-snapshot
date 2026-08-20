using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services.Monitoring;
using GatherGrove.Application.Services.TierValidation;
using GatherGrove.Application.Services.Caching;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for resource optimization monitoring and metrics
/// Provides real-time visibility into tier-based resource savings
/// Key component for validating 60-80% CPU, 50-70% memory, 40-60% database load reductions
/// </summary>
[ApiController]
[Route("api/v1/resource-monitoring")]
[Authorize] // Require authentication for monitoring endpoints
public class ResourceMonitoringController : ControllerBase
{
    private readonly IResourceOptimizationMonitor _resourceMonitor;
    private readonly ITierAwareCacheService _cacheService;
    private readonly ITierGateService _tierGateService;
    private readonly ILogger<ResourceMonitoringController> _logger;

    public ResourceMonitoringController(
        IResourceOptimizationMonitor resourceMonitor,
        ITierAwareCacheService cacheService,
        ITierGateService tierGateService,
        ILogger<ResourceMonitoringController> logger)
    {
        _resourceMonitor = resourceMonitor;
        _cacheService = cacheService;
        _tierGateService = tierGateService;
        _logger = logger;
    }

    /// <summary>
    /// Gets comprehensive resource optimization report
    /// Shows real-time metrics on tier-based resource savings
    /// </summary>
    /// <returns>Detailed optimization metrics</returns>
    [HttpGet("report")]
    public async Task<ActionResult<ResourceOptimizationReport>> GetOptimizationReport()
    {
        try
        {

            var report = await _resourceMonitor.GetOptimizationReportAsync();

            _logger.LogInformation("Resource optimization report generated: {OptimizationRate}% operations optimized",
                report.OptimizationRate);

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating resource optimization report");
            return StatusCode(500, new { error = "Failed to generate optimization report" });
        }
    }

    /// <summary>
    /// Gets detailed metrics breakdown by operation type
    /// Useful for identifying which operations provide the most resource savings
    /// </summary>
    /// <returns>Detailed metrics by operation type</returns>
    [HttpGet("metrics/detailed")]
    public async Task<ActionResult<Dictionary<string, ResourceMetrics>>> GetDetailedMetrics()
    {
        try
        {

            var metrics = await _resourceMonitor.GetDetailedMetricsAsync();

            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving detailed metrics");
            return StatusCode(500, new { error = "Failed to retrieve detailed metrics" });
        }
    }

    /// <summary>
    /// Validates if optimization targets are being met
    /// Checks against targets: 60-80% CPU, 50-70% memory, 40-60% database load reduction
    /// </summary>
    /// <returns>Target validation status</returns>
    [HttpGet("targets/validation")]
    public async Task<ActionResult<OptimizationTargetStatus>> ValidateOptimizationTargets()
    {
        try
        {

            var targetStatus = await _resourceMonitor.ValidateOptimizationTargetsAsync();

            var allTargetsMet = targetStatus.CpuTarget.IsMet &&
                               targetStatus.MemoryTarget.IsMet &&
                               targetStatus.DatabaseTarget.IsMet;

            _logger.LogInformation("Optimization targets validation: {TargetStatus}",
                allTargetsMet ? "ALL TARGETS MET" : "SOME TARGETS NOT MET");

            return Ok(targetStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating optimization targets");
            return StatusCode(500, new { error = "Failed to validate optimization targets" });
        }
    }

    /// <summary>
    /// Gets cache statistics showing memory optimization savings
    /// Demonstrates tier-based caching effectiveness
    /// </summary>
    /// <returns>Cache performance and savings metrics</returns>
    [HttpGet("cache/statistics")]
    public async Task<ActionResult<CacheStatistics>> GetCacheStatistics()
    {
        try
        {

            var cacheStats = await _cacheService.GetCacheStatisticsAsync();

            _logger.LogDebug("Cache statistics retrieved: {MemorySavings}% memory savings",
                cacheStats.MemorySavingsPercentage);

            return Ok(cacheStats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cache statistics");
            return StatusCode(500, new { error = "Failed to retrieve cache statistics" });
        }
    }

    /// <summary>
    /// Records a blocked operation for monitoring purposes
    /// Used by other services to track resource savings
    /// </summary>
    /// <param name="request">Operation blocking details</param>
    /// <returns>Confirmation of recorded operation</returns>
    [HttpPost("record/blocked-operation")]
    public async Task<ActionResult> RecordBlockedOperation([FromBody] RecordBlockedOperationRequest request)
    {
        try
        {
            _logger.LogDebug("Recording blocked operation for club {ClubId}, type {OperationType}",
                request.ClubId, request.OperationType);

            var estimatedCost = TimeSpan.FromMilliseconds(request.EstimatedCostMs);

            await _resourceMonitor.RecordBlockedOperationAsync(request.ClubId, request.OperationType, estimatedCost);

            return Ok(new { message = "Blocked operation recorded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording blocked operation for club {ClubId}", request.ClubId);
            return StatusCode(500, new { error = "Failed to record blocked operation" });
        }
    }

    /// <summary>
    /// Records an allowed operation for monitoring purposes
    /// Used by other services to track unlimited tier resource usage
    /// </summary>
    /// <param name="request">Operation execution details</param>
    /// <returns>Confirmation of recorded operation</returns>
    [HttpPost("record/allowed-operation")]
    public async Task<ActionResult> RecordAllowedOperation([FromBody] RecordAllowedOperationRequest request)
    {
        try
        {
            _logger.LogDebug("Recording allowed operation for club {ClubId}, type {OperationType}",
                request.ClubId, request.OperationType);

            var actualCost = TimeSpan.FromMilliseconds(request.ActualCostMs);

            await _resourceMonitor.RecordAllowedOperationAsync(request.ClubId, request.OperationType, actualCost);

            return Ok(new { message = "Allowed operation recorded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording allowed operation for club {ClubId}", request.ClubId);
            return StatusCode(500, new { error = "Failed to record allowed operation" });
        }
    }

    /// <summary>
    /// Resets all monitoring metrics
    /// Useful for starting fresh monitoring periods
    /// </summary>
    /// <returns>Confirmation of reset</returns>
    [HttpPost("reset")]
    [Authorize(Policy = "AdminOnly")] // Only administrators can reset metrics
    public async Task<ActionResult> ResetMetrics()
    {
        try
        {
            _logger.LogInformation("Resetting resource optimization metrics");

            await _resourceMonitor.ResetMetricsAsync();
            await _cacheService.ResetStatisticsAsync();

            _logger.LogInformation("All resource optimization metrics reset successfully");

            return Ok(new { message = "All metrics reset successfully", resetTime = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting metrics");
            return StatusCode(500, new { error = "Failed to reset metrics" });
        }
    }

    /// <summary>
    /// Gets current system health related to resource optimization
    /// Provides overview of optimization system status
    /// </summary>
    /// <returns>System health status</returns>
    [HttpGet("health")]
    public async Task<ActionResult<ResourceOptimizationHealth>> GetOptimizationHealth()
    {
        try
        {

            var report = await _resourceMonitor.GetOptimizationReportAsync();
            var cacheStats = await _cacheService.GetCacheStatisticsAsync();

            var health = new ResourceOptimizationHealth
            {
                OverallStatus = DetermineHealthStatus(report),
                OptimizationRate = report.OptimizationRate,
                TargetsStatus = await _resourceMonitor.ValidateOptimizationTargetsAsync(),
                CacheEfficiency = cacheStats.MemorySavingsPercentage,
                SystemLoad = new SystemLoadInfo
                {
                    CpuUsage = report.CurrentCpuUsage,
                    MemoryAvailable = report.CurrentMemoryAvailable,
                    ActiveOptimizations = report.BlockedOperations
                },
                LastUpdated = DateTime.UtcNow
            };


            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking optimization health");
            return StatusCode(500, new { error = "Failed to check optimization health" });
        }
    }

    /// <summary>
    /// Gets tier distribution metrics
    /// Shows breakdown of unlimited vs basic tier usage
    /// </summary>
    /// <returns>Tier usage statistics</returns>
    [HttpGet("tier/distribution")]
    public async Task<ActionResult<TierDistributionMetrics>> GetTierDistribution()
    {
        try
        {

            var report = await _resourceMonitor.GetOptimizationReportAsync();

            var distribution = new TierDistributionMetrics
            {
                UnlimitedTierOperations = report.AllowedOperations,
                BasicTierOperations = report.BlockedOperations,
                TotalOperations = report.TotalOperations,
                OptimizationEfficiency = report.OptimizationRate,
                ResourceSavingsBreakdown = new ResourceSavingsBreakdown
                {
                    CpuSavings = report.EstimatedCpuSavings,
                    MemorySavings = report.EstimatedMemorySavings,
                    DatabaseSavings = report.EstimatedDatabaseSavings
                },
                TrackingPeriod = report.TrackingPeriod,
                GeneratedAt = DateTime.UtcNow
            };

            return Ok(distribution);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving tier distribution metrics");
            return StatusCode(500, new { error = "Failed to retrieve tier distribution" });
        }
    }

    /// <summary>
    /// Triggers cache warmup for unlimited tier clubs
    /// Optimizes cache performance for paying customers
    /// </summary>
    /// <param name="request">Cache warmup configuration</param>
    /// <returns>Warmup operation status</returns>
    [HttpPost("cache/warmup")]
    [Authorize(Policy = "AdminOnly")] // Only administrators can trigger warmup
    public async Task<ActionResult> TriggerCacheWarmup([FromBody] CacheWarmupRequest request)
    {
        try
        {
            _logger.LogInformation("Triggering cache warmup for {ClubCount} clubs", request.ClubIds?.Length ?? 0);

            var clubIds = request.ClubIds ?? Array.Empty<int>();
            var keys = request.CacheKeys ?? Array.Empty<string>();

            await _cacheService.WarmupCacheAsync(clubIds, keys);

            _logger.LogInformation("Cache warmup completed for {ClubCount} unlimited tier clubs", clubIds.Length);

            return Ok(new
            {
                message = "Cache warmup completed successfully",
                clubsWarmedUp = clubIds.Length,
                keysWarmedUp = keys.Length,
                completedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cache warmup");
            return StatusCode(500, new { error = "Failed to complete cache warmup" });
        }
    }

    /// <summary>
    /// Determines overall health status based on optimization report
    /// </summary>
    private string DetermineHealthStatus(ResourceOptimizationReport report)
    {
        if (report.OptimizationRate >= 70) return "Excellent";
        if (report.OptimizationRate >= 50) return "Good";
        if (report.OptimizationRate >= 30) return "Fair";
        return "Poor";
    }
}

/// <summary>
/// Request model for recording blocked operations
/// </summary>
public class RecordBlockedOperationRequest
{
    public int ClubId { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public double EstimatedCostMs { get; set; }
}

/// <summary>
/// Request model for recording allowed operations
/// </summary>
public class RecordAllowedOperationRequest
{
    public int ClubId { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public double ActualCostMs { get; set; }
}

/// <summary>
/// Request model for cache warmup
/// </summary>
public class CacheWarmupRequest
{
    public int[]? ClubIds { get; set; }
    public string[]? CacheKeys { get; set; }
}

/// <summary>
/// Resource optimization health status model
/// </summary>
public class ResourceOptimizationHealth
{
    public string OverallStatus { get; set; } = string.Empty;
    public double OptimizationRate { get; set; }
    public OptimizationTargetStatus TargetsStatus { get; set; } = new();
    public double CacheEfficiency { get; set; }
    public SystemLoadInfo SystemLoad { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// System load information
/// </summary>
public class SystemLoadInfo
{
    public double CpuUsage { get; set; }
    public double MemoryAvailable { get; set; }
    public long ActiveOptimizations { get; set; }
}

/// <summary>
/// Tier distribution metrics model
/// </summary>
public class TierDistributionMetrics
{
    public long UnlimitedTierOperations { get; set; }
    public long BasicTierOperations { get; set; }
    public long TotalOperations { get; set; }
    public double OptimizationEfficiency { get; set; }
    public ResourceSavingsBreakdown ResourceSavingsBreakdown { get; set; } = new();
    public TimeSpan TrackingPeriod { get; set; }
    public DateTime GeneratedAt { get; set; }
}

/// <summary>
/// Resource savings breakdown model
/// </summary>
public class ResourceSavingsBreakdown
{
    public double CpuSavings { get; set; }
    public double MemorySavings { get; set; }
    public double DatabaseSavings { get; set; }
}