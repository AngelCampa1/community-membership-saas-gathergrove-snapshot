using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;

namespace GatherGrove.Application.Authorization;

/// <summary>
/// Authorization handler for ClubAdminRequirement
/// </summary>
public class ClubAdminHandler : AuthorizationHandler<ClubAdminRequirement>
{
    private readonly IClubAuthorizationService _authService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<ClubAdminHandler> _logger;

    public ClubAdminHandler(
        IClubAuthorizationService authService,
        IHttpContextAccessor httpContextAccessor,
        ILogger<ClubAdminHandler> logger)
    {
        _authService = authService;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ClubAdminRequirement requirement)
    {
        try
        {
            // Get club ID from user claims
            var clubId = _authService.GetClubIdFromClaims(context.User);
            if (clubId.HasValue)
            {
                // Use proper async authorization check
                if (await _authService.CanAccessClubAsAdminAsync(context.User, clubId.Value))
                {
                    _logger.LogDebug("User {UserId} granted admin access to club {ClubId} for ClubAdmin requirement",
                        _authService.GetUserIdFromClaims(context.User), clubId.Value);
                    context.Succeed(requirement);
                    return;
                }
                else
                {
                    _logger.LogWarning("User {UserId} denied admin access to club {ClubId} for ClubAdmin requirement",
                        _authService.GetUserIdFromClaims(context.User), clubId.Value);
                }
            }
            else
            {
                _logger.LogWarning("User {UserId} has no club ID claim for ClubAdmin requirement",
                    _authService.GetUserIdFromClaims(context.User));
            }

            // Authorization failed - don't call context.Fail() to allow other handlers
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during club admin authorization check");
            // Don't call context.Fail() to allow other handlers
        }
    }
}