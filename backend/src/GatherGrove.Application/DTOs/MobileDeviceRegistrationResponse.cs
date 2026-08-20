namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response after registering a mobile device for push notifications
/// </summary>
public class MobileDeviceRegistrationResponse
{
    /// <summary>
    /// Whether the registration was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Human-readable message about the registration result
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// The device token that was registered
    /// </summary>
    public string DeviceToken { get; set; } = string.Empty;

    /// <summary>
    /// The platform of the registered device
    /// </summary>
    public string Platform { get; set; } = string.Empty;

    /// <summary>
    /// The user ID the device was registered for
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// The club ID associated with the registration
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// When the device was registered
    /// </summary>
    public DateTime RegisteredAt { get; set; }
}