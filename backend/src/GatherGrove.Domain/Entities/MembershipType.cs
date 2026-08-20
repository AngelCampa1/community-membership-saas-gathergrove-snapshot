using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a membership type within a club (e.g., Individual, Family, Student)
/// </summary>
public class MembershipType
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
    /// Name of the membership type (e.g., "Individual", "Family", "Student")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the membership type
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Dues amount for this membership type
    /// </summary>
    [Range(0.00, 999999.99, ErrorMessage = "Dues amount must be between 0.00 and 999999.99")]
    public decimal DuesAmount { get; set; }

    /// <summary>
    /// How often dues are collected (Monthly, Quarterly, Annually)
    /// </summary>
    public string DuesFrequency { get; set; } = "Monthly";

    /// <summary>
    /// Whether this membership type is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When this membership type was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this membership type was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the club this membership type belongs to
    /// </summary>
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Navigation property for members with this membership type
    /// </summary>
    public virtual ICollection<Member> Members { get; set; } = new List<Member>();
}