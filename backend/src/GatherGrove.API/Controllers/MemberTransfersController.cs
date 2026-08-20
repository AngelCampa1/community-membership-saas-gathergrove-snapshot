using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Application.Services;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// API endpoints for managing member transfers between locations
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1")]
public class MemberTransfersController : ControllerBase
{
    private readonly IMemberTransferService _transferService;
    private readonly ILogger<MemberTransfersController> _logger;

    public MemberTransfersController(
        IMemberTransferService transferService,
        ILogger<MemberTransfersController> logger)
    {
        _transferService = transferService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a transfer request for a member
    /// </summary>
    [HttpPost("members/{memberId}/transfers")]
    public async Task<ActionResult<MemberTransferResponse>> RequestTransfer(
        int memberId,
        [FromBody] CreateMemberTransferRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var transfer = await _transferService.RequestTransferAsync(memberId, userId, request);
            return CreatedAtAction(nameof(GetTransferHistory), new { memberId }, transfer);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting transfer for member {MemberId}", memberId);
            return StatusCode(500, new { message = "An error occurred while requesting the transfer" });
        }
    }

    /// <summary>
    /// Gets all pending transfers for a location
    /// </summary>
    [HttpGet("locations/{locationId}/transfers/pending")]
    public async Task<ActionResult<List<MemberTransferResponse>>> GetPendingTransfers(int locationId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var transfers = await _transferService.GetPendingTransfersAsync(locationId, userId);
            return Ok(transfers);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending transfers for location {LocationId}", locationId);
            return StatusCode(500, new { message = "An error occurred while retrieving pending transfers" });
        }
    }

    /// <summary>
    /// Approves a transfer request
    /// </summary>
    [HttpPost("transfers/{transferId}/approve")]
    public async Task<ActionResult<MemberTransferResponse>> ApproveTransfer(
        int transferId,
        [FromBody] ApproveTransferRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var transfer = await _transferService.ApproveTransferAsync(transferId, userId, request);
            return Ok(transfer);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving transfer {TransferId}", transferId);
            return StatusCode(500, new { message = "An error occurred while approving the transfer" });
        }
    }

    /// <summary>
    /// Denies a transfer request
    /// </summary>
    [HttpPost("transfers/{transferId}/deny")]
    public async Task<ActionResult<MemberTransferResponse>> DenyTransfer(
        int transferId,
        [FromBody] DenyTransferRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var transfer = await _transferService.DenyTransferAsync(transferId, userId, request);
            return Ok(transfer);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error denying transfer {TransferId}", transferId);
            return StatusCode(500, new { message = "An error occurred while denying the transfer" });
        }
    }

    /// <summary>
    /// Gets transfer history for a member
    /// </summary>
    [HttpGet("members/{memberId}/transfer-history")]
    public async Task<ActionResult<List<MemberTransferResponse>>> GetTransferHistory(int memberId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            var history = await _transferService.GetTransferHistoryAsync(memberId, userId);
            return Ok(history);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting transfer history for member {MemberId}", memberId);
            return StatusCode(500, new { message = "An error occurred while retrieving transfer history" });
        }
    }
}

