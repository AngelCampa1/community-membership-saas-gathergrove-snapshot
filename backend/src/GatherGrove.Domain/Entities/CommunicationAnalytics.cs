using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Tracks analytics for individual communication sends
/// </summary>
[Table("CommunicationAnalytics")]
public class CommunicationAnalytics
{
    /// <summary>
    /// Unique identifier for the analytics record
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// Reference to the communications log entry
    /// </summary>
    [Required]
    public int CommunicationId { get; set; }

    /// <summary>
    /// The member who received this communication
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// Unique tracking ID for this send
    /// </summary>
    [Required]
    [StringLength(100)]
    public string TrackingId { get; set; } = string.Empty;

    /// <summary>
    /// A/B test campaign ID (if applicable)
    /// </summary>
    public int? ABTestCampaignId { get; set; }

    /// <summary>
    /// Variant name (A or B) for A/B testing
    /// </summary>
    [StringLength(10)]
    public string? VariantName { get; set; }

    /// <summary>
    /// Email template ID used (if applicable)
    /// </summary>
    public int? TemplateId { get; set; }

    /// <summary>
    /// When the communication was sent
    /// </summary>
    [Required]
    public DateTime SentAt { get; set; }

    /// <summary>
    /// When the communication was delivered
    /// </summary>
    public DateTime? DeliveredAt { get; set; }

    /// <summary>
    /// When the communication was opened (first time)
    /// </summary>
    public DateTime? OpenedAt { get; set; }

    /// <summary>
    /// Number of times opened
    /// </summary>
    [Required]
    public int OpenCount { get; set; } = 0;

    /// <summary>
    /// When the first link was clicked
    /// </summary>
    public DateTime? ClickedAt { get; set; }

    /// <summary>
    /// Number of link clicks
    /// </summary>
    [Required]
    public int ClickCount { get; set; } = 0;

    /// <summary>
    /// When the member unsubscribed
    /// </summary>
    public DateTime? UnsubscribedAt { get; set; }

    /// <summary>
    /// When the communication bounced
    /// </summary>
    public DateTime? BouncedAt { get; set; }

    /// <summary>
    /// Bounce reason/type
    /// </summary>
    [StringLength(200)]
    public string? BounceReason { get; set; }

    /// <summary>
    /// Device type used to open (Desktop, Mobile, Tablet)
    /// </summary>
    [StringLength(50)]
    public string? DeviceType { get; set; }

    /// <summary>
    /// Email client used (Gmail, Outlook, Apple Mail, etc.)
    /// </summary>
    [StringLength(100)]
    public string? EmailClient { get; set; }

    /// <summary>
    /// IP address of the opener (for geolocation)
    /// </summary>
    [StringLength(50)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// Geographic location (city, country)
    /// </summary>
    [StringLength(200)]
    public string? Location { get; set; }

    /// <summary>
    /// User agent string
    /// </summary>
    [StringLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Navigation property for the communications log
    /// </summary>
    public virtual CommunicationsLog Communication { get; set; } = null!;

    /// <summary>
    /// Navigation property for the member
    /// </summary>
    public virtual Member Member { get; set; } = null!;

    /// <summary>
    /// Navigation property for the A/B test campaign
    /// </summary>
    public virtual ABTestCampaign? ABTestCampaign { get; set; }

    /// <summary>
    /// Navigation property for the email template
    /// </summary>
    public virtual EmailTemplate? Template { get; set; }
}

