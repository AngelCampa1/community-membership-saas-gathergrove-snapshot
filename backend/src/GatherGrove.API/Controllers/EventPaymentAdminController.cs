using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Admin endpoints for managing event payments
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/events/{eventId}/payments/admin")]
[Authorize(Policy = "ClubAdmin")]
public class EventPaymentAdminController : ControllerBase
{
    private readonly IEventPaymentAdminService _adminService;
    private readonly ILogger<EventPaymentAdminController> _logger;

    public EventPaymentAdminController(
        IEventPaymentAdminService adminService,
        ILogger<EventPaymentAdminController> logger)
    {
        _adminService = adminService;
        _logger = logger;
    }

    /// <summary>
    /// Get payment overview for an event
    /// </summary>
    /// <remarks>
    /// Returns comprehensive payment information including:
    /// - Total revenue and attendee count
    /// - Payment summary statistics (completed, pending, failed, refunded)
    /// - Detailed attendee list with payment status
    /// 
    /// Requires club admin access.
    /// </remarks>
    /// <param name="clubId">The club ID</param>
    /// <param name="eventId">The event ID</param>
    /// <response code="200">Returns payment overview</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not authorized - must be admin of the club</response>
    /// <response code="404">Event not found</response>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(EventPaymentOverviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventPaymentOverviewResponse>> GetPaymentOverview(
        [FromRoute] int clubId,
        [FromRoute] int eventId)
    {
        try
        {
            // Verify club access
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim");
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to access club {ClubId} but owns club {UserClubId}",
                    clubId, userClubId);
                return Forbid();
            }

            var overview = await _adminService.GetEventPaymentOverviewAsync(clubId, eventId);
            return Ok(overview);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request for payment overview");
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment overview for event {EventId}", eventId);
            return StatusCode(500, new { message = "An error occurred while retrieving payment overview" });
        }
    }

    /// <summary>
    /// Issue a refund for an event payment
    /// </summary>
    /// <remarks>
    /// Issues a refund via Stripe for a completed payment.
    /// 
    /// Requirements:
    /// - Payment must have been made via Stripe (has payment intent ID)
    /// - Payment status must be Succeeded
    /// - Refund amount must be positive and not exceed original payment
    /// 
    /// The RSVP payment status will be updated to Refunded.
    /// </remarks>
    /// <param name="clubId">The club ID</param>
    /// <param name="eventId">The event ID</param>
    /// <param name="request">Refund request details</param>
    /// <response code="200">Refund processed successfully</response>
    /// <response code="400">Invalid refund request</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not authorized - must be admin of the club</response>
    /// <response code="404">Event or RSVP not found</response>
    /// <response code="500">Stripe refund failed</response>
    [HttpPost("refund")]
    [ProducesResponseType(typeof(EventRefundResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<EventRefundResponse>> IssueRefund(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] IssueRefundRequest request)
    {
        try
        {
            // Verify club access
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim");
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to access club {ClubId} but owns club {UserClubId}",
                    clubId, userClubId);
                return Forbid();
            }

            // Ensure request has correct event ID
            request.EventId = eventId;

            var result = await _adminService.IssueRefundAsync(clubId, request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid refund request");
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot process refund");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error issuing refund for RSVP {RsvpId}", request.RsvpId);
            return StatusCode(500, new { message = "An error occurred while processing the refund" });
        }
    }

    /// <summary>
    /// Record a manual payment for an event
    /// </summary>
    /// <remarks>
    /// Records a manual payment (cash, check, Venmo, etc.) for a member.
    /// 
    /// If the member already has an RSVP for the event, it will be updated
    /// with the payment information. Otherwise, a new RSVP is created.
    /// 
    /// The RSVP status is set to Confirmed and payment status to Succeeded.
    /// </remarks>
    /// <param name="clubId">The club ID</param>
    /// <param name="eventId">The event ID</param>
    /// <param name="request">Manual payment details</param>
    /// <response code="200">Payment recorded successfully</response>
    /// <response code="400">Invalid payment request</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not authorized - must be admin of the club</response>
    /// <response code="404">Event or member not found</response>
    [HttpPost("manual-payment")]
    [ProducesResponseType(typeof(ManualPaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ManualPaymentResponse>> RecordManualPayment(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromBody] RecordManualPaymentRequest request)
    {
        try
        {
            // Verify club access
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim");
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to access club {ClubId} but owns club {UserClubId}",
                    clubId, userClubId);
                return Forbid();
            }

            // Ensure request has correct event ID
            request.EventId = eventId;

            var result = await _adminService.RecordManualPaymentAsync(clubId, request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid manual payment request");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording manual payment for member {MemberId}", request.MemberId);
            return StatusCode(500, new { message = "An error occurred while recording the payment" });
        }
    }

    /// <summary>
    /// Export payment data for an event
    /// </summary>
    /// <remarks>
    /// Exports all payment and attendee data for an event as CSV.
    /// 
    /// The export includes:
    /// - Attendee information (name, email, member status)
    /// - Payment details (status, amount, date, method)
    /// - Summary statistics
    /// 
    /// The file is returned as a downloadable CSV.
    /// </remarks>
    /// <param name="clubId">The club ID</param>
    /// <param name="eventId">The event ID</param>
    /// <param name="format">Export format (default: csv)</param>
    /// <response code="200">Returns CSV file</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not authorized - must be admin of the club</response>
    /// <response code="404">Event not found</response>
    [HttpGet("export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportPaymentData(
        [FromRoute] int clubId,
        [FromRoute] int eventId,
        [FromQuery] string format = "csv")
    {
        try
        {
            // Verify club access
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim");
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to access club {ClubId} but owns club {UserClubId}",
                    clubId, userClubId);
                return Forbid();
            }

            var request = new ExportPaymentDataRequest
            {
                EventId = eventId,
                Format = format
            };

            var fileData = await _adminService.ExportPaymentDataAsync(clubId, request);

            var fileName = $"event-{eventId}-payments-{DateTime.UtcNow:yyyyMMdd}.csv";

            return File(fileData, "text/csv", fileName);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid export request");
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting payment data for event {EventId}", eventId);
            return StatusCode(500, new { message = "An error occurred while exporting payment data" });
        }
    }
}

