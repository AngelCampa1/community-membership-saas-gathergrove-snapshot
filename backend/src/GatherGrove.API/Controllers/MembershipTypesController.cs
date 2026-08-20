using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing membership types
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/membership-types")]
[Authorize]
public class MembershipTypesController : ControllerBase
{
    private readonly IMembershipTypeService _membershipTypeService;
    private readonly ILogger<MembershipTypesController> _logger;

    public MembershipTypesController(
        IMembershipTypeService membershipTypeService,
        ILogger<MembershipTypesController> logger)
    {
        _membershipTypeService = membershipTypeService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new membership type for a club
    /// </summary>
    /// <remarks>
    /// Creates a new membership type with the specified details.
    /// Requires authentication and admin access to the specified club.
    /// The membership type name must be unique within the club.
    /// </remarks>
    /// <param name="clubId">The ID of the club where the membership type will be created</param>
    /// <param name="request">The details of the new membership type to create</param>
    /// <response code="201">Returns the newly created membership type details</response>
    /// <response code="400">If the request body fails validation (e.g., missing name, invalid dues amount, or name already exists)</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost]
    [ProducesResponseType(typeof(MembershipTypeResponse), 201)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> CreateMembershipType([FromRoute] int clubId, [FromBody] CreateMembershipTypeRequest request)
    {
        try
        {
            _logger.LogInformation("Creating membership type for club {ClubId}: {Name}", clubId, request.Name);

            // Verify club ownership - user must own the club they're creating membership types for
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user creating membership type in club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to create membership type in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var membershipType = await _membershipTypeService.CreateMembershipTypeAsync(clubId, request);

            _logger.LogInformation("Membership type created successfully: {MembershipTypeId}", membershipType.Id);

            return CreatedAtAction(
                nameof(GetMembershipType),
                new { clubId, membershipTypeId = membershipType.Id },
                membershipType);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to create membership type for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating membership type for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while creating the membership type." });
        }
    }

    /// <summary>
    /// Gets all membership types for a club
    /// </summary>
    /// <remarks>
    /// Retrieves all membership types associated with the specified club.
    /// Requires authentication and access to the specified club.
    /// </remarks>
    /// <param name="clubId">The ID of the club to get membership types for</param>
    /// <response code="200">Returns the list of membership types for the club</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user does not have access to the specified club</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<MembershipTypeResponse>), 200)]
    public async Task<IActionResult> GetMembershipTypes([FromRoute] int clubId)
    {
        try
        {
            _logger.LogInformation("Getting membership types for club {ClubId}", clubId);

            // Verify club access - user must own the club they're accessing
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user accessing club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to access club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var membershipTypes = await _membershipTypeService.GetMembershipTypesByClubAsync(clubId);

            return Ok(membershipTypes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting membership types for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving membership types." });
        }
    }

    /// <summary>
    /// Gets a specific membership type by ID
    /// </summary>
    /// <remarks>
    /// Retrieves the details of a specific membership type within a club.
    /// Requires authentication and access to the specified club.
    /// </remarks>
    /// <param name="clubId">The ID of the club the membership type belongs to</param>
    /// <param name="membershipTypeId">The ID of the membership type to retrieve</param>
    /// <response code="200">Returns the membership type details</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user does not have access to the specified club</response>
    /// <response code="404">If the specified club or membership type does not exist</response>
    [HttpGet("{membershipTypeId}")]
    [ProducesResponseType(typeof(MembershipTypeResponse), 200)]
    public async Task<IActionResult> GetMembershipType([FromRoute] int clubId, [FromRoute] int membershipTypeId)
    {
        try
        {
            _logger.LogInformation("Getting membership type {MembershipTypeId} for club {ClubId}", membershipTypeId, clubId);

            // Verify club access - user must own the club they're accessing
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user accessing club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to access club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var membershipType = await _membershipTypeService.GetMembershipTypeByIdAsync(clubId, membershipTypeId);

            if (membershipType == null)
            {
                return NotFound(new { message = "Membership type not found" });
            }

            return Ok(membershipType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting membership type {MembershipTypeId} for club {ClubId}", membershipTypeId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving the membership type." });
        }
    }

    /// <summary>
    /// Updates an existing membership type
    /// </summary>
    /// <remarks>
    /// Updates the name and dues amount of an existing membership type.
    /// Requires authentication and admin access to the specified club.
    /// The membership type name must be unique within the club.
    /// </remarks>
    /// <param name="clubId">The ID of the club that owns the membership type</param>
    /// <param name="membershipTypeId">The ID of the membership type to update</param>
    /// <param name="request">The updated membership type details</param>
    /// <response code="200">Returns the updated membership type details</response>
    /// <response code="400">If the request body fails validation (e.g., missing name, invalid dues amount, or name already exists)</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club or membership type does not exist</response>
    [HttpPut("{membershipTypeId}")]
    [ProducesResponseType(typeof(MembershipTypeResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> UpdateMembershipType([FromRoute] int clubId, [FromRoute] int membershipTypeId, [FromBody] UpdateMembershipTypeRequest request)
    {
        try
        {
            _logger.LogInformation("Updating membership type {MembershipTypeId} for club {ClubId}: {Name}", membershipTypeId, clubId, request.Name);

            // Verify club ownership - user must own the club they're updating membership types for
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user updating membership type in club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to update membership type in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var membershipType = await _membershipTypeService.UpdateMembershipTypeAsync(clubId, membershipTypeId, request);

            _logger.LogInformation("Membership type updated successfully: {MembershipTypeId}", membershipType.Id);

            return Ok(membershipType);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update membership type {MembershipTypeId} for club {ClubId}: {Error}", membershipTypeId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating membership type {MembershipTypeId} for club {ClubId}", membershipTypeId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while updating the membership type." });
        }
    }

    /// <summary>
    /// Deletes a membership type
    /// </summary>
    /// <remarks>
    /// Deletes a membership type from a club. This operation will fail if any members
    /// are currently assigned to this membership type.
    /// Requires authentication and admin access to the specified club.
    /// </remarks>
    /// <param name="clubId">The ID of the club that owns the membership type</param>
    /// <param name="membershipTypeId">The ID of the membership type to delete</param>
    /// <response code="204">If the membership type was successfully deleted</response>
    /// <response code="400">If the membership type cannot be deleted (e.g., it's assigned to members)</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club or membership type does not exist</response>
    [HttpDelete("{membershipTypeId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> DeleteMembershipType([FromRoute] int clubId, [FromRoute] int membershipTypeId)
    {
        try
        {
            _logger.LogInformation("Deleting membership type {MembershipTypeId} for club {ClubId}", membershipTypeId, clubId);

            // Verify club ownership - user must own the club they're deleting membership types from
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user deleting membership type in club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to delete membership type in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var deleted = await _membershipTypeService.DeleteMembershipTypeAsync(clubId, membershipTypeId);

            if (!deleted)
            {
                return NotFound(new { message = "Membership type not found" });
            }

            _logger.LogInformation("Membership type deleted successfully: {MembershipTypeId}", membershipTypeId);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to delete membership type {MembershipTypeId} for club {ClubId}: {Error}", membershipTypeId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting membership type {MembershipTypeId} for club {ClubId}", membershipTypeId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while deleting the membership type." });
        }
    }

    /// <summary>
    /// Gets the current user's ID from the JWT token claims
    /// </summary>
    /// <returns>User ID if found in claims</returns>
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim?.Value, out var userId) ? userId : null;
    }
}