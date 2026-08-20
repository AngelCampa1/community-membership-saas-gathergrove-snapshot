using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using GatherGrove.Application.Services.TierValidation;
using GatherGrove.Application.Services;

namespace GatherGrove.API.Middleware;

/// <summary>
/// Middleware that validates tier access for API endpoints
/// Prevents unauthorized access to Expand features and blocks resource waste
/// Key component of resource optimization strategy
/// </summary>
public class TierValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TierValidationMiddleware> _logger;

    // Endpoints that require Expand tier access
    private static readonly HashSet<string> UnlimitedEndpoints = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/analytics/advanced",
        "/api/analytics/engagement-trends",
        "/api/analytics/cohort-analysis",
        "/api/analytics/financial-roi",
        "/api/analytics/member-segmentation",
        "/api/analytics/export",
        "/api/branding",
        "/api/data-export",
        "/api/advanced-features"
    };

    // Endpoints that should be blocked entirely for basic tier to save resources
    private static readonly HashSet<string> BlockedBasicTierEndpoints = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/analytics/background-processing",
        "/api/advanced-analytics",
        "/api/member-segmentation",
        "/api/cohort-analysis"
    };

    // Endpoints that require at least Grow tier (blocked for Seed and below)
    private static readonly HashSet<string> BlockedSeedTierEndpoints = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/chat"
    };

    public TierValidationMiddleware(RequestDelegate next, ILogger<TierValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ITierGateService tierGateService, IClubAuthorizationService clubAuthService)
    {
        try
        {
            // Skip validation for non-API endpoints
            if (!context.Request.Path.StartsWithSegments("/api"))
            {
                await _next(context);
                return;
            }

            // Extract club ID from route or claims
            var clubId = ExtractClubId(context);
            if (!clubId.HasValue)
            {
                // If no club ID available, continue to next middleware
                // Authorization middleware will handle authentication
                await _next(context);
                return;
            }

            var requestPath = context.Request.Path.ToString();
            var method = context.Request.Method;

            _logger.LogDebug("Tier validation for club {ClubId}, path {Path}, method {Method}",
                clubId.Value, requestPath, method);

            // Check if endpoint requires Expand tier
            if (RequiresUnlimitedTier(requestPath))
            {
                var hasUnlimitedAccess = await tierGateService.ValidateUnlimitedAccessAsync(clubId.Value);
                if (!hasUnlimitedAccess)
                {
                    _logger.LogWarning("Club {ClubId} attempted to access Expand endpoint {Path} without proper tier",
                        clubId.Value, requestPath);

                    await WriteErrorResponse(context, 403, "You need Expand for this feature");
                    return;
                }
            }

            // Check if endpoint is completely blocked for basic tier
            if (IsBlockedForBasicTier(requestPath))
            {
                var isBasicTier = !await tierGateService.ValidateUnlimitedAccessAsync(clubId.Value);
                if (isBasicTier)
                {
                    _logger.LogInformation("Blocked basic tier club {ClubId} from accessing resource-intensive endpoint {Path}",
                        clubId.Value, requestPath);

                    await WriteErrorResponse(context, 403, "This feature is not available for your subscription tier");
                    return;
                }
            }

            // Check if endpoint requires at least Grow tier (blocked for Seed and below)
            if (IsBlockedForSeedTier(requestPath))
            {
                var hasGrowAccess = await tierGateService.ValidateGrowOrAboveAccessAsync(clubId.Value);
                if (!hasGrowAccess)
                {
                    _logger.LogInformation("Blocked Seed tier club {ClubId} from accessing Grow+ endpoint {Path}",
                        clubId.Value, requestPath);

                    await WriteErrorResponse(context, 403, "This feature requires a Grow or higher tier subscription");
                    return;
                }
            }

            // Add tier information to context for downstream components
            context.Items["ClubId"] = clubId.Value;
            context.Items["TierValidated"] = true;

            // Validate resource limits for specific operations
            if (method == "POST" && IsResourceIntensiveOperation(requestPath))
            {
                var resourceLimits = await tierGateService.GetTierResourceLimitsAsync(clubId.Value);
                context.Items["TierResourceLimits"] = resourceLimits;
            }

            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in tier validation middleware");

            // Continue to next middleware on error to avoid blocking legitimate requests
            // But log the error for monitoring
            await _next(context);
        }
    }

    /// <summary>
    /// Extracts club ID from various sources (route, claims, query parameters)
    /// </summary>
    private int? ExtractClubId(HttpContext context)
    {
        // Try route values first
        if (context.Request.RouteValues.TryGetValue("clubId", out var routeClubId))
        {
            if (int.TryParse(routeClubId?.ToString(), out var clubIdFromRoute))
                return clubIdFromRoute;
        }

        // Try claims
        var clubIdClaim = context.User?.FindFirst("ClubId")?.Value;
        if (!string.IsNullOrEmpty(clubIdClaim) && int.TryParse(clubIdClaim, out var clubIdFromClaims))
        {
            return clubIdFromClaims;
        }

        // Try query parameters
        if (context.Request.Query.TryGetValue("clubId", out var queryClubId))
        {
            if (int.TryParse(queryClubId.FirstOrDefault(), out var clubIdFromQuery))
                return clubIdFromQuery;
        }

        return null;
    }

    /// <summary>
    /// Checks if the endpoint requires Expand tier access
    /// </summary>
    private bool RequiresUnlimitedTier(string path)
    {
        return UnlimitedEndpoints.Any(endpoint => path.StartsWith(endpoint, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Checks if the endpoint is blocked for basic tier to save resources
    /// </summary>
    private bool IsBlockedForBasicTier(string path)
    {
        return BlockedBasicTierEndpoints.Any(endpoint => path.StartsWith(endpoint, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Checks if the endpoint requires Grow tier or above (blocked for Seed and below)
    /// </summary>
    private bool IsBlockedForSeedTier(string path)
    {
        return BlockedSeedTierEndpoints.Any(endpoint => path.StartsWith(endpoint, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Checks if the operation is resource intensive and needs limit validation
    /// </summary>
    private bool IsResourceIntensiveOperation(string path)
    {
        var resourceIntensivePaths = new[]
        {
            "/api/analytics",
            "/api/reports/generate",
            "/api/exports",
            "/api/data-processing"
        };

        return resourceIntensivePaths.Any(intensivePath =>
            path.StartsWith(intensivePath, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Writes error response with proper JSON formatting
    /// </summary>
    private async Task WriteErrorResponse(HttpContext context, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var response = new
        {
            error = message,
            statusCode = statusCode,
            timestamp = DateTime.UtcNow,
            path = context.Request.Path.ToString()
        };

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}

/// <summary>
/// Extension method for registering tier validation middleware
/// </summary>
public static class TierValidationMiddlewareExtensions
{
    public static IApplicationBuilder UseTierValidation(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<TierValidationMiddleware>();
    }
}
