namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to create a communication workflow
/// </summary>
public class CreateWorkflowRequest
{
    /// <summary>
    /// Name of the workflow
    /// </summary>
    public string WorkflowName { get; set; } = string.Empty;

    /// <summary>
    /// Description of the workflow
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Trigger type (MemberJoin, EventRSVP, MemberInactivity, CustomDate, MemberBehavior)
    /// </summary>
    public string TriggerType { get; set; } = string.Empty;

    /// <summary>
    /// Trigger configuration as JSON
    /// </summary>
    public string? TriggerConfig { get; set; }

    /// <summary>
    /// Workflow steps as JSON array
    /// </summary>
    public string WorkflowSteps { get; set; } = "[]";

    /// <summary>
    /// Member segment ID for targeting (null = all members)
    /// </summary>
    public int? SegmentId { get; set; }
}

/// <summary>
/// Request to update a workflow
/// </summary>
public class UpdateWorkflowRequest
{
    /// <summary>
    /// Name of the workflow
    /// </summary>
    public string? WorkflowName { get; set; }

    /// <summary>
    /// Description of the workflow
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Trigger configuration as JSON
    /// </summary>
    public string? TriggerConfig { get; set; }

    /// <summary>
    /// Workflow steps as JSON array
    /// </summary>
    public string? WorkflowSteps { get; set; }

    /// <summary>
    /// Member segment ID for targeting
    /// </summary>
    public int? SegmentId { get; set; }

    /// <summary>
    /// Whether the workflow is active
    /// </summary>
    public bool? IsActive { get; set; }
}

/// <summary>
/// Communication workflow response
/// </summary>
public class WorkflowResponse
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public string WorkflowName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TriggerType { get; set; } = string.Empty;
    public string? TriggerConfig { get; set; }
    public string WorkflowSteps { get; set; } = string.Empty;
    public int? SegmentId { get; set; }
    public bool IsActive { get; set; }
    public int TriggerCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public DateTime? LastTriggeredAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Workflow execution statistics
/// </summary>
public class WorkflowStatsResponse
{
    public int WorkflowId { get; set; }
    public string WorkflowName { get; set; } = string.Empty;
    public int TotalExecutions { get; set; }
    public int SuccessfulExecutions { get; set; }
    public int FailedExecutions { get; set; }
    public decimal SuccessRate { get; set; }
    public DateTime? LastExecutedAt { get; set; }
    public Dictionary<string, int> StepExecutionCounts { get; set; } = new();
}

/// <summary>
/// Manual workflow execution request
/// </summary>
public class ExecuteWorkflowRequest
{
    /// <summary>
    /// Optional member IDs to execute workflow for (null = all eligible members)
    /// </summary>
    public List<int>? MemberIds { get; set; }
}

/// <summary>
/// Workflow creation request
/// </summary>
public class CreateCommunicationWorkflowRequest
{
    public string WorkflowName { get; set; } = string.Empty;
    public string TriggerType { get; set; } = string.Empty;
    public List<WorkflowStepDefinition> WorkflowSteps { get; set; } = new();
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Workflow update request
/// </summary>
public class UpdateCommunicationWorkflowRequest
{
    public string? WorkflowName { get; set; }
    public List<WorkflowStepDefinition>? WorkflowSteps { get; set; }
    public bool? IsActive { get; set; }
}

/// <summary>
/// Workflow response
/// </summary>
public class CommunicationWorkflowResponse
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public string WorkflowName { get; set; } = string.Empty;
    public string TriggerType { get; set; } = string.Empty;
    public List<WorkflowStepDefinition> WorkflowSteps { get; set; } = new();
    public bool IsActive { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Workflow list item response
/// </summary>
public class CommunicationWorkflowListResponse
{
    public int Id { get; set; }
    public string WorkflowName { get; set; } = string.Empty;
    public string TriggerType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Workflow step definition
/// </summary>
public class WorkflowStepDefinition
{
    public string StepId { get; set; } = string.Empty;
    public string StepType { get; set; } = string.Empty;
    public int DelayMinutes { get; set; }
    public bool IsRequired { get; set; } = true;
    public Dictionary<string, object> Parameters { get; set; } = new();
}

/// <summary>
/// Workflow execution response
/// </summary>
public class WorkflowExecutionResponse
{
    public int WorkflowId { get; set; }
    public int MemberId { get; set; }
    public List<ExecutedStepResponse> ExecutedSteps { get; set; } = new();
    public DateTime CompletedAt { get; set; }
    public bool Success { get; set; }
}

/// <summary>
/// Executed step response
/// </summary>
public class ExecutedStepResponse
{
    public string StepId { get; set; } = string.Empty;
    public string StepType { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime ExecutedAt { get; set; }
}

