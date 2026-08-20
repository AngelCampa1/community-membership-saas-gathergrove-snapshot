using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Application.Authorization;
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.API.Tests.Helpers;

/// <summary>
/// Mock club authorization service for testing
/// </summary>
public class TestClubAuthorizationService :
    GatherGrove.Infrastructure.Services.IClubAuthorizationService,
    GatherGrove.Application.Services.IClubAuthorizationService
{
    public int? GetUserIdFromClaims(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("userId")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    public int? GetClubIdFromClaims(ClaimsPrincipal user)
    {
        var clubIdClaim = user.FindFirst("ClubId")?.Value;
        return int.TryParse(clubIdClaim, out var clubId) ? clubId : null;
    }

    public async Task<bool> CanAccessClubAsAdminAsync(ClaimsPrincipal user, int clubId)
    {
        var isAdmin = user.FindFirst("IsAdmin")?.Value == "true";
        var userClubId = GetClubIdFromClaims(user);
        return isAdmin && userClubId.HasValue && userClubId.Value == clubId;
    }

    public async Task<bool> CanAccessClubAsMemberAsync(ClaimsPrincipal user, int clubId)
    {
        var userClubId = GetClubIdFromClaims(user);
        return userClubId.HasValue && userClubId.Value == clubId;
    }

    public async Task<bool> CanAccessUserDataAsync(ClaimsPrincipal requestingUser, int targetUserId)
    {
        var requestingUserId = GetUserIdFromClaims(requestingUser);
        if (requestingUserId.HasValue && requestingUserId.Value == targetUserId)
        {
            return true; // User can access their own data
        }

        // Check if requesting user is admin
        var isAdmin = requestingUser.FindFirst("IsAdmin")?.Value == "true";
        return isAdmin;
    }

    public async Task<bool> ValidateClubAccessAsync(int clubId, int userId)
    {
        // For testing, allow access for users 1-10 to clubs 1-200
        return userId <= 10 && clubId <= 200;
    }

    public Task<bool> HasFeatureAccess(int clubId, string featureName)
    {
        // For testing, allow all feature access for clubs 1-200
        return Task.FromResult(clubId <= 200);
    }

    public async Task<bool> CanAccessUnlimitedFeaturesAsync(int clubId)
    {
        // For testing, allow unlimited features for test clubs
        return clubId <= 200;
    }

    public async Task<bool> CanAccessGrowFeaturesAsync(int clubId)
    {
        return true; // All clubs can access grow features
    }

    public async Task<string?> GetClubTierAsync(int clubId)
    {
        return clubId <= 200 ? "Unlimited" : "Basic";
    }

    public async Task<bool> IsUserAuthorizedForClubAsync(int userId, int clubId)
    {
        // For testing, allow access for users 1-10 to clubs 1-200
        return userId <= 10 && clubId <= 200;
    }

    public Task<bool> CanAccessMemberDataAsync(int memberId, int userId)
    {
        return Task.FromResult(userId <= 10);
    }
}

/// <summary>
/// Mock club tier service for testing
/// </summary>
public class TestClubTierService : IClubTierService
{
    public async Task<bool> HasUnlimitedTierAccess(int userId, int clubId)
    {
        // For testing, allow unlimited access for clubs <= 200
        return clubId <= 200;
    }

    public async Task<bool> HasGrowTierAccess(int userId, int clubId)
    {
        return true; // All test users have grow access
    }

    public async Task<string?> GetClubTier(int clubId)
    {
        return clubId <= 200 ? "Unlimited" : "Basic";
    }

    public async Task<bool> CanExportFinancialData(int userId, int clubId)
    {
        return true; // Allow all exports in tests
    }

    public async Task<bool> CanExportMemberData(int userId, int clubId)
    {
        return true; // Allow all exports in tests
    }

    public async Task<int> GetFinancialExportLimitAsync(int clubId)
    {
        return clubId <= 200 ? int.MaxValue : 20; // Unlimited for test clubs <= 200
    }

    public async Task<int> GetMemberExportLimitAsync(int clubId)
    {
        return clubId <= 200 ? int.MaxValue : 50; // Unlimited for test clubs <= 200
    }

    public async Task<bool> CanExportEventData(int userId, int clubId)
    {
        return true; // Allow all event exports in tests
    }
}

/// <summary>
/// Test authorization handler for AdminOnly policy
/// </summary>
public class TestAdminOnlyHandler : AuthorizationHandler<IAuthorizationRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        IAuthorizationRequirement requirement)
    {
        if (requirement.GetType().Name == "DenyAnonymousAuthorizationRequirement")
        {
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var isAdmin = context.User.FindFirst("IsAdmin")?.Value == "true";
                if (isAdmin)
                {
                    context.Succeed(requirement);
                }
            }
        }

        return Task.CompletedTask;
    }
}

/// <summary>
/// Test authorization handler for UnlimitedTierRequired policy
/// </summary>
public class TestUnlimitedTierHandler : AuthorizationHandler<IAuthorizationRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        IAuthorizationRequirement requirement)
    {
        if (requirement.GetType().Name.Contains("UnlimitedTier"))
        {
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var hasUnlimitedTier = context.User.FindFirst("UnlimitedTier")?.Value == "true";
                if (hasUnlimitedTier)
                {
                    context.Succeed(requirement);
                }
            }
        }

        return Task.CompletedTask;
    }
}
