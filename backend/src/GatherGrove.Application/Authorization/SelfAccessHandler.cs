using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;

namespace GatherGrove.Application.Authorization;

/// <summary>
/// Authorization handler for SelfAccessRequirement
/// </summary>
public class SelfAccessHandler : AuthorizationHandler<SelfAccessRequirement>
{
    private readonly IClubAuthorizationService _authService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<SelfAccessHandler> _logger;

    public SelfAccessHandler(
        IClubAuthorizationService authService,
        IHttpContextAccessor httpContextAccessor,
        ILogger<SelfAccessHandler> logger)
    {
        _authService = authService;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        SelfAccessRequirement requirement)
    {
        try
        {
            // Get current user ID
            var currentUserId = _authService.GetUserIdFromClaims(context.User);
            if (!currentUserId.HasValue)
            {
                _logger.LogWarning("No user ID found in claims for SelfAccess requirement");
                return Task.CompletedTask;
            }

            // For SelfAccess, we use a simplified approach that allows authenticated users 
            // with proper roles to pass this requirement. The actual authorization logic
            // for accessing specific user data is handled in controllers via 
            // ClubAuthorizationService.CanAccessUserDataAsync

            if (context.User.IsInRole("Admin") || context.User.IsInRole("Member"))
            {
                _logger.LogDebug("User {UserId} granted SelfAccess requirement",
                    currentUserId.Value);
                context.Succeed(requirement);
                return Task.CompletedTask;
            }
            else
            {
                _logger.LogWarning("User {UserId} denied access - no appropriate role for SelfAccess requirement",
                    currentUserId.Value);
            }

            // Authorization failed - don't call context.Fail() to allow other handlers
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during self-access authorization check");
            // Don't call context.Fail() to allow other handlers
        }

        return Task.CompletedTask;
    }
}