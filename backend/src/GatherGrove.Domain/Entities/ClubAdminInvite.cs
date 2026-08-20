using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

public class ClubAdminInvite
{
    [Key]
    public int InviteId { get; set; }

    [Required]
    public int ClubId { get; set; }

    [Required]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(255)]
    public string InviteToken { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "Pending";

    [Required]
    public DateTime ExpiresAt { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    public int InvitedByUserId { get; set; }

    // Navigation properties
    public virtual Club Club { get; set; } = null!;
    public virtual User InvitedByUser { get; set; } = null!;
}