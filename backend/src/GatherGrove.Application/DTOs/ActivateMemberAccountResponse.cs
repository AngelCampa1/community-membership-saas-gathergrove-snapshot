namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response DTO for member account activation
/// </summary>
public class ActivateMemberAccountResponse
{
    /// <summary>
    /// Message describing the result of the activation
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Whether the activation was successful
    /// </summary>
    public bool Success { get; set; }
}