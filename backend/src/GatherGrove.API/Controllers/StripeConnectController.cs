using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using System.Security.Claims;
using GatherGrove.Application.Configuration;
using Microsoft.Extensions.Options;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for Stripe Connect integration (Story 18)
/// </summary>
[ApiController]
[Route("api/v1/billing")]
[Authorize]
[EnableRateLimiting("StrictApi")]
public class StripeConnectController : ControllerBase
{
    private readonly IStripeConnectService _stripeConnectService;
    private readonly ILogger<StripeConnectController> _logger;
    private readonly StripeSettings _stripeSettings;

    public StripeConnectController(
        IStripeConnectService stripeConnectService,
        ILogger<StripeConnectController> logger,
        IOptions<StripeSettings> stripeSettings)
    {
        _stripeConnectService = stripeConnectService;
        _logger = logger;
        _stripeSettings = stripeSettings.Value;
    }

    /// <summary>
    /// Generates a Stripe Connect onboarding link for the club
    /// </summary>
    /// <param name="request">Optional request with country code</param>
    /// <returns>Onboarding link</returns>
    /// <response code="200">Returns the onboarding link</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("stripe-connect-link")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(StripeConnectLinkResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<StripeConnectLinkResponse>> GetStripeConnectLink([FromBody] StripeConnectLinkRequest? request = null)
    {
        try
        {
            // BUG FIX: Use safe parsing to avoid NullReferenceException
            var clubIdClaim = User.FindFirst("ClubId")?.Value;
            if (!int.TryParse(clubIdClaim, out var clubId))
            {
                _logger.LogWarning("No valid ClubId claim found for user when generating Stripe Connect link");
                return Unauthorized("Club ID not found in user claims");
            }
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                _logger.LogWarning("No email claim found for user when generating Stripe Connect link");
                return BadRequest("User email not found");
            }

            _logger.LogInformation("Generating Stripe Connect link for club {ClubId} with country {Country}",
                clubId, request?.Country ?? "default");

            var response = await _stripeConnectService.GenerateConnectLinkAsync(clubId, userEmail, request?.Country);

            _logger.LogInformation("Successfully generated Stripe Connect link for club {ClubId}", clubId);
            return Ok(response);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Stripe Connect"))
        {
            _logger.LogError("Stripe Connect not enabled: {Error}", ex.Message);
            return StatusCode(503, new
            {
                error = ex.Message,
                setupUrl = "https://dashboard.stripe.com/connect/onboarding",
                isConnectSetupRequired = true
            });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Failed to create payment account"))
        {
            _logger.LogWarning("Failed to create Stripe Connect account: {Error}", ex.Message);

            return BadRequest(new
            {
                error = ex.Message,
                isRetryable = true
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation when generating Stripe Connect link: {Error}", ex.Message);
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating Stripe Connect link");
            return StatusCode(500, new { error = "An error occurred while generating the payment setup link" });
        }
    }

    /// <summary>
    /// Gets the Stripe Connect status for the club
    /// </summary>
    /// <returns>Connection status</returns>
    /// <response code="200">Returns the connection status</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("stripe-connect-status")]
    [Authorize(Policy = "ClubMember")]
    [ProducesResponseType(typeof(StripeConnectStatusResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<StripeConnectStatusResponse>> GetStripeConnectStatus()
    {
        try
        {
            // BUG FIX: Use safe parsing to avoid NullReferenceException
            var clubIdClaim = User.FindFirst("ClubId")?.Value;
            if (!int.TryParse(clubIdClaim, out var clubId))
            {
                _logger.LogWarning("No valid ClubId claim found for user when getting Stripe Connect status");
                return Unauthorized("Club ID not found in user claims");
            }

            _logger.LogInformation("Getting Stripe Connect status for club {ClubId}", clubId);

            var response = await _stripeConnectService.GetConnectStatusAsync(clubId);

            _logger.LogInformation("Successfully retrieved Stripe Connect status for club {ClubId}", clubId);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Club not found when getting Stripe Connect status: {Error}", ex.Message);
            return NotFound("Club not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Stripe Connect status");
            return StatusCode(500, "An error occurred while getting the Stripe Connect status");
        }
    }

    /// <summary>
    /// Disconnects the club's Stripe account
    /// </summary>
    /// <returns>Success response</returns>
    /// <response code="200">Account disconnected successfully</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="404">Club not found</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("stripe-disconnect")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult> DisconnectStripe()
    {
        try
        {
            // BUG FIX: Use safe parsing to avoid NullReferenceException
            var clubIdClaim = User.FindFirst("ClubId")?.Value;
            if (!int.TryParse(clubIdClaim, out var clubId))
            {
                _logger.LogWarning("No valid ClubId claim found for user when disconnecting Stripe");
                return Unauthorized("Club ID not found in user claims");
            }
            _logger.LogInformation("Disconnecting Stripe account for club {ClubId}", clubId);

            await _stripeConnectService.DisconnectAsync(clubId);

            _logger.LogInformation("Successfully disconnected Stripe account for club {ClubId}", clubId);
            return Ok(new { message = "Stripe account disconnected successfully" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Club not found when disconnecting Stripe: {Error}", ex.Message);
            return NotFound("Club not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disconnecting Stripe account");
            return StatusCode(500, "An error occurred while disconnecting the Stripe account");
        }
    }

    /// <summary>
    /// Gets the list of supported countries for Stripe Connect
    /// </summary>
    /// <returns>List of supported countries</returns>
    /// <response code="200">Returns the list of supported countries</response>
    [HttpGet("supported-countries")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SupportedCountriesResponse), 200)]
    public ActionResult<SupportedCountriesResponse> GetSupportedCountries()
    {
        var platformCountry = _stripeSettings.PlatformCountry ?? "US";
        var response = new SupportedCountriesResponse();

        foreach (var country in StripeRegions.SupportedCountries.OrderBy(c => StripeRegions.GetCountryName(c)))
        {
            response.Countries.Add(new CountryInfo
            {
                Code = country,
                Name = StripeRegions.GetCountryName(country),
                SupportsApplicationFees = StripeRegions.AreApplicationFeesSupported(platformCountry, country)
            });
        }

        return Ok(response);
    }
}