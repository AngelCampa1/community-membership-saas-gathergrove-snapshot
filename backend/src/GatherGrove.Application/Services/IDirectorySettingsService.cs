using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service interface for managing club directory settings
/// </summary>
public interface IDirectorySettingsService
{
    /// <summary>
    /// Gets the directory settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Directory settings response</returns>
    Task<DirectorySettingsResponse> GetDirectorySettingsAsync(int clubId, int userId);

    /// <summary>
    /// Updates the directory settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The updated directory settings</param>
    /// <returns>Updated directory settings response</returns>
    Task<DirectorySettingsResponse> UpdateDirectorySettingsAsync(int clubId, int userId, UpdateDirectorySettingsRequest request);
}