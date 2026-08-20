namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response returned when a club claims its free Grow trial.
/// </summary>
public class ClaimTrialResponse
{
    /// <summary>
    /// Whether trial claim succeeded.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Human-readable result message.
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Stripe subscription ID created for the trial.
    /// </summary>
    public string? SubscriptionId { get; set; }

    /// <summary>
    /// UTC timestamp when the trial ends.
    /// </summary>
    public DateTime? TrialEndsAt { get; set; }
}
