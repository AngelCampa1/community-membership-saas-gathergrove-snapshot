namespace GatherGrove.Application.DTOs.Alerts;

/// <summary>
/// Response DTO for alert configuration
/// </summary>
public class AlertConfigResponse
{
    /// <summary>
    /// The club ID this configuration belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Whether engagement drop alerts are enabled
    /// </summary>
    public bool EngagementAlerts { get; set; }

    /// <summary>
    /// Whether churn risk alerts are enabled
    /// </summary>
    public bool ChurnRiskAlerts { get; set; }

    /// <summary>
    /// Whether event reminder alerts are enabled
    /// </summary>
    public bool EventReminderAlerts { get; set; }

    /// <summary>
    /// The engagement score threshold below which churn risk alerts are triggered (0-100)
    /// </summary>
    public int ChurnRiskThreshold { get; set; }

    /// <summary>
    /// The engagement score threshold for engagement alerts (0-100)
    /// </summary>
    public int EngagementScoreThreshold { get; set; }

    /// <summary>
    /// List of email addresses to receive alerts
    /// </summary>
    public List<string> AlertEmailRecipients { get; set; } = new();

    /// <summary>
    /// Optional Slack webhook URL for alert notifications
    /// </summary>
    public string? SlackWebhookUrl { get; set; }

    /// <summary>
    /// Whether the alert configuration is enabled
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// When the configuration was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the configuration was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
