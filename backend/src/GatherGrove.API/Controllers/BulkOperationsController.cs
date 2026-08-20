using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.API.Extensions;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for bulk operations on members, tags, and custom fields (Unlimited tier feature)
/// BUG FIX #21: Added rate limiting to prevent abuse of bulk operations
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/bulk-operations")]
[EnableRateLimiting("StrictApi")]
public class BulkOperationsController : ControllerBase
{
    private readonly IBulkOperationsService _bulkOperationsService;
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<BulkOperationsController> _logger;

    public BulkOperationsController(
        IBulkOperationsService bulkOperationsService,
        IClubAuthorizationService authService,
        ILogger<BulkOperationsController> logger)
    {
        _bulkOperationsService = bulkOperationsService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Bulk assign tags to multiple members
    /// </summary>
    /// <remarks>
    /// Assigns one or more tags to multiple members in a single operation.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// Returns detailed results including success count, errors, and failed operations.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The bulk tag assignment details</param>
    /// <response code="200">Returns the bulk operation results</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("assign-tags")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(BulkTagOperationResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> BulkAssignTags([FromRoute] int clubId, [FromBody] BulkAssignTagsRequest request)
    {
        try
        {
            _logger.LogInformation("Bulk assigning {TagCount} tags to {MemberCount} members for club {ClubId}",
                request.TagIds?.Count ?? 0, request.MemberIds?.Count ?? 0, clubId);

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
            request.RequestedByUserId = userId.Value;

            var result = await _bulkOperationsService.BulkAssignTagsAsync(clubId, userId.Value, request);

            _logger.LogInformation("Bulk tag assignment completed for club {ClubId}: {SuccessCount} successful, {ErrorCount} failed",
                clubId, result.SuccessCount, result.ErrorCount);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to bulk assign tags for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error bulk assigning tags for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred during bulk tag assignment." });
        }
    }

    /// <summary>
    /// Bulk remove tags from multiple members
    /// </summary>
    /// <remarks>
    /// Removes one or more tags from multiple members in a single operation.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// Returns detailed results including success count, errors, and failed operations.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The bulk tag removal details</param>
    /// <response code="200">Returns the bulk operation results</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("remove-tags")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(BulkTagOperationResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> BulkRemoveTags([FromRoute] int clubId, [FromBody] BulkRemoveTagsRequest request)
    {
        try
        {
            _logger.LogInformation("Bulk removing {TagCount} tags from {MemberCount} members for club {ClubId}",
                request.TagIds?.Count ?? 0, request.MemberIds?.Count ?? 0, clubId);

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
            request.RequestedByUserId = userId.Value;

            var result = await _bulkOperationsService.BulkRemoveTagsAsync(clubId, userId.Value, request);

            _logger.LogInformation("Bulk tag removal completed for club {ClubId}: {SuccessCount} successful, {ErrorCount} failed",
                clubId, result.SuccessCount, result.ErrorCount);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to bulk remove tags for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error bulk removing tags for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred during bulk tag removal." });
        }
    }

    /// <summary>
    /// Bulk update custom field values for multiple members
    /// </summary>
    /// <remarks>
    /// Updates custom field values for multiple members in a single operation.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// Supports setting the same value for all members or different values per member.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The bulk custom field update details</param>
    /// <response code="200">Returns the bulk operation results</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("update-custom-fields")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(BulkCustomFieldResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> BulkUpdateCustomFields([FromRoute] int clubId, [FromBody] BulkUpdateCustomFieldsRequest request)
    {
        try
        {
            _logger.LogInformation("Bulk updating custom field {FieldId} for {MemberCount} members in club {ClubId}",
                request.CustomFieldId, request.Updates?.Count ?? 0, clubId);

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
            request.RequestedByUserId = userId.Value;

            var result = await _bulkOperationsService.BulkUpdateCustomFieldsAsync(clubId, userId.Value, request);

            _logger.LogInformation("Bulk custom field update completed for club {ClubId}: {SuccessCount} successful, {ErrorCount} failed",
                clubId, result.SuccessCount, result.ErrorCount);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to bulk update custom fields for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error bulk updating custom fields for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred during bulk custom field update." });
        }
    }

    /// <summary>
    /// Bulk update member statuses
    /// </summary>
    /// <remarks>
    /// Updates the status of multiple members in a single operation.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// Supports changing members to Active, Archived, Inactive, or Suspended status.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The bulk status update details</param>
    /// <response code="200">Returns the bulk operation results</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("update-member-statuses")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(BulkMemberUpdateResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> BulkUpdateMemberStatuses([FromRoute] int clubId, [FromBody] BulkUpdateMemberStatusRequest request)
    {
        try
        {
            _logger.LogInformation("Bulk updating status to {Status} for {MemberCount} members in club {ClubId}",
                request.NewStatus, request.MemberIds?.Count ?? 0, clubId);

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
            request.RequestedByUserId = userId.Value;

            var result = await _bulkOperationsService.BulkUpdateMemberStatusAsync(clubId, userId.Value, request);

            _logger.LogInformation("Bulk member status update completed for club {ClubId}: {SuccessCount} successful, {ErrorCount} failed",
                clubId, result.SuccessCount, result.ErrorCount);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to bulk update member statuses for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error bulk updating member statuses for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred during bulk member status update." });
        }
    }

    /// <summary>
    /// Bulk export members based on filter criteria
    /// </summary>
    /// <remarks>
    /// Exports member data in bulk based on advanced filter criteria to CSV or Excel format.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// Supports including custom fields, tags, engagement data, and more in the export.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The bulk export criteria</param>
    /// <response code="200">Returns the export file or download link</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("export")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(BulkExportResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> BulkExport([FromRoute] int clubId, [FromBody] BulkExportRequest request)
    {
        try
        {
            _logger.LogInformation("Bulk exporting members for club {ClubId} in {Format} format",
                clubId, request.ExportFormat);

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
            request.RequestedByUserId = userId.Value;

            var result = await _bulkOperationsService.BulkExportMembersAsync(clubId, userId.Value, request);

            _logger.LogInformation("Bulk export completed for club {ClubId}: {RecordCount} records exported",
                clubId, result.RecordCount);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to bulk export members for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error bulk exporting members for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred during bulk export." });
        }
    }

    /// <summary>
    /// Bulk import members from uploaded file
    /// </summary>
    /// <remarks>
    /// Imports member data in bulk from a CSV or Excel file.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// Supports importing custom fields, tags, and other member data.
    /// Returns detailed results including validation errors and import statistics.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The bulk import details</param>
    /// <response code="200">Returns the import results</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpPost("import")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(BulkImportResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> BulkImport([FromRoute] int clubId, [FromBody] BulkImportRequest request)
    {
        try
        {
            _logger.LogInformation("Bulk importing members for club {ClubId}", clubId);

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
            request.RequestedByUserId = userId.Value;

            var result = await _bulkOperationsService.BulkImportMembersAsync(clubId, userId.Value, request);

            _logger.LogInformation("Bulk import completed for club {ClubId}: {SuccessCount} successful, {ErrorCount} failed",
                clubId, result.SuccessCount, result.ErrorCount);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to bulk import members for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error bulk importing members for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred during bulk import." });
        }
    }

    /// <summary>
    /// Gets the status of a bulk operation
    /// </summary>
    /// <remarks>
    /// Retrieves the current status and progress of a long-running bulk operation.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="operationId">The ID of the bulk operation to check</param>
    /// <response code="200">Returns the operation status</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or operation does not exist</response>
    [HttpGet("status/{operationId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(BulkOperationStatus), 200)]
    public async Task<IActionResult> GetOperationStatus([FromRoute] int clubId, [FromRoute] string operationId)
    {
        try
        {
            _logger.LogInformation("Getting status for bulk operation {OperationId} in club {ClubId}", operationId, clubId);

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

            var status = await _bulkOperationsService.GetOperationStatusAsync(clubId, operationId, userId.Value);

            if (status == null)
            {
                return NotFound(new { message = "Bulk operation not found" });
            }

            return Ok(status);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get bulk operation status {OperationId} for club {ClubId}: {Error}",
                operationId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting bulk operation status {OperationId} for club {ClubId}",
                operationId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving operation status." });
        }
    }

    /// <summary>
    /// Cancels a running bulk operation
    /// </summary>
    /// <remarks>
    /// Attempts to cancel a currently running bulk operation.
    /// Requires authentication and admin access to the club.
    /// Only available for clubs with Unlimited tier subscription.
    /// Note: Operations that have already completed cannot be cancelled.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="operationId">The ID of the bulk operation to cancel</param>
    /// <response code="200">Operation cancelled successfully</response>
    /// <response code="400">If the operation cannot be cancelled</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin or club doesn't have Unlimited tier</response>
    /// <response code="404">If the specified club or operation does not exist</response>
    [HttpPost("cancel/{operationId}")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> CancelOperation([FromRoute] int clubId, [FromRoute] string operationId)
    {
        try
        {
            _logger.LogInformation("Cancelling bulk operation {OperationId} for club {ClubId}", operationId, clubId);

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

            var cancelled = await _bulkOperationsService.CancelOperationAsync(clubId, operationId, userId.Value);

            if (!cancelled)
            {
                return BadRequest(new { message = "Operation cannot be cancelled" });
            }

            _logger.LogInformation("Bulk operation {OperationId} cancelled successfully", operationId);

            return Ok(new { message = "Operation cancelled successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to cancel bulk operation {OperationId} for club {ClubId}: {Error}",
                operationId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error cancelling bulk operation {OperationId} for club {ClubId}",
                operationId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while cancelling the operation." });
        }
    }
}