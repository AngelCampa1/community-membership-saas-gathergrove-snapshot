namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response when account deletion is requested
/// </summary>
public class AccountDeletionResponse
{
    /// <summary>
    /// Unique identifier for this deletion request
    /// </summary>
    public Guid DeletionRequestId { get; set; }

    /// <summary>
    /// Current status of the deletion request
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Whether this deletion requires manual review (e.g., club owner)
    /// </summary>
    public bool RequiresManualReview { get; set; }

    /// <summary>
    /// Estimated date when deletion will be completed
    /// </summary>
    public DateTime EstimatedCompletionDate { get; set; }

    /// <summary>
    /// ID of the data export if requested
    /// </summary>
    public Guid? DataExportId { get; set; }

    /// <summary>
    /// File path where data export can be downloaded
    /// </summary>
    public string? DataExportFilePath { get; set; }

    /// <summary>
    /// Actions that need to be taken before deletion can proceed
    /// </summary>
    public List<string> RequiredActions { get; set; } = new();

    /// <summary>
    /// Warning messages about the deletion impact
    /// </summary>
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// Response showing current status of account deletion
/// </summary>
public class AccountDeletionStatusResponse
{
    /// <summary>
    /// Unique identifier for this deletion request
    /// </summary>
    public Guid DeletionRequestId { get; set; }

    /// <summary>
    /// Current status: Requested, InProgress, Completed, Cancelled, Failed
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Deletion progress percentage (0-100)
    /// </summary>
    public int Progress { get; set; }

    /// <summary>
    /// Estimated completion date
    /// </summary>
    public DateTime? EstimatedCompletionDate { get; set; }

    /// <summary>
    /// Steps that have been completed
    /// </summary>
    public List<string> CompletedSteps { get; set; } = new();

    /// <summary>
    /// Steps that still need to be completed
    /// </summary>
    public List<string> RemainingSteps { get; set; } = new();

    /// <summary>
    /// Error messages if deletion failed
    /// </summary>
    public List<string> ErrorMessages { get; set; } = new();
}

/// <summary>
/// Response for account deletion validation
/// </summary>
public class AccountDeletionValidationResponse
{
    /// <summary>
    /// Whether the account can be deleted immediately
    /// </summary>
    public bool CanDelete { get; set; }

    /// <summary>
    /// List of validation errors preventing deletion
    /// </summary>
    public List<string> ValidationErrors { get; set; } = new();

    /// <summary>
    /// Actions required before deletion can proceed
    /// </summary>
    public List<string> RequiredActions { get; set; } = new();

    /// <summary>
    /// Estimated time for complete deletion process
    /// </summary>
    public TimeSpan EstimatedDeletionTime { get; set; }

    /// <summary>
    /// Impact summary of what will be deleted
    /// </summary>
    public DeletionImpactSummary ImpactSummary { get; set; } = new();

    /// <summary>
    /// Whether this is an admin account deletion
    /// </summary>
    public bool IsAdminAccount { get; set; }

    /// <summary>
    /// Admin-specific validation information
    /// </summary>
    public AdminDeletionInfo AdminInfo { get; set; } = new();
}

/// <summary>
/// Admin-specific account deletion information
/// </summary>
public class AdminDeletionInfo
{
    /// <summary>
    /// Number of clubs where user is the primary admin
    /// </summary>
    public int PrimaryClubsCount { get; set; }

    /// <summary>
    /// Number of clubs where user is a secondary admin
    /// </summary>
    public int SecondaryClubsCount { get; set; }

    /// <summary>
    /// List of clubs that will be deleted entirely
    /// </summary>
    public List<ClubDeletionInfo> ClubsToBeDeleted { get; set; } = new();

    /// <summary>
    /// List of clubs where admin rights will be transferred
    /// </summary>
    public List<ClubTransferInfo> ClubsToTransfer { get; set; } = new();

    /// <summary>
    /// Available transfer targets for clubs
    /// </summary>
    public List<AdminTransferTarget> AvailableTransferTargets { get; set; } = new();

    /// <summary>
    /// Whether any club has active subscriptions or billing
    /// </summary>
    public bool HasActiveBilling { get; set; }

    /// <summary>
    /// Extended grace period for admin deletions (days)
    /// </summary>
    public int ExtendedGracePeriodDays { get; set; } = 30;
}

/// <summary>
/// Information about club deletion
/// </summary>
public class ClubDeletionInfo
{
    public int ClubId { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public int EventCount { get; set; }
    public decimal? OutstandingBalance { get; set; }
    public bool HasActiveSubscription { get; set; }
}

/// <summary>
/// Information about club ownership transfer
/// </summary>
public class ClubTransferInfo
{
    public int ClubId { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public int CurrentAdminCount { get; set; }
    public bool RequiresNewAdmin { get; set; }
}

/// <summary>
/// Potential admin transfer target
/// </summary>
public class AdminTransferTarget
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<int> ClubIds { get; set; } = new();
    public string Role { get; set; } = string.Empty;
}

/// <summary>
/// Summary of what will be affected by account deletion
/// </summary>
public class DeletionImpactSummary
{
    /// <summary>
    /// Number of clubs that will be deleted
    /// </summary>
    public int ClubsToDelete { get; set; }

    /// <summary>
    /// Number of clubs where ownership will be transferred
    /// </summary>
    public int ClubsToTransfer { get; set; }

    /// <summary>
    /// Number of member records to anonymize
    /// </summary>
    public int MemberRecordsToAnonymize { get; set; }

    /// <summary>
    /// Number of events that will lose their creator
    /// </summary>
    public int EventsAffected { get; set; }

    /// <summary>
    /// Number of payment records that will be anonymized
    /// </summary>
    public int PaymentRecordsAffected { get; set; }

    /// <summary>
    /// Size of data export in bytes
    /// </summary>
    public long DataExportSize { get; set; }
}