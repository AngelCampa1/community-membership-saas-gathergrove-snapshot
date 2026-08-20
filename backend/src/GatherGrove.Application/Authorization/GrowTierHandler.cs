using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;

namespace GatherGrove.Application.Authorization;

/// <summary>
/// Authorization handler for GrowTierRequirement
/// </summary>
public class GrowTierHandler : AuthorizationHandler<GrowTierRequirement>
{
    private readonly IClubAuthorizationService _authService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<GrowTierHandler> _logger;

    public GrowTierHandler(
        IClubAuthorizationService authService,
        IHttpContextAccessor httpContextAccessor,
        ILogger<GrowTierHandler> logger)
    {
        _authService = authService;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        GrowTierRequirement requirement)
    {
        try
        {
            // Skip checks and noisy logs for anonymous requests
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return;
            }

            // Get club ID from user claims (simpler approach than route parsing)
            var clubId = _authService.GetClubIdFromClaims(context.User);
            if (clubId.HasValue)
            {
                // Check if club has Grow tier access
                if (await _authService.CanAccessGrowFeaturesAsync(clubId.Value))
                {
                    _logger.LogDebug("Club {ClubId} granted Grow tier access for user {UserId}",
                        clubId.Value, _authService.GetUserIdFromClaims(context.User));
                    context.Succeed(requirement);
                    return;
                }
                else
                {
                    _logger.LogWarning("Club {ClubId} denied Grow tier access for user {UserId}",
                        clubId.Value, _authService.GetUserIdFromClaims(context.User));
                }
            }
            else
            {
                _logger.LogWarning("User {UserId} has no club ID claim for Grow tier requirement",
                    _authService.GetUserIdFromClaims(context.User));
            }

            // Authorization failed - don't call context.Fail() to allow other handlers
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Grow tier authorization check");
            // Don't call context.Fail() to allow other handlers
        }
    }
}