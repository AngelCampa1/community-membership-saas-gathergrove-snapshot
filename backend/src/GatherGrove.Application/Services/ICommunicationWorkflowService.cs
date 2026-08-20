using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing communication workflows
/// </summary>
public interface ICommunicationWorkflowService
{
    /// <summary>
    /// Creates a new communication workflow
    /// </summary>
    Task<WorkflowResponse> CreateWorkflowAsync(int clubId, int userId, CreateWorkflowRequest request);

    /// <summary>
    /// Updates an existing workflow
    /// </summary>
    Task<WorkflowResponse> UpdateWorkflowAsync(int clubId, int workflowId, UpdateWorkflowRequest request);

    /// <summary>
    /// Gets a workflow by ID
    /// </summary>
    Task<WorkflowResponse> GetWorkflowAsync(int clubId, int workflowId);

    /// <summary>
    /// Gets all workflows for a club
    /// </summary>
    Task<List<WorkflowResponse>> GetWorkflowsAsync(int clubId, bool includeInactive = false);

    /// <summary>
    /// Deletes a workflow
    /// </summary>
    Task DeleteWorkflowAsync(int clubId, int workflowId);

    /// <summary>
    /// Activates or deactivates a workflow
    /// </summary>
    Task<WorkflowResponse> ToggleWorkflowAsync(int clubId, int workflowId, bool isActive);

    /// <summary>
    /// Gets workflow execution statistics
    /// </summary>
    Task<WorkflowStatsResponse> GetWorkflowStatsAsync(int clubId, int workflowId);

    /// <summary>
    /// Manually executes a workflow
    /// </summary>
    Task ExecuteWorkflowAsync(int clubId, int workflowId, ExecuteWorkflowRequest request);
}

