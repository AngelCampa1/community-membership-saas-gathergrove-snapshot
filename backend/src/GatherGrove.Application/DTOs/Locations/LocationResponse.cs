namespace GatherGrove.Application.DTOs.Locations;

/// <summary>
/// Response containing location details
/// </summary>
public class LocationResponse
{
    /// <summary>
    /// Unique identifier for the location
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The parent club this location belongs to
    /// </summary>
    public int ParentClubId { get; set; }

    /// <summary>
    /// Name of the parent club
    /// </summary>
    public string ParentClubName { get; set; } = string.Empty;

    /// <summary>
    /// Name of the location/chapter
    /// </summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>
    /// Unique code for the location
    /// </summary>
    public string LocationCode { get; set; } = string.Empty;

    /// <summary>
    /// Street address of the location
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// City where the location is based
    /// </summary>
    public string? City { get; set; }

    /// <summary>
    /// State/Province where the location is based
    /// </summary>
    public string? State { get; set; }

    /// <summary>
    /// Country where the location is based
    /// </summary>
    public string? Country { get; set; }

    /// <summary>
    /// Timezone for the location
    /// </summary>
    public string? Timezone { get; set; }

    /// <summary>
    /// Contact email for this location
    /// </summary>
    public string? ContactEmail { get; set; }

    /// <summary>
    /// Contact phone for this location
    /// </summary>
    public string? ContactPhone { get; set; }

    /// <summary>
    /// Whether this location is currently active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Number of members at this location
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Number of events at this location
    /// </summary>
    public int EventCount { get; set; }

    /// <summary>
    /// Number of active admins for this location
    /// </summary>
    public int ActiveAdminCount { get; set; }

    /// <summary>
    /// When the location was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the location was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// JSON string for additional location-specific settings
    /// </summary>
    public string? SettingsJson { get; set; }
}

