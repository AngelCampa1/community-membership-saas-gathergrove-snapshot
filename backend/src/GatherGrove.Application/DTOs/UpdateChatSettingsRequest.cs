namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for updating club chat settings
/// </summary>
public class UpdateChatSettingsRequest
{
    /// <summary>
    /// Whether the club chat feature should be enabled
    /// </summary>
    public bool IsChatEnabled { get; set; }
}