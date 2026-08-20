using System.Security.Claims;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling club-specific authorization checks
/// </summary>
public interface IClubAuthorizationService
{
    /// <summary>
    /// Verifies if a user can access a specific club as an admin
    /// </summary>
    /// <param name="user">The authenticated user</param>
    /// <param name="clubId">The club ID to verify access for</param>
    /// <returns>True if user is admin of the specified club</returns>
    Task<bool> CanAccessClubAsAdminAsync(ClaimsPrincipal user, int clubId);

    /// <summary>
    /// Verifies if a user can access a specific club as a member (admin or member role)
    /// </summary>
    /// <param name="user">The authenticated user</param>
    /// <param name="clubId">The club ID to verify access for</param>
    /// <returns>True if user is admin or member of the specified club</returns>
    Task<bool> CanAccessClubAsMemberAsync(ClaimsPrincipal user, int clubId);

    /// <summary>
    /// Verifies if a club has access to Grow tier features
    /// </summary>
    /// <param name="clubId">The club ID to check</param>
    /// <returns>True if club has Grow tier</returns>
    Task<bool> CanAccessGrowFeaturesAsync(int clubId);

    /// <summary>
    /// Verifies if a club has access to Expand tier features
    /// </summary>
    /// <param name="clubId">The club ID to check</param>
    /// <returns>True if club has Expand tier</returns>
    Task<bool> CanAccessUnlimitedFeaturesAsync(int clubId);

    /// <summary>
    /// Verifies if a user can access another user's data (self or admin)
    /// </summary>
    /// <param name="requestingUser">The user making the request</param>
    /// <param name="targetUserId">The user ID whose data is being accessed</param>
    /// <returns>True if access is allowed</returns>
    Task<bool> CanAccessUserDataAsync(ClaimsPrincipal requestingUser, int targetUserId);

    /// <summary>
    /// Gets the club ID from user claims
    /// </summary>
    /// <param name="user">The authenticated user</param>
    /// <returns>Club ID if found, null otherwise</returns>
    int? GetClubIdFromClaims(ClaimsPrincipal user);

    /// <summary>
    /// Gets the user ID from user claims
    /// </summary>
    /// <param name="user">The authenticated user</param>
    /// <returns>User ID if found, null otherwise</returns>
    int? GetUserIdFromClaims(ClaimsPrincipal user);

    /// <summary>
    /// Validates if a user has access to a specific club
    /// </summary>
    /// <param name="clubId">The club ID to validate access for</param>
    /// <param name="userId">The user ID to validate</param>
    /// <returns>True if user has access to the club</returns>
    Task<bool> ValidateClubAccessAsync(int clubId, int userId);

    /// <summary>
    /// Validates if a club has access to a specific feature
    /// </summary>
    /// <param name="clubId">The club ID to check</param>
    /// <param name="featureName">The feature name to validate access for</param>
    /// <returns>True if club has access to the feature</returns>
    Task<bool> HasFeatureAccess(int clubId, string featureName);

    /// <summary>
    /// Validates if a user is authorized for a specific club
    /// </summary>
    /// <param name="userId">The user ID to check</param>
    /// <param name="clubId">The club ID to check authorization for</param>
    /// <returns>True if user is authorized for the club</returns>
    Task<bool> IsUserAuthorizedForClubAsync(int userId, int clubId);

    /// <summary>
    /// Validates if a user can access another member's data (self access or same club admin/member)
    /// </summary>
    /// <param name="memberId">The member ID whose data is being accessed</param>
    /// <param name="userId">The user ID making the request</param>
    /// <returns>True if access is allowed</returns>
    Task<bool> CanAccessMemberDataAsync(int memberId, int userId);
}