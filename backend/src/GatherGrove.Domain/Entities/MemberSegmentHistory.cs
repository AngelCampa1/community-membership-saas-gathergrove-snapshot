using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Tracks changes to member segment assignments
/// </summary>
[Table("MemberSegmentHistory")]
public class MemberSegmentHistory
{
    /// <summary>
    /// Unique identifier for the history entry
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// The member whose segment membership changed
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// The segment that was added or removed
    /// </summary>
    [Required]
    public int SegmentId { get; set; }

    /// <summary>
    /// The action that was performed (Added, Removed, Recalculated)
    /// </summary>
    [Required]
    [StringLength(20)]
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Reason for the change
    /// </summary>
    [StringLength(200)]
    public string? Reason { get; set; }

    /// <summary>
    /// When the change occurred
    /// </summary>
    [Required]
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who made the change (null for system changes)
    /// </summary>
    public int? ChangedByUserId { get; set; }

    // Navigation properties
    [ForeignKey(nameof(MemberId))]
    public virtual Member Member { get; set; } = null!;

    [ForeignKey(nameof(SegmentId))]
    public virtual MemberSegment Segment { get; set; } = null!;

    [ForeignKey(nameof(ChangedByUserId))]
    public virtual User? ChangedByUser { get; set; }
}