using GatherGrove.Application.DTOs.Chat;

namespace GatherGrove.Application.Services.Chat;

/// <summary>
/// Service interface for chat functionality
/// </summary>
public interface IChatService
{
    /// <summary>
    /// Retrieves chat message history for a club with pagination
    /// </summary>
    /// <param name="clubId">The club ID to get messages for</param>
    /// <param name="currentUserId">The current user's ID (for authorization)</param>
    /// <param name="before">Get messages before this timestamp (for pagination)</param>
    /// <param name="limit">Maximum number of messages to return</param>
    /// <returns>Chat history response with messages and pagination info</returns>
    Task<ChatHistoryResponse> GetChatHistoryAsync(int clubId, int currentUserId, DateTime? before = null, int limit = 50);

    /// <summary>
    /// Sends a new chat message to the club
    /// </summary>
    /// <param name="clubId">The club ID to send the message to</param>
    /// <param name="currentUserId">The current user's ID (sender)</param>
    /// <param name="request">The message content to send</param>
    /// <returns>The sent message details</returns>
    Task<ChatMessageResponse> SendMessageAsync(int clubId, int currentUserId, SendMessageRequest request);

    /// <summary>
    /// Checks if chat is enabled for the given club
    /// </summary>
    /// <param name="clubId">The club ID to check</param>
    /// <returns>True if chat is enabled, false otherwise</returns>
    Task<bool> IsChatEnabledAsync(int clubId);

    /// <summary>
    /// Validates that the user has access to the club's chat
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="currentUserId">The current user's ID</param>
    /// <returns>True if user has access, false otherwise</returns>
    Task<bool> HasChatAccessAsync(int clubId, int currentUserId);
}