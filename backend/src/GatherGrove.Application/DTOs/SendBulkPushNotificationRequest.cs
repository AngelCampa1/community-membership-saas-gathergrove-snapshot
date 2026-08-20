using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for sending bulk push notifications to club members
/// </summary>
public class SendBulkPushNotificationRequest
{
    /// <summary>
    /// The title of the push notification
    /// </summary>
    [Required(ErrorMessage = "Title is required")]
    [StringLength(100, ErrorMessage = "Title cannot exceed 100 characters")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// The body message of the push notification
    /// </summary>
    [Required(ErrorMessage = "Message is required")]
    [StringLength(300, ErrorMessage = "Message cannot exceed 300 characters")]
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// Optional data payload to include with the notification
    /// </summary>
    public Dictionary<string, string>? Data { get; set; }
}