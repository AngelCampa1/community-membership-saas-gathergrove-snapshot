using GatherGrove.Application.DTOs.Chat;

namespace GatherGrove.Application.Services.Chat;

/// <summary>
/// Service interface for broadcasting chat messages in real-time
/// </summary>
public interface IChatBroadcastService
{
    /// <summary>
    /// Broadcasts a new chat message to all connected users in a club's chat room
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="message">The message to broadcast</param>
    /// <returns>Task representing the broadcast operation</returns>
    Task BroadcastMessageToClubAsync(int clubId, ChatMessageResponse message);
}