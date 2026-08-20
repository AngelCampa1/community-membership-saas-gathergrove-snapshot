using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for alert configuration data access
/// </summary>
public interface IAlertConfigRepository
{
    /// <summary>
    /// Gets alert configuration by club ID
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>The alert configuration or null if not found</returns>
    Task<AlertConfiguration?> GetByClubIdAsync(int clubId);

    /// <summary>
    /// Adds new alert configuration
    /// </summary>
    /// <param name="config">The alert configuration to add</param>
    /// <returns>The added alert configuration</returns>
    Task<AlertConfiguration> AddAsync(AlertConfiguration config);

    /// <summary>
    /// Updates existing alert configuration
    /// </summary>
    /// <param name="config">The alert configuration to update</param>
    /// <returns>The updated alert configuration</returns>
    Task<AlertConfiguration> UpdateAsync(AlertConfiguration config);

    /// <summary>
    /// Checks if alert configuration exists for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>True if alert configuration exists</returns>
    Task<bool> ExistsAsync(int clubId);
}
