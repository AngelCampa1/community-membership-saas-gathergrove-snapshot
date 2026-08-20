namespace GatherGrove.Application.DTOs;

/// <summary>
/// Impact analysis for account deletion
/// </summary>
public class AccountDeletionImpact
{
    /// <summary>
    /// Number of clubs owned by the user
    /// </summary>
    public int OwnedClubsCount { get; set; }

    /// <summary>
    /// List of clubs owned by the user
    /// </summary>
    public List<ClubInfo> OwnedClubs { get; set; } = new();

    /// <summary>
    /// Number of members that will be affected
    /// </summary>
    public int AffectedMembersCount { get; set; }

    /// <summary>
    /// Number of events that will be affected
    /// </summary>
    public int AffectedEventsCount { get; set; }

    /// <summary>
    /// Total data size to be deleted (in bytes)
    /// </summary>
    public long TotalDataSize { get; set; }

    /// <summary>
    /// Data categories that will be deleted
    /// </summary>
    public List<string> DataCategories { get; set; } = new();

    /// <summary>
    /// Active subscriptions that need cancellation
    /// </summary>
    public List<SubscriptionInfo> ActiveSubscriptions { get; set; } = new();
}

/// <summary>
/// Information about a club
/// </summary>
public class ClubInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public bool HasActiveSubscription { get; set; }
}

/// <summary>
/// Information about a subscription
/// </summary>
public class SubscriptionInfo
{
    public string SubscriptionId { get; set; } = string.Empty;
    public string Plan { get; set; } = string.Empty;
    public DateTime NextBillingDate { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
}