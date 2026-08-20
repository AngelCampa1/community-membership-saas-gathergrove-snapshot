using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for club branding data access
/// </summary>
public interface IBrandingRepository
{
    /// <summary>
    /// Gets branding settings by club ID
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>The branding settings or null if not found</returns>
    Task<ClubBranding?> GetByClubIdAsync(int clubId);

    /// <summary>
    /// Adds new branding settings
    /// </summary>
    /// <param name="branding">The branding settings to add</param>
    /// <returns>The added branding settings</returns>
    Task<ClubBranding> AddAsync(ClubBranding branding);

    /// <summary>
    /// Updates existing branding settings
    /// </summary>
    /// <param name="branding">The branding settings to update</param>
    /// <returns>The updated branding settings</returns>
    Task<ClubBranding> UpdateAsync(ClubBranding branding);

    /// <summary>
    /// Deletes branding settings
    /// </summary>
    /// <param name="branding">The branding settings to delete</param>
    /// <returns>Task</returns>
    Task DeleteAsync(ClubBranding branding);

    /// <summary>
    /// Checks if branding settings exist for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>True if branding settings exist</returns>
    Task<bool> ExistsAsync(int clubId);
}