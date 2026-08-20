namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response after registering a device token for push notifications
/// </summary>
public class RegisterDeviceTokenResponse
{
    /// <summary>
    /// Whether the device token was successfully registered
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Optional message about the registration result
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// The device token that was registered
    /// </summary>
    public string? DeviceToken { get; set; }

    /// <summary>
    /// The device type that was registered
    /// </summary>
    public string? DeviceType { get; set; }

    /// <summary>
    /// When the device token was registered or updated
    /// </summary>
    public DateTime RegisteredAt { get; set; }
}