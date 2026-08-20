using System.Security.Claims;

namespace GatherGrove.Infrastructure.Services;

/// <summary>
/// Service for handling club-specific authorization checks
/// Infrastructure-specific version to break circular dependency
/// </summary>
public interface IClubAuthorizationService
{
    /// <summary>
    /// Verifies if a club has access to Expand tier features
    /// </summary>
    /// <param name="clubId">The club ID to check</param>
    /// <returns>True if club has Expand tier</returns>
    Task<bool> CanAccessUnlimitedFeaturesAsync(int clubId);

    /// <summary>
    /// Validates if a club has access to a specific feature
    /// </summary>
    /// <param name="clubId">The club ID to check</param>
    /// <param name="featureName">The feature name to validate access for</param>
    /// <returns>True if club has access to the feature</returns>
    Task<bool> HasFeatureAccess(int clubId, string featureName);

    /// <summary>
    /// Validates club access for a specific user
    /// </summary>
    Task<bool> ValidateClubAccessAsync(int clubId, int userId);

    /// <summary>
    /// Gets user ID from claims principal
    /// </summary>
    int? GetUserIdFromClaims(ClaimsPrincipal user);

    /// <summary>
    /// Gets club ID from claims principal
    /// </summary>
    int? GetClubIdFromClaims(ClaimsPrincipal user);

    /// <summary>
    /// Checks if user can access club as admin
    /// </summary>
    Task<bool> CanAccessClubAsAdminAsync(ClaimsPrincipal user, int clubId);

    /// <summary>
    /// Checks if user can access club as member
    /// </summary>
    Task<bool> CanAccessClubAsMemberAsync(ClaimsPrincipal user, int clubId);

    /// <summary>
    /// Checks if requesting user can access target user data
    /// </summary>
    Task<bool> CanAccessUserDataAsync(ClaimsPrincipal requestingUser, int targetUserId);

    /// <summary>
    /// Checks if club can access grow tier features
    /// </summary>
    Task<bool> CanAccessGrowFeaturesAsync(int clubId);

    /// <summary>
    /// Gets the club tier
    /// </summary>
    Task<string?> GetClubTierAsync(int clubId);

    /// <summary>
    /// Checks if user is authorized for a specific club
    /// </summary>
    /// <param name="userId">User ID to check</param>
    /// <param name="clubId">Club ID to check access for</param>
    /// <returns>True if user is authorized for the club</returns>
    Task<bool> IsUserAuthorizedForClubAsync(int userId, int clubId);
}