namespace GatherGrove.Application.Services.Interfaces;

/// <summary>
/// Service interface for club-related operations
/// </summary>
public interface IClubService
{
    /// <summary>
    /// Check if a user has Expand tier access for a specific club
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="clubId">Club ID</param>
    /// <returns>True if user has Expand tier access</returns>
    Task<bool> HasUnlimitedTierAccess(int userId, int clubId);

    /// <summary>
    /// Check if a user is an admin for a specific club
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="clubId">Club ID</param>
    /// <returns>True if user is a club admin</returns>
    Task<bool> IsClubAdmin(int userId, int clubId);

    /// <summary>
    /// Check if a user is a member of a specific club
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="clubId">Club ID</param>
    /// <returns>True if user is a club member</returns>
    Task<bool> IsClubMember(int userId, int clubId);

    /// <summary>
    /// Get club subscription tier
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>Subscription tier name</returns>
    Task<string> GetClubSubscriptionTier(int clubId);
}