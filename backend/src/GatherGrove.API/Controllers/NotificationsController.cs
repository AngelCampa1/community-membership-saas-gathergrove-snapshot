using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.API.Extensions;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing push notifications for mobile devices
/// Push notifications are a Grow tier feature that uses Azure Notification Hubs
/// Azure Notification Hubs provides unified push notification delivery to iOS (APNs) and Android (FCM)
/// </summary>
[ApiController]
[Route("api/notifications")]
[Authorize(Policy = "GrowTierRequired")]
[Produces("application/json")]
public class NotificationsController : ControllerBase
{
    private readonly IPushNotificationService _pushNotificationService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        IPushNotificationService pushNotificationService,
        ILogger<NotificationsController> logger)
    {
        _pushNotificationService = pushNotificationService;
        _logger = logger;
    }

    /// <summary>
    /// Register a device for push notifications (Mobile App Endpoint)
    /// </summary>
    /// <remarks>
    /// This endpoint is specifically designed for mobile app integration with Azure Notification Hubs.
    /// The mobile app will call this endpoint with the device token, platform, and user/club information.
    /// 
    /// Expected request format:
    /// ```json
    /// {
    ///   "token": "ExponentPushToken[xxx]",
    ///   "platform": "android",
    ///   "userId": 123,
    ///   "clubId": 456
    /// }
    /// ```
    /// </remarks>
    /// <param name="request">The mobile device registration request</param>
    /// <response code="200">Device registered successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="401">Unauthorized - missing or invalid JWT token</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(MobileDeviceRegistrationResponse), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> RegisterDevice([FromBody] MobileDeviceRegistrationRequest request)
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var authenticatedUserId))
            {
                _logger.LogWarning("Device registration attempt without valid user ID in token");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            // Verify the user ID in the request matches the authenticated user
            if (request.UserId != authenticatedUserId)
            {
                _logger.LogWarning("User {AuthenticatedUserId} attempted to register device for user {RequestedUserId}",
                    authenticatedUserId, request.UserId);
                return BadRequest(new ProblemDetails
                {
                    Title = "User ID Mismatch",
                    Detail = "You can only register devices for your own account.",
                    Status = 400
                });
            }

            _logger.LogInformation("Registering mobile device for user {UserId} on platform {Platform}",
                request.UserId, request.Platform);

            // Validate the request
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Convert mobile request to internal format
            var deviceTokenRequest = new RegisterDeviceTokenRequest
            {
                DeviceToken = request.Token,
                DeviceType = request.Platform.ToLowerInvariant() == "ios" ? "ios" : "android"
            };

            // Register the device token using existing service
            var response = await _pushNotificationService.RegisterDeviceTokenAsync(authenticatedUserId, deviceTokenRequest);

            if (response.Success)
            {
                _logger.LogInformation("Mobile device registered successfully for user {UserId}", request.UserId);

                return Ok(new MobileDeviceRegistrationResponse
                {
                    Success = true,
                    Message = "Device registered successfully",
                    DeviceToken = request.Token,
                    Platform = request.Platform,
                    UserId = request.UserId,
                    ClubId = request.ClubId,
                    RegisteredAt = response.RegisteredAt
                });
            }
            else
            {
                _logger.LogWarning("Mobile device registration failed for user {UserId}: {Message}",
                    request.UserId, response.Message);

                return StatusCode(500, new ProblemDetails
                {
                    Title = "Device Registration Failed",
                    Detail = response.Message ?? "Failed to register device for push notifications.",
                    Status = 500
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during mobile device registration for user {UserId}", request.UserId);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Device Registration Error",
                Detail = "An unexpected error occurred while registering your device. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Unregister a device from push notifications (Mobile App Endpoint)
    /// </summary>
    /// <remarks>
    /// This endpoint allows mobile apps to unregister devices when users log out or uninstall the app.
    /// </remarks>
    /// <param name="request">The device unregistration request containing the token to remove</param>
    /// <response code="200">Device unregistered successfully</response>
    /// <response code="401">Unauthorized - missing or invalid JWT token</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("unregister")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> UnregisterDevice([FromBody] MobileDeviceUnregistrationRequest request)
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Device unregistration attempt without valid user ID in token");
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Error",
                    Detail = "Invalid authentication token.",
                    Status = 401
                });
            }

            _logger.LogInformation("Unregistering mobile device for user {UserId}", userId);

            // Remove the device token using existing service
            var success = await _pushNotificationService.RemoveDeviceTokenAsync(userId, request.Token);

            if (success)
            {
                _logger.LogInformation("Mobile device unregistered successfully for user {UserId}", userId);
                return Ok(new { message = "Device unregistered successfully" });
            }
            else
            {
                _logger.LogWarning("Mobile device unregistration failed for user {UserId}", userId);
                return StatusCode(500, new ProblemDetails
                {
                    Title = "Device Unregistration Failed",
                    Detail = "Failed to unregister device from push notifications.",
                    Status = 500
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during mobile device unregistration for user {UserId}",
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Device Unregistration Error",
                Detail = "An unexpected error occurred while unregistering your device. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Send bulk push notifications to all club members (Admin endpoint)
    /// </summary>
    /// <remarks>
    /// This endpoint allows club administrators to send push notifications to all active members
    /// who have registered devices with the mobile app. This is a Grow tier feature.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The bulk push notification request</param>
    /// <response code="200">Push notification sent successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="401">Unauthorized - missing or invalid JWT token</response>
    /// <response code="403">Forbidden - not authorized for this club or not Grow tier</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("/api/v1/clubs/{clubId}/communications/push")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(SendBulkPushNotificationResponse), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 403)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> SendBulkPushNotification(int clubId, [FromBody] SendBulkPushNotificationRequest request)
    {
        try
        {
            // Get the current user ID from the JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Bulk push notification attempt without valid user ID in token");
                return this.Unauthorized("Invalid authentication token.");
            }

            _logger.LogInformation("Sending bulk push notification for club {ClubId} by user {UserId}", clubId, userId);

            // Validate the request
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Send the bulk push notification
            var response = await _pushNotificationService.SendBulkPushNotificationAsync(clubId, userId, request);

            if (response.Success)
            {
                _logger.LogInformation("Bulk push notification sent successfully for club {ClubId}: {DeviceCount} devices, {UserCount} users",
                    clubId, response.DeviceCount, response.UserCount);

                return Ok(response);
            }
            else
            {
                _logger.LogWarning("Bulk push notification failed for club {ClubId}: {Message}", clubId, response.Message);

                return StatusCode(500, new ProblemDetails
                {
                    Title = "Push Notification Failed",
                    Detail = response.Message,
                    Status = 500
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during bulk push notification send for club {ClubId}", clubId);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Push Notification Error",
                Detail = "An unexpected error occurred while sending the push notification. Please try again.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Get push notification usage statistics for a club (Admin endpoint)
    /// </summary>
    /// <remarks>
    /// Returns information about push notification availability and member device registration status.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <response code="200">Usage statistics retrieved successfully</response>
    /// <response code="401">Unauthorized - missing or invalid JWT token</response>
    /// <response code="403">Forbidden - not authorized for this club or not Grow tier</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("/api/v1/clubs/{clubId}/communications/push/usage")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(PushNotificationUsageStatsResponse), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 403)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> GetPushNotificationUsageStats(int clubId)
    {
        try
        {
            _logger.LogInformation("Getting push notification usage stats for club {ClubId}", clubId);

            var stats = await _pushNotificationService.GetPushNotificationUsageStatsAsync(clubId);

            _logger.LogDebug("Push notification stats for club {ClubId}: {WithTokens}/{TotalActive} members have device tokens",
                clubId, stats.MembersWithDeviceTokens, stats.TotalActiveMembers);

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting push notification usage stats for club {ClubId}", clubId);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Usage Stats Error",
                Detail = "An unexpected error occurred while retrieving usage statistics. Please try again.",
                Status = 500
            });
        }
    }
}