using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing club custom fields for member profiles
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/custom-fields")]
[Authorize]
public class CustomFieldsController : ControllerBase
{
    private readonly ICustomFieldService _customFieldService;
    private readonly ILogger<CustomFieldsController> _logger;

    public CustomFieldsController(
        ICustomFieldService customFieldService,
        ILogger<CustomFieldsController> logger)
    {
        _customFieldService = customFieldService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all custom fields for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>List of custom fields</returns>
    /// <response code="200">Returns the list of custom fields</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">User not authorized to access this club</response>
    /// <response code="500">Internal server error</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CustomFieldResponse>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<IEnumerable<CustomFieldResponse>>> GetCustomFields(int clubId)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Getting custom fields for club {ClubId} by user {UserId}", clubId, userId);

            var customFields = await _customFieldService.GetCustomFieldsAsync(clubId, userId);
            return Ok(customFields);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to custom fields for club {ClubId}: {Error}", clubId, ex.Message);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting custom fields for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving custom fields" });
        }
    }

    /// <summary>
    /// Gets a specific custom field by ID
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="customFieldId">The custom field ID</param>
    /// <returns>Custom field details</returns>
    /// <response code="200">Returns the custom field</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">User not authorized to access this club</response>
    /// <response code="404">Custom field not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("{customFieldId}")]
    [ProducesResponseType(typeof(CustomFieldResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<CustomFieldResponse>> GetCustomField(int clubId, int customFieldId)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Getting custom field {CustomFieldId} for club {ClubId} by user {UserId}",
                customFieldId, clubId, userId);

            var customField = await _customFieldService.GetCustomFieldByIdAsync(clubId, customFieldId, userId);
            return Ok(customField);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to custom field {CustomFieldId} for club {ClubId}: {Error}",
                customFieldId, clubId, ex.Message);
            return Forbid();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            _logger.LogWarning("Custom field not found: {CustomFieldId} for club {ClubId}", customFieldId, clubId);
            return NotFound(new { message = "Custom field not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting custom field {CustomFieldId} for club {ClubId}", customFieldId, clubId);
            return StatusCode(500, new { message = "An error occurred while retrieving the custom field" });
        }
    }

    /// <summary>
    /// Creates a new custom field for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">The custom field creation request</param>
    /// <returns>Created custom field</returns>
    /// <response code="201">Custom field created successfully</response>
    /// <response code="400">Invalid request data or validation error</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">User not authorized to access this club</response>
    /// <response code="500">Internal server error</response>
    [HttpPost]
    [ProducesResponseType(typeof(CustomFieldResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<CustomFieldResponse>> CreateCustomField(
        int clubId,
        [FromBody] CreateCustomFieldRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Creating custom field for club {ClubId} by user {UserId}: FieldLabel={FieldLabel}",
                clubId, userId, request.FieldLabel);

            var customField = await _customFieldService.CreateCustomFieldAsync(clubId, userId, request);

            return CreatedAtAction(
                nameof(GetCustomField),
                new { clubId, customFieldId = customField.CustomFieldId },
                customField);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid custom field creation for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to create custom field for club {ClubId}: {Error}", clubId, ex.Message);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation creating custom field for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating custom field for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An error occurred while creating the custom field" });
        }
    }

    /// <summary>
    /// Updates an existing custom field
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="customFieldId">The custom field ID</param>
    /// <param name="request">The custom field update request</param>
    /// <returns>Updated custom field</returns>
    /// <response code="200">Custom field updated successfully</response>
    /// <response code="400">Invalid request data or validation error</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">User not authorized to access this club</response>
    /// <response code="404">Custom field not found</response>
    /// <response code="500">Internal server error</response>
    [HttpPut("{customFieldId}")]
    [ProducesResponseType(typeof(CustomFieldResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<CustomFieldResponse>> UpdateCustomField(
        int clubId,
        int customFieldId,
        [FromBody] UpdateCustomFieldRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Updating custom field {CustomFieldId} for club {ClubId} by user {UserId}: FieldLabel={FieldLabel}",
                customFieldId, clubId, userId, request.FieldLabel);

            var customField = await _customFieldService.UpdateCustomFieldAsync(clubId, customFieldId, userId, request);
            return Ok(customField);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid custom field update for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to update custom field {CustomFieldId} for club {ClubId}: {Error}",
                customFieldId, clubId, ex.Message);
            return Forbid();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            _logger.LogWarning("Custom field not found for update: {CustomFieldId} for club {ClubId}", customFieldId, clubId);
            return NotFound(new { message = "Custom field not found" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation updating custom field {CustomFieldId} for club {ClubId}: {Error}",
                customFieldId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating custom field {CustomFieldId} for club {ClubId}", customFieldId, clubId);
            return StatusCode(500, new { message = "An error occurred while updating the custom field" });
        }
    }

    /// <summary>
    /// Deletes a custom field
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="customFieldId">The custom field ID</param>
    /// <returns>Success response</returns>
    /// <response code="204">Custom field deleted successfully</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="403">User not authorized to access this club</response>
    /// <response code="404">Custom field not found</response>
    /// <response code="409">Cannot delete custom field - contains member data</response>
    /// <response code="500">Internal server error</response>
    [HttpDelete("{customFieldId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> DeleteCustomField(int clubId, int customFieldId)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Deleting custom field {CustomFieldId} for club {ClubId} by user {UserId}",
                customFieldId, clubId, userId);

            await _customFieldService.DeleteCustomFieldAsync(clubId, customFieldId, userId);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access to delete custom field {CustomFieldId} for club {ClubId}: {Error}",
                customFieldId, clubId, ex.Message);
            return Forbid();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            _logger.LogWarning("Custom field not found for deletion: {CustomFieldId} for club {ClubId}", customFieldId, clubId);
            return NotFound(new { message = "Custom field not found" });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("member data"))
        {
            _logger.LogWarning("Cannot delete custom field with member data: {CustomFieldId} for club {ClubId}", customFieldId, clubId);
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting custom field {CustomFieldId} for club {ClubId}", customFieldId, clubId);
            return StatusCode(500, new { message = "An error occurred while deleting the custom field" });
        }
    }

    /// <summary>
    /// Gets the current user ID from JWT claims
    /// </summary>
    /// <returns>User ID</returns>
    /// <exception cref="UnauthorizedAccessException">Thrown if user ID cannot be determined</exception>
    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid authentication token");
        }
        return userId;
    }
}