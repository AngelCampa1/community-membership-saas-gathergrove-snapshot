using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherGrove.API.Controllers;

/// <summary>
/// Controller for managing communication workflows
/// </summary>
[ApiController]
[Route("api/v1/clubs/{clubId}/communication-workflows")]
[Authorize]
public class CommunicationWorkflowsController : ControllerBase
{
    private readonly ICommunicationWorkflowService _workflowService;
    private readonly IClubAuthorizationService _authService;
    private readonly ILogger<CommunicationWorkflowsController> _logger;

    public CommunicationWorkflowsController(
        ICommunicationWorkflowService workflowService,
        IClubAuthorizationService authService,
        ILogger<CommunicationWorkflowsController> logger)
    {
        _workflowService = workflowService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all workflows for a club
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<WorkflowResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<WorkflowResponse>>> GetWorkflows(
        int clubId,
        [FromQuery] bool includeInactive = false)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        if (!await _authService.CanAccessUnlimitedFeaturesAsync(clubId))
        {
            return Forbid("You need Expand to use work steps");
        }

        try
        {
            var workflows = await _workflowService.GetWorkflowsAsync(clubId, includeInactive);
            return Ok(workflows);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting workflows for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Error retrieving workflows" });
        }
    }

    /// <summary>
    /// Gets a specific workflow
    /// </summary>
    [HttpGet("{workflowId}")]
    [ProducesResponseType(typeof(WorkflowResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<WorkflowResponse>> GetWorkflow(int clubId, int workflowId)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var workflow = await _workflowService.GetWorkflowAsync(clubId, workflowId);
            return Ok(workflow);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting workflow {WorkflowId}", workflowId);
            return StatusCode(500, new { message = "Error retrieving workflow" });
        }
    }

    /// <summary>
    /// Creates a new workflow
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WorkflowResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<WorkflowResponse>> CreateWorkflow(
        int clubId,
        [FromBody] CreateWorkflowRequest request)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        if (!await _authService.CanAccessUnlimitedFeaturesAsync(clubId))
        {
            return Forbid("You need Expand to use work steps");
        }

        // BUG FIX: Use int.TryParse instead of int.Parse with "0" fallback to avoid silent failures
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Unable to determine user identity");
        }

        try
        {
            var workflow = await _workflowService.CreateWorkflowAsync(clubId, userId, request);
            return CreatedAtAction(nameof(GetWorkflow), new { clubId, workflowId = workflow.Id }, workflow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating workflow for club {ClubId}", clubId);
            return StatusCode(500, new { message = "Error creating workflow" });
        }
    }

    /// <summary>
    /// Updates an existing workflow
    /// </summary>
    [HttpPut("{workflowId}")]
    [ProducesResponseType(typeof(WorkflowResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<WorkflowResponse>> UpdateWorkflow(
        int clubId,
        int workflowId,
        [FromBody] UpdateWorkflowRequest request)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var workflow = await _workflowService.UpdateWorkflowAsync(clubId, workflowId, request);
            return Ok(workflow);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating workflow {WorkflowId}", workflowId);
            return StatusCode(500, new { message = "Error updating workflow" });
        }
    }

    /// <summary>
    /// Deletes a workflow
    /// </summary>
    [HttpDelete("{workflowId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteWorkflow(int clubId, int workflowId)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            await _workflowService.DeleteWorkflowAsync(clubId, workflowId);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting workflow {WorkflowId}", workflowId);
            return StatusCode(500, new { message = "Error deleting workflow" });
        }
    }

    /// <summary>
    /// Toggles workflow active status
    /// </summary>
    [HttpPost("{workflowId}/toggle")]
    [ProducesResponseType(typeof(WorkflowResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<WorkflowResponse>> ToggleWorkflow(
        int clubId,
        int workflowId,
        [FromBody] bool isActive)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var workflow = await _workflowService.ToggleWorkflowAsync(clubId, workflowId, isActive);
            return Ok(workflow);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling workflow {WorkflowId}", workflowId);
            return StatusCode(500, new { message = "Error toggling workflow" });
        }
    }

    /// <summary>
    /// Gets workflow execution statistics
    /// </summary>
    [HttpGet("{workflowId}/stats")]
    [ProducesResponseType(typeof(WorkflowStatsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<WorkflowStatsResponse>> GetWorkflowStats(int clubId, int workflowId)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            var stats = await _workflowService.GetWorkflowStatsAsync(clubId, workflowId);
            return Ok(stats);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stats for workflow {WorkflowId}", workflowId);
            return StatusCode(500, new { message = "Error retrieving stats" });
        }
    }

    /// <summary>
    /// Manually executes a workflow
    /// </summary>
    [HttpPost("{workflowId}/execute")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ExecuteWorkflow(
        int clubId,
        int workflowId,
        [FromBody] ExecuteWorkflowRequest request)
    {
        if (!await _authService.CanAccessClubAsAdminAsync(User, clubId))
        {
            return Forbid();
        }

        try
        {
            await _workflowService.ExecuteWorkflowAsync(clubId, workflowId, request);
            return Accepted(new { message = "Workflow execution started" });
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
            _logger.LogError(ex, "Error executing workflow {WorkflowId}", workflowId);
            return StatusCode(500, new { message = "Error executing workflow" });
        }
    }
}

