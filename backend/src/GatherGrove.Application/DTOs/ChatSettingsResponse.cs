namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for club chat settings
/// </summary>
public class ChatSettingsResponse
{
    /// <summary>
    /// Whether the club chat feature is enabled
    /// </summary>
    public bool IsChatEnabled { get; set; }
}