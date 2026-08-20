using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents the relationship between a member segment and its members
/// This is a bridge table for the many-to-many relationship
/// </summary>
[Table("SegmentMembers")]
public class SegmentMember
{
    /// <summary>
    /// The segment ID
    /// </summary>
    [Required]
    public int SegmentId { get; set; }

    /// <summary>
    /// Navigation property for the segment
    /// </summary>
    [ForeignKey(nameof(SegmentId))]
    public virtual MemberSegment Segment { get; set; } = null!;

    /// <summary>
    /// The member ID
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// Navigation property for the member
    /// </summary>
    [ForeignKey(nameof(MemberId))]
    public virtual Member Member { get; set; } = null!;

    /// <summary>
    /// When this member was added to the segment
    /// </summary>
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Who added this member to the segment (optional, can be system)
    /// </summary>
    public int? AddedBy { get; set; }

    /// <summary>
    /// Navigation property for the user who added the member
    /// </summary>
    [ForeignKey(nameof(AddedBy))]
    public virtual User? AddedByUser { get; set; }
}