namespace GatherGrove.Application.DTOs;

public class MemberInviteCodeResponse
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int MembershipTypeId { get; set; }
    public string MembershipTypeName { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public int? MaxUses { get; set; }
    public int CurrentUses { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;

    // QR Code and URLs
    public string JoinUrl { get; set; } = string.Empty;
    public string QrCodeDataUrl { get; set; } = string.Empty;

    // Status indicators
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    public bool IsMaxUsesReached => MaxUses.HasValue && CurrentUses >= MaxUses.Value;
    public bool IsAvailable => IsActive && !IsExpired && !IsMaxUsesReached;
}