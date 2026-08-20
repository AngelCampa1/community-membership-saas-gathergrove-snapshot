using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Public API endpoints for non-member event payments (authentication required)
/// </summary>
[ApiController]
[Route("api/v1/public/events")]
[Authorize]
public class PublicEventPaymentsController : ControllerBase
{
    private readonly INonMemberEventPaymentService _paymentService;
    private readonly ILogger<PublicEventPaymentsController> _logger;

    public PublicEventPaymentsController(
        INonMemberEventPaymentService paymentService,
        ILogger<PublicEventPaymentsController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    /// <summary>
    /// Process non-member event payment with optional membership upgrade and account creation
    /// </summary>
    /// <param name="request">Payment request with guest information and options</param>
    /// <returns>Payment confirmation with details</returns>
    /// <response code="200">Payment processed successfully</response>
    /// <response code="400">Invalid request or validation error</response>
    /// <response code="402">Payment processing failed</response>
    /// <response code="404">Event not found</response>
    /// <response code="409">Duplicate registration (already paid)</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("pay")]
    [ProducesResponseType(typeof(NonMemberEventPaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status402PaymentRequired)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<NonMemberEventPaymentResponse>> PayForEvent([FromBody] NonMemberEventPaymentRequest request)
    {
        try
        {
            _logger.LogInformation("Processing non-member payment request for event {EventId}, guest {GuestEmail}",
                request.EventId, request.GuestEmail);

            var response = await _paymentService.ProcessNonMemberEventPaymentAsync(request);

            _logger.LogInformation("Successfully processed non-member payment for event {EventId}, RSVP {RsvpId}",
                request.EventId, response.RsvpId);

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request for non-member event payment");
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid Request",
                Detail = ex.Message,
                Instance = HttpContext.Request.Path
            });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already registered") || ex.Message.Contains("already paid"))
        {
            _logger.LogWarning(ex, "Duplicate payment attempt for event {EventId}", request.EventId);
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Duplicate Registration",
                Detail = ex.Message,
                Instance = HttpContext.Request.Path
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Operation failed for non-member event payment");
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Operation Failed",
                Detail = ex.Message,
                Instance = HttpContext.Request.Path
            });
        }
        catch (Stripe.StripeException ex)
        {
            _logger.LogError(ex, "Stripe payment failed for non-member event payment");
            return StatusCode(StatusCodes.Status402PaymentRequired, new ProblemDetails
            {
                Status = StatusCodes.Status402PaymentRequired,
                Title = "Payment Failed",
                Detail = $"Payment processing failed: {ex.Message}",
                Instance = HttpContext.Request.Path
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing non-member event payment");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Internal Server Error",
                Detail = "An unexpected error occurred while processing your payment. Please try again later.",
                Instance = HttpContext.Request.Path
            });
        }
    }

    /// <summary>
    /// Get available membership types for a club hosting the event
    /// </summary>
    /// <param name="eventId">Event ID to get membership types for</param>
    /// <returns>List of available membership types</returns>
    /// <response code="200">Membership types retrieved successfully</response>
    /// <response code="404">Event not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("{eventId}/membership-types")]
    [ProducesResponseType(typeof(List<MembershipTypeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<MembershipTypeResponse>>> GetMembershipTypes([FromRoute] int eventId)
    {
        try
        {
            _logger.LogInformation("Getting membership types for event {EventId}", eventId);

            var membershipTypes = await _paymentService.GetAvailableMembershipTypesForEventAsync(eventId);

            _logger.LogInformation("Found {Count} membership types for event {EventId}",
                membershipTypes.Count, eventId);

            return Ok(membershipTypes);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Event {EventId} not found", eventId);
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Event Not Found",
                Detail = ex.Message,
                Instance = HttpContext.Request.Path
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting membership types for event {EventId}", eventId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Internal Server Error",
                Detail = "An unexpected error occurred while retrieving membership types. Please try again later.",
                Instance = HttpContext.Request.Path
            });
        }
    }
}
