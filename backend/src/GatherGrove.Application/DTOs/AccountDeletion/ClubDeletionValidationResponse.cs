namespace GatherGrove.Application.DTOs;

/// <summary>
/// Validation response for club deletion when admin is only administrator
/// </summary>
public class ClubDeletionValidationResponse
{
    /// <summary>
    /// Club ID being validated for deletion
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// Club name
    /// </summary>
    public string ClubName { get; set; } = string.Empty;

    /// <summary>
    /// Admin user ID requesting the deletion
    /// </summary>
    public int AdminUserId { get; set; }

    /// <summary>
    /// Whether the club can be deleted
    /// </summary>
    public bool CanDelete { get; set; }

    /// <summary>
    /// Reason for the validation result
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Number of members in the club
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Number of administrators in the club
    /// </summary>
    public int AdminCount { get; set; }

    /// <summary>
    /// Number of upcoming events
    /// </summary>
    public int UpcomingEventCount { get; set; }

    /// <summary>
    /// Whether the club has active billing
    /// </summary>
    public bool HasActiveBilling { get; set; }

    /// <summary>
    /// Whether deletion requires additional confirmation
    /// </summary>
    public bool RequiresConfirmation { get; set; }

    /// <summary>
    /// List of validation errors preventing deletion
    /// </summary>
    public List<string> ValidationErrors { get; set; } = new();

    /// <summary>
    /// Actions required before club deletion can proceed
    /// </summary>
    public List<string> RequiredActions { get; set; } = new();

    /// <summary>
    /// Summary of what will be deleted with the club
    /// </summary>
    public ClubDeletionImpactSummary ImpactSummary { get; set; } = new();

    /// <summary>
    /// Whether club has active subscriptions that need cancellation
    /// </summary>
    public bool HasActiveSubscriptions { get; set; }

    /// <summary>
    /// Whether club has outstanding payments or financial obligations
    /// </summary>
    public bool HasFinancialObligations { get; set; }

    /// <summary>
    /// Estimated grace period before club deletion (days)
    /// </summary>
    public int GracePeriodDays { get; set; } = 30;

    /// <summary>
    /// Whether manual review is required before deletion
    /// </summary>
    public bool RequiresManualReview { get; set; }

    /// <summary>
    /// Additional warnings or requirements
    /// </summary>
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// Summary of impact when deleting a club
/// </summary>
public class ClubDeletionImpactSummary
{
    /// <summary>
    /// Number of members that will be affected
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Number of events that will be deleted
    /// </summary>
    public int EventCount { get; set; }

    /// <summary>
    /// Number of payments that will be affected
    /// </summary>
    public int PaymentCount { get; set; }

    /// <summary>
    /// Total amount of outstanding payments
    /// </summary>
    public decimal OutstandingBalance { get; set; }

    /// <summary>
    /// Whether there are active subscriptions
    /// </summary>
    public bool HasActiveSubscriptions { get; set; }

    /// <summary>
    /// Size of data export for the club (bytes)
    /// </summary>
    public long DataExportSize { get; set; }

    /// <summary>
    /// List of third-party integrations that need cleanup
    /// </summary>
    public List<string> IntegrationsToCleanup { get; set; } = new();
}