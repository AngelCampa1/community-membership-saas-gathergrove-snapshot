namespace GatherGrove.Application.DTOs.Chat;

/// <summary>
/// Response DTO for chat message history with pagination
/// </summary>
public class ChatHistoryResponse
{
    /// <summary>
    /// List of chat messages
    /// </summary>
    public List<ChatMessageResponse> Messages { get; set; } = new();

    /// <summary>
    /// Whether there are more messages available (for pagination)
    /// </summary>
    public bool HasMore { get; set; }

    /// <summary>
    /// Total number of messages in the chat
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Timestamp of the oldest message in this response (for pagination)
    /// </summary>
    public DateTime? OldestMessageTimestamp { get; set; }
}