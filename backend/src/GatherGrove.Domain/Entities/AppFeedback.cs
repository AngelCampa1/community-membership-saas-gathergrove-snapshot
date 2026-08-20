using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents user feedback about the GatherGrove application
/// </summary>
public class AppFeedback
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Rating from 1-5 stars
    /// </summary>
    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    /// <summary>
    /// Subject/category of feedback (Bug Report, Feature Request, etc.)
    /// </summary>
    [Required]
    [StringLength(200)]
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// Detailed feedback message
    /// </summary>
    [Required]
    [StringLength(5000)]
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Name of the submitter (optional for guests, auto-filled for members)
    /// </summary>
    [StringLength(100)]
    public string? Name { get; set; }

    /// <summary>
    /// Email of the submitter (optional for guests, auto-filled for members)
    /// </summary>
    [StringLength(254)]
    public string? Email { get; set; }

    /// <summary>
    /// User ID if submitted by an authenticated user
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// Platform where feedback was submitted (web or mobile)
    /// </summary>
    [StringLength(20)]
    public string Platform { get; set; } = "web";

    /// <summary>
    /// Client IP address for rate limiting and spam detection
    /// </summary>
    [StringLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent string for analytics
    /// </summary>
    [StringLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Page/screen URL where feedback was submitted
    /// </summary>
    [StringLength(1000)]
    public string? PageUrl { get; set; }

    /// <summary>
    /// When the feedback was submitted
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Whether the email notification was sent successfully
    /// </summary>
    public bool EmailSent { get; set; } = false;

    /// <summary>
    /// Application version when feedback was submitted
    /// </summary>
    [StringLength(50)]
    public string? AppVersion { get; set; }

    /// <summary>
    /// Operating system version (e.g., "Windows 11", "iOS 17.2", "Android 14")
    /// </summary>
    [StringLength(100)]
    public string? OsVersion { get; set; }

    /// <summary>
    /// Device model (for mobile: "iPhone 15 Pro", for web: null)
    /// </summary>
    [StringLength(100)]
    public string? DeviceModel { get; set; }

    /// <summary>
    /// Screen resolution (e.g., "1920x1080")
    /// </summary>
    [StringLength(50)]
    public string? ScreenResolution { get; set; }

    /// <summary>
    /// Browser information for web (e.g., "Chrome 120.0")
    /// </summary>
    [StringLength(200)]
    public string? BrowserInfo { get; set; }

    // Navigation property
    public virtual User? User { get; set; }
}
