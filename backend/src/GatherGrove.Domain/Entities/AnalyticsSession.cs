using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

public class AnalyticsSession
{
    [Key]
    [StringLength(128)]
    public string Id { get; set; } = string.Empty;

    public int? ClubId { get; set; }
    public int? UserId { get; set; }
    public int? MemberId { get; set; }

    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public DateTime LastActivityAt { get; set; }

    [Required]
    [StringLength(50)]
    public string Platform { get; set; } = string.Empty;

    [StringLength(50)]
    public string? DeviceType { get; set; }

    [StringLength(100)]
    public string? OperatingSystem { get; set; }

    [StringLength(500)]
    public string? UserAgent { get; set; }

    [StringLength(128)]
    public string? IpAddressHash { get; set; }

    [StringLength(10)]
    public string? CountryCode { get; set; }

    [StringLength(1000)]
    public string? EntryUrl { get; set; }

    [StringLength(1000)]
    public string? ExitUrl { get; set; }

    public int EventCount { get; set; } = 0;
    public int PageViewCount { get; set; } = 0;
    public int? DurationSeconds { get; set; }

    // Login activity tracking fields
    public bool IsLoginSession { get; set; } = false;
    public DateTime? LastLoginAt { get; set; }
    public int LoginStreakDays { get; set; } = 0;
    public string? LoginMethod { get; set; } // "email", "social", "sso"
    public bool IsSuccessfulLogin { get; set; } = true;
    public string? LoginFailureReason { get; set; }

    // Navigation properties
    public Club? Club { get; set; }
    public User? User { get; set; }
    public Member? Member { get; set; }
}