using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to register a device token for push notifications
/// </summary>
public class RegisterDeviceTokenRequest
{
    /// <summary>
    /// The device token for push notifications (FCM or APNs)
    /// </summary>
    [Required(ErrorMessage = "Device token is required")]
    public string DeviceToken { get; set; } = string.Empty;

    /// <summary>
    /// The type of device (android or ios)
    /// </summary>
    [Required(ErrorMessage = "Device type is required")]
    [RegularExpression("^(android|ios)$", ErrorMessage = "Device type must be either 'android' or 'ios'")]
    public string DeviceType { get; set; } = string.Empty;
}