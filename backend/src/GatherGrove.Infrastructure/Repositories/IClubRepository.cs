using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for club data access
/// </summary>
public interface IClubRepository
{
    /// <summary>
    /// Gets a club and verifies the user is an admin
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The user ID to check admin access</param>
    /// <returns>The club if user is admin</returns>
    /// <exception cref="UnauthorizedAccessException">When user is not an admin</exception>
    /// <exception cref="KeyNotFoundException">When club not found</exception>
    Task<Club> GetClubWithAdminCheckAsync(int clubId, int userId);

    /// <summary>
    /// Gets a club by ID
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>The club or null if not found</returns>
    Task<Club?> GetByIdAsync(int clubId);
}