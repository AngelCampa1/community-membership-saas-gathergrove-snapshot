using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing A/B testing campaigns
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/ab-tests")]
[Authorize]
public class ABTestingController : ControllerBase
{
    private readonly IABTestingService _abTestingService;
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<ABTestingController> _logger;

    public ABTestingController(
        IABTestingService abTestingService,
        IClubAuthorizationService authService,
        ILogger<ABTestingController> logger)
    {
        _abTestingService = abTestingService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all A/B test campaigns for a club
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ABTestCampaignResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<ABTestCampaignResponse>>> GetCampaigns(int clubId)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        if (!await _authService.CanAccessUnlimitedFeaturesAsync(clubId))
        {
            return Forbid("You need Expand for A/B tests");
        }

        try
        {
            var campaigns = await _abTestingService.GetCampaignsAsync(clubId);
            return Ok(campaigns);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting A/B test campaigns for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Error retrieving campaigns" });
        }
    }

    /// <summary>
    /// Gets a specific A/B test campaign
    /// </summary>
    [HttpGet("{campaignId}")]
    [ProducesResponseType(typeof(ABTestCampaignResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ABTestCampaignResponse>> GetCampaign(int clubId, int campaignId)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var campaign = await _abTestingService.GetCampaignAsync(clubId, campaignId);
            return Ok(campaign);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting campaign {CampaignId}", campaignId);
            return StatusCode(500, new { message = "Error retrieving campaign" });
        }
    }

    /// <summary>
    /// Creates a new A/B test campaign
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ABTestCampaignResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ABTestCampaignResponse>> CreateCampaign(
        int clubId,
        [FromBody] CreateABTestCampaignRequest request)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        if (!await _authService.CanAccessUnlimitedFeaturesAsync(clubId))
        {
            return Forbid("You need Expand for A/B tests");
        }

        // BUG FIX: Use int.TryParse instead of int.Parse with "0" fallback to avoid silent failures
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Unable to determine user identity");
        }

        try
        {
            var campaign = await _abTestingService.CreateCampaignAsync(clubId, userId, request);
            return CreatedAtAction(nameof(GetCampaign), new { clubId, campaignId = campaign.Id }, campaign);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating A/B test campaign for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Error creating campaign" });
        }
    }

    /// <summary>
    /// Starts an A/B test campaign
    /// </summary>
    [HttpPost("{campaignId}/start")]
    [ProducesResponseType(typeof(ABTestCampaignResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ABTestCampaignResponse>> StartCampaign(
        int clubId,
        int campaignId,
        [FromBody] StartABTestRequest request)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var campaign = await _abTestingService.StartCampaignAsync(clubId, campaignId, request);
            return Ok(campaign);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting campaign {CampaignId}", campaignId);
            return StatusCode(500, new { message = "Error starting campaign" });
        }
    }

    /// <summary>
    /// Gets results for an A/B test campaign
    /// </summary>
    [HttpGet("{campaignId}/results")]
    [ProducesResponseType(typeof(ABTestResultsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ABTestResultsResponse>> GetCampaignResults(int clubId, int campaignId)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var results = await _abTestingService.GetCampaignResultsAsync(clubId, campaignId);
            return Ok(results);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting results for campaign {CampaignId}", campaignId);
            return StatusCode(500, new { message = "Error retrieving results" });
        }
    }

    /// <summary>
    /// Determines the winner of an A/B test automatically
    /// </summary>
    [HttpPost("{campaignId}/determine-winner")]
    [ProducesResponseType(typeof(ABTestCampaignResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ABTestCampaignResponse>> DetermineWinner(int clubId, int campaignId)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var campaign = await _abTestingService.DetermineWinnerAsync(clubId, campaignId);
            return Ok(campaign);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error determining winner for campaign {CampaignId}", campaignId);
            return StatusCode(500, new { message = "Error determining winner" });
        }
    }
}

