namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for club directory settings
/// </summary>
public class DirectorySettingsResponse
{
    /// <summary>
    /// Whether the member directory is enabled for this club
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// Array of member profile fields that can be optionally shared in the directory
    /// </summary>
    public string[] AllowedSharableFields { get; set; } = Array.Empty<string>();
}