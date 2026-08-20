using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace GatherGrove.Application.Extensions;

/// <summary>
/// Extension methods for IAuthorizationService
/// </summary>
public static class AuthorizationServiceExtensions
{
    /// <summary>
    /// Gets user claims asynchronously
    /// </summary>
    public static async Task<IEnumerable<Claim>> GetUserClaimsAsync(this IAuthorizationService authorizationService, ClaimsPrincipal user)
    {
        // Return user claims from the principal
        return await Task.FromResult(user.Claims);
    }

    /// <summary>
    /// Gets user claims by user ID
    /// </summary>
    public static async Task<IEnumerable<Claim>> GetUserClaimsAsync(this IAuthorizationService authorizationService, int userId)
    {
        // Placeholder implementation - would typically query user store
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, "User")
        };

        return await Task.FromResult(claims);
    }
}