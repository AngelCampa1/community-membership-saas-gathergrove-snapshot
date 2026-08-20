namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents the relationship between a user and a location they administer
/// </summary>
public class LocationAdmin
{
    /// <summary>
    /// Unique identifier for the location admin relationship
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The location being administered
    /// </summary>
    public int LocationId { get; set; }

    /// <summary>
    /// The user who is the admin
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Permission level for this admin at this location
    /// </summary>
    public LocationPermissionLevel PermissionLevel { get; set; }

    /// <summary>
    /// When this admin relationship was created
    /// </summary>
    public DateTime AssignedAt { get; set; }

    /// <summary>
    /// User ID of who assigned this admin (null for automatic migrations)
    /// </summary>
    public int? AssignedBy { get; set; }

    /// <summary>
    /// Navigation property to the location
    /// </summary>
    public virtual ClubLocation Location { get; set; } = null!;

    /// <summary>
    /// Navigation property to the user
    /// </summary>
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Navigation property to the user who assigned this admin
    /// </summary>
    public virtual User? AssignedByUser { get; set; }
}

