using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using GatherGrove.Infrastructure.Authorization.Requirements;
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.Infrastructure.Authorization.Handlers;

/// <summary>
/// Authorization handler for Unlimited tier requirement
/// Ensures users have access to premium analytics features
/// </summary>
public class UnlimitedTierRequirementHandler : AuthorizationHandler<UnlimitedTierRequirement>
{
    private readonly IClubTierService _clubTierService;
    private readonly ILogger<UnlimitedTierRequirementHandler> _logger;

    public UnlimitedTierRequirementHandler(
        IClubTierService clubTierService,
        ILogger<UnlimitedTierRequirementHandler> logger)
    {
        _clubTierService = clubTierService;
        _logger = logger;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        UnlimitedTierRequirement requirement)
    {
        try
        {
            // Get user ID from claims
            var userIdClaim = context.User.FindFirst("sub")?.Value ?? context.User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                _logger.LogWarning("Unable to determine user identity for unlimited tier check");
                context.Fail();
                return;
            }

            // Extract club ID from route data or query parameters
            var httpContext = context.Resource as Microsoft.AspNetCore.Http.HttpContext;
            var clubId = GetClubIdFromContext(httpContext);

            if (clubId == null)
            {
                _logger.LogWarning("Unable to determine club ID for unlimited tier check");
                context.Fail();
                return;
            }

            // Check if user has admin access to the club and if club has unlimited tier
            var hasAccess = await _clubTierService.HasUnlimitedTierAccess(userId, clubId.Value);

            if (hasAccess)
            {
                _logger.LogInformation("User {UserId} granted unlimited tier access for club {ClubId}", userId, clubId);
                context.Succeed(requirement);
            }
            else
            {
                _logger.LogInformation("User {UserId} denied unlimited tier access for club {ClubId}", userId, clubId);
                context.Fail();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during unlimited tier authorization check");
            context.Fail();
        }
    }

    private int? GetClubIdFromContext(Microsoft.AspNetCore.Http.HttpContext? httpContext)
    {
        if (httpContext == null) return null;

        // Try to get club ID from query parameters
        if (httpContext.Request.Query.TryGetValue("clubId", out var queryClubId))
        {
            if (int.TryParse(queryClubId.FirstOrDefault(), out var clubIdFromQuery))
            {
                return clubIdFromQuery;
            }
        }

        // For now, we'll rely on query parameters only
        // Route values and request body parsing would require additional dependencies
        return null;
    }
}