namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a physical location or chapter of a club
/// </summary>
public class ClubLocation
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
    /// Name of the location/chapter
    /// </summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>
    /// Unique code for the location (e.g., "NYC", "LA-WEST")
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
    /// Timezone for the location (e.g., "America/New_York")
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
    public bool IsActive { get; set; } = true;

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

    /// <summary>
    /// Navigation property to the parent club
    /// </summary>
    public virtual Club ParentClub { get; set; } = null!;

    /// <summary>
    /// Navigation property to members at this location
    /// </summary>
    public virtual ICollection<Member> Members { get; set; } = new List<Member>();

    /// <summary>
    /// Navigation property to events at this location
    /// </summary>
    public virtual ICollection<Event> EventsAtLocation { get; set; } = new List<Event>();

    /// <summary>
    /// Navigation property to location admins
    /// </summary>
    public virtual ICollection<LocationAdmin> LocationAdmins { get; set; } = new List<LocationAdmin>();

    /// <summary>
    /// Navigation property to location branding
    /// </summary>
    public virtual LocationBranding? LocationBranding { get; set; }
}

