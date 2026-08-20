using Microsoft.Extensions.Logging;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GatherGrove.Infrastructure.Services.TierValidation;

/// <summary>
/// TierGateService - Core service for tier-based resource access validation
/// Prevents resource waste by blocking Expand features for basic tier clubs
/// Part of the resource optimization strategy targeting 60-80% CPU reduction
/// </summary>
public class TierGateService : ITierGateService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<TierGateService> _logger;

    // Resource limits by tier
    private static readonly Dictionary<string, TierResourceLimits> TierLimits = new()
    {
        ["Seed"] = new TierResourceLimits
        {
            MaxAnalyticsQueries = 100,
            MaxCacheSize = 50,
            MaxBackgroundJobs = 1,
            BackgroundProcessingEnabled = true,
            AdvancedFeaturesEnabled = false
        },
        ["Grow"] = new TierResourceLimits
        {
            MaxAnalyticsQueries = 500,
            MaxCacheSize = 200,
            MaxBackgroundJobs = 2,
            BackgroundProcessingEnabled = true,
            AdvancedFeaturesEnabled = false
        },
        ["Expand"] = new TierResourceLimits
        {
            MaxAnalyticsQueries = -1, // Unlimited
            MaxCacheSize = -1, // Unlimited
            MaxBackgroundJobs = -1, // Unlimited
            BackgroundProcessingEnabled = true,
            AdvancedFeaturesEnabled = true
        }
    };

    public TierGateService(
        GatherGroveDbContext context,
        ILogger<TierGateService> logger)
    {
        _context = context;
        _logger = logger;
    }

    private static bool IsExpandTier(string? tier) =>
        tier?.Equals("Expand", StringComparison.OrdinalIgnoreCase) == true
        || tier?.Equals("Unlimited", StringComparison.OrdinalIgnoreCase) == true;

    private static string NormalizeTierKey(string? tier) =>
        IsExpandTier(tier) ? "Expand" : tier ?? "Grow";

    /// <summary>
    /// Validates if a club has Expand tier access
    /// CRITICAL: This check prevents resource allocation for non-Expand clubs
    /// </summary>
    public async Task<bool> ValidateUnlimitedAccessAsync(int clubId)
    {
        try
        {

            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found during Expand access validation", clubId);
                return false;
            }

            var hasAccess = IsExpandTier(club.Tier);

            if (!hasAccess)
            {
                _logger.LogInformation("Club {ClubId} denied access to Expand features - tier validation blocked resource allocation", clubId);
            }

            return hasAccess;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Expand access for club {ClubId}", clubId);
            return false; // Fail closed for security
        }
    }

    /// <summary>
    /// Validates if a club has Grow tier or above access (Grow or Expand)
    /// </summary>
    public async Task<bool> ValidateGrowOrAboveAccessAsync(int clubId)
    {
        try
        {
            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found during Grow access validation", clubId);
                return false;
            }

            var hasAccess = club.Tier?.Equals("Grow", StringComparison.OrdinalIgnoreCase) == true
                         || IsExpandTier(club.Tier);

            if (!hasAccess)
            {
                _logger.LogInformation("Club {ClubId} denied access to Grow+ features - requires Grow or Expand tier", clubId);
            }

            return hasAccess;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Grow or above access for club {ClubId}", clubId);
            return false; // Fail closed for security
        }
    }

    /// <summary>
    /// Validates access to specific features based on club tier
    /// Prevents loading of advanced features for basic tier clubs
    /// </summary>
    public async Task<TierValidationResult> ValidateFeatureAccessAsync(int clubId, string featureName)
    {
        try
        {

            // Get club tier
            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found during feature validation", clubId);
                return new TierValidationResult
                {
                    HasAccess = false,
                    Message = "Club not found",
                    CurrentTier = null,
                    RequiredTier = null
                };
            }

            // Determine required tier for the feature
            var requiredTier = featureName switch
            {
                // Basic features - available to all tiers
                "MemberDirectory" or "BasicEvents" or "BasicReporting" or "EventRSVP" or "WaitlistManagement" => "Basic",

                // Grow+ features  
                "EnhancedReporting" or "CustomFields" => "Grow",

                // Advanced features - Expand tier only
                "AdvancedAnalytics" or "DataExport" or "WhiteLabeling" or "AdvancedEventManagement" or "MemberSegmentation" or "APIAccess" => "Expand",

                _ => "Expand" // Unknown features require highest tier
            };

            // Check feature access based on tier and feature type
            var hasAccess = featureName switch
            {
                // Basic features - available to all tiers
                "MemberDirectory" or "BasicEvents" or "BasicReporting" or "EventRSVP" or "WaitlistManagement" => true,

                // Grow+ features
                "EnhancedReporting" or "CustomFields" => club.Tier == "Grow" || IsExpandTier(club.Tier),

                // Advanced features - Expand tier only (includes engagement analytics)
                "AdvancedAnalytics" or "DataExport" or "WhiteLabeling" or "AdvancedEventManagement"
                    or "MemberSegmentation" or "APIAccess" or "Member Engagement Analytics"
                    or "MemberEngagementAnalytics" => IsExpandTier(club.Tier),

                // Unknown features - allow for Expand tier only (fail closed for security)
                _ => IsExpandTier(club.Tier)
            };

            var result = new TierValidationResult
            {
                HasAccess = hasAccess,
                CurrentTier = club.Tier,
                RequiredTier = requiredTier,
                Message = hasAccess ? "Access granted" : $"Feature '{featureName}' requires {requiredTier} tier or higher. Current tier: {club.Tier}"
            };

            if (!hasAccess)
            {
                _logger.LogWarning("Feature {FeatureName} not available for club {ClubId} with tier {Tier}",
                    featureName, clubId, club.Tier);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating feature access for club {ClubId}, feature {FeatureName}", clubId, featureName);
            return new TierValidationResult
            {
                HasAccess = false,
                Message = "Error validating feature access",
                CurrentTier = null,
                RequiredTier = null
            };
        }
    }

    /// <summary>
    /// Gets resource limits for a specific tier
    /// Used to prevent resource over-allocation and enforce tier boundaries
    /// </summary>
    public async Task<TierResourceLimits> GetTierResourceLimitsAsync(int clubId)
    {
        try
        {

            var club = await _context.Clubs
                .Where(c => c.Id == clubId)
                .Select(c => new { c.Tier })
                .FirstOrDefaultAsync();

            if (club == null)
            {
                _logger.LogWarning("Club {ClubId} not found, returning default Grow limits", clubId);
                return TierLimits["Grow"];
            }

            var tierKey = NormalizeTierKey(club.Tier);
            if (!TierLimits.ContainsKey(tierKey))
            {
                _logger.LogWarning("Unknown tier {Tier} for club {ClubId}, returning Grow limits", club.Tier, clubId);
                return TierLimits["Grow"];
            }

            var limits = TierLimits[tierKey];
            _logger.LogInformation("Retrieved tier limits for club {ClubId} tier {Tier}: maxQueries={MaxQueries}, maxCache={MaxCache}, backgroundProcessing={BackgroundProcessing}",
            clubId, club.Tier, limits.MaxAnalyticsQueries, limits.MaxCacheSize, limits.BackgroundProcessingEnabled);

            return limits;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting resource limits for club {ClubId}", clubId);
            return TierLimits["Grow"]; // Return Grow limits on error
        }
    }

    /// <summary>
    /// Validates a resource allocation request against tier limits
    /// CRITICAL: Prevents resource over-allocation and waste
    /// </summary>
    public async Task<bool> ValidateResourceAllocationAsync(ResourceAllocationRequest request)
    {
        try
        {
            _logger.LogInformation("Validating resource allocation for club {ClubId}: queries={Queries}, cache={Cache}, backgroundProcessing={BackgroundProcessing}",
            request.ClubId, request.AnalyticsQueries, request.CacheSize, request.BackgroundProcessing);

            var limits = await GetTierResourceLimitsAsync(request.ClubId);

            // Check analytics queries limit
            if (limits.MaxAnalyticsQueries != -1 && request.AnalyticsQueries > limits.MaxAnalyticsQueries)
            {
                _logger.LogWarning("Club {ClubId} exceeded analytics queries limit: requested={Requested}, limit={Limit}",
                    request.ClubId, request.AnalyticsQueries, limits.MaxAnalyticsQueries);
                throw new InvalidOperationException($"Analytics queries limit exceeded. Limit: {limits.MaxAnalyticsQueries}, Requested: {request.AnalyticsQueries}");
            }

            // Check cache size limit
            if (limits.MaxCacheSize != -1 && request.CacheSize > limits.MaxCacheSize)
            {
                _logger.LogWarning("Club {ClubId} exceeded cache size limit: requested={Requested}, limit={Limit}",
                    request.ClubId, request.CacheSize, limits.MaxCacheSize);
                throw new InvalidOperationException($"Cache size limit exceeded. Limit: {limits.MaxCacheSize}, Requested: {request.CacheSize}");
            }

            // Check background processing permission
            if (request.BackgroundProcessing && !limits.BackgroundProcessingEnabled)
            {
                _logger.LogWarning("Club {ClubId} requested background processing but tier doesn't allow it", request.ClubId);
                throw new InvalidOperationException("Background processing not available for this tier");
            }

            return true;
        }
        catch (Exception ex) when (!(ex is InvalidOperationException))
        {
            _logger.LogError(ex, "Error validating resource allocation for club {ClubId}", request.ClubId);
            return false;
        }
    }

    /// <summary>
    /// Gets tier-aware cache key prefix to prevent cache pollution between tiers
    /// </summary>
    public string GetTierAwareCacheKey(int clubId, string baseKey)
    {
        var club = _context.Clubs
            .Where(c => c.Id == clubId)
            .Select(c => new { c.Tier })
            .FirstOrDefault();

        var tier = club?.Tier ?? "Grow";
        return $"{tier}:{clubId}:{baseKey}";
    }

    /// <summary>
    /// Determines if background processing should be enabled for a club
    /// Part of CPU optimization - prevents unnecessary background jobs for basic tier
    /// </summary>
    public async Task<bool> ShouldEnableBackgroundProcessingAsync(int clubId)
    {
        try
        {
            var limits = await GetTierResourceLimitsAsync(clubId);
            var shouldEnable = limits.BackgroundProcessingEnabled;

            return shouldEnable;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking background processing eligibility for club {ClubId}", clubId);
            return false; // Disable background processing on error to save resources
        }
    }
}
