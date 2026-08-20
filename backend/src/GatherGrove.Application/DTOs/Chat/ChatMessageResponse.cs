namespace GatherGrove.Application.DTOs.Chat;

/// <summary>
/// Response DTO for chat message data
/// </summary>
public class ChatMessageResponse
{
    /// <summary>
    /// Unique identifier for the chat message
    /// </summary>
    public int ChatMessageId { get; set; }

    /// <summary>
    /// ID of the club this message belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// ID of the user who sent the message
    /// </summary>
    public int SenderUserId { get; set; }

    /// <summary>
    /// Full name of the user who sent the message
    /// </summary>
    public string SenderName { get; set; } = string.Empty;

    /// <summary>
    /// The text content of the message
    /// </summary>
    public string MessageContent { get; set; } = string.Empty;

    /// <summary>
    /// When the message was sent (UTC)
    /// </summary>
    public DateTime SentAt { get; set; }
}