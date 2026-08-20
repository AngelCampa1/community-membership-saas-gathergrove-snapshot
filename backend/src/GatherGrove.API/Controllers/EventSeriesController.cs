using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Services.TierValidation;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using System.Security.Claims;
using ApplicationClubAuth = GatherGrove.Application.Services.IClubAuthorizationService;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing event series
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/event-series")]
[Authorize]
public class EventSeriesController : ControllerBase
{
    private readonly IEventSeriesService _eventSeriesService;
    private readonly ApplicationClubAuth _clubAuthorizationService;
    private readonly ITierGateService _tierGateService;
    private readonly IMemberService _memberService;
    private readonly ILogger<EventSeriesController> _logger;

    public EventSeriesController(
        IEventSeriesService eventSeriesService,
        ApplicationClubAuth clubAuthorizationService,
        ITierGateService tierGateService,
        IMemberService memberService,
        ILogger<EventSeriesController> logger)
    {
        _eventSeriesService = eventSeriesService;
        _clubAuthorizationService = clubAuthorizationService;
        _tierGateService = tierGateService;
        _memberService = memberService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new event series for a club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The event series creation request</param>
    /// <returns>The created event series</returns>
    [HttpPost]
    [ProducesResponseType(typeof(EventSeriesResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CreateEventSeries(
        [FromRoute] int clubId,
        [FromBody] CreateEventSeriesRequest request)
    {
        try
        {
            _logger.LogInformation("Creating event series '{Name}' for club {ClubId}", request.Name, clubId);

            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            // Check tier restrictions for event series (unlimited tier feature)
            var tierValidation = await _tierGateService.ValidateFeatureAccessAsync(clubId, "EventSeries");
            if (!tierValidation.HasAccess)
            {
                return Forbid("Feature not available for your tier");
            }

            var response = await _eventSeriesService.CreateEventSeriesAsync(clubId, request);

            _logger.LogInformation("Event series '{Name}' created with ID {Id}", response.Name, response.Id);

            return CreatedAtAction(
                nameof(GetEventSeries),
                new { clubId, seriesId = response.Id },
                response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for creating event series: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating event series for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while creating the event series");
        }
    }

    /// <summary>
    /// Gets all event series for a club
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <returns>List of event series for the club</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<EventSeriesResponse>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetEventSeriesByClub([FromRoute] int clubId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var eventSeries = await _eventSeriesService.GetEventSeriesByClubAsync(clubId);

            return Ok(eventSeries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event series for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving event series");
        }
    }

    /// <summary>
    /// Gets a specific event series by ID
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="seriesId">The ID of the event series</param>
    /// <returns>The event series details</returns>
    [HttpGet("{seriesId}")]
    [ProducesResponseType(typeof(EventSeriesResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetEventSeries(
        [FromRoute] int clubId,
        [FromRoute] int seriesId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var eventSeries = await _eventSeriesService.GetEventSeriesAsync(seriesId);
            if (eventSeries == null)
            {
                return NotFound($"Event series with ID {seriesId} not found");
            }

            // Ensure the series belongs to the specified club
            if (eventSeries.ClubId != clubId)
            {
                return NotFound($"Event series with ID {seriesId} not found in club {clubId}");
            }

            return Ok(eventSeries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event series {SeriesId} for club {ClubId}", seriesId, clubId);
            return StatusCode(500, "An error occurred while retrieving the event series");
        }
    }

    /// <summary>
    /// Updates an existing event series
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="seriesId">The ID of the event series</param>
    /// <param name="request">The update request</param>
    /// <returns>The updated event series</returns>
    [HttpPut("{seriesId}")]
    [ProducesResponseType(typeof(EventSeriesResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateEventSeries(
        [FromRoute] int clubId,
        [FromRoute] int seriesId,
        [FromBody] UpdateEventSeriesRequest request)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            var updatedSeries = await _eventSeriesService.UpdateEventSeriesAsync(seriesId, request);
            if (updatedSeries == null)
            {
                return NotFound($"Event series with ID {seriesId} not found");
            }

            // Ensure the series belongs to the specified club
            if (updatedSeries.ClubId != clubId)
            {
                return NotFound($"Event series with ID {seriesId} not found in club {clubId}");
            }

            _logger.LogInformation("Event series {SeriesId} updated for club {ClubId}", seriesId, clubId);

            return Ok(updatedSeries);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for updating event series {SeriesId}: {Message}", seriesId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating event series {SeriesId} for club {ClubId}", seriesId, clubId);
            return StatusCode(500, "An error occurred while updating the event series");
        }
    }

    /// <summary>
    /// Deletes an event series
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="seriesId">The ID of the event series</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{seriesId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteEventSeries(
        [FromRoute] int clubId,
        [FromRoute] int seriesId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            // Verify the series exists and belongs to the club
            var eventSeries = await _eventSeriesService.GetEventSeriesAsync(seriesId);
            if (eventSeries == null || eventSeries.ClubId != clubId)
            {
                return NotFound($"Event series with ID {seriesId} not found in club {clubId}");
            }

            await _eventSeriesService.DeleteEventSeriesAsync(seriesId);

            _logger.LogInformation("Event series {SeriesId} deleted for club {ClubId}", seriesId, clubId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting event series {SeriesId} for club {ClubId}", seriesId, clubId);
            return StatusCode(500, "An error occurred while deleting the event series");
        }
    }

    /// <summary>
    /// Register for an event series (mobile-compatible endpoint with bulk RSVP)
    /// Mobile expects: POST .../event-series/{seriesId}/register
    /// Registers the authenticated user for all upcoming events in the series
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="seriesId">The ID of the event series</param>
    /// <param name="request">Optional bulk RSVP request (defaults used if not provided)</param>
    /// <returns>Bulk RSVP result with success/error/skip counts</returns>
    [HttpPost("{seriesId}/register")]
    [ProducesResponseType(typeof(BulkSeriesRsvpResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RegisterForSeries(
        [FromRoute] int clubId,
        [FromRoute] int seriesId,
        [FromBody] BulkSeriesRsvpRequest? request = null)
    {
        try
        {
            _logger.LogInformation("Member registering for event series {SeriesId} in club {ClubId}",
                seriesId, clubId);

            // Validate club authorization
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            // Get current user's email from JWT to lookup member
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized("User email not found in token");
            }

            // Look up member by email
            var member = await _memberService.GetMemberByEmailAsync(clubId, userEmail);
            if (member == null)
            {
                return NotFound($"No member found for email {userEmail} in club {clubId}");
            }

            // Use provided request or create default
            var rsvpRequest = request ?? new BulkSeriesRsvpRequest
            {
                MemberId = member.Id,
                Status = RsvpStatus.Confirmed,
                SkipFullEvents = true,
                UpdateExisting = false
            };

            // Ensure member ID is set to current user
            if (rsvpRequest.MemberId == 0)
            {
                rsvpRequest.MemberId = member.Id;
            }

            // Call bulk RSVP service method
            var result = await _eventSeriesService.RegisterMemberForSeriesAsync(clubId, seriesId, rsvpRequest);

            _logger.LogInformation(
                "Bulk RSVP complete for series {SeriesId}: {Success} succeeded, {Error} errors, {Skipped} skipped",
                seriesId, result.SuccessCount, result.ErrorCount, result.SkippedCount);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for registering for series {SeriesId}: {Message}",
                seriesId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering for series {SeriesId} in club {ClubId}",
                seriesId, clubId);
            return StatusCode(500, "An error occurred while registering for the event series");
        }
    }

    /// <summary>
    /// Generates events from an event series based on its recurrence pattern
    /// </summary>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="seriesId">The ID of the event series</param>
    /// <returns>List of generated events</returns>
    [HttpPost("{seriesId}/generate-events")]
    [ProducesResponseType(typeof(List<EventResponse>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GenerateSeriesEvents(
        [FromRoute] int clubId,
        [FromRoute] int seriesId)
    {
        try
        {
            // Validate club authorization
            // BUG FIX: Use int.TryParse instead of int.Parse to avoid FormatException
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!await _clubAuthorizationService.ValidateClubAccessAsync(clubId, userId))
            {
                return Forbid("User not authorized for this club");
            }

            // Verify the series exists and belongs to the club
            var eventSeries = await _eventSeriesService.GetEventSeriesAsync(seriesId);
            if (eventSeries == null || eventSeries.ClubId != clubId)
            {
                return NotFound($"Event series with ID {seriesId} not found in club {clubId}");
            }

            var generatedEvents = await _eventSeriesService.GenerateSeriesEventsAsync(seriesId);

            _logger.LogInformation("Generated {Count} events for series {SeriesId} in club {ClubId}",
                generatedEvents.Count, seriesId, clubId);

            // Convert to EventResponse DTOs (you'll need to implement this mapping)
            var eventResponses = generatedEvents.Select(e => new EventResponse
            {
                Id = e.Id,
                ClubId = e.ClubId,
                Name = e.Name,
                EventDateTime = e.EventDateTime,
                Location = e.Location,
                Description = e.Description,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            }).ToList();

            return Ok(eventResponses);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for generating events from series {SeriesId}: {Message}", seriesId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating events for series {SeriesId} in club {ClubId}", seriesId, clubId);
            return StatusCode(500, "An error occurred while generating events from the series");
        }
    }
}