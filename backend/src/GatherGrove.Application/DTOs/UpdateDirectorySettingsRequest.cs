namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for updating club directory settings
/// </summary>
public class UpdateDirectorySettingsRequest
{
    /// <summary>
    /// Whether the member directory should be enabled for this club
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// Array of member profile fields that can be optionally shared in the directory
    /// </summary>
    public string[] AllowedSharableFields { get; set; } = Array.Empty<string>();
}