using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.API.Extensions;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing member tags and tag assignments (Unlimited tier feature)
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/members/tags")]
public class MemberTaggingController : ControllerBase
{
    private readonly IMemberTaggingService _memberTaggingService;
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<MemberTaggingController> _logger;

    public MemberTaggingController(
        IMemberTaggingService memberTaggingService,
        IClubAuthorizationService authService,
        ILogger<MemberTaggingController> logger)
    {
        _memberTaggingService = memberTaggingService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all tags for a club
    /// </summary>
    /// <remarks>
    /// Retrieves all member tags configured for the specified club.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club to get tags for</param>
    /// <response code="200">Returns the list of member tags</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(IEnumerable<MemberTagResponse>), 200)]
    public async Task<IActionResult> GetTags([FromRoute] int clubId)
    {
        try
        {
            _logger.LogInformation("Getting member tags for club {ClubId}", clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var tags = await _memberTaggingService.GetTagsAsync(clubId, userId.Value);

            _logger.LogInformation("Retrieved {Count} member tags for club {ClubId}",
                tags?.Count() ?? 0, clubId);

            return Ok(tags);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting member tags for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving member tags." });
        }
    }

    /// <summary>
    /// Gets a specific tag by ID
    /// </summary>
    /// <remarks>
    /// Retrieves the details of a specific member tag within a club.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club the tag belongs to</param>
    /// <param name="tagId">The ID of the tag to retrieve</param>
    /// <response code="200">Returns the tag details</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or tag does not exist</response>
    [HttpGet("{tagId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(MemberTagResponse), 200)]
    public async Task<IActionResult> GetTag([FromRoute] int clubId, [FromRoute] int tagId)
    {
        try
        {
            _logger.LogInformation("Getting member tag {TagId} for club {ClubId}", tagId, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var tag = await _memberTaggingService.GetTagByIdAsync(clubId, tagId, userId.Value);

            if (tag == null)
            {
                return NotFound(new { message = "Member tag not found" });
            }

            return Ok(tag);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get member tag {TagId} for club {ClubId}: {Error}",
                tagId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting member tag {TagId} for club {ClubId}",
                tagId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving the member tag." });
        }
    }

    /// <summary>
    /// Creates a new member tag for a club
    /// </summary>
    /// <remarks>
    /// Creates a new tag that can be assigned to club members.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// Tag colors must be valid hex color codes (e.g., #007bff).
    /// </remarks>
    /// <param name="clubId">The ID of the club to create the tag for</param>
    /// <param name="request">The tag creation details</param>
    /// <response code="201">Returns the newly created tag</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(MemberTagResponse), 201)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> CreateTag([FromRoute] int clubId, [FromBody] CreateTagRequest request)
    {
        try
        {
            _logger.LogInformation("Creating member tag for club {ClubId}: {TagName}", clubId, request.Name);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            // Set the clubId and userId in the request
            request.ClubId = clubId;
            request.CreatedByUserId = userId.Value;

            // Convert to the expected DTO
            var createMemberTagRequest = new CreateMemberTagRequest
            {
                ClubId = request.ClubId,
                Name = request.Name,
                Description = request.Description,
                Color = request.Color,
                IsVisible = request.IsVisible,
                DisplayOrder = request.DisplayOrder,
                CreatedByUserId = request.CreatedByUserId
            };

            var tag = await _memberTaggingService.CreateTagAsync(clubId, userId.Value, createMemberTagRequest);

            _logger.LogInformation("Member tag created successfully: {TagId}", tag.Id);

            return CreatedAtAction(
                nameof(GetTag),
                new { clubId, tagId = tag.Id },
                tag);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to create member tag for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating member tag for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while creating the member tag." });
        }
    }

    /// <summary>
    /// Updates an existing member tag
    /// </summary>
    /// <remarks>
    /// Updates the details of a specific member tag within a club.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club the tag belongs to</param>
    /// <param name="tagId">The ID of the tag to update</param>
    /// <param name="request">The updated tag information</param>
    /// <response code="200">Returns the updated tag</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or tag does not exist</response>
    [HttpPut("{tagId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(MemberTagResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> UpdateTag([FromRoute] int clubId, [FromRoute] int tagId, [FromBody] UpdateTagRequest request)
    {
        try
        {
            _logger.LogInformation("Updating member tag {TagId} for club {ClubId}: {TagName}",
                tagId, clubId, request.Name);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            // Set the tagId and userId in the request
            request.TagId = tagId;
            request.UpdatedByUserId = userId.Value;

            // Convert to the expected DTO
            var updateMemberTagRequest = new UpdateMemberTagRequest
            {
                TagId = request.TagId,
                Name = request.Name,
                Description = request.Description,
                Color = request.Color,
                IsVisible = request.IsVisible,
                DisplayOrder = request.DisplayOrder,
                UpdatedByUserId = request.UpdatedByUserId
            };

            var updatedTag = await _memberTaggingService.UpdateTagAsync(clubId, tagId, userId.Value, updateMemberTagRequest);

            _logger.LogInformation("Member tag updated successfully: {TagId}", tagId);

            return Ok(updatedTag);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update member tag {TagId} for club {ClubId}: {Error}",
                tagId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating member tag {TagId} for club {ClubId}",
                tagId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while updating the member tag." });
        }
    }

    /// <summary>
    /// Deletes a member tag
    /// </summary>
    /// <remarks>
    /// Deletes a specific member tag and all associated member assignments.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// This operation cannot be undone and will remove all tag assignments.
    /// </remarks>
    /// <param name="clubId">The ID of the club the tag belongs to</param>
    /// <param name="tagId">The ID of the tag to delete</param>
    /// <response code="204">Tag deleted successfully</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or tag does not exist</response>
    [HttpDelete("{tagId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeleteTag([FromRoute] int clubId, [FromRoute] int tagId)
    {
        try
        {
            _logger.LogInformation("Deleting member tag {TagId} for club {ClubId}", tagId, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var deleted = await _memberTaggingService.DeleteTagAsync(clubId, tagId, userId.Value);

            if (!deleted)
            {
                return NotFound(new { message = "Member tag not found" });
            }

            _logger.LogInformation("Member tag deleted successfully: {TagId}", tagId);

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to delete member tag {TagId} for club {ClubId}: {Error}",
                tagId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting member tag {TagId} for club {ClubId}",
                tagId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while deleting the member tag." });
        }
    }

    /// <summary>
    /// Assigns a tag to a member
    /// </summary>
    /// <remarks>
    /// Assigns a specific tag to a member.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="memberId">The ID of the member to assign the tag to</param>
    /// <param name="tagId">The ID of the tag to assign</param>
    /// <param name="request">Optional assignment details</param>
    /// <response code="200">Tag assigned successfully</response>
    /// <response code="400">If the assignment fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club, member, or tag does not exist</response>
    [HttpPost("assign/{memberId}/{tagId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> AssignTag([FromRoute] int clubId, [FromRoute] int memberId, [FromRoute] int tagId, [FromBody] AssignTagRequest? request = null)
    {
        try
        {
            _logger.LogInformation("Assigning tag {TagId} to member {MemberId} for club {ClubId}",
                tagId, memberId, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var assigned = await _memberTaggingService.AssignTagToMemberAsync(clubId, memberId, tagId, userId.Value);

            if (!assigned)
            {
                return BadRequest(new { message = "Failed to assign tag to member" });
            }

            _logger.LogInformation("Tag {TagId} assigned successfully to member {MemberId}", tagId, memberId);

            return Ok(new { message = "Tag assigned successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to assign tag {TagId} to member {MemberId} for club {ClubId}: {Error}",
                tagId, memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error assigning tag {TagId} to member {MemberId} for club {ClubId}",
                tagId, memberId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while assigning the tag." });
        }
    }

    /// <summary>
    /// Removes a tag from a member
    /// </summary>
    /// <remarks>
    /// Removes a specific tag assignment from a member.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="memberId">The ID of the member to remove the tag from</param>
    /// <param name="tagId">The ID of the tag to remove</param>
    /// <response code="200">Tag removed successfully</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club, member, tag, or assignment does not exist</response>
    [HttpDelete("remove/{memberId}/{tagId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> RemoveTag([FromRoute] int clubId, [FromRoute] int memberId, [FromRoute] int tagId)
    {
        try
        {
            _logger.LogInformation("Removing tag {TagId} from member {MemberId} for club {ClubId}",
                tagId, memberId, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var removed = await _memberTaggingService.RemoveTagFromMemberAsync(clubId, memberId, tagId, userId.Value);

            if (!removed)
            {
                return NotFound(new { message = "Tag assignment not found" });
            }

            _logger.LogInformation("Tag {TagId} removed successfully from member {MemberId}", tagId, memberId);

            return Ok(new { message = "Tag removed successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to remove tag {TagId} from member {MemberId} for club {ClubId}: {Error}",
                tagId, memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error removing tag {TagId} from member {MemberId} for club {ClubId}",
                tagId, memberId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while removing the tag." });
        }
    }

    /// <summary>
    /// Gets all tags assigned to a specific member
    /// </summary>
    /// <remarks>
    /// Retrieves all tags that have been assigned to a specific member.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="memberId">The ID of the member to get tags for</param>
    /// <response code="200">Returns the list of tags assigned to the member</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or member does not exist</response>
    [HttpGet("member/{memberId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(IEnumerable<MemberTagResponse>), 200)]
    public async Task<IActionResult> GetMemberTags([FromRoute] int clubId, [FromRoute] int memberId)
    {
        try
        {
            _logger.LogInformation("Getting tags for member {MemberId} in club {ClubId}", memberId, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var memberTags = await _memberTaggingService.GetMemberTagsAsync(clubId, memberId, userId.Value);

            _logger.LogInformation("Retrieved {Count} tags for member {MemberId}",
                memberTags?.Count() ?? 0, memberId);

            return Ok(memberTags);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get tags for member {MemberId} in club {ClubId}: {Error}",
                memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting tags for member {MemberId} in club {ClubId}",
                memberId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving member tags." });
        }
    }

    /// <summary>
    /// Gets all members that have a specific tag
    /// </summary>
    /// <remarks>
    /// Retrieves all members that have been assigned a specific tag.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="tagId">The ID of the tag to get members for</param>
    /// <response code="200">Returns the list of members with the tag</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or tag does not exist</response>
    [HttpGet("{tagId}/members")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(IEnumerable<MemberResponse>), 200)]
    public async Task<IActionResult> GetMembersWithTag([FromRoute] int clubId, [FromRoute] int tagId)
    {
        try
        {
            _logger.LogInformation("Getting members with tag {TagId} for club {ClubId}", tagId, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var taggedMembers = await _memberTaggingService.GetMembersWithTagAsync(clubId, tagId, userId.Value);

            _logger.LogInformation("Retrieved {Count} members with tag {TagId}",
                taggedMembers?.Count() ?? 0, tagId);

            return Ok(taggedMembers);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get members with tag {TagId} for club {ClubId}: {Error}",
                tagId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting members with tag {TagId} for club {ClubId}",
                tagId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving tagged members." });
        }
    }

    /// <summary>
    /// Gets tag usage statistics for the club
    /// </summary>
    /// <remarks>
    /// Retrieves statistics about tag usage across all members in the club.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club to get tag statistics for</param>
    /// <response code="200">Returns the tag usage statistics</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet("usage-stats")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(MemberTagUsageStatsResponse), 200)]
    public async Task<IActionResult> GetTagUsageStats([FromRoute] int clubId)
    {
        try
        {
            _logger.LogInformation("Getting tag usage statistics for club {ClubId}", clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            // Verify Unlimited tier access
            var tierResult = await this.VerifyUnlimitedTierAccessAsync(_authService, clubId);
            if (tierResult != null) return tierResult;

            var userId = this.GetCurrentUserId(_authService);
            if (!userId.HasValue)
            {
                return Unauthorized("Invalid authentication token");
            }

            var usageStats = await _memberTaggingService.GetTagUsageStatsAsync(clubId, userId.Value);

            _logger.LogInformation("Retrieved tag usage statistics for club {ClubId}", clubId);

            return Ok(usageStats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting tag usage statistics for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving tag usage statistics." });
        }
    }
}