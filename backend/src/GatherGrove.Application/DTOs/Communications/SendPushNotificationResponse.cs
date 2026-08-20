namespace GatherGrove.Application.DTOs.Communications;

/// <summary>
/// Response DTO for sending bulk push notifications to club members
/// </summary>
public class SendPushNotificationResponse
{
    /// <summary>
    /// Whether the push notification was sent successfully
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Success or error message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Number of device tokens that received the push notification
    /// </summary>
    public int DeviceCount { get; set; }

    /// <summary>
    /// Number of unique users that received the push notification
    /// </summary>
    public int UserCount { get; set; }

    /// <summary>
    /// ID of the communication log entry
    /// </summary>
    public int CommunicationLogId { get; set; }
}