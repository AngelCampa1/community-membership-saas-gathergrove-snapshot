namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response for resend activation email request
/// </summary>
public class ResendActivationResponse
{
    /// <summary>
    /// Indicates whether the activation email was sent successfully
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Message describing the result
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
