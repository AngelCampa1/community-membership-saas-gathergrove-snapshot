namespace GatherGrove.Domain.Entities;

/// <summary>
/// Status of a member transfer request
/// </summary>
public enum MemberTransferStatus
{
    /// <summary>
    /// Transfer request is pending approval
    /// </summary>
    Pending = 1,

    /// <summary>
    /// Transfer has been approved and completed
    /// </summary>
    Approved = 2,

    /// <summary>
    /// Transfer request was denied
    /// </summary>
    Denied = 3,

    /// <summary>
    /// Transfer request was cancelled
    /// </summary>
    Cancelled = 4
}

