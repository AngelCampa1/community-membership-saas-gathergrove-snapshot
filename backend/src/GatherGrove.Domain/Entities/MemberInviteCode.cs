using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

public class MemberInviteCode
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ClubId { get; set; }

    [Required]
    [StringLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    public int MembershipTypeId { get; set; }

    [Required]
    public DateTime ExpiresAt { get; set; }

    public int? MaxUses { get; set; } // null = unlimited

    [Required]
    public int CurrentUses { get; set; } = 0;

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    [Required]
    public int CreatedByUserId { get; set; }

    // Navigation properties
    public virtual Club Club { get; set; } = null!;
    public virtual MembershipType MembershipType { get; set; } = null!;
    public virtual User CreatedByUser { get; set; } = null!;
    public virtual ICollection<Member> Members { get; set; } = new List<Member>();
}