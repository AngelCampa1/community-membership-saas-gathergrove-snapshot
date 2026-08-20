using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for public RSVP operations via email links
/// </summary>
[ApiController]
[Route("api/v1/rsvps")]
[Produces("application/json")]
public class RsvpController : ControllerBase
{
    private readonly IRsvpTokenService _rsvpTokenService;
    private readonly ILogger<RsvpController> _logger;

    public RsvpController(IRsvpTokenService rsvpTokenService, ILogger<RsvpController> logger)
    {
        _rsvpTokenService = rsvpTokenService;
        _logger = logger;
    }

    /// <summary>
    /// Processes an RSVP via a unique token from an email link
    /// </summary>
    /// <param name="token">The unique RSVP token from the email link</param>
    /// <returns>RSVP confirmation response</returns>
    /// <response code="200">RSVP processed successfully</response>
    /// <response code="400">Invalid or expired token</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("via-link")]
    [ProducesResponseType(typeof(RsvpViaLinkResponse), 200)]
    [ProducesResponseType(typeof(RsvpViaLinkResponse), 400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<RsvpViaLinkResponse>> ProcessRsvpViaLink([FromQuery] string token)
    {
        try
        {
            _logger.LogInformation("Processing RSVP via link with token");

            if (string.IsNullOrWhiteSpace(token))
            {
                _logger.LogWarning("RSVP token is missing or empty");
                return BadRequest(new RsvpViaLinkResponse
                {
                    Success = false,
                    Message = "RSVP token is required."
                });
            }

            var result = await _rsvpTokenService.ProcessRsvpViaTokenAsync(token);

            if (result.Success)
            {
                _logger.LogInformation("RSVP processed successfully for member {MemberName} and event {EventName}",
                    result.MemberName, result.EventName);
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("RSVP processing failed: {Message}", result.Message);
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing RSVP via link");
            return StatusCode(500, new RsvpViaLinkResponse
            {
                Success = false,
                Message = "There was an error processing your RSVP. Please try again later."
            });
        }
    }
}