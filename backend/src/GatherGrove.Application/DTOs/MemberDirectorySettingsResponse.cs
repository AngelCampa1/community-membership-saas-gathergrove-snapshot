namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for member directory settings (Story 29)
/// </summary>
public class MemberDirectorySettingsResponse
{
    /// <summary>
    /// Whether the club directory is enabled by the admin
    /// </summary>
    public bool ClubDirectoryEnabled { get; set; }

    /// <summary>
    /// Array of profile fields that the admin allows to be shared in the directory
    /// </summary>
    public string[] AdminAllowedSharableFields { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Whether this member is listed in the directory
    /// </summary>
    public bool IsListed { get; set; }

    /// <summary>
    /// Array of fields this member has chosen to make visible in the directory
    /// </summary>
    public string[] VisibleFields { get; set; } = Array.Empty<string>();
}