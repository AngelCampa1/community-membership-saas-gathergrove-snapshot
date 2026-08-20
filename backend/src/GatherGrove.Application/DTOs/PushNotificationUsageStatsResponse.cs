namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for push notification usage statistics
/// </summary>
public class PushNotificationUsageStatsResponse
{
    /// <summary>
    /// Club tier (Sprout or Grow)
    /// </summary>
    public string ClubTier { get; set; } = string.Empty;

    /// <summary>
    /// Number of active members with registered device tokens
    /// </summary>
    public int MembersWithDeviceTokens { get; set; }

    /// <summary>
    /// Total number of active members in the club
    /// </summary>
    public int TotalActiveMembers { get; set; }

    /// <summary>
    /// Total number of registered device tokens across all members
    /// </summary>
    public int TotalDeviceTokens { get; set; }

    /// <summary>
    /// Whether this is a Grow tier club (push notifications are Grow tier only)
    /// </summary>
    public bool IsGrowTier { get; set; }

    /// <summary>
    /// Whether Azure Notification Hubs is configured
    /// </summary>
    public bool IsAzureConfigured { get; set; }

    /// <summary>
    /// Current month for context
    /// </summary>
    public string CurrentMonth { get; set; } = string.Empty;
}