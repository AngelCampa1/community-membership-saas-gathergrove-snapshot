using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Alerts;

/// <summary>
/// Request DTO for updating alert configuration
/// </summary>
public class UpdateAlertConfigRequest
{
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
    [Range(0, 100, ErrorMessage = "Churn risk threshold must be between 0 and 100")]
    public int ChurnRiskThreshold { get; set; }

    /// <summary>
    /// The engagement score threshold for engagement alerts (0-100)
    /// </summary>
    [Range(0, 100, ErrorMessage = "Engagement score threshold must be between 0 and 100")]
    public int EngagementScoreThreshold { get; set; }

    /// <summary>
    /// List of email addresses to receive alerts
    /// </summary>
    public List<string> AlertEmailRecipients { get; set; } = new();

    /// <summary>
    /// Optional Slack webhook URL for alert notifications
    /// </summary>
    [Url(ErrorMessage = "Invalid Slack webhook URL")]
    public string? SlackWebhookUrl { get; set; }

    /// <summary>
    /// Whether the alert configuration is enabled
    /// </summary>
    public bool IsEnabled { get; set; }
}
