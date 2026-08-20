using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

public class AnalyticsEvent
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string EventType { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Action { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Label { get; set; }

    public decimal? Value { get; set; }

    public int? ClubId { get; set; }
    public int? UserId { get; set; }
    public int? MemberId { get; set; }

    [Required]
    [StringLength(128)]
    public string SessionId { get; set; } = string.Empty;

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
    public string? PageUrl { get; set; }

    [StringLength(1000)]
    public string? ReferrerUrl { get; set; }

    // JSON properties stored as string
    public string? Properties { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Club? Club { get; set; }
    public User? User { get; set; }
    public Member? Member { get; set; }
    public AnalyticsSession? Session { get; set; }
}