namespace GatherGrove.Application.DTOs;

/// <summary>
/// Membership type information for display and selection
/// </summary>
public class MembershipTypeResponse
{
    /// <summary>
    /// Unique identifier for the membership type
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The club this membership type belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Name of the membership type
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the membership type
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Dues amount for this membership type
    /// </summary>
    public decimal DuesAmount { get; set; }

    /// <summary>
    /// How often dues are collected (Monthly, Quarterly, Annually)
    /// </summary>
    public string DuesFrequency { get; set; } = string.Empty;

    /// <summary>
    /// Whether this membership type is currently active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// When this membership type was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this membership type was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Number of members with this membership type
    /// </summary>
    public int MemberCount { get; set; }
}
