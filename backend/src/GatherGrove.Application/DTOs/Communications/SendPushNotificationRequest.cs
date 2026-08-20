using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Communications;

/// <summary>
/// Request DTO for sending bulk push notifications to club members
/// </summary>
public class SendPushNotificationRequest
{
    /// <summary>
    /// The push notification title
    /// </summary>
    [Required(ErrorMessage = "Title is required")]
    [StringLength(100, ErrorMessage = "Title cannot exceed 100 characters")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// The push notification body/message
    /// </summary>
    [Required(ErrorMessage = "Body is required")]
    [StringLength(300, ErrorMessage = "Body cannot exceed 300 characters")]
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// Optional list of membership type IDs to target. If null or empty, sends to all active members with registered devices.
    /// </summary>
    public List<int>? MemberTypeIds { get; set; }
}