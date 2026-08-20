using GatherGrove.Application.DTOs.Alerts;

namespace GatherGrove.Application.Services.Alerts;

/// <summary>
/// Service interface for managing club alert configurations
/// </summary>
public interface IAlertConfigService
{
    /// <summary>
    /// Gets the alert configuration for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID</param>
    /// <returns>The alert configuration</returns>
    /// <exception cref="KeyNotFoundException">Thrown when configuration not found</exception>
    /// <exception cref="UnauthorizedAccessException">Thrown when user not authorized</exception>
    Task<AlertConfigResponse> GetAlertConfigAsync(int clubId, int userId);

    /// <summary>
    /// Creates a new alert configuration for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID</param>
    /// <param name="request">The configuration to create</param>
    /// <returns>The created configuration</returns>
    /// <exception cref="InvalidOperationException">Thrown when configuration already exists</exception>
    /// <exception cref="UnauthorizedAccessException">Thrown when user not authorized</exception>
    Task<AlertConfigResponse> CreateAlertConfigAsync(int clubId, int userId, CreateAlertConfigRequest request);

    /// <summary>
    /// Updates the alert configuration for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID</param>
    /// <param name="request">The updated configuration</param>
    /// <returns>The updated configuration</returns>
    /// <exception cref="KeyNotFoundException">Thrown when configuration not found</exception>
    /// <exception cref="UnauthorizedAccessException">Thrown when user not authorized</exception>
    /// <exception cref="InvalidOperationException">Thrown when update fails validation</exception>
    Task<AlertConfigResponse> UpdateAlertConfigAsync(int clubId, int userId, UpdateAlertConfigRequest request);
}
