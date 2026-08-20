using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.API.Extensions;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing club members
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/members")]
public class MembersController : ControllerBase
{
    private readonly IMemberService _memberService;
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<MembersController> _logger;

    public MembersController(
        IMemberService memberService,
        IClubAuthorizationService authService,
        ILogger<MembersController> logger)
    {
        _memberService = memberService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new member for a club
    /// </summary>
    /// <remarks>
    /// Creates a new member record and adds them to the club.
    /// Requires authentication and admin access to the specified club.
    /// The member's email must be unique within the club.
    /// If no join date is provided, the current date is used.
    /// </remarks>
    /// <param name="clubId">The ID of the club where the member will be added</param>
    /// <param name="request">The details of the new member to create</param>
    /// <response code="201">Returns the newly created member's details</response>
    /// <response code="400">If the request body fails validation (e.g., missing name, invalid email, email already exists, or invalid membership type)</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club or membership type does not exist</response>
    [HttpPost]
    [Authorize(Policy = "ClubAdmin")] // Admin access required to create members
    [ProducesResponseType(typeof(MemberResponse), 201)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> CreateMember([FromRoute] int clubId, [FromBody] CreateMemberRequest request)
    {
        try
        {
            _logger.LogInformation("Creating member for club {ClubId}: {Name} ({Email})", clubId, request.FullName, request.Email);

            // Verify club admin access using the authorization service
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var member = await _memberService.CreateMemberAsync(clubId, request);

            _logger.LogInformation("Member created successfully: {MemberId}", member.Id);

            return CreatedAtAction(
                nameof(GetMember),
                new { clubId, memberId = member.Id },
                member);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to create member for club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating member for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while creating the member." });
        }
    }

    /// <summary>
    /// Gets paginated and searchable members for a club (Story 14)
    /// </summary>
    /// <remarks>
    /// Retrieves a paginated list of active members for the specified club with optional search functionality.
    /// Supports searching by member name or email address.
    /// Returns pagination metadata including current page, total pages, and navigation indicators.
    /// Only returns active members as per Story 14 requirements.
    /// </remarks>
    /// <param name="clubId">The ID of the club to get members for</param>
    /// <param name="search">Optional search term to filter members by name or email</param>
    /// <param name="page">Page number (1-based, defaults to 1)</param>
    /// <param name="pageSize">Number of items per page (defaults to 25, max 100)</param>
    /// <response code="200">Returns the paginated list of members with metadata</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user does not have access to the specified club</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet("paginated")]
    [Authorize(Policy = "ClubMember")] // Allow both admins and members to view directory
    [ProducesResponseType(typeof(PaginatedMembersResponse), 200)]
    public async Task<IActionResult> GetPaginatedMembers(
        [FromRoute] int clubId,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        try
        {
            _logger.LogInformation("Getting paginated members for club {ClubId}, page {Page}, pageSize {PageSize}, search '{Search}'",
                clubId, page, pageSize, search ?? "none");

            // Verify club member access using the authorization service
            var authResult = await this.VerifyClubMemberAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var result = await _memberService.GetPaginatedMembersAsync(clubId, search, page, pageSize);

            _logger.LogInformation("Retrieved {Count} members for club {ClubId} (page {Page} of {TotalPages})",
                result.Members.Count, clubId, result.CurrentPage, result.TotalPages);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting paginated members for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving members." });
        }
    }

    /// <summary>
    /// Gets the member directory for a club (Story 30)
    /// </summary>
    /// <remarks>
    /// Returns only members who have opted into the directory with their chosen visible fields.
    /// Requires the requesting member to be opted in and the club to have directory enabled.
    /// </remarks>
    /// <param name="clubId">The ID of the club to get the directory for</param>
    /// <param name="search">Optional search term to filter members by name</param>
    /// <param name="page">Page number (1-based, defaults to 1)</param>
    /// <param name="pageSize">Number of items per page (defaults to 25, max 100)</param>
    /// <response code="200">Returns the paginated directory with member privacy settings respected</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user does not have access to the directory (not opted in or directory disabled)</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet("directory")]
    [Authorize(Policy = "ClubMember")] // Allow both admins and members to view directory
    [ProducesResponseType(typeof(PaginatedDirectoryMembersResponse), 200)]
    public async Task<IActionResult> GetMemberDirectory(
        [FromRoute] int clubId,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                _logger.LogWarning("Invalid user ID claim for directory request");
                return Unauthorized("Invalid authentication token");
            }

            _logger.LogInformation("Getting member directory for club {ClubId}, user {UserId}, page {Page}, pageSize {PageSize}, search '{Search}'",
                clubId, userId, page, pageSize, search ?? "none");

            var result = await _memberService.GetMemberDirectoryAsync(clubId, userId, search, page, pageSize);

            _logger.LogInformation("Retrieved {Count} directory members for club {ClubId} (page {Page} of {TotalPages})",
                result.Members.Count, clubId, result.CurrentPage, result.TotalPages);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for directory: {Error}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Forbidden directory access: {Error}", ex.Message);
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting member directory for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving the member directory." });
        }
    }

    /// <summary>
    /// Gets all members for a club
    /// </summary>
    /// <remarks>
    /// Retrieves all members associated with the specified club.
    /// Requires authentication and access to the specified club.
    /// Members are returned with their membership type information.
    /// </remarks>
    /// <param name="clubId">The ID of the club to get members for</param>
    /// <response code="200">Returns the list of members for the club</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user does not have access to the specified club</response>
    /// <response code="404">If the specified club does not exist</response>
    [HttpGet]
    [Authorize(Policy = "ClubMember")] // Allow both admins and members to view directory
    [ProducesResponseType(typeof(List<MemberResponse>), 200)]
    public async Task<IActionResult> GetMembers([FromRoute] int clubId)
    {
        try
        {
            _logger.LogInformation("Getting members for club {ClubId}", clubId);

            // Verify club member access using the authorization service
            var authResult = await this.VerifyClubMemberAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var members = await _memberService.GetMembersByClubAsync(clubId);

            return Ok(members);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting members for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving members." });
        }
    }

    /// <summary>
    /// Gets a specific member by ID
    /// </summary>
    /// <remarks>
    /// Retrieves the details of a specific member within a club.
    /// Requires authentication and access to the specified club.
    /// Returns the member with their membership type information.
    /// </remarks>
    /// <param name="clubId">The ID of the club the member belongs to</param>
    /// <param name="memberId">The ID of the member to retrieve</param>
    /// <response code="200">Returns the member details</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user does not have access to the specified club</response>
    /// <response code="404">If the specified club or member does not exist</response>
    [HttpGet("{memberId}")]
    [Authorize(Policy = "ClubAdmin")] // Admin access required to get specific member
    [ProducesResponseType(typeof(MemberResponse), 200)]
    public async Task<IActionResult> GetMember([FromRoute] int clubId, [FromRoute] int memberId)
    {
        try
        {
            _logger.LogInformation("Getting member {MemberId} for club {ClubId}", memberId, clubId);

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

            var member = await _memberService.GetMemberByIdAsync(clubId, memberId);

            if (member == null)
            {
                return NotFound(new { message = "Member not found" });
            }

            return Ok(member);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting member {MemberId} for club {ClubId}", memberId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving the member." });
        }
    }

    /// <summary>
    /// Updates an existing member's information
    /// </summary>
    /// <remarks>
    /// Updates the details of a specific member within a club.
    /// Requires authentication and admin access to the specified club.
    /// All fields in the request will replace the existing values.
    /// The member's email must remain unique within the club.
    /// </remarks>
    /// <param name="clubId">The ID of the club the member belongs to</param>
    /// <param name="memberId">The ID of the member to update</param>
    /// <param name="request">The updated member information</param>
    /// <response code="200">Returns the updated member details</response>
    /// <response code="400">If the request body fails validation (e.g., duplicate email, invalid membership type, or tier restrictions)</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club or member does not exist</response>
    [HttpPut("{memberId}")]
    [Authorize(Policy = "ClubAdmin")] // Admin access required to update members
    [ProducesResponseType(typeof(MemberResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> UpdateMember([FromRoute] int clubId, [FromRoute] int memberId, [FromBody] UpdateMemberRequest request)
    {
        try
        {
            _logger.LogInformation("Updating member {MemberId} for club {ClubId}: {Name} ({Email})", memberId, clubId, request.FullName, request.Email);

            // Verify club ownership - user must own the club they're updating members for
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user updating member in club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to update member in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var updatedMember = await _memberService.UpdateMemberAsync(clubId, memberId, request);

            _logger.LogInformation("Member updated successfully: {MemberId}", updatedMember.Id);

            return Ok(updatedMember);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update member {MemberId} for club {ClubId}: {Error}", memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating member {MemberId} for club {ClubId}", memberId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while updating the member." });
        }
    }

    /// <summary>
    /// Updates a member's status (Story 16: Archive a Member)
    /// </summary>
    /// <remarks>
    /// Updates the status of a specific member within a club (e.g., archive a member).
    /// Requires authentication and admin access to the specified club.
    /// Valid statuses include: Active, Archived, Inactive, Suspended.
    /// Archived members will not appear in the default member listing.
    /// </remarks>
    /// <param name="clubId">The ID of the club the member belongs to</param>
    /// <param name="memberId">The ID of the member to update</param>
    /// <param name="request">The status update request</param>
    /// <response code="200">Returns the updated member details</response>
    /// <response code="400">If the request body fails validation (e.g., invalid status)</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club or member does not exist</response>
    [HttpPut("{memberId}/status")]
    [Authorize(Policy = "ClubAdmin")] // Admin access required to update member status
    [ProducesResponseType(typeof(MemberResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> UpdateMemberStatus([FromRoute] int clubId, [FromRoute] int memberId, [FromBody] UpdateMemberStatusRequest request)
    {
        try
        {
            _logger.LogInformation("Updating member {MemberId} status to {Status} for club {ClubId}", memberId, request.Status, clubId);

            // Verify club ownership - user must own the club they're updating members for
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user updating member status in club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to update member status in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var updatedMember = await _memberService.UpdateMemberStatusAsync(clubId, memberId, request.Status);

            _logger.LogInformation("Member status updated successfully: {MemberId} to {Status}", updatedMember.Id, updatedMember.Status);

            return Ok(updatedMember);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update member {MemberId} status for club {ClubId}: {Error}", memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating member {MemberId} status for club {ClubId}", memberId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while updating the member status." });
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

    /// <summary>
    /// Records a manual dues payment for a member (Story 17)
    /// </summary>
    /// <remarks>
    /// Records a manual payment (cash or check) made by a member for their dues.
    /// Creates a payment record and automatically updates the member's DuesPaidUntil date.
    /// The member's dues will be extended by one year from the payment date, or from their
    /// existing dues expiration date if they are already paid beyond the payment date.
    /// Requires authentication and admin access to the specified club.
    /// </remarks>
    /// <param name="clubId">The ID of the club the member belongs to</param>
    /// <param name="memberId">The ID of the member making the payment</param>
    /// <param name="request">The payment details (amount, date, method, notes)</param>
    /// <response code="201">Returns the recorded payment details</response>
    /// <response code="400">If the request body fails validation (e.g., invalid amount or payment method)</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club or member does not exist</response>
    [HttpPost("{memberId}/payments")]
    [Authorize(Policy = "ClubAdmin")] // Admin access required to record payments
    [ProducesResponseType(typeof(PaymentResponse), 201)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> RecordPayment([FromRoute] int clubId, [FromRoute] int memberId, [FromBody] RecordPaymentRequest request)
    {
        try
        {
            _logger.LogInformation("Recording payment of ${Amount} for member {MemberId} in club {ClubId} via {PaymentMethod}",
                request.Amount, memberId, clubId, request.PaymentMethod);

            // Verify club ownership - user must own the club they're recording payments for
            var userClubIdClaim = User.FindFirst("ClubId");
            if (userClubIdClaim == null || !int.TryParse(userClubIdClaim.Value, out var userClubId))
            {
                _logger.LogWarning("Missing or invalid ClubId claim for user recording payment in club {ClubId}", clubId);
                return Forbid();
            }

            if (userClubId != clubId)
            {
                _logger.LogWarning("User attempted to record payment in club {ClubId} but owns club {UserClubId}", clubId, userClubId);
                return Forbid();
            }

            var payment = await _memberService.RecordPaymentAsync(clubId, memberId, request);

            _logger.LogInformation("Payment recorded successfully: {PaymentId} for member {MemberId}", payment.PaymentId, memberId);

            return CreatedAtAction(
                nameof(GetMember),
                new { clubId, memberId },
                payment);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to record payment for member {MemberId} in club {ClubId}: {Error}", memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error recording payment for member {MemberId} in club {ClubId}", memberId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while recording the payment." });
        }
    }

    /// <summary>
    /// Gets the current user's member profile (self-access)
    /// </summary>
    /// <remarks>
    /// Returns the member profile for the currently authenticated user.
    /// Available to both admins and members to view their own profile.
    /// Members can only see their own profile, while admins can see theirs within their club.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <response code="200">Returns the member's profile</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not a member of the specified club</response>
    /// <response code="404">If the member profile is not found</response>
    [HttpGet("me")]
    [Authorize(Policy = "ClubMember")] // Allow both admins and members
    [ProducesResponseType(typeof(MemberResponse), 200)]
    public async Task<IActionResult> GetMyProfile([FromRoute] int clubId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                _logger.LogWarning("No user ID found in claims for self-profile access");
                return Unauthorized("Invalid authentication token");
            }

            _logger.LogInformation("Getting self profile for user {UserId} in club {ClubId}", currentUserId.Value, clubId);

            // Verify club access
            var authCheck = await this.VerifyClubMemberAccessAsync(_authService, clubId);
            if (authCheck != null) return authCheck;

            // Get member profile by user's email
            var userEmailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(userEmailClaim))
            {
                _logger.LogWarning("No email claim found for user {UserId}", currentUserId.Value);
                return Unauthorized("Invalid authentication token");
            }

            var member = await _memberService.GetMemberByEmailAsync(clubId, userEmailClaim);
            if (member == null)
            {
                _logger.LogWarning("Member profile not found for user {UserId} in club {ClubId}", currentUserId.Value, clubId);
                return NotFound(new { message = "Member profile not found" });
            }

            return Ok(member);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting self profile for user in club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving your profile." });
        }
    }

    /// <summary>
    /// Updates the current user's member profile (self-access)
    /// </summary>
    /// <remarks>
    /// Updates the member profile for the currently authenticated user.
    /// Members can update their own contact information, while admins can update their profile within their club.
    /// Some fields may be restricted based on club tier and user role.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <param name="request">The updated profile information</param>
    /// <response code="200">Returns the updated member profile</response>
    /// <response code="400">If the request body fails validation</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not a member of the specified club</response>
    /// <response code="404">If the member profile is not found</response>
    [HttpPut("me")]
    [Authorize(Policy = "ClubMember")] // Allow both admins and members
    [ProducesResponseType(typeof(MemberResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> UpdateMyProfile([FromRoute] int clubId, [FromBody] UpdateMemberRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                _logger.LogWarning("No user ID found in claims for self-profile update");
                return Unauthorized("Invalid authentication token");
            }

            _logger.LogInformation("Updating self profile for user {UserId} in club {ClubId}", currentUserId.Value, clubId);

            // Verify club access
            var authCheck = await this.VerifyClubMemberAccessAsync(_authService, clubId);
            if (authCheck != null) return authCheck;

            // Get member profile by user's email to get the member ID
            var userEmailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(userEmailClaim))
            {
                _logger.LogWarning("No email claim found for user {UserId}", currentUserId.Value);
                return Unauthorized("Invalid authentication token");
            }

            var existingMember = await _memberService.GetMemberByEmailAsync(clubId, userEmailClaim);
            if (existingMember == null)
            {
                _logger.LogWarning("Member profile not found for user {UserId} in club {ClubId}", currentUserId.Value, clubId);
                return NotFound(new { message = "Member profile not found" });
            }

            // Update the member profile
            var updatedMember = await _memberService.UpdateMemberAsync(clubId, existingMember.Id, request);

            _logger.LogInformation("Self profile updated successfully for user {UserId}, member {MemberId}", currentUserId.Value, existingMember.Id);

            return Ok(updatedMember);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update self profile for user in club {ClubId}: {Error}", clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating self profile for user in club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while updating your profile." });
        }
    }

    /// <summary>
    /// Allows a member to pay their own dues online (Mobile Story M08)
    /// </summary>
    /// <remarks>
    /// Allows an authenticated member to pay their own membership dues using Stripe.
    /// The member provides a Stripe payment method ID, and the system processes the payment
    /// for the amount specified by their membership type. Upon successful payment,
    /// the member's DuesPaidUntil date is updated according to their membership frequency.
    /// Requires authentication and that the member's club has Stripe Connect configured.
    /// </remarks>
    /// <param name="request">The payment details (paymentMethodId and membershipTypeId)</param>
    /// <response code="200">Payment processed successfully</response>
    /// <response code="400">If the request body fails validation or payment processing fails</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the member's club doesn't have Stripe Connect configured</response>
    /// <response code="404">If the member or membership type is not found</response>
    [HttpPost("me/dues/pay")]
    [Authorize(Policy = "ClubMember")] // Members can pay their own dues
    [ProducesResponseType(typeof(PaymentResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> PayMyDues([FromBody] PayMyDuesRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            _logger.LogInformation("Processing dues payment for user {UserId} with membership type {MembershipTypeId}",
                userId.Value, request.MembershipTypeId);

            var payment = await _memberService.PayMemberDuesAsync(userId.Value, request);

            _logger.LogInformation("Dues payment processed successfully: {PaymentId} for user {UserId}",
                payment.PaymentId, userId.Value);

            return Ok(payment);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to process dues payment for user {UserId}: {Error}", GetCurrentUserId(), ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Payment processing failed for user {UserId}: {Error}", GetCurrentUserId(), ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing dues payment for user {UserId}", GetCurrentUserId());
            return StatusCode(500, new { message = "An unexpected error occurred while processing your payment." });
        }
    }

    /// <summary>
    /// Updates the current user's member profile (cross-club access)
    /// </summary>
    [HttpPut("me/profile")]
    [Authorize(Policy = "ClubMember")]
    public async Task<IActionResult> UpdateMyGlobalProfile([FromBody] UpdateMemberProfileRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var updatedProfile = await _memberService.UpdateMemberProfileAsync(userId.Value, request);
            return Ok(updatedProfile);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update member profile for user {UserId}: {Error}", GetCurrentUserId(), ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating member profile for user {UserId}", GetCurrentUserId());
            return StatusCode(500, new { message = "An unexpected error occurred while updating your profile." });
        }
    }

    /// <summary>
    /// Gets all payments for a specific member
    /// </summary>
    /// <remarks>
    /// Retrieves all payment records for a member within a club.
    /// Payments are returned in descending order by payment date.
    /// Requires authentication and admin access to the specified club.
    /// </remarks>
    /// <param name="clubId">The ID of the club the member belongs to</param>
    /// <param name="memberId">The ID of the member to get payments for</param>
    /// <response code="200">Returns the list of payments for the member</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club or member does not exist</response>
    [HttpGet("{memberId}/payments")]
    [Authorize(Policy = "ClubAdmin")] // Admin access required to view payments
    [ProducesResponseType(typeof(List<PaymentResponse>), 200)]
    public async Task<IActionResult> GetMemberPayments([FromRoute] int clubId, [FromRoute] int memberId)
    {
        try
        {
            _logger.LogInformation("Getting payments for member {MemberId} in club {ClubId}", memberId, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var payments = await _memberService.GetMemberPaymentsAsync(clubId, memberId);

            _logger.LogInformation("Retrieved {Count} payments for member {MemberId}", payments.Count, memberId);

            return Ok(payments);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get payments for member {MemberId} in club {ClubId}: {Error}", memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting payments for member {MemberId} in club {ClubId}", memberId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving payments." });
        }
    }

    /// <summary>
    /// Gets a specific payment by ID
    /// </summary>
    /// <remarks>
    /// Retrieves the details of a specific payment within a club.
    /// Requires authentication and admin access to the specified club.
    /// </remarks>
    /// <param name="clubId">The ID of the club the payment belongs to</param>
    /// <param name="memberId">The ID of the member the payment belongs to</param>
    /// <param name="paymentId">The ID of the payment to retrieve</param>
    /// <response code="200">Returns the payment details</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club, member, or payment does not exist</response>
    [HttpGet("{memberId}/payments/{paymentId}")]
    [Authorize(Policy = "ClubAdmin")] // Admin access required to view payment details
    [ProducesResponseType(typeof(PaymentResponse), 200)]
    public async Task<IActionResult> GetPayment([FromRoute] int clubId, [FromRoute] int memberId, [FromRoute] int paymentId)
    {
        try
        {
            _logger.LogInformation("Getting payment {PaymentId} for member {MemberId} in club {ClubId}", paymentId, memberId, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var payment = await _memberService.GetPaymentByIdAsync(clubId, memberId, paymentId);

            if (payment == null)
            {
                return NotFound(new { message = "Payment not found" });
            }

            return Ok(payment);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to get payment {PaymentId} for member {MemberId} in club {ClubId}: {Error}", paymentId, memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting payment {PaymentId} for member {MemberId} in club {ClubId}", paymentId, memberId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving the payment." });
        }
    }

    /// <summary>
    /// Updates a specific payment
    /// </summary>
    /// <remarks>
    /// Updates the details of a manual payment (cash or check) within a club.
    /// Only manual payments can be edited - Stripe payments cannot be modified.
    /// Updates to payment amounts will recalculate the member's DuesPaidUntil date.
    /// Requires authentication and admin access to the specified club.
    /// </remarks>
    /// <param name="clubId">The ID of the club the payment belongs to</param>
    /// <param name="memberId">The ID of the member the payment belongs to</param>
    /// <param name="paymentId">The ID of the payment to update</param>
    /// <param name="request">The updated payment details</param>
    /// <response code="200">Returns the updated payment details</response>
    /// <response code="400">If the request body fails validation or payment cannot be edited</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club, member, or payment does not exist</response>
    [HttpPut("{memberId}/payments/{paymentId}")]
    [Authorize(Policy = "ClubAdmin")] // Admin access required to update payments
    [ProducesResponseType(typeof(PaymentResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> UpdatePayment([FromRoute] int clubId, [FromRoute] int memberId, [FromRoute] int paymentId, [FromBody] UpdatePaymentRequest request)
    {
        try
        {
            _logger.LogInformation("Updating payment {PaymentId} for member {MemberId} in club {ClubId}", paymentId, memberId, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var updatedPayment = await _memberService.UpdatePaymentAsync(clubId, memberId, paymentId, request);

            _logger.LogInformation("Payment updated successfully: {PaymentId} for member {MemberId}", paymentId, memberId);

            return Ok(updatedPayment);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update payment {PaymentId} for member {MemberId} in club {ClubId}: {Error}", paymentId, memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Cannot update payment {PaymentId} for member {MemberId} in club {ClubId}: {Error}", paymentId, memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating payment {PaymentId} for member {MemberId} in club {ClubId}", paymentId, memberId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while updating the payment." });
        }
    }

    /// <summary>
    /// Deletes a specific payment
    /// </summary>
    /// <remarks>
    /// Deletes a manual payment (cash or check) within a club.
    /// Only manual payments can be deleted - Stripe payments cannot be removed.
    /// Deleting a payment will recalculate the member's DuesPaidUntil date.
    /// This operation creates an audit trail and cannot be undone.
    /// Requires authentication and admin access to the specified club.
    /// </remarks>
    /// <param name="clubId">The ID of the club the payment belongs to</param>
    /// <param name="memberId">The ID of the member the payment belongs to</param>
    /// <param name="paymentId">The ID of the payment to delete</param>
    /// <response code="204">Payment deleted successfully</response>
    /// <response code="400">If the payment cannot be deleted (e.g., Stripe payment)</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    /// <response code="404">If the specified club, member, or payment does not exist</response>
    [HttpDelete("{memberId}/payments/{paymentId}")]
    [Authorize(Policy = "ClubAdmin")] // Admin access required to delete payments
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> DeletePayment([FromRoute] int clubId, [FromRoute] int memberId, [FromRoute] int paymentId)
    {
        try
        {
            _logger.LogInformation("Deleting payment {PaymentId} for member {MemberId} in club {ClubId}", paymentId, memberId, clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            await _memberService.DeletePaymentAsync(clubId, memberId, paymentId);

            _logger.LogInformation("Payment deleted successfully: {PaymentId} for member {MemberId}", paymentId, memberId);

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to delete payment {PaymentId} for member {MemberId} in club {ClubId}: {Error}", paymentId, memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Cannot delete payment {PaymentId} for member {MemberId} in club {ClubId}: {Error}", paymentId, memberId, clubId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting payment {PaymentId} for member {MemberId} in club {ClubId}", paymentId, memberId, clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while deleting the payment." });
        }
    }

    /// <summary>
    /// Gets all members with their statuses for diagnostic purposes
    /// </summary>
    /// <remarks>
    /// Retrieves all members for a club with their current status information including dues status.
    /// This endpoint is for diagnostic purposes to help understand member status in the system.
    /// </remarks>
    /// <param name="clubId">The ID of the club</param>
    /// <response code="200">Returns all members with their status information</response>
    /// <response code="401">If the request lacks a valid JWT</response>
    /// <response code="403">If the user is not an admin for the specified club</response>
    [HttpGet("all-with-statuses")]
    [Authorize(Policy = "ClubAdmin")]
    [ProducesResponseType(typeof(object), 200)]
    public async Task<IActionResult> GetAllMembersWithStatuses([FromRoute] int clubId)
    {
        try
        {
            _logger.LogInformation("Getting all members with statuses for club {ClubId}", clubId);

            // Verify club admin access
            var authResult = await this.VerifyClubAdminAccessAsync(_authService, clubId);
            if (authResult != null) return authResult;

            var members = await _memberService.GetAllMembersWithStatusesAsync(clubId);

            return Ok(members);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting members with statuses for club {ClubId}", clubId);
            return StatusCode(500, new { message = "An unexpected error occurred while retrieving members." });
        }
    }
}
