namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for updating member directory settings (Story 29)
/// </summary>
public class UpdateMemberDirectorySettingsRequest
{
    /// <summary>
    /// Whether this member should be listed in the directory
    /// </summary>
    public bool IsListed { get; set; }

    /// <summary>
    /// Array of profile fields this member wants to make visible in the directory
    /// Must be a subset of the admin-allowed fields
    /// </summary>
    public string[] VisibleFields { get; set; } = Array.Empty<string>();
}