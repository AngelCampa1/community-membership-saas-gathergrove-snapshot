using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for member event payment operations (EC-03)
/// </summary>
[ApiController]
[Route("api/v1/users/me/events")]
[Authorize(Policy = "ClubMember")]
public class EventPaymentsController : ControllerBase
{
    private readonly IEventPaymentService _eventPaymentService;
    private readonly ILogger<EventPaymentsController> _logger;

    public EventPaymentsController(
        IEventPaymentService eventPaymentService,
        ILogger<EventPaymentsController> logger)
    {
        _eventPaymentService = eventPaymentService;
        _logger = logger;
    }

    /// <summary>
    /// Pay for an event (member self-service payment)
    /// </summary>
    /// <remarks>
    /// Allows an authenticated member to pay for a paid event at member pricing.
    /// Creates an RSVP automatically upon successful payment and sends confirmation email.
    /// 
    /// Sample request:
    /// 
    ///     POST /api/v1/users/me/events/pay
    ///     {
    ///        "eventId": 1,
    ///        "paymentMethodId": "pm_1234567890abcdef"
    ///     }
    /// 
    /// </remarks>
    /// <param name="request">Payment request with event ID and Stripe payment method ID</param>
    /// <response code="200">Payment successful, returns confirmation details</response>
    /// <response code="400">Invalid request or event is free</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not a member of the club</response>
    /// <response code="404">Event not found</response>
    /// <response code="409">Already paid for this event</response>
    /// <response code="402">Payment failed</response>
    [HttpPost("pay")]
    [ProducesResponseType(typeof(EventPaymentResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    [ProducesResponseType(402)]
    public async Task<IActionResult> PayForEvent([FromBody] PayEventRequest request)
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

            _logger.LogInformation("User {UserId} attempting to pay for event {EventId}",
                userId, request.EventId);

            // Validate request
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Process payment
            var response = await _eventPaymentService.PayForEventAsync(userId, request);

            _logger.LogInformation("Event payment successful for user {UserId}, event {EventId}, payment {PaymentId}",
                userId, request.EventId, response.PaymentId);

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument for event payment: {Message}", ex.Message);

            // Determine appropriate status code based on message
            if (ex.Message.Contains("not found"))
            {
                return NotFound(new { message = ex.Message });
            }
            else if (ex.Message.Contains("Member profile not found"))
            {
                return StatusCode(403, new { message = ex.Message });
            }

            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation for event payment: {Message}", ex.Message);

            // Determine status code based on message
            if (ex.Message.Contains("already paid"))
            {
                return Conflict(new { message = ex.Message });
            }
            else if (ex.Message.Contains("does not require payment") ||
                     ex.Message.Contains("not configured online payments"))
            {
                return BadRequest(new { message = ex.Message });
            }
            else if (ex.Message.Contains("Payment failed") ||
                     ex.Message.Contains("Payment requires additional authentication"))
            {
                return StatusCode(402, new { message = ex.Message });
            }
            else if (ex.Message.Contains("must be a member"))
            {
                return StatusCode(403, new { message = ex.Message });
            }

            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing event payment for user, event {EventId}",
                request.EventId);
            return StatusCode(500, new { message = "An error occurred while processing your payment. Please try again." });
        }
    }
}

