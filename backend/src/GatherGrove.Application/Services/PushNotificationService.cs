using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Security;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing push notifications to mobile devices
/// </summary>
public class PushNotificationService : IPushNotificationService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<PushNotificationService> _logger;

    public PushNotificationService(
        GatherGroveDbContext context,
        ILogger<PushNotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Register a device token for a user
    /// </summary>
    public async Task<RegisterDeviceTokenResponse> RegisterDeviceTokenAsync(int userId, RegisterDeviceTokenRequest request)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        try
        {
            var now = DateTime.UtcNow;

            // Check if this device token already exists for this user
            var existingToken = await _context.UserDeviceTokens
                .FirstOrDefaultAsync(t => t.UserId == userId && t.DeviceToken == request.DeviceToken);

            if (existingToken != null)
            {
                // Update existing token
                existingToken.DeviceType = request.DeviceType;
                existingToken.LastLogin = now;
                existingToken.UpdatedAt = now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated existing device token for user {UserId}", userId);

                return new RegisterDeviceTokenResponse
                {
                    Success = true,
                    Message = "Device token updated successfully",
                    DeviceToken = request.DeviceToken,
                    DeviceType = request.DeviceType,
                    RegisteredAt = now
                };
            }

            // Create new device token
            var deviceToken = new UserDeviceToken
            {
                UserId = userId,
                DeviceToken = request.DeviceToken,
                DeviceType = request.DeviceType,
                LastLogin = now,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.UserDeviceTokens.Add(deviceToken);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Registered new device token for user {UserId} with device type {DeviceType}",
                userId, request.DeviceType);

            return new RegisterDeviceTokenResponse
            {
                Success = true,
                Message = "Device token registered successfully",
                DeviceToken = request.DeviceToken,
                DeviceType = request.DeviceType,
                RegisteredAt = now
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering device token for user {UserId}", userId);

            return new RegisterDeviceTokenResponse
            {
                Success = false,
                Message = "Failed to register device token"
            };
        }
    }

    /// <summary>
    /// Send a push notification to a specific device token
    /// </summary>
    public async Task<bool> SendNotificationToDeviceAsync(string deviceToken, string deviceType, string title, string body, Dictionary<string, string>? data = null)
    {
        try
        {
            // For now, this is a placeholder implementation
            // In a real implementation, you would integrate with Azure Notification Hubs
            _logger.LogInformation("Would send push notification to device token fingerprint {TokenFingerprint} ({DeviceType}): {Title} - {Body}",
                SensitiveLogValue.Fingerprint(deviceToken), deviceType, title, body);

            // TODO: Integrate with Azure Notification Hubs for unified push notifications
            // Azure Notification Hubs handles both FCM (Android) and APNs (iOS)
            // Package: Azure.Messaging.NotificationHubs
            // Docs: https://learn.microsoft.com/azure/notification-hubs/

            // Simulate success for now
            await Task.Delay(100); // Simulate network call
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending push notification to device token fingerprint {TokenFingerprint}",
                SensitiveLogValue.Fingerprint(deviceToken));
            return false;
        }
    }

    /// <summary>
    /// Send a push notification to all devices for a specific user
    /// </summary>
    public async Task<int> SendNotificationToUserAsync(int userId, string title, string body, Dictionary<string, string>? data = null)
    {
        try
        {
            var deviceTokens = await _context.UserDeviceTokens
                .Where(t => t.UserId == userId)
                .ToListAsync();

            if (!deviceTokens.Any())
            {
                _logger.LogWarning("No device tokens found for user {UserId}", userId);
                return 0;
            }

            var successCount = 0;
            foreach (var token in deviceTokens)
            {
                var success = await SendNotificationToDeviceAsync(token.DeviceToken, token.DeviceType, title, body, data);
                if (success)
                {
                    successCount++;
                }
            }

            _logger.LogInformation("Sent push notification to {SuccessCount}/{TotalCount} devices for user {UserId}",
                successCount, deviceTokens.Count, userId);

            return successCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending push notification to user {UserId}", userId);
            return 0;
        }
    }

    /// <summary>
    /// Send a push notification to all devices for multiple users
    /// </summary>
    public async Task<int> SendNotificationToUsersAsync(IEnumerable<int> userIds, string title, string body, Dictionary<string, string>? data = null)
    {
        try
        {
            var totalSuccessCount = 0;

            foreach (var userId in userIds)
            {
                var successCount = await SendNotificationToUserAsync(userId, title, body, data);
                totalSuccessCount += successCount;
            }

            _logger.LogInformation("Sent push notification to {TotalSuccessCount} devices across {UserCount} users",
                totalSuccessCount, userIds.Count());

            return totalSuccessCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending push notifications to multiple users");
            return 0;
        }
    }

    /// <summary>
    /// Remove a device token for a user
    /// </summary>
    public async Task<bool> RemoveDeviceTokenAsync(int userId, string deviceToken)
    {
        try
        {
            var token = await _context.UserDeviceTokens
                .FirstOrDefaultAsync(t => t.UserId == userId && t.DeviceToken == deviceToken);

            if (token == null)
            {
                _logger.LogWarning("Device token not found for user {UserId}", userId);
                return false;
            }

            _context.UserDeviceTokens.Remove(token);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed device token for user {UserId}", userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing device token for user {UserId}", userId);
            return false;
        }
    }

    /// <summary>
    /// Get all device tokens for a user
    /// </summary>
    public async Task<IEnumerable<string>> GetUserDeviceTokensAsync(int userId)
    {
        try
        {
            var deviceTokens = await _context.UserDeviceTokens
                .Where(t => t.UserId == userId)
                .Select(t => t.DeviceToken)
                .ToListAsync();

            return deviceTokens;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting device tokens for user {UserId}", userId);
            return Enumerable.Empty<string>();
        }
    }

    /// <summary>
    /// Send bulk push notifications to all club members with device tokens
    /// </summary>
    public async Task<SendBulkPushNotificationResponse> SendBulkPushNotificationAsync(int clubId, int userId, SendBulkPushNotificationRequest request)
    {
        _logger.LogInformation("Starting bulk push notification send for club {ClubId} by user {UserId}", clubId, userId);

        try
        {
            // Get club information and validate tier
            var club = await _context.Clubs
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == clubId);

            if (club == null)
            {
                _logger.LogWarning("Club not found: {ClubId}", clubId);
                return new SendBulkPushNotificationResponse
                {
                    Success = false,
                    Message = "Club not found"
                };
            }

            // Get all active members
            var activeMembers = await _context.Members
                .AsNoTracking()
                .Where(m => m.ClubId == clubId && m.Status.ToLower() == "active")
                .ToListAsync();

            if (!activeMembers.Any())
            {
                _logger.LogInformation("No active members found for club {ClubId}", clubId);
                return new SendBulkPushNotificationResponse
                {
                    Success = false,
                    Message = "No active members found to send push notification to",
                    TotalActiveMembers = 0
                };
            }

            // Find Users that correspond to these members (by email)
            var memberEmails = activeMembers.Select(m => m.Email).ToList();
            var usersForMembers = await _context.Users
                .AsNoTracking()
                .Where(u => memberEmails.Contains(u.Email))
                .Select(u => u.Id)
                .ToListAsync();

            if (!usersForMembers.Any())
            {
                _logger.LogInformation("No users found for active members in club {ClubId}", clubId);
                return new SendBulkPushNotificationResponse
                {
                    Success = false,
                    Message = "No members have user accounts for push notifications",
                    TotalActiveMembers = activeMembers.Count
                };
            }

            // Get users who have device tokens
            var usersWithTokens = await _context.UserDeviceTokens
                .AsNoTracking()
                .Where(t => usersForMembers.Contains(t.UserId))
                .Select(t => t.UserId)
                .Distinct()
                .ToListAsync();

            if (!usersWithTokens.Any())
            {
                _logger.LogInformation("No members with device tokens found for club {ClubId}", clubId);
                return new SendBulkPushNotificationResponse
                {
                    Success = false,
                    Message = "No members have registered devices for push notifications",
                    TotalActiveMembers = activeMembers.Count
                };
            }

            // Create communications log entry
            var commLog = new CommunicationsLog
            {
                ClubId = clubId,
                CommunicationType = "PushNotification",
                Subject = request.Title,
                Body = request.Body,
                RecipientCount = usersWithTokens.Count(),
                Recipients = System.Text.Json.JsonSerializer.Serialize(usersWithTokens.ToArray()),
                Status = "Pending",
                SentByUserId = userId,
                SentAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.CommunicationsLogs.Add(commLog);
            await _context.SaveChangesAsync();

            // Send push notifications to users with device tokens
            var deviceCount = await SendNotificationToUsersAsync(usersWithTokens, request.Title, request.Body, request.Data);

            // Update communications log status
            commLog.Status = deviceCount > 0 ? "Sent" : "Failed";
            await _context.SaveChangesAsync();

            _logger.LogInformation("Bulk push notification sent to {DeviceCount} devices for {UserCount} users in club {ClubId}",
                deviceCount, usersWithTokens.Count, clubId);

            return new SendBulkPushNotificationResponse
            {
                Success = deviceCount > 0,
                Message = deviceCount > 0
                    ? $"Push notification sent to {deviceCount} devices across {usersWithTokens.Count} members"
                    : "Failed to send push notifications",
                DeviceCount = deviceCount,
                UserCount = usersWithTokens.Count,
                TotalActiveMembers = activeMembers.Count,
                CommunicationLogId = commLog.Id
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending bulk push notification for club {ClubId}", clubId);

            return new SendBulkPushNotificationResponse
            {
                Success = false,
                Message = "Failed to send push notification"
            };
        }
    }

    /// <summary>
    /// Get push notification usage statistics for a club
    /// </summary>
    public async Task<PushNotificationUsageStatsResponse> GetPushNotificationUsageStatsAsync(int clubId)
    {
        try
        {
            // Get club information
            var club = await _context.Clubs
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == clubId);

            if (club == null)
            {
                _logger.LogWarning("Club not found: {ClubId}", clubId);
                return new PushNotificationUsageStatsResponse
                {
                    ClubTier = "Unknown",
                    IsGrowTier = false,
                    IsAzureConfigured = false,
                    CurrentMonth = DateTime.UtcNow.ToString("MMMM yyyy")
                };
            }

            // Get active members count
            var totalActiveMembers = await _context.Members
                .AsNoTracking()
                .CountAsync(m => m.ClubId == clubId && m.Status.ToLower() == "active");

            // Get members with device tokens
            var memberEmails = await _context.Members
                .AsNoTracking()
                .Where(m => m.ClubId == clubId && m.Status.ToLower() == "active")
                .Select(m => m.Email)
                .ToListAsync();

            // Find users that correspond to these members
            var userIdsForMembers = await _context.Users
                .AsNoTracking()
                .Where(u => memberEmails.Contains(u.Email))
                .Select(u => u.Id)
                .ToListAsync();

            var membersWithTokens = await _context.UserDeviceTokens
                .AsNoTracking()
                .Where(t => userIdsForMembers.Contains(t.UserId))
                .Select(t => t.UserId)
                .Distinct()
                .CountAsync();

            var totalDeviceTokens = await _context.UserDeviceTokens
                .AsNoTracking()
                .Where(t => userIdsForMembers.Contains(t.UserId))
                .CountAsync();

            return new PushNotificationUsageStatsResponse
            {
                ClubTier = club.Tier,
                IsGrowTier = club.Tier == "Grow",
                IsAzureConfigured = true, // TODO: Check actual Azure configuration
                MembersWithDeviceTokens = membersWithTokens,
                TotalActiveMembers = totalActiveMembers,
                TotalDeviceTokens = totalDeviceTokens,
                CurrentMonth = DateTime.UtcNow.ToString("MMMM yyyy")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting push notification usage stats for club {ClubId}", clubId);

            return new PushNotificationUsageStatsResponse
            {
                ClubTier = "Unknown",
                IsGrowTier = false,
                IsAzureConfigured = false,
                CurrentMonth = DateTime.UtcNow.ToString("MMMM yyyy")
            };
        }
    }
}
