namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Result of email retry operation with delivery status and retry attempt information
/// </summary>
public class EmailRetryResult
{
    /// <summary>
    /// The final delivery status after retry attempts
    /// </summary>
    public EmailDeliveryStatus Status { get; set; }

    /// <summary>
    /// Number of retry attempts made
    /// </summary>
    public int RetryAttempts { get; set; }

    /// <summary>
    /// The final error message if delivery failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Total time taken for all retry attempts
    /// </summary>
    public TimeSpan TotalRetryDuration { get; set; }
}