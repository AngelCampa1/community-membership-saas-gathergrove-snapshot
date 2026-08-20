using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a custom personalization token for club communications
/// </summary>
[Table("PersonalizationTokens")]
public class PersonalizationToken
{
    /// <summary>
    /// Unique identifier for the personalization token
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// The club this token belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Token name (e.g., "member_name", "club_name")
    /// </summary>
    [Required]
    [StringLength(100)]
    public string TokenName { get; set; } = string.Empty;

    /// <summary>
    /// Display name for the token
    /// </summary>
    [Required]
    [StringLength(200)]
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Description of what the token does
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Token category (Member, Club, Event, Custom)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Category { get; set; } = "Custom";

    /// <summary>
    /// Data source for the token value (Member.FullName, Club.Name, Custom, etc.)
    /// </summary>
    [StringLength(200)]
    public string? DataSource { get; set; }

    /// <summary>
    /// Default value if token cannot be resolved
    /// </summary>
    [StringLength(500)]
    public string? DefaultValue { get; set; }

    /// <summary>
    /// Whether this is a system-provided token
    /// </summary>
    [Required]
    public bool IsSystemToken { get; set; } = false;

    /// <summary>
    /// Whether the token is currently active
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Sort order for display
    /// </summary>
    [Required]
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// User who created this token
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// When this token was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this token was last updated
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the club
    /// </summary>
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Navigation property for the user who created this token
    /// </summary>
    public virtual User CreatedByUser { get; set; } = null!;
}

