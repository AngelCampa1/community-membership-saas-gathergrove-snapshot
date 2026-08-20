using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a device token for push notifications associated with a user
/// </summary>
public class UserDeviceToken
{
    /// <summary>
    /// Unique identifier for the device token record
    /// </summary>
    public int UserDeviceTokenId { get; set; }

    /// <summary>
    /// The user who owns this device token
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// The device token for push notifications (FCM or APNs)
    /// </summary>
    [Required]
    [StringLength(255)]
    public string DeviceToken { get; set; } = string.Empty;

    /// <summary>
    /// The type of device (android or ios)
    /// </summary>
    [Required]
    [StringLength(10)]
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>
    /// When this device token was last used for login
    /// </summary>
    public DateTime LastLogin { get; set; }

    /// <summary>
    /// When this device token record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this device token record was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property to the user
    /// </summary>
    public User User { get; set; } = null!;
}