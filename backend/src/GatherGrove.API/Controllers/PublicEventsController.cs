using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Public controller for accessing event information via payment tokens
/// NO AUTHENTICATION REQUIRED - Publicly accessible endpoints
/// Rate limiting applied via middleware
/// </summary>
[ApiController]
[Route("api/public/events")]
[Produces("application/json")]
public class PublicEventsController : ControllerBase
{
    private readonly IEventTokenService _tokenService;
    private readonly ILogger<PublicEventsController> _logger;

    public PublicEventsController(
        IEventTokenService tokenService,
        ILogger<PublicEventsController> logger)
    {
        _tokenService = tokenService;
        _logger = logger;
    }

    /// <summary>
    /// Get event details by payment token (public access)
    /// </summary>
    /// <param name="token">The payment token for the event</param>
    /// <returns>Public event details if token is valid</returns>
    /// <response code="200">Returns the event details</response>
    /// <response code="400">If the token is null or empty</response>
    /// <response code="404">If the event is not found</response>
    /// <response code="500">If an error occurs</response>
    [HttpGet("{token}")]
    [ProducesResponseType(typeof(PublicEventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetEventByToken([FromRoute] string? token)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(token))
            {
                _logger.LogWarning("Invalid token provided - null or empty");
                return BadRequest(new { error = "Payment token is required" });
            }

            _logger.LogInformation("Public access request for event with token");

            // Validate token and get event
            var eventEntity = await _tokenService.ValidatePaymentTokenAsync(token);

            if (eventEntity == null)
            {
                _logger.LogWarning("Event not found for provided token");
                return NotFound(new { error = "Event not found or invalid payment link" });
            }

            // Map to public DTO (excludes sensitive internal IDs)
            var publicDto = new PublicEventDto
            {
                Name = eventEntity.Name,
                EventDateTime = eventEntity.EventDateTime,
                Location = eventEntity.Location,
                Description = eventEntity.Description,
                MemberPrice = eventEntity.MemberPrice,
                NonMemberPrice = eventEntity.NonMemberPrice,
                Currency = eventEntity.Currency,
                IsFree = eventEntity.IsFree,
                ClubName = eventEntity.Club?.Name ?? "Unknown Club",
                MaxCapacity = eventEntity.MaxCapacity,
                EarlyBirdPrice = eventEntity.EarlyBirdPrice,
                EarlyBirdDeadline = eventEntity.EarlyBirdDeadline,
                IsEarlyBirdActive = eventEntity.IsEarlyBirdActive
            };

            _logger.LogInformation("Successfully retrieved public event details");
            return Ok(publicDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving event by payment token");
            return StatusCode(500, new { error = "An error occurred while retrieving the event" });
        }
    }
}