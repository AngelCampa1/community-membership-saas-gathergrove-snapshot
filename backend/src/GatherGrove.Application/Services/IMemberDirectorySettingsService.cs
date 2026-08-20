using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service interface for managing member directory settings (Story 29)
/// </summary>
public interface IMemberDirectorySettingsService
{
    /// <summary>
    /// Gets the directory settings for the current member
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>Member directory settings</returns>
    Task<MemberDirectorySettingsResponse> GetMemberDirectorySettingsAsync(int userId);

    /// <summary>
    /// Updates the directory settings for the current member
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="request">The updated settings</param>
    /// <returns>Updated member directory settings</returns>
    Task<MemberDirectorySettingsResponse> UpdateMemberDirectorySettingsAsync(int userId, UpdateMemberDirectorySettingsRequest request);
}