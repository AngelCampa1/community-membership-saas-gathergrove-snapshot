using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to submit application-level feedback
/// </summary>
public class SubmitAppFeedbackRequest
{
    /// <summary>
    /// Rating from 1-5 stars
    /// </summary>
    [Required]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int Rating { get; set; }

    /// <summary>
    /// Subject/category of feedback (Bug Report, Feature Request, etc.)
    /// </summary>
    [Required]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Subject must be between 3 and 200 characters")]
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// Detailed feedback message
    /// </summary>
    [Required]
    [StringLength(5000, MinimumLength = 10, ErrorMessage = "Message must be between 10 and 5000 characters")]
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Optional name (for guest users)
    /// </summary>
    [StringLength(100)]
    public string? Name { get; set; }

    /// <summary>
    /// Optional email (for guest users)
    /// </summary>
    [EmailAddress(ErrorMessage = "Please provide a valid email address")]
    [StringLength(254)]
    public string? Email { get; set; }

    /// <summary>
    /// Platform identifier (web or mobile)
    /// </summary>
    [StringLength(20)]
    public string Platform { get; set; } = "web";

    /// <summary>
    /// Current page/screen URL
    /// </summary>
    [StringLength(1000)]
    public string? PageUrl { get; set; }

    /// <summary>
    /// Application version
    /// </summary>
    [StringLength(50)]
    public string? AppVersion { get; set; }

    /// <summary>
    /// Operating system version
    /// </summary>
    [StringLength(100)]
    public string? OsVersion { get; set; }

    /// <summary>
    /// Device model (for mobile devices)
    /// </summary>
    [StringLength(100)]
    public string? DeviceModel { get; set; }

    /// <summary>
    /// Screen resolution
    /// </summary>
    [StringLength(50)]
    public string? ScreenResolution { get; set; }

    /// <summary>
    /// Browser information (for web)
    /// </summary>
    [StringLength(200)]
    public string? BrowserInfo { get; set; }

    /// <summary>
    /// Honeypot field for public web submissions. Legitimate users should leave this empty.
    /// </summary>
    [StringLength(500)]
    public string? CompanyWebsite { get; set; }

    /// <summary>
    /// Cloudflare Turnstile token for anonymous public web submissions.
    /// </summary>
    [StringLength(4096)]
    public string? TurnstileToken { get; set; }
}

/// <summary>
/// Response after submitting application-level feedback
/// </summary>
public class AppFeedbackResponse
{
    /// <summary>
    /// Whether the feedback was submitted successfully
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Message describing the result
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// The ID of the submitted feedback (if successful)
    /// </summary>
    public int? FeedbackId { get; set; }
}
