using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a tag that can be assigned to members for categorization
/// </summary>
[Table("MemberTags")]
public class MemberTag
{
    /// <summary>
    /// Unique identifier for the tag
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// The club this tag belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// The name/label of the tag
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the tag
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Color for the tag in hex format (e.g., #007bff)
    /// </summary>
    [Required]
    [StringLength(7)]
    public string Color { get; set; } = "#007bff";

    /// <summary>
    /// Whether the tag is visible in the UI
    /// </summary>
    [Required]
    public bool IsVisible { get; set; } = true;

    /// <summary>
    /// Display order for sorting tags
    /// </summary>
    [Required]
    public int DisplayOrder { get; set; } = 0;

    /// <summary>
    /// When this tag was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who created this tag
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// When this tag was last updated
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(ClubId))]
    public virtual Club Club { get; set; } = null!;

    [ForeignKey(nameof(CreatedByUserId))]
    public virtual User CreatedByUser { get; set; } = null!;

    /// <summary>
    /// Collection of member assignments for this tag
    /// </summary>
    public virtual ICollection<MemberTagAssignment> MemberAssignments { get; set; } = new List<MemberTagAssignment>();
}