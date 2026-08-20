namespace GatherGrove.Application.DTOs.Chat;

/// <summary>
/// Response DTO for chat access check
/// </summary>
public class ChatAccessResponse
{
    /// <summary>
    /// Whether the user has access to the club chat
    /// </summary>
    public bool HasAccess { get; set; }

    /// <summary>
    /// Whether chat is enabled for the club
    /// </summary>
    public bool IsChatEnabled { get; set; }
}