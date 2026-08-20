using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing push notifications to mobile devices
/// </summary>
public interface IPushNotificationService
{
    /// <summary>
    /// Register a device token for a user
    /// </summary>
    /// <param name="userId">The ID of the user</param>
    /// <param name="request">The device token registration request</param>
    /// <returns>Response indicating registration success</returns>
    Task<RegisterDeviceTokenResponse> RegisterDeviceTokenAsync(int userId, RegisterDeviceTokenRequest request);

    /// <summary>
    /// Send a push notification to a specific device token
    /// </summary>
    /// <param name="deviceToken">The device token to send to</param>
    /// <param name="deviceType">The type of device (android or ios)</param>
    /// <param name="title">The notification title</param>
    /// <param name="body">The notification body</param>
    /// <param name="data">Optional data payload</param>
    /// <returns>True if notification was sent successfully</returns>
    Task<bool> SendNotificationToDeviceAsync(string deviceToken, string deviceType, string title, string body, Dictionary<string, string>? data = null);

    /// <summary>
    /// Send a push notification to all devices for a specific user
    /// </summary>
    /// <param name="userId">The ID of the user</param>
    /// <param name="title">The notification title</param>
    /// <param name="body">The notification body</param>
    /// <param name="data">Optional data payload</param>
    /// <returns>Number of devices that received the notification successfully</returns>
    Task<int> SendNotificationToUserAsync(int userId, string title, string body, Dictionary<string, string>? data = null);

    /// <summary>
    /// Send a push notification to all devices for multiple users
    /// </summary>
    /// <param name="userIds">The IDs of the users</param>
    /// <param name="title">The notification title</param>
    /// <param name="body">The notification body</param>
    /// <param name="data">Optional data payload</param>
    /// <returns>Number of devices that received the notification successfully</returns>
    Task<int> SendNotificationToUsersAsync(IEnumerable<int> userIds, string title, string body, Dictionary<string, string>? data = null);

    /// <summary>
    /// Remove a device token for a user
    /// </summary>
    /// <param name="userId">The ID of the user</param>
    /// <param name="deviceToken">The device token to remove</param>
    /// <returns>True if device token was removed successfully</returns>
    Task<bool> RemoveDeviceTokenAsync(int userId, string deviceToken);

    /// <summary>
    /// Get all device tokens for a user
    /// </summary>
    /// <param name="userId">The ID of the user</param>
    /// <returns>List of device tokens for the user</returns>
    Task<IEnumerable<string>> GetUserDeviceTokensAsync(int userId);

    /// <summary>
    /// Send bulk push notifications to all club members with device tokens
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="userId">The ID of the user sending the notification</param>
    /// <param name="request">The bulk push notification request</param>
    /// <returns>Response with send results</returns>
    Task<SendBulkPushNotificationResponse> SendBulkPushNotificationAsync(int clubId, int userId, SendBulkPushNotificationRequest request);

    /// <summary>
    /// Get push notification usage statistics for a club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <returns>Usage statistics</returns>
    Task<PushNotificationUsageStatsResponse> GetPushNotificationUsageStatsAsync(int clubId);
}