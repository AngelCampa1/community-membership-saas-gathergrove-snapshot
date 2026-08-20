using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.API.Extensions;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing member segmentation with advanced filtering (Unlimited tier feature)
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/segments")]
public class MemberSegmentationController : ControllerBase
{
    private readonly IMemberSegmentationService _segmentationService;
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<MemberSegmentationController> _logger;

    public MemberSegmentationController(
        IMemberSegmentationService segmentationService,
        IClubAuthorizationService authService,
        ILogger<MemberSegmentationController> logger)
    {
        _segmentationService = segmentationService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all segments for a club
    /// </summary>
    /// <remarks>
    /// Retrieves all member segments configured for the specified club.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club to get segments for</param>
    /// <param name="includeInactive">Include inactive segments in the results</param>
    /// <response code="200">Returns the list of member segments</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(IEnumerable<MemberSegmentResponse>), 200)]
    public async Task<IActionResult> GetSegments([FromRoute] int clubId, [FromQuery] bool includeInactive = false)
    {
        try
        {
            _logger.LogInformation("Getting member segments for club {ClubId}, includeInactive: {IncludeInactive}",
                clubId, includeInactive);

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

            var segments = await _segmentationService.GetSegmentsAsync(clubId, userId.Value, includeInactive);

            _logger.LogInformation("Retrieved {Count} member segments for club {ClubId}",
                segments?.Count() ?? 0, clubId);

            return Ok(segments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting member segments for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving member segments." });
        }
    }

    /// <summary>
    /// Gets a specific segment by ID
    /// </summary>
    /// <remarks>
    /// Retrieves the details of a specific member segment within a club.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club the segment belongs to</param>
    /// <param name="segmentId">The ID of the segment to retrieve</param>
    /// <response code="200">Returns the segment details</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or segment does not exist</response>
    [HttpGet("{segmentId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(MemberSegmentResponse), 200)]
    public async Task<IActionResult> GetSegment([FromRoute] int clubId, [FromRoute] int segmentId)
    {
        try
        {
            _logger.LogInformation("Getting member segment {SegmentId} for club {ClubId}", segmentId, clubId);

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

            var segment = await _segmentationService.GetSegmentByIdAsync(clubId, segmentId, userId.Value);

            if (segment == null)
            {
                return NotFound(new { message = "Member segment not found" });
            }

            return Ok(segment);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get member segment {SegmentId} for club {ClubId}: {Error}",
                segmentId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting member segment {SegmentId} for club {ClubId}",
                segmentId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving the member segment." });
        }
    }

    /// <summary>
    /// Creates a new member segment for a club
    /// </summary>
    /// <remarks>
    /// Creates a new segment with complex filter criteria for member grouping.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// Supports filtering by status, dates, engagement, membership type, tags, custom fields, and more.
    /// </remarks>
    /// <param name="clubId">The ID of the club to create the segment for</param>
    /// <param name="request">The segment creation details</param>
    /// <response code="201">Returns the newly created segment</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(MemberSegmentResponse), 201)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> CreateSegment([FromRoute] int clubId, [FromBody] CreateSegmentRequest request)
    {
        try
        {
            _logger.LogInformation("Creating member segment for club {ClubId}: {SegmentName}", clubId, request.Name);

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

            // Convert to the expected type
            var createRequest = new CreateMemberSegmentRequest
            {
                ClubId = request.ClubId,
                Name = request.Name,
                Description = request.Description,
                FilterCriteria = request.FilterCriteria,
                AutoCalculate = request.AutoCalculate,
                CreatedByUserId = request.CreatedByUserId
            };

            var segment = await _segmentationService.CreateSegmentAsync(clubId, userId.Value, createRequest);

            _logger.LogInformation("Member segment created successfully: {SegmentId}", segment.Id);

            return CreatedAtAction(
                nameof(GetSegment),
                new { clubId, segmentId = segment.Id },
                segment);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to create member segment for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating member segment for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while creating the member segment." });
        }
    }

    /// <summary>
    /// Updates an existing member segment
    /// </summary>
    /// <remarks>
    /// Updates the details and filter criteria of a specific member segment within a club.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// Updating filter criteria will automatically recalculate segment membership if auto-calculate is enabled.
    /// </remarks>
    /// <param name="clubId">The ID of the club the segment belongs to</param>
    /// <param name="segmentId">The ID of the segment to update</param>
    /// <param name="request">The updated segment information</param>
    /// <response code="200">Returns the updated segment</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or segment does not exist</response>
    [HttpPut("{segmentId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(MemberSegmentResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> UpdateSegment([FromRoute] int clubId, [FromRoute] int segmentId, [FromBody] UpdateSegmentRequest request)
    {
        try
        {
            _logger.LogInformation("Updating member segment {SegmentId} for club {ClubId}: {SegmentName}",
                segmentId, clubId, request.Name);

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

            // Set the segmentId and userId in the request
            request.SegmentId = segmentId;
            request.UpdatedByUserId = userId.Value;

            // Convert to the expected type
            var updateRequest = new UpdateMemberSegmentRequest
            {
                SegmentId = request.SegmentId,
                Name = request.Name,
                Description = request.Description,
                FilterCriteria = request.FilterCriteria,
                IsActive = request.IsActive,
                UpdatedByUserId = request.UpdatedByUserId
            };

            var updatedSegment = await _segmentationService.UpdateSegmentAsync(clubId, segmentId, userId.Value, updateRequest);

            _logger.LogInformation("Member segment updated successfully: {SegmentId}", segmentId);

            return Ok(updatedSegment);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update member segment {SegmentId} for club {ClubId}: {Error}",
                segmentId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating member segment {SegmentId} for club {ClubId}",
                segmentId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while updating the member segment." });
        }
    }

    /// <summary>
    /// Deletes a member segment
    /// </summary>
    /// <remarks>
    /// Deletes a specific member segment and all associated data.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// This operation cannot be undone.
    /// </remarks>
    /// <param name="clubId">The ID of the club the segment belongs to</param>
    /// <param name="segmentId">The ID of the segment to delete</param>
    /// <response code="204">Segment deleted successfully</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or segment does not exist</response>
    [HttpDelete("{segmentId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeleteSegment([FromRoute] int clubId, [FromRoute] int segmentId)
    {
        try
        {
            _logger.LogInformation("Deleting member segment {SegmentId} for club {ClubId}", segmentId, clubId);

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

            var deleted = await _segmentationService.DeleteSegmentAsync(clubId, segmentId, userId.Value);

            if (!deleted)
            {
                return NotFound(new { message = "Member segment not found" });
            }

            _logger.LogInformation("Member segment deleted successfully: {SegmentId}", segmentId);

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to delete member segment {SegmentId} for club {ClubId}: {Error}",
                segmentId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting member segment {SegmentId} for club {ClubId}",
                segmentId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while deleting the member segment." });
        }
    }

    /// <summary>
    /// Gets members in a specific segment
    /// </summary>
    /// <remarks>
    /// Retrieves all members that match the segment's filter criteria.
    /// Supports pagination and optional inclusion of engagement data, custom fields, and tags.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="segmentId">The ID of the segment to get members for</param>
    /// <param name="request">Query parameters for member retrieval</param>
    /// <response code="200">Returns the paginated list of segment members</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or segment does not exist</response>
    [HttpGet("{segmentId}/members")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(PaginatedSegmentMembersResponse), 200)]
    public async Task<IActionResult> GetSegmentMembers([FromRoute] int clubId, [FromRoute] int segmentId, [FromQuery] GetSegmentMembersRequest request)
    {
        try
        {
            _logger.LogInformation("Getting members for segment {SegmentId} in club {ClubId}, page {Page}",
                segmentId, clubId, request.Page);

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

            // Set the segmentId in the request
            request.SegmentId = segmentId;

            var segmentMembers = await _segmentationService.GetSegmentMembersAsync(clubId, userId.Value, request);

            _logger.LogInformation("Retrieved {Count} members for segment {SegmentId} (page {Page} of {TotalPages})",
                segmentMembers.Members?.Count ?? 0, segmentId, segmentMembers.CurrentPage, segmentMembers.TotalPages);

            return Ok(segmentMembers);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get members for segment {SegmentId} in club {ClubId}: {Error}",
                segmentId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting members for segment {SegmentId} in club {ClubId}",
                segmentId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving segment members." });
        }
    }

    /// <summary>
    /// Recalculates segment membership
    /// </summary>
    /// <remarks>
    /// Manually triggers recalculation of segment membership based on current filter criteria.
    /// Useful for segments with auto-calculate disabled or when data has been updated.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="segmentId">The ID of the segment to recalculate</param>
    /// <response code="200">Segment recalculated successfully</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or segment does not exist</response>
    [HttpPost("{segmentId}/recalculate")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(SegmentRecalculationResult), 200)]
    public async Task<IActionResult> RecalculateSegment([FromRoute] int clubId, [FromRoute] int segmentId)
    {
        try
        {
            _logger.LogInformation("Recalculating segment {SegmentId} for club {ClubId}", segmentId, clubId);

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

            var result = await _segmentationService.RecalculateSegmentAsync(clubId, segmentId, userId.Value);

            _logger.LogInformation("Segment {SegmentId} recalculated successfully, {MemberCount} members",
                segmentId, result.MemberCount);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to recalculate segment {SegmentId} for club {ClubId}: {Error}",
                segmentId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error recalculating segment {SegmentId} for club {ClubId}",
                segmentId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while recalculating the segment." });
        }
    }

    /// <summary>
    /// Searches members by advanced filter criteria
    /// </summary>
    /// <remarks>
    /// Performs advanced member search using complex filter criteria without creating a persistent segment.
    /// Supports all the same filters as segment creation including tags, custom fields, engagement data, etc.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club to search within</param>
    /// <param name="request">The search criteria</param>
    /// <response code="200">Returns the search results</response>
    /// <response code="400">If the search criteria fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("search")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(MemberSegmentSearchResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> SearchMembers([FromRoute] int clubId, [FromBody] MemberSegmentSearchRequest request)
    {
        try
        {
            _logger.LogInformation("Searching members with advanced filters for club {ClubId}", clubId);

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

            // Set the clubId in the request
            request.ClubId = clubId;

            var searchResults = await _segmentationService.SearchMembersAsync(clubId, userId.Value, request);

            _logger.LogInformation("Advanced member search completed for club {ClubId}, found {Count} members",
                clubId, searchResults.TotalCount);

            return Ok(searchResults);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to search members for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error searching members for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while searching members." });
        }
    }

    /// <summary>
    /// Gets segment statistics and insights
    /// </summary>
    /// <remarks>
    /// Retrieves statistical information and insights about a specific segment.
    /// Includes member distribution, growth trends, and segment performance metrics.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="segmentId">The ID of the segment to analyze</param>
    /// <param name="daysBack">Number of days to include in trend analysis (default: 30)</param>
    /// <response code="200">Returns the segment statistics</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or segment does not exist</response>
    [HttpGet("{segmentId}/stats")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(SegmentStatsResponse), 200)]
    public async Task<IActionResult> GetSegmentStats([FromRoute] int clubId, [FromRoute] int segmentId, [FromQuery] int daysBack = 30)
    {
        try
        {
            _logger.LogInformation("Getting statistics for segment {SegmentId} in club {ClubId}, {DaysBack} days",
                segmentId, clubId, daysBack);

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

            var segmentStats = await _segmentationService.GetSegmentStatsAsync(clubId, segmentId, userId.Value, daysBack);

            _logger.LogInformation("Retrieved statistics for segment {SegmentId}", segmentId);

            return Ok(segmentStats);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get statistics for segment {SegmentId} in club {ClubId}: {Error}",
                segmentId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting statistics for segment {SegmentId} in club {ClubId}",
                segmentId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving segment statistics." });
        }
    }
}