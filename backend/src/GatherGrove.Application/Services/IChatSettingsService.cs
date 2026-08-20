using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Interface for managing club chat settings
/// </summary>
public interface IChatSettingsService
{
    /// <summary>
    /// Gets the chat settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <returns>Chat settings response</returns>
    Task<ChatSettingsResponse> GetChatSettingsAsync(int clubId, int userId);

    /// <summary>
    /// Updates the chat settings for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="userId">The requesting user ID for authorization</param>
    /// <param name="request">The updated chat settings</param>
    /// <returns>Updated chat settings response</returns>
    Task<ChatSettingsResponse> UpdateChatSettingsAsync(int clubId, int userId, UpdateChatSettingsRequest request);
}