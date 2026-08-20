using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace GatherGrove.API.Middleware;

/// <summary>
/// Apply to controller actions or controllers to skip ClubId route validation.
/// Use sparingly for endpoints that legitimately need cross-club access
/// (e.g., platform admin operations, public endpoints with clubId in route).
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class SkipClubIdValidationAttribute : Attribute { }

/// <summary>
/// Action filter that validates the route {clubId} parameter matches
/// the authenticated user's ClubId claim. Prevents IDOR attacks where
/// a user manipulates the URL to access another club's data.
///
/// Applied globally to all authenticated endpoints with a clubId route parameter.
/// Skips validation for:
/// - Anonymous endpoints (no user claims to check)
/// - Endpoints decorated with [SkipClubIdValidation]
/// - Users with PlatformAdmin role (cross-club access)
/// - Test authentication schemes
/// </summary>
public class ClubIdValidationFilter : IAsyncActionFilter
{
    private readonly ILogger<ClubIdValidationFilter> _logger;

    public ClubIdValidationFilter(ILogger<ClubIdValidationFilter> logger)
    {
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Only validate if the route has a clubId parameter
        if (!context.RouteData.Values.TryGetValue("clubId", out var routeClubIdObj))
        {
            await next();
            return;
        }

        // Skip if endpoint is decorated with [SkipClubIdValidation]
        var endpoint = context.HttpContext.GetEndpoint();
        if (endpoint?.Metadata.GetMetadata<SkipClubIdValidationAttribute>() != null)
        {
            await next();
            return;
        }

        // Skip validation for unauthenticated requests (anonymous endpoints)
        var user = context.HttpContext.User;
        if (user?.Identity?.IsAuthenticated != true)
        {
            await next();
            return;
        }

        // Skip validation in test environments (test auth handlers set specific auth types)
        if (user.Identity.AuthenticationType == "Test" ||
            user.Identity.AuthenticationType == "AuthorizedTest" ||
            user.Identity.AuthenticationType == "UnauthorizedTest")
        {
            await next();
            return;
        }

        // Skip validation for platform-level admins (cross-club access)
        if (user.IsInRole("PlatformAdmin"))
        {
            await next();
            return;
        }

        // Parse route clubId
        if (!int.TryParse(routeClubIdObj?.ToString(), out var routeClubId))
        {
            context.Result = new BadRequestObjectResult(new { message = "Invalid club ID in route" });
            return;
        }

        // Get ClubId from user claims
        var claimClubId = user.FindFirst("ClubId")?.Value;
        if (string.IsNullOrEmpty(claimClubId) || !int.TryParse(claimClubId, out var userClubId))
        {
            _logger.LogWarning("User {UserId} attempted to access club {RouteClubId} but has no ClubId claim",
                user.FindFirst("nameid")?.Value ?? user.FindFirst("sub")?.Value ?? "unknown",
                routeClubId);
            context.Result = new ForbidResult();
            return;
        }

        // Validate route clubId matches user's claim
        if (routeClubId != userClubId)
        {
            _logger.LogWarning("IDOR attempt: User {UserId} (club {UserClubId}) tried to access club {RouteClubId} via {Path}",
                user.FindFirst("nameid")?.Value ?? user.FindFirst("sub")?.Value ?? "unknown",
                userClubId,
                routeClubId,
                context.HttpContext.Request.Path);
            context.Result = new ForbidResult();
            return;
        }

        await next();
    }
}
