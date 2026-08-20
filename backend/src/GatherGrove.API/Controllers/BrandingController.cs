using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using GatherGrove.Application.Services.Branding;
using GatherGrove.Application.DTOs.Branding;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing club branding and white-label customization
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/branding")]
[Authorize(Policy = "AdminOnly")]
[Authorize(Policy = "UnlimitedTierRequired")]
public class BrandingController : ControllerBase
{
    private readonly IBrandingService _brandingService;
    private readonly ILogger<BrandingController> _logger;

    public BrandingController(
        IBrandingService brandingService,
        ILogger<BrandingController> logger)
    {
        _brandingService = brandingService;
        _logger = logger;
    }

    /// <summary>
    /// Gets branding settings for a club
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <returns>Club branding settings</returns>
    [HttpGet]
    [ProducesResponseType(typeof(BrandingResponse), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(403)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<BrandingResponse>> GetBranding(int clubId)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Getting branding settings for club {ClubId} by user {UserId}", clubId, userId);

            var branding = await _brandingService.GetBrandingAsync(clubId, userId);
            return Ok(branding);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to branding for club {ClubId}: {Message}", clubId, ex.Message);
            return Forbid("You do not have access to this club's branding settings");
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogInformation("Branding settings not found for club {ClubId}: {Message}", clubId, ex.Message);
            return NotFound("Branding settings not found for this club");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for branding in club {ClubId}: {Message}", clubId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving branding settings for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while retrieving branding settings");
        }
    }

    /// <summary>
    /// Creates new branding settings for a club
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <param name="request">Branding settings to create</param>
    /// <returns>Created branding settings</returns>
    [HttpPost]
    [ProducesResponseType(typeof(BrandingResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    [ProducesResponseType(403)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<BrandingResponse>> CreateBranding(
        int clubId,
        [FromBody] CreateBrandingRequest? request)
    {
        try
        {
            if (request == null)
            {
                _logger.LogWarning("Null request received for create branding in club {ClubId}", clubId);
                return BadRequest("Branding request cannot be null");
            }

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for create branding in club {ClubId}", clubId);
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();
            _logger.LogInformation("Creating branding settings for club {ClubId} by user {UserId}", clubId, userId);

            var branding = await _brandingService.CreateBrandingAsync(clubId, userId, request);
            return CreatedAtAction(nameof(GetBranding), new { clubId }, branding);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized attempt to create branding for club {ClubId}: {Message}", clubId, ex.Message);
            return Forbid("You do not have access to create branding settings for this club");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for creating branding in club {ClubId}: {Message}", clubId, ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating branding settings for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while creating branding settings");
        }
    }

    /// <summary>
    /// Updates existing branding settings for a club
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <param name="request">Branding settings to update</param>
    /// <returns>Updated branding settings</returns>
    [HttpPut]
    [ProducesResponseType(typeof(BrandingResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(403)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<BrandingResponse>> UpdateBranding(
        int clubId,
        [FromBody] UpdateBrandingRequest? request)
    {
        try
        {
            if (request == null)
            {
                _logger.LogWarning("Null request received for update branding in club {ClubId}", clubId);
                return BadRequest("Branding request cannot be null");
            }

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for update branding in club {ClubId}", clubId);
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();
            _logger.LogInformation("Updating branding settings for club {ClubId} by user {UserId}", clubId, userId);

            var branding = await _brandingService.UpdateBrandingAsync(clubId, userId, request);
            return Ok(branding);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized attempt to update branding for club {ClubId}: {Message}", clubId, ex.Message);
            return Forbid("You do not have access to update branding settings for this club");
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogInformation("Branding settings not found for update in club {ClubId}: {Message}", clubId, ex.Message);
            return NotFound("Branding settings not found for this club");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for updating branding in club {ClubId}: {Message}", clubId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating branding settings for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while updating branding settings");
        }
    }

    /// <summary>
    /// Deletes branding settings for a club
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <returns>No content</returns>
    [HttpDelete]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    [ProducesResponseType(403)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> DeleteBranding(int clubId)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Deleting branding settings for club {ClubId} by user {UserId}", clubId, userId);

            await _brandingService.DeleteBrandingAsync(clubId, userId);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized attempt to delete branding for club {ClubId}: {Message}", clubId, ex.Message);
            return Forbid("You do not have access to delete branding settings for this club");
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogInformation("Branding settings not found for deletion in club {ClubId}: {Message}", clubId, ex.Message);
            return NotFound("Branding settings not found for this club");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for deleting branding in club {ClubId}: {Message}", clubId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting branding settings for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while deleting branding settings");
        }
    }

    /// <summary>
    /// Uploads a logo file for the club
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <param name="file">Logo image file</param>
    /// <returns>Logo upload response with URL</returns>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(LogoUploadResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(401)]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5MB limit
    public async Task<ActionResult<LogoUploadResponse>> UploadLogo(
        int clubId,
        IFormFile? file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("Empty or null file received for logo upload in club {ClubId}", clubId);
                return BadRequest("File cannot be null or empty");
            }

            var userId = GetCurrentUserId();
            _logger.LogInformation("Uploading logo for club {ClubId} by user {UserId}, file: {FileName} ({FileSize} bytes)",
                clubId, userId, file.FileName, file.Length);

            var response = await _brandingService.UploadLogoAsync(clubId, userId, file);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized attempt to upload logo for club {ClubId}: {Message}", clubId, ex.Message);
            return Forbid("You do not have access to upload logos for this club");
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid file for logo upload in club {ClubId}: {Message}", clubId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for logo upload in club {ClubId}: {Message}", clubId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading logo for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while uploading the logo");
        }
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user authentication");
        }
        return userId;
    }

    /// <summary>
    /// Uploads a favicon file for the club
    /// </summary>
    /// <param name="clubId">Club identifier</param>
    /// <param name="file">Favicon image file</param>
    /// <returns>Favicon upload response with URL</returns>
    [HttpPost("favicon/upload")]
    [ProducesResponseType(typeof(FaviconUploadResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(401)]
    [RequestSizeLimit(2 * 1024 * 1024)] // 2MB limit for favicon
    public async Task<ActionResult<FaviconUploadResponse>> UploadFavicon(
        int clubId,
        IFormFile? file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("Empty or null file received for favicon upload in club {ClubId}", clubId);
                return BadRequest("File cannot be null or empty");
            }

            var userId = GetCurrentUserId();
            _logger.LogInformation("Uploading favicon for club {ClubId} by user {UserId}, file: {FileName} ({FileSize} bytes)",
                clubId, userId, file.FileName, file.Length);

            var response = await _brandingService.UploadFaviconAsync(clubId, userId, file);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized attempt to upload favicon for club {ClubId}: {Message}", clubId, ex.Message);
            return Forbid("You do not have access to upload favicons for this club");
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid file for favicon upload in club {ClubId}: {Message}", clubId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation for favicon upload in club {ClubId}: {Message}", clubId, ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading favicon for club {ClubId}", clubId);
            return StatusCode(500, "An error occurred while uploading the favicon");
        }
    }
}