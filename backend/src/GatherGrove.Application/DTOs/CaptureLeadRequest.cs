using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to capture a marketing lead from website
/// </summary>
public class CaptureLeadRequest
{
    /// <summary>
    /// Email address of the lead
    /// </summary>
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Optional name of the lead
    /// </summary>
    [StringLength(100)]
    public string? Name { get; set; }

    /// <summary>
    /// Source of the lead capture (exit-intent, newsletter, etc.)
    /// </summary>
    [Required]
    [StringLength(50)]
    [RegularExpression(
        "^(exit-intent|newsletter|lead-magnet|consultation|template-download|tool-dues-calculator|tool-stack-calculator|tool-event-budget)$",
        ErrorMessage = "Invalid lead source.")]
    public string Source { get; set; } = string.Empty;

    /// <summary>
    /// Optional variant for A/B testing
    /// </summary>
    [StringLength(50)]
    public string? Variant { get; set; }

    /// <summary>
    /// Additional metadata as JSON string
    /// </summary>
    public string? Metadata { get; set; }

    /// <summary>
    /// Timestamp when lead was captured (ISO 8601)
    /// </summary>
    public string? CapturedAt { get; set; }

    /// <summary>
    /// User agent string
    /// </summary>
    [StringLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Referrer URL
    /// </summary>
    [StringLength(1000)]
    public string? Referrer { get; set; }

    /// <summary>
    /// Current page URL
    /// </summary>
    [StringLength(1000)]
    public string? CurrentUrl { get; set; }

    /// <summary>
    /// Session ID for tracking
    /// </summary>
    [StringLength(128)]
    public string? SessionId { get; set; }

    /// <summary>
    /// Hidden honeypot field. Real users should never fill this.
    /// </summary>
    [StringLength(500)]
    public string? CompanyWebsite { get; set; }

    /// <summary>
    /// Cloudflare Turnstile response token from the public form.
    /// </summary>
    [StringLength(4096)]
    public string? TurnstileToken { get; set; }
}
