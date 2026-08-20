using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing email templates (Unlimited tier feature)
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/email-templates")]
[Authorize]
public class EmailTemplatesController : ControllerBase
{
    private readonly ICommunicationTemplateService _templateService;
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<EmailTemplatesController> _logger;

    public EmailTemplatesController(
        ICommunicationTemplateService templateService,
        IClubAuthorizationService authService,
        ILogger<EmailTemplatesController> logger)
    {
        _templateService = templateService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all email templates for a club
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<EmailTemplateListResponse>>> GetTemplates(
        int clubId,
        [FromQuery] bool includeInactive = false)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var templates = await _templateService.GetTemplatesAsync(clubId, includeInactive);
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting templates for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Error retrieving templates" });
        }
    }

    /// <summary>
    /// Gets a specific email template
    /// </summary>
    [HttpGet("{templateId}")]
    public async Task<ActionResult<EmailTemplateResponse>> GetTemplate(int clubId, int templateId)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var template = await _templateService.GetTemplateAsync(clubId, templateId);
            return Ok(template);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting template {TemplateId}", templateId);
            return StatusCode(500, new { message = "Error retrieving template" });
        }
    }

    /// <summary>
    /// Creates a new email template
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<EmailTemplateResponse>> CreateTemplate(
        int clubId,
        [FromBody] CreateEmailTemplateRequest request)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        // BUG FIX: Use int.TryParse instead of int.Parse with "0" fallback to avoid silent failures
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Unable to determine user identity");
        }

        try
        {
            var template = await _templateService.CreateTemplateAsync(clubId, userId, request);
            return CreatedAtAction(nameof(GetTemplate), new { clubId, templateId = template.Id }, template);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating template for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Error creating template" });
        }
    }

    /// <summary>
    /// Updates an existing email template
    /// </summary>
    [HttpPatch("{templateId}")]
    public async Task<ActionResult<EmailTemplateResponse>> UpdateTemplate(
        int clubId,
        int templateId,
        [FromBody] UpdateEmailTemplateRequest request)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var template = await _templateService.UpdateTemplateAsync(clubId, templateId, request);
            return Ok(template);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating template {TemplateId}", templateId);
            return StatusCode(500, new { message = "Error updating template" });
        }
    }

    /// <summary>
    /// Deletes an email template
    /// </summary>
    [HttpDelete("{templateId}")]
    public async Task<IActionResult> DeleteTemplate(int clubId, int templateId)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            await _templateService.DeleteTemplateAsync(clubId, templateId);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting template {TemplateId}", templateId);
            return StatusCode(500, new { message = "Error deleting template" });
        }
    }

    /// <summary>
    /// Duplicates an existing template
    /// </summary>
    [HttpPost("{templateId}/duplicate")]
    public async Task<ActionResult<EmailTemplateResponse>> DuplicateTemplate(
        int clubId,
        int templateId,
        [FromBody] DuplicateTemplateRequest request)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        // BUG FIX: Use int.TryParse instead of int.Parse with "0" fallback to avoid silent failures
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Unable to determine user identity");
        }

        try
        {
            var template = await _templateService.DuplicateTemplateAsync(clubId, userId, templateId, request.NewName);
            return CreatedAtAction(nameof(GetTemplate), new { clubId, templateId = template.Id }, template);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error duplicating template {TemplateId}", templateId);
            return StatusCode(500, new { message = "Error duplicating template" });
        }
    }
}

/// <summary>
/// Request to duplicate a template
/// </summary>
public class DuplicateTemplateRequest
{
    public string NewName { get; set; } = string.Empty;
}

