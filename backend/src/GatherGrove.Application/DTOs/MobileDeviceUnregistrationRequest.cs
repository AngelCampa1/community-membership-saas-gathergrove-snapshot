using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to unregister a mobile device from push notifications
/// </summary>
public class MobileDeviceUnregistrationRequest
{
    /// <summary>
    /// The device token to unregister
    /// </summary>
    [Required(ErrorMessage = "Device token is required")]
    public string Token { get; set; } = string.Empty;
}