using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// General API endpoints for event payments (for integration tests)
/// </summary>
[ApiController]
[Route("api/v1/event-payments")]
[Authorize(Policy = "ClubMember")]
public class EventPaymentsApiController : ControllerBase
{
    private readonly IEventPaymentService _eventPaymentService;
    private readonly IClubAuthorizationService _clubAuthorizationService;
    private readonly ILogger<EventPaymentsApiController> _logger;

    public EventPaymentsApiController(
        IEventPaymentService eventPaymentService,
        IClubAuthorizationService clubAuthorizationService,
        ILogger<EventPaymentsApiController> logger)
    {
        _eventPaymentService = eventPaymentService;
        _clubAuthorizationService = clubAuthorizationService;
        _logger = logger;
    }

    /// <summary>
    /// Process an event payment
    /// </summary>
    /// <param name="request">Payment request</param>
    /// <returns>Payment response</returns>
    [HttpPost]
    [ProducesResponseType(typeof(EventPaymentResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ProcessEventPayment([FromBody] PayEventRequest request)
    {
        try
        {
            // Get current user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                _logger.LogWarning("No valid user ID found in claims for event payment");
                return Unauthorized(new { message = "Invalid authentication token" });
            }

            // Verify club access - check both possible claim names
            var clubIdClaim = User.FindFirst("ClubId")?.Value ?? User.FindFirst("club_id")?.Value;
            if (string.IsNullOrEmpty(clubIdClaim) || !int.TryParse(clubIdClaim, out var userClubId))
            {
                _logger.LogWarning("No valid club ID found in claims for event payment");
                return Unauthorized(new { message = "Invalid club authentication" });
            }

            _logger.LogInformation("User {UserId} attempting to pay for event {EventId}",
                userId, request.EventId);

            // Process payment
            var response = await _eventPaymentService.PayForEventAsync(userId, request);

            _logger.LogInformation("Event payment successful for user {UserId}, event {EventId}, payment {PaymentId}",
                userId, request.EventId, response.PaymentId);

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument for event payment: {Message}", ex.Message);

            if (ex.Message.Contains("not found"))
            {
                return NotFound(new { message = ex.Message });
            }

            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation for event payment: {Message}", ex.Message);

            if (ex.Message.Contains("already paid"))
            {
                return Conflict(new { message = ex.Message });
            }

            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing event payment");
            return StatusCode(500, new { message = "An error occurred while processing your payment. Please try again." });
        }
    }

    /// <summary>
    /// Get payment history for an event
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <returns>List of payments</returns>
    [HttpGet("event/{eventId}/history")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<EventPaymentDetailsDto>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetEventPaymentHistory(int eventId)
    {
        try
        {
            var clubId = await RequireAdminClubAsync();
            if (!clubId.HasValue)
                return Forbid();

            var payments = await _eventPaymentService.GetPaymentHistoryAsync(eventId, clubId.Value);
            return Ok(payments);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized payment history request for event {EventId}", eventId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment history for event {EventId}", eventId);
            return StatusCode(500, new { message = "An error occurred while retrieving payment history" });
        }
    }

    /// <summary>
    /// Get payment details
    /// </summary>
    /// <param name="paymentId">Payment ID</param>
    /// <returns>Payment details</returns>
    [HttpGet("{paymentId}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(EventPaymentDetailsDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetEventPaymentDetails(string paymentId)
    {
        try
        {
            var clubId = await RequireAdminClubAsync();
            if (!clubId.HasValue)
                return Forbid();

            var payment = await _eventPaymentService.GetPaymentDetailsAsync(paymentId, clubId.Value);

            if (payment == null)
            {
                return NotFound(new { message = "Payment not found" });
            }

            return Ok(payment);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized payment details request for payment {PaymentId}", paymentId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment details for payment {PaymentId}", paymentId);
            return StatusCode(500, new { message = "An error occurred while retrieving payment details" });
        }
    }

    /// <summary>
    /// Process a refund for a payment
    /// </summary>
    /// <param name="paymentId">Payment ID</param>
    /// <param name="request">Refund request</param>
    /// <returns>Refund response</returns>
    [HttpPost("{paymentId}/refund")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(EventPaymentRefundResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RefundEventPayment(string paymentId, [FromBody] RefundRequest request)
    {
        try
        {
            var clubId = await RequireAdminClubAsync();
            if (!clubId.HasValue)
                return Forbid();

            var refundResponse = await _eventPaymentService.ProcessRefundAsync(paymentId, request.Reason, clubId.Value);
            return Ok(refundResponse);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized refund request for payment {PaymentId}", paymentId);
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Payment not found for refund: {PaymentId}", paymentId);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot refund payment: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing refund for payment {PaymentId}", paymentId);
            return StatusCode(500, new { message = "An error occurred while processing the refund" });
        }
    }

    private async Task<int?> RequireAdminClubAsync()
    {
        var clubId = _clubAuthorizationService.GetClubIdFromClaims(User);
        if (!clubId.HasValue)
            throw new UnauthorizedAccessException("Invalid or missing club ID in token");

        if (!await _clubAuthorizationService.CanAccessClubAsAdminAsync(User, clubId.Value))
            throw new UnauthorizedAccessException("Admin access required for payment administration");

        return clubId.Value;
    }
}

/// <summary>
/// Simple refund request for test compatibility
/// </summary>
public class RefundRequest
{
    public string Reason { get; set; } = string.Empty;
}
