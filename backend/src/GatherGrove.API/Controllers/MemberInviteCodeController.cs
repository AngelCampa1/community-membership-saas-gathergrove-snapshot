using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// API controller for managing member invite codes
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/invite-codes")]
[Authorize]
public class MemberInviteCodeController : ControllerBase
{
    private readonly IMemberInviteCodeService _inviteCodeService;

    public MemberInviteCodeController(IMemberInviteCodeService inviteCodeService)
    {
        _inviteCodeService = inviteCodeService;
    }

    /// <summary>
    /// Create a new member invite code
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="request">Invite code creation request</param>
    /// <returns>Created invite code</returns>
    [HttpPost]
    public async Task<IActionResult> CreateInviteCode(int clubId, [FromBody] CreateMemberInviteCodeRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _inviteCodeService.CreateInviteCodeAsync(clubId, userId, request);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }

    /// <summary>
    /// Get all invite codes for a club
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <returns>List of invite codes</returns>
    [HttpGet]
    public async Task<IActionResult> GetClubInviteCodes(int clubId)
    {
        var userId = GetCurrentUserId();
        var result = await _inviteCodeService.GetClubInviteCodesAsync(clubId, userId);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }

    /// <summary>
    /// Get a specific invite code by ID
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="id">Invite code ID</param>
    /// <returns>Invite code details</returns>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetInviteCode(int clubId, int id)
    {
        var userId = GetCurrentUserId();
        var result = await _inviteCodeService.GetInviteCodeByIdAsync(id, clubId, userId);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }

    /// <summary>
    /// Toggle the active status of an invite code
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="id">Invite code ID</param>
    /// <returns>Success message</returns>
    [HttpPatch("{id}/toggle-status")]
    public async Task<IActionResult> ToggleInviteCodeStatus(int clubId, int id)
    {
        var userId = GetCurrentUserId();
        var result = await _inviteCodeService.ToggleInviteCodeStatusAsync(id, clubId, userId);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }

    /// <summary>
    /// Delete an invite code
    /// </summary>
    /// <param name="clubId">Club ID</param>
    /// <param name="id">Invite code ID</param>
    /// <returns>Success message</returns>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInviteCode(int clubId, int id)
    {
        var userId = GetCurrentUserId();
        var result = await _inviteCodeService.DeleteInviteCodeAsync(id, clubId, userId);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }

    /// <summary>
    /// Gets the current user ID from the JWT token
    /// </summary>
    /// <returns>Current user ID</returns>
    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }
        return userId;
    }
}

/// <summary>
/// Public API controller for invite code validation and member registration
/// </summary>
[ApiController]
[Route("api/v1/invite-codes")]
public class PublicInviteCodeController : ControllerBase
{
    private readonly IMemberInviteCodeService _inviteCodeService;

    public PublicInviteCodeController(IMemberInviteCodeService inviteCodeService)
    {
        _inviteCodeService = inviteCodeService;
    }

    /// <summary>
    /// Validate an invite code (public endpoint)
    /// </summary>
    /// <param name="code">Invite code to validate</param>
    /// <returns>Invite code validation result</returns>
    [HttpGet("{code}/validate")]
    public async Task<IActionResult> ValidateInviteCode(string code)
    {
        var result = await _inviteCodeService.ValidateInviteCodeAsync(code);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }

    /// <summary>
    /// Get invite code details (public endpoint)
    /// </summary>
    /// <param name="code">Invite code</param>
    /// <returns>Invite code details</returns>
    [HttpGet("{code}")]
    public async Task<IActionResult> GetInviteCode(string code)
    {
        var result = await _inviteCodeService.GetInviteCodeByCodeAsync(code);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }

    /// <summary>
    /// Register a new member using an invite code
    /// </summary>
    /// <param name="request">Member registration request</param>
    /// <returns>Registered member details</returns>
    [HttpPost("register")]
    public async Task<IActionResult> RegisterWithInviteCode([FromBody] RegisterWithInviteCodeRequest request)
    {
        var result = await _inviteCodeService.RegisterMemberWithInviteCodeAsync(request);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }

    /// <summary>
    /// Gets the current user ID from the JWT token
    /// </summary>
    /// <returns>Current user ID</returns>
    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }
        return userId;
    }
}