using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

public class MarketingLead
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Name { get; set; }

    [Required]
    [StringLength(50)]
    public string Source { get; set; } = string.Empty; // exit-intent, newsletter, lead-magnet, consultation

    [StringLength(50)]
    public string? Variant { get; set; } // For A/B testing

    [StringLength(500)]
    public string? UserAgent { get; set; }

    [StringLength(1000)]
    public string? ReferrerUrl { get; set; }

    [StringLength(1000)]
    public string? CurrentUrl { get; set; }

    [StringLength(128)]
    public string? SessionId { get; set; }

    // JSON metadata for additional data
    public string? Metadata { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Optional fields for follow-up tracking
    public bool IsContacted { get; set; } = false;
    public DateTime? ContactedAt { get; set; }
    public bool IsConverted { get; set; } = false;
    public DateTime? ConvertedAt { get; set; }

    // For GDPR compliance
    public bool HasConsent { get; set; } = true;
    public DateTime? ConsentWithdrawnAt { get; set; }
}