using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents alert configuration settings for a club
/// </summary>
public class AlertConfiguration
{
    /// <summary>
    /// Unique identifier for the alert configuration
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The club this configuration belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Whether engagement drop alerts are enabled
    /// </summary>
    public bool EngagementAlerts { get; set; } = true;

    /// <summary>
    /// Whether churn risk alerts are enabled
    /// </summary>
    public bool ChurnRiskAlerts { get; set; } = true;

    /// <summary>
    /// Whether event reminder alerts are enabled
    /// </summary>
    public bool EventReminderAlerts { get; set; } = true;

    /// <summary>
    /// The engagement score threshold below which churn risk alerts are triggered (0-100)
    /// </summary>
    [Range(0, 100, ErrorMessage = "Churn risk threshold must be between 0 and 100")]
    public int ChurnRiskThreshold { get; set; } = 30;

    /// <summary>
    /// The engagement score threshold for engagement alerts (0-100)
    /// </summary>
    [Range(0, 100, ErrorMessage = "Engagement score threshold must be between 0 and 100")]
    public int EngagementScoreThreshold { get; set; } = 50;

    /// <summary>
    /// JSON-serialized list of email addresses to receive alerts
    /// </summary>
    public string AlertEmailRecipientsJson { get; set; } = "[]";

    /// <summary>
    /// Optional Slack webhook URL for alert notifications
    /// </summary>
    [StringLength(500, ErrorMessage = "Slack webhook URL cannot exceed 500 characters")]
    [Url(ErrorMessage = "Invalid Slack webhook URL")]
    public string? SlackWebhookUrl { get; set; }

    /// <summary>
    /// Whether the alert configuration is enabled
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// When the configuration was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the configuration was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the club this configuration belongs to
    /// </summary>
    public virtual Club Club { get; set; } = null!;
}
