using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Caches segment membership for performance optimization
/// </summary>
[Table("MemberSegmentCache")]
public class MemberSegmentCache
{
    /// <summary>
    /// Unique identifier for the cache entry
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// The member in this segment
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// The segment this member belongs to
    /// </summary>
    [Required]
    public int SegmentId { get; set; }

    /// <summary>
    /// When this cache entry was created
    /// </summary>
    [Required]
    public DateTime CachedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Whether this cache entry is still valid
    /// </summary>
    [Required]
    public bool IsValid { get; set; } = true;

    // Navigation properties
    [ForeignKey(nameof(MemberId))]
    public virtual Member Member { get; set; } = null!;

    [ForeignKey(nameof(SegmentId))]
    public virtual MemberSegment Segment { get; set; } = null!;
}