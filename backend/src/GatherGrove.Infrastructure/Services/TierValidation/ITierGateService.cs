namespace GatherGrove.Infrastructure.Services.TierValidation;

/// <summary>
/// Service for validating tier-based access to features and analytics
/// </summary>
public interface ITierGateService
{
    /// <summary>
    /// Validates if a club has Expand tier access
    /// </summary>
    /// <param name="clubId">The club ID to validate</param>
    /// <returns>True if club has Expand tier access</returns>
    Task<bool> ValidateUnlimitedAccessAsync(int clubId);

    /// <summary>
    /// Validates if a club has Grow tier or above access (Grow or Expand)
    /// </summary>
    /// <param name="clubId">The club ID to validate</param>
    /// <returns>True if club is on Grow or Expand tier</returns>
    Task<bool> ValidateGrowOrAboveAccessAsync(int clubId);

    /// <summary>
    /// Validates access to specific features based on club tier
    /// </summary>
    /// <param name="clubId">The club ID to validate</param>
    /// <param name="featureName">The feature name to validate</param>
    /// <returns>Validation result with access status and details</returns>
    Task<TierValidationResult> ValidateFeatureAccessAsync(int clubId, string featureName);

    /// <summary>
    /// Gets resource limits for a specific tier
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>The tier resource limits</returns>
    Task<TierResourceLimits> GetTierResourceLimitsAsync(int clubId);

    /// <summary>
    /// Validates a resource allocation request against tier limits
    /// </summary>
    /// <param name="request">The resource allocation request</param>
    /// <returns>True if allocation is valid</returns>
    Task<bool> ValidateResourceAllocationAsync(ResourceAllocationRequest request);

    /// <summary>
    /// Gets tier-aware cache key prefix
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="baseKey">The base cache key</param>
    /// <returns>Tier-aware cache key</returns>
    string GetTierAwareCacheKey(int clubId, string baseKey);

    /// <summary>
    /// Determines if background processing should be enabled for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>True if background processing should be enabled</returns>
    Task<bool> ShouldEnableBackgroundProcessingAsync(int clubId);
}

/// <summary>
/// Resource limits by tier for optimization
/// </summary>
public class TierResourceLimits
{
    public int MaxAnalyticsQueries { get; set; }
    public int MaxCacheSize { get; set; }
    public int MaxBackgroundJobs { get; set; }
    public bool BackgroundProcessingEnabled { get; set; }
    public bool AdvancedFeaturesEnabled { get; set; }
}

/// <summary>
/// Resource allocation request for validation
/// </summary>
public class ResourceAllocationRequest
{
    public int ClubId { get; set; }
    public int AnalyticsQueries { get; set; }
    public int CacheSize { get; set; }
    public bool BackgroundProcessing { get; set; }
}

/// <summary>
/// Result of tier validation checks
/// </summary>
public class TierValidationResult
{
    /// <summary>
    /// Whether the user/club has access to the feature
    /// </summary>
    public bool HasAccess { get; set; }

    /// <summary>
    /// Message explaining the validation result
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// Current tier of the club
    /// </summary>
    public string? CurrentTier { get; set; }

    /// <summary>
    /// Required tier for the feature
    /// </summary>
    public string? RequiredTier { get; set; }
}