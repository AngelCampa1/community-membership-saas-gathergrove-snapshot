namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for bulk push notification sending
/// </summary>
public class SendBulkPushNotificationResponse
{
    /// <summary>
    /// Whether the operation was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Response message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Number of devices that received the notification successfully
    /// </summary>
    public int DeviceCount { get; set; }

    /// <summary>
    /// Number of users that had device tokens
    /// </summary>
    public int UserCount { get; set; }

    /// <summary>
    /// Total number of active club members
    /// </summary>
    public int TotalActiveMembers { get; set; }

    /// <summary>
    /// ID of the communication log entry
    /// </summary>
    public int? CommunicationLogId { get; set; }
}