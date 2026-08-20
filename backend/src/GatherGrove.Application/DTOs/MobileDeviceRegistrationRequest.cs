using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to register a mobile device for push notifications (Azure Notification Hubs)
/// </summary>
public class MobileDeviceRegistrationRequest
{
    /// <summary>
    /// The Expo push token for the mobile device
    /// </summary>
    [Required(ErrorMessage = "Device token is required")]
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// The platform of the device (android, ios)
    /// </summary>
    [Required(ErrorMessage = "Platform is required")]
    [RegularExpression("^(android|ios)$", ErrorMessage = "Platform must be either 'android' or 'ios'")]
    public string Platform { get; set; } = string.Empty;

    /// <summary>
    /// The ID of the user registering the device
    /// </summary>
    [Required(ErrorMessage = "User ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "User ID must be a positive integer")]
    public int UserId { get; set; }

    /// <summary>
    /// The ID of the club the user belongs to
    /// </summary>
    [Required(ErrorMessage = "Club ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Club ID must be a positive integer")]
    public int ClubId { get; set; }
}