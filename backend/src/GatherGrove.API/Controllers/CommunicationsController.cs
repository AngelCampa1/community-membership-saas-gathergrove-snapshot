using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GatherGrove.Application.DTOs.Communications;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Data;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace GatherGrove.API.Controllers;

/// <summary>
/// API controller for managing club communications
/// BUG FIX #21: Added rate limiting to prevent abuse of bulk communication features
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/communications")]
[Authorize]
[EnableRateLimiting("StrictApi")]
public class CommunicationsController : ControllerBase
{
    private readonly ICommunicationsService _communicationsService;
    private readonly ILogger<CommunicationsController> _logger;
    private readonly GatherGroveDbContext _context;

    public CommunicationsController(
        ICommunicationsService communicationsService,
        ILogger<CommunicationsController> logger,
        GatherGroveDbContext context)
    {
        _communicationsService = communicationsService;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Sends a bulk email to all active members of the club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">The email content</param>
    /// <returns>Response indicating success and details</returns>
    /// <response code="200">Email sent successfully</response>
    /// <response code="400">Invalid request or validation errors</response>
    /// <response code="403">Email limit exceeded for Sprout tier</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("email")]
    public async Task<ActionResult<SendBulkEmailResponse>> SendBulkEmail(int clubId, [FromBody] SendBulkEmailRequest request)
    {
        try
        {
            _logger.LogInformation("Bulk email request received for club {ClubId}", clubId);

            // Validate that user has access to this club
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Send email attempt without valid user ID in token");
                return Unauthorized("Invalid authentication token");
            }

            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user {UserId}", userId);
                return StatusCode(403, new { message = "You do not have permission to send communications for this club" });
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User {UserId} attempted to send email for club {ClubId} but owns club {UserClubId}", userId, clubId, userClubId);
                return StatusCode(403, new { message = "You do not have permission to send communications for this club" });
            }

            // Validate the request
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _communicationsService.SendBulkEmailAsync(clubId, userId, request);

            if (!response.Success)
            {
                if (response.Message.Contains("exceed") && response.Message.Contains("monthly allowance"))
                {
                    return StatusCode(429, response); // Too Many Requests for rate limiting
                }

                if (response.Message.Contains("not found"))
                {
                    return NotFound(response);
                }

                return BadRequest(response);
            }

            _logger.LogInformation("Bulk email sent successfully for club {ClubId} to {RecipientCount} recipients",
                clubId, response.RecipientCount);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending bulk email for club {ClubId}", clubId);
            return StatusCode(500, new SendBulkEmailResponse
            {
                Success = false,
                Message = "An internal error occurred while sending the email"
            });
        }
    }

    /// <summary>
    /// Sends a unified outreach to selected members via email or push notification
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">The outreach request with recipients, message, and type</param>
    /// <returns>Response indicating success and details</returns>
    /// <response code="200">Outreach sent successfully</response>
    /// <response code="400">Invalid request or validation errors</response>
    /// <response code="403">User does not have access to this club</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("outreach")]
    public async Task<ActionResult<SendOutreachResponse>> SendOutreach(int clubId, [FromBody] SendOutreachRequest request)
    {
        try
        {
            _logger.LogInformation("Outreach request received for club {ClubId}, type: {Type}", clubId, request.Type);

            // Validate that user has access to this club
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Send outreach attempt without valid user ID in token");
                return Unauthorized("Invalid authentication token");
            }

            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user {UserId}", userId);
                return StatusCode(403, new { message = "You do not have permission to send communications for this club" });
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User {UserId} attempted to send outreach for club {ClubId} but owns club {UserClubId}", userId, clubId, userClubId);
                return StatusCode(403, new { message = "You do not have permission to send communications for this club" });
            }

            // Validate the request
            if (request.SelectedMemberIds == null || request.SelectedMemberIds.Count == 0)
            {
                return BadRequest(new { message = "At least one member must be selected" });
            }

            // Validate type
            var validTypes = new[] { "email", "notification" };
            if (!validTypes.Contains(request.Type?.ToLower()))
            {
                return BadRequest(new { message = "Type must be 'email' or 'notification'" });
            }

            // Email requires subject
            if (request.Type?.ToLower() == "email" && string.IsNullOrWhiteSpace(request.Subject))
            {
                return BadRequest(new { message = "Subject is required for email outreach" });
            }

            var response = await _communicationsService.SendOutreachAsync(clubId, userId, request);

            _logger.LogInformation("Outreach sent successfully for club {ClubId}: {SentCount} recipients",
                clubId, response.SentCount);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending outreach for club {ClubId}", clubId);
            return StatusCode(500, new SendOutreachResponse
            {
                Success = false,
                Message = "An internal error occurred while sending the outreach"
            });
        }
    }

    /// <summary>
    /// Gets the current email usage statistics for the club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Email usage statistics including limits and current usage</returns>
    /// <response code="200">Usage statistics retrieved successfully</response>
    /// <response code="403">User does not have access to this club</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("email/usage")]
    public async Task<ActionResult<EmailUsageStatsResponse>> GetEmailUsageStats(int clubId)
    {
        try
        {
            _logger.LogInformation("Email usage stats request for club {ClubId}", clubId);

            // Validate that user has access to this club
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Email usage stats attempt without valid user ID in token");
                return Unauthorized("Invalid authentication token");
            }

            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user {UserId}", userId);
                return StatusCode(403, new { message = "You do not have permission to view statistics for this club" });
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User {UserId} attempted to access email usage for club {ClubId} but owns club {UserClubId}", userId, clubId, userClubId);
                return StatusCode(403, new { message = "You do not have permission to view statistics for this club" });
            }

            var stats = await _communicationsService.GetEmailUsageStatsAsync(clubId);

            _logger.LogInformation("Email usage stats retrieved for club {ClubId}: {EmailsSent}/{Limit} emails",
                clubId, stats.EmailsSentThisMonth, stats.MonthlyEmailLimit ?? -1);

            return Ok(stats);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            _logger.LogWarning("Club not found: {ClubId}", clubId);
            return NotFound(new { message = "Club not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving email usage stats for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An internal error occurred while retrieving usage statistics" });
        }
    }

    /// <summary>
    /// SMS messaging is no longer supported.
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Response indicating success and details</returns>
    /// <response code="410">SMS messaging is no longer supported</response>
    [HttpPost("sms")]
    public ActionResult SendBulkSms(int clubId)
    {
        return StatusCode(StatusCodes.Status410Gone, new { message = "SMS messaging is no longer supported." });

    }

    /// <summary>
    /// SMS usage statistics are no longer supported.
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Gone response</returns>
    /// <response code="410">SMS messaging is no longer supported</response>
    [HttpGet("sms/usage")]
    public ActionResult GetSmsUsageStats(int clubId)
    {
        return StatusCode(StatusCodes.Status410Gone, new { message = "SMS messaging is no longer supported." });

    }

    /// <summary>
    /// WhatsApp messaging is no longer supported.
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Response indicating success and details</returns>
    /// <response code="410">WhatsApp messaging is no longer supported</response>
    [HttpPost("whatsapp")]
    public ActionResult SendBulkWhatsApp(int clubId)
    {
        return StatusCode(StatusCodes.Status410Gone, new { message = "WhatsApp messaging is no longer supported." });

    }

    /// <summary>
    /// WhatsApp templates are no longer supported.
    /// </summary>
    /// <returns>Gone response</returns>
    /// <response code="410">WhatsApp messaging is no longer supported</response>
    [HttpGet("whatsapp/templates")]
    public ActionResult GetWhatsAppTemplates(int clubId)
    {
        return StatusCode(StatusCodes.Status410Gone, new { message = "WhatsApp messaging is no longer supported." });

    }

    /// <summary>
    /// Gets the communication history for a club with pagination and filtering
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 20, max: 100)</param>
    /// <param name="communicationType">Filter by communication type (Email or Push)</param>
    /// <param name="startDate">Filter by start date (ISO format)</param>
    /// <param name="endDate">Filter by end date (ISO format)</param>
    /// <returns>Paginated communication history</returns>
    /// <response code="200">History retrieved successfully</response>
    /// <response code="400">Invalid request parameters</response>
    /// <response code="403">User does not have access to this club</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("history")]
    public async Task<ActionResult<GetCommunicationHistoryResponse>> GetCommunicationHistory(
        int clubId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? communicationType = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            _logger.LogInformation("Communication history request for club {ClubId}, page {Page}, pageSize {PageSize}",
                clubId, page, pageSize);

            // Validate that user has access to this club
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Communication history attempt without valid user ID in token");
                return Unauthorized("Invalid authentication token");
            }

            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user {UserId}", userId);
                return StatusCode(403, new { message = "You do not have permission to view communication history for this club" });
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User {UserId} attempted to access communication history for club {ClubId} but owns club {UserClubId}", userId, clubId, userClubId);
                return StatusCode(403, new { message = "You do not have permission to view communication history for this club" });
            }

            // Create the request object
            var request = new GetCommunicationHistoryRequest
            {
                Page = page,
                PageSize = pageSize,
                CommunicationType = communicationType,
                StartDate = startDate,
                EndDate = endDate
            };

            // Validate the request
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _communicationsService.GetCommunicationHistoryAsync(clubId, request);

            _logger.LogInformation("Communication history retrieved for club {ClubId}: {Count} items, page {Page}/{TotalPages}",
                clubId, response.Communications.Count, response.CurrentPage, response.TotalPages);

            return Ok(response);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            _logger.LogWarning("Club not found: {ClubId}", clubId);
            return NotFound(new { message = "Club not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving communication history for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An internal error occurred while retrieving communication history" });
        }
    }

    /// <summary>
    /// Sends a bulk push notification to club members with registered devices
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">The push notification content</param>
    /// <returns>Response indicating success and details</returns>
    /// <response code="200">Push notification sent successfully</response>
    /// <response code="400">Invalid request or validation errors</response>
    /// <response code="403">Push notifications not available for Sprout tier</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("push")]
    public async Task<ActionResult<SendPushNotificationResponse>> SendBulkPushNotification(int clubId, [FromBody] SendPushNotificationRequest request)
    {
        try
        {
            _logger.LogInformation("Bulk push notification request received for club {ClubId}", clubId);

            // Validate that user has access to this club
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Send push notification attempt without valid user ID in token");
                return Unauthorized("Invalid authentication token");
            }

            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user {UserId}", userId);
                return StatusCode(403, new { message = "You do not have permission to send push notifications for this club" });
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User {UserId} attempted to send push notification for club {ClubId} but owns club {UserClubId}", userId, clubId, userClubId);
                return StatusCode(403, new { message = "You do not have permission to send push notifications for this club" });
            }

            // Validate the request
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate membership type IDs if provided
            if (request.MemberTypeIds != null && request.MemberTypeIds.Any())
            {
                // Ensure all membership type IDs belong to this club
                var validMembershipTypeIds = await _context.MembershipTypes
                    .AsNoTracking()
                    .Where(mt => mt.ClubId == clubId && mt.IsActive)
                    .Select(mt => mt.Id)
                    .ToListAsync();

                var invalidIds = request.MemberTypeIds.Except(validMembershipTypeIds).ToList();
                if (invalidIds.Any())
                {
                    _logger.LogWarning("Invalid membership type IDs provided for club {ClubId}: {InvalidIds}", clubId, string.Join(", ", invalidIds));
                    return BadRequest(new { message = $"Invalid membership type IDs: {string.Join(", ", invalidIds)}" });
                }
            }

            var response = await _communicationsService.SendBulkPushNotificationAsync(clubId, userId, request);

            if (!response.Success)
            {
                if (response.Message.Contains("not found"))
                {
                    return NotFound(response);
                }

                return BadRequest(response);
            }

            _logger.LogInformation("Bulk push notification sent successfully for club {ClubId} to {UserCount} users ({DeviceCount} devices)",
                clubId, response.UserCount, response.DeviceCount);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending bulk push notification for club {ClubId}", clubId);
            return StatusCode(500, new SendPushNotificationResponse
            {
                Success = false,
                Message = "An internal error occurred while sending the push notification"
            });
        }
    }

    /// <summary>
    /// Gets the push notification usage statistics for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Push notification usage statistics</returns>
    /// <response code="200">Usage statistics retrieved successfully</response>
    /// <response code="403">User does not have permission for this club</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("push/usage")]
    public async Task<ActionResult<PushNotificationUsageStatsResponse>> GetPushNotificationUsageStats(int clubId)
    {
        try
        {
            // Validate that user has access to this club
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogWarning("Push notification usage stats request without valid user ID in token");
                return Unauthorized("Invalid authentication token");
            }

            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user {UserId}", userId);
                return StatusCode(403, new { message = "You do not have permission to view push notification usage for this club" });
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User {UserId} attempted to view push notification usage for club {ClubId} but owns club {UserClubId}", userId, clubId, userClubId);
                return StatusCode(403, new { message = "You do not have permission to view push notification usage for this club" });
            }

            var response = await _communicationsService.GetPushNotificationUsageStatsAsync(clubId);

            _logger.LogInformation("Push notification usage stats retrieved for club {ClubId}: {MembersWithDevices}/{TotalActiveMembers} members, {TotalDevices} devices",
                clubId, response.MembersWithDeviceTokens, response.TotalActiveMembers, response.TotalDeviceTokens);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving push notification usage stats for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An internal error occurred while retrieving push notification usage statistics" });
        }
    }
}
