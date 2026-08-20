using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;

namespace GatherGrove.Application.Authorization;

/// <summary>
/// Authorization handler for UnlimitedTierRequirement
/// </summary>
public class UnlimitedTierHandler : AuthorizationHandler<UnlimitedTierRequirement>
{
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<UnlimitedTierHandler> _logger;

    public UnlimitedTierHandler(
        IClubAuthorizationService authService,
        ILogger<UnlimitedTierHandler> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        UnlimitedTierRequirement requirement)
    {
        try
        {
            // Skip checks for anonymous requests
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return;
            }

            // Get club ID from user claims
            var clubId = _authService.GetClubIdFromClaims(context.User);
            if (clubId.HasValue)
            {
                // Check if club has Expand tier access
                if (await _authService.CanAccessUnlimitedFeaturesAsync(clubId.Value))
                {
                    _logger.LogDebug("Club {ClubId} granted Expand tier access for user {UserId}",
                        clubId.Value, _authService.GetUserIdFromClaims(context.User));
                    context.Succeed(requirement);
                    return;
                }
                else
                {
                    _logger.LogWarning("Club {ClubId} denied Expand tier access for user {UserId}",
                        clubId.Value, _authService.GetUserIdFromClaims(context.User));
                }
            }
            else
            {
                _logger.LogWarning("User {UserId} has no club ID claim for Expand tier requirement",
                    _authService.GetUserIdFromClaims(context.User));
            }

            // Authorization failed - don't call context.Fail() to allow other handlers
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Expand tier authorization check");
            // Don't call context.Fail() to allow other handlers
        }
    }
}
