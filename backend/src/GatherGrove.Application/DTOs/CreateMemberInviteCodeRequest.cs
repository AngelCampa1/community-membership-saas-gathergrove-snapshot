using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

public class CreateMemberInviteCodeRequest
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    public int MembershipTypeId { get; set; }

    [Required]
    public DateTime ExpiresAt { get; set; }

    public int? MaxUses { get; set; } // null = unlimited

    [Required]
    public bool IsActive { get; set; } = true;
}