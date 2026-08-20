using GatherGrove.Infrastructure.Services.TierValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for tier validation and feature access endpoints
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId:int}")]
[Authorize]
public class ClubTierController : ControllerBase
{
    private readonly ITierGateService _tierGateService;
    private readonly ILogger<ClubTierController> _logger;

    public ClubTierController(ITierGateService tierGateService, ILogger<ClubTierController> logger)
    {
        _tierGateService = tierGateService;
        _logger = logger;
    }

    /// <summary>
    /// Gets tier information for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Tier information including current tier and resource limits</returns>
    [HttpGet("tier-info")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetTierInfo(int clubId)
    {
        try
        {
            // Validate club access
            if (!ValidateClubAccess(clubId))
            {
                return Forbid("You do not have access to this club");
            }

            var resourceLimits = await _tierGateService.GetTierResourceLimitsAsync(clubId);
            var hasUnlimited = await _tierGateService.ValidateUnlimitedAccessAsync(clubId);

            // Determine tier based on resource limits
            string tier;
            if (hasUnlimited)
            {
                tier = "Unlimited";
            }
            else if (resourceLimits.AdvancedFeaturesEnabled)
            {
                tier = "Grow";
            }
            else
            {
                tier = "Grow"; // Default to Grow for any non-unlimited tier
            }

            return Ok(new
            {
                tier,
                resourceLimits = new
                {
                    resourceLimits.MaxAnalyticsQueries,
                    resourceLimits.MaxCacheSize,
                    resourceLimits.MaxBackgroundJobs,
                    resourceLimits.BackgroundProcessingEnabled,
                    resourceLimits.AdvancedFeaturesEnabled
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tier info for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving tier information" });
        }
    }

    /// <summary>
    /// Validates access to a specific feature for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="feature">The feature name to validate</param>
    /// <returns>Whether the club has access to the feature</returns>
    [HttpGet("validate-feature/{feature}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ValidateFeatureAccess(int clubId, string feature)
    {
        try
        {
            // Validate club access
            if (!ValidateClubAccess(clubId))
            {
                return Forbid("You do not have access to this club");
            }

            var result = await _tierGateService.ValidateFeatureAccessAsync(clubId, feature);

            return Ok(new
            {
                hasAccess = result.HasAccess,
                message = result.Message,
                currentTier = result.CurrentTier,
                requiredTier = result.RequiredTier
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating feature access for club {ClubId}, feature {Feature}", clubId, feature);
            return StatusCode(500, new { message = "An error occurred while validating feature access" });
        }
    }

    /// <summary>
    /// Validates if a club has unlimited tier access
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>Whether the club has unlimited tier access</returns>
    [HttpGet("validate-unlimited")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ValidateUnlimitedAccess(int clubId)
    {
        try
        {
            // Validate club access
            if (!ValidateClubAccess(clubId))
            {
                return Forbid("You do not have access to this club");
            }

            var hasUnlimitedAccess = await _tierGateService.ValidateUnlimitedAccessAsync(clubId);

            return Ok(new { hasUnlimitedAccess });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating unlimited access for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while validating unlimited access" });
        }
    }

    /// <summary>
    /// Validates if the current user has access to the specified club
    /// </summary>
    private bool ValidateClubAccess(int clubId)
    {
        var userClubIdClaim = User.FindFirst("ClubId")?.Value;
        if (string.IsNullOrEmpty(userClubIdClaim) || !int.TryParse(userClubIdClaim, out var userClubId))
        {
            return false;
        }

        return userClubId == clubId;
    }
}
