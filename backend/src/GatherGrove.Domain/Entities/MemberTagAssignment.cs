using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents the assignment of a tag to a member
/// </summary>
[Table("MemberTagAssignments")]
public class MemberTagAssignment
{
    /// <summary>
    /// Unique identifier for the assignment
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// The member being tagged
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// The tag being assigned
    /// </summary>
    [Required]
    public int TagId { get; set; }

    /// <summary>
    /// When this tag was assigned
    /// </summary>
    [Required]
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who assigned this tag
    /// </summary>
    [Required]
    public int AssignedByUserId { get; set; }

    /// <summary>
    /// Optional notes about the assignment
    /// </summary>
    [StringLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    [ForeignKey(nameof(MemberId))]
    public virtual Member Member { get; set; } = null!;

    [ForeignKey(nameof(TagId))]
    public virtual MemberTag Tag { get; set; } = null!;

    [ForeignKey(nameof(AssignedByUserId))]
    public virtual User AssignedByUser { get; set; } = null!;
}