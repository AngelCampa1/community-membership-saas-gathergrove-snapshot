using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for account deletion operations with complete data export and cleanup
/// </summary>
[ApiController]
[Route("api/v1/account-deletion")]
[Authorize]
[Produces("application/json")]
public class AccountDeletionController : ControllerBase
{
    private readonly IAccountDeletionService _accountDeletionService;
    private readonly IAdminService _adminService;
    private readonly ILogger<AccountDeletionController> _logger;

    public AccountDeletionController(
        IAccountDeletionService accountDeletionService,
        IAdminService adminService,
        ILogger<AccountDeletionController> logger)
    {
        _accountDeletionService = accountDeletionService;
        _adminService = adminService;
        _logger = logger;
    }

    /// <summary>
    /// Validates whether the current user's account can be deleted
    /// </summary>
    /// <remarks>
    /// Checks for blocking conditions like active subscriptions, club ownership, etc.
    /// Returns impact summary and required actions before deletion can proceed.
    /// </remarks>
    /// <response code="200">Returns validation result with requirements</response>
    /// <response code="401">If the request lacks a valid JWT token</response>
    /// <response code="500">If an unexpected error occurs during validation</response>
    [HttpGet("validate")]
    [ProducesResponseType(typeof(AccountDeletionValidationResponse), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> ValidateAccountDeletion()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(CreateProblemDetails("Authentication Error", "Invalid authentication token.", 401));
            }

            _logger.LogInformation("Validating account deletion for user: {UserId}", userId.Value);

            var validation = await _accountDeletionService.ValidateAccountDeletionAsync(userId.Value);

            return Ok(validation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during account deletion validation");
            return StatusCode(500, CreateProblemDetails("Validation Error",
                "An unexpected error occurred during validation. Please try again.", 500));
        }
    }

    /// <summary>
    /// Requests account deletion with data export
    /// </summary>
    /// <remarks>
    /// Initiates the account deletion process after validation. If the user owns clubs
    /// or has active subscriptions, the request may require manual review.
    /// Data export is generated before any deletion occurs.
    /// </remarks>
    /// <param name="request">Deletion request with reason and preferences</param>
    /// <response code="200">Deletion request initiated successfully</response>
    /// <response code="400">If the request fails validation or has blocking conditions</response>
    /// <response code="401">If the request lacks a valid JWT token</response>
    /// <response code="500">If an unexpected error occurs during initiation</response>
    [HttpPost("request")]
    [ProducesResponseType(typeof(AccountDeletionResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> RequestAccountDeletion([FromBody] AccountDeletionRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(CreateProblemDetails("Authentication Error", "Invalid authentication token.", 401));
            }

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Account deletion request validation failed for user: {UserId}", userId.Value);
                return BadRequest(ModelState);
            }

            _logger.LogInformation("Processing account deletion request for user: {UserId}", userId.Value);

            var response = await _accountDeletionService.RequestAccountDeletionAsync(userId.Value, request);

            _logger.LogInformation("Account deletion request created: {DeletionId} for user: {UserId}",
                response.DeletionRequestId, userId.Value);

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Account deletion request failed: {Message}", ex.Message);
            return BadRequest(CreateProblemDetails("Deletion Request Error", ex.Message, 400));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during account deletion request");
            return StatusCode(500, CreateProblemDetails("Deletion Request Error",
                "An unexpected error occurred while processing your deletion request. Please try again.", 500));
        }
    }

    /// <summary>
    /// Gets the status of an account deletion request
    /// </summary>
    /// <param name="deletionRequestId">Deletion request ID</param>
    /// <response code="200">Returns current status and progress</response>
    /// <response code="401">If the request lacks a valid JWT token</response>
    /// <response code="404">If the deletion request is not found</response>
    /// <response code="500">If an unexpected error occurs</response>
    [HttpGet("{deletionRequestId:guid}/status")]
    [ProducesResponseType(typeof(AccountDeletionStatusResponse), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> GetAccountDeletionStatus(Guid deletionRequestId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(CreateProblemDetails("Authentication Error", "Invalid authentication token.", 401));
            }

            _logger.LogInformation("Getting deletion status for request: {DeletionId}, user: {UserId}",
                deletionRequestId, userId.Value);

            var status = await _accountDeletionService.GetAccountDeletionStatusAsync(userId.Value, deletionRequestId);

            return Ok(status);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Deletion request not found: {DeletionId}", deletionRequestId);
            return NotFound(CreateProblemDetails("Deletion Request Not Found", ex.Message, 404));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting deletion status");
            return StatusCode(500, CreateProblemDetails("Status Error",
                "An unexpected error occurred while getting deletion status. Please try again.", 500));
        }
    }

    /// <summary>
    /// Cancels a pending account deletion request
    /// </summary>
    /// <param name="deletionRequestId">Deletion request ID to cancel</param>
    /// <response code="200">Deletion request cancelled successfully</response>
    /// <response code="400">If the deletion cannot be cancelled (already processed)</response>
    /// <response code="401">If the request lacks a valid JWT token</response>
    /// <response code="404">If the deletion request is not found</response>
    /// <response code="500">If an unexpected error occurs</response>
    [HttpPost("{deletionRequestId:guid}/cancel")]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> CancelAccountDeletion(Guid deletionRequestId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(CreateProblemDetails("Authentication Error", "Invalid authentication token.", 401));
            }

            _logger.LogInformation("Cancelling deletion request: {DeletionId} for user: {UserId}",
                deletionRequestId, userId.Value);

            await _accountDeletionService.CancelAccountDeletionAsync(userId.Value, deletionRequestId);

            _logger.LogInformation("Deletion request cancelled: {DeletionId}", deletionRequestId);

            return Ok(new { message = "Account deletion request successfully cancelled" });
        }
        catch (ArgumentException ex)
        {
            return NotFound(CreateProblemDetails("Deletion Request Not Found", ex.Message, 404));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Cannot cancel deletion request: {DeletionId} - {Message}", deletionRequestId, ex.Message);
            return BadRequest(CreateProblemDetails("Cannot Cancel Deletion", ex.Message, 400));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error cancelling deletion request");
            return StatusCode(500, CreateProblemDetails("Cancellation Error",
                "An unexpected error occurred while cancelling deletion request. Please try again.", 500));
        }
    }

    /// <summary>
    /// Gets available admin transfer targets for clubs
    /// </summary>
    /// <remarks>
    /// For admin accounts only. Returns list of users who can receive admin transfer
    /// for clubs where the current user is an administrator.
    /// </remarks>
    /// <response code="200">Returns list of available transfer targets</response>
    /// <response code="401">If the request lacks a valid JWT token</response>
    /// <response code="403">If the user is not an admin</response>
    /// <response code="500">If an unexpected error occurs</response>
    [HttpGet("admin/transfer-targets")]
    [ProducesResponseType(typeof(List<AdminTransferTarget>), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 403)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> GetAdminTransferTargets()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(CreateProblemDetails("Authentication Error", "Invalid authentication token.", 401));
            }

            _logger.LogInformation("Getting admin transfer targets for user: {UserId}", userId.Value);

            // Check if user is admin for any clubs
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Owner")
            {
                return Forbid();
            }

            var transferTargets = await _accountDeletionService.GetAdminTransferTargetsAsync(userId.Value);

            _logger.LogInformation("Found {Count} transfer targets for admin: {UserId}", transferTargets.Count, userId.Value);

            return Ok(transferTargets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting admin transfer targets");
            return StatusCode(500, CreateProblemDetails("Transfer Targets Error",
                "An unexpected error occurred while getting transfer targets. Please try again.", 500));
        }
    }

    /// <summary>
    /// Transfers club ownership to another admin
    /// </summary>
    /// <remarks>
    /// For admin accounts only. Transfers ownership of specified clubs to another admin.
    /// This is a prerequisite for admin account deletion where clubs will remain active.
    /// </remarks>
    /// <param name="request">Transfer request with club and target admin details</param>
    /// <response code="200">Transfer initiated successfully</response>
    /// <response code="400">If the transfer request is invalid</response>
    /// <response code="401">If the request lacks a valid JWT token</response>
    /// <response code="403">If the user is not authorized to transfer the club</response>
    /// <response code="404">If the club or target admin is not found</response>
    /// <response code="500">If an unexpected error occurs</response>
    [HttpPost("admin/transfer-ownership")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 403)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> TransferClubOwnership([FromBody] ClubOwnershipTransferRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(CreateProblemDetails("Authentication Error", "Invalid authentication token.", 401));
            }

            _logger.LogInformation("Initiating club ownership transfer for admin: {UserId}, club: {ClubId}",
                userId.Value, request.ClubId);

            // Check if user is admin for any clubs
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Owner")
            {
                return Forbid();
            }

            var result = await _accountDeletionService.TransferClubOwnershipAsync(userId.Value, request);

            _logger.LogInformation("Club ownership transfer initiated: {TransferId}", result.TransferId);

            return Ok(new
            {
                message = "Club ownership transfer initiated successfully",
                transferId = result.TransferId,
                requiresConfirmation = result.RequiresTargetConfirmation
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(CreateProblemDetails("Invalid Transfer Request", ex.Message, 400));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during club ownership transfer");
            return StatusCode(500, CreateProblemDetails("Transfer Error",
                "An unexpected error occurred during club ownership transfer. Please try again.", 500));
        }
    }

    /// <summary>
    /// Downloads the data export for the user
    /// </summary>
    /// <param name="exportId">Data export ID</param>
    /// <response code="200">Returns the data export file</response>
    /// <response code="401">If the request lacks a valid JWT token</response>
    /// <response code="404">If the export is not found or expired</response>
    /// <response code="410">If the export link has expired</response>
    /// <response code="500">If an unexpected error occurs</response>
    [HttpGet("exports/{exportId:guid}/download")]
    [ProducesResponseType(typeof(FileResult), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 410)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> DownloadDataExport(Guid exportId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(CreateProblemDetails("Authentication Error", "Invalid authentication token.", 401));
            }

            _logger.LogInformation("Downloading data export: {ExportId} for user: {UserId}", exportId, userId.Value);

            var download = await _accountDeletionService.DownloadDataExportAsync(userId.Value, exportId);

            _logger.LogInformation("Data export downloaded: {ExportId}, size: {Size}", exportId, download.FileSize);

            return File(download.FileContent, download.ContentType, download.FileName);
        }
        catch (ArgumentException ex)
        {
            return NotFound(CreateProblemDetails("Export Not Found", ex.Message, 404));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("expired"))
        {
            _logger.LogWarning("Export link expired: {ExportId}", exportId);
            return StatusCode(410, CreateProblemDetails("Export Expired", ex.Message, 410));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error downloading data export");
            return StatusCode(500, CreateProblemDetails("Download Error",
                "An unexpected error occurred while downloading your data export. Please try again.", 500));
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }

    private ProblemDetails CreateProblemDetails(string title, string detail, int statusCode)
    {
        return new ProblemDetails
        {
            Title = title,
            Detail = detail,
            Status = statusCode,
            Instance = HttpContext.Request.Path
        };
    }
}