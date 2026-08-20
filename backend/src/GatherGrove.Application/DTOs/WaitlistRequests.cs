using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Services.TierValidation;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Status of a waitlist entry
/// </summary>
public enum WaitlistStatus
{
    Active = 1,
    Promoted = 2,
    Cancelled = 3,
    Expired = 4
}

/// <summary>
/// Request to add a member to an event waitlist
/// </summary>
public class AddToWaitlistRequest
{
    /// <summary>
    /// The member to add to the waitlist
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// Priority level for this waitlist entry
    /// </summary>
    public WaitlistPriority Priority { get; set; } = WaitlistPriority.Normal;

    /// <summary>
    /// Optional notes about the waitlist entry
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// Waitlist promotion details
/// </summary>
public class WaitlistPromotion
{
    /// <summary>
    /// Member ID that was promoted
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Original position in waitlist
    /// </summary>
    public int FromPosition { get; set; }

    /// <summary>
    /// When the promotion occurred
    /// </summary>
    public DateTime PromotedAt { get; set; }
}

/// <summary>
/// Response for waitlist processing operations
/// </summary>
public class WaitlistProcessingResult
{
    /// <summary>
    /// Event ID being processed
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Number of available spots for promotion
    /// </summary>
    public int AvailableSpots { get; set; }

    /// <summary>
    /// List of members that were promoted from the waitlist
    /// </summary>
    public List<WaitlistPromotion> PromotedMembers { get; set; } = new();

    /// <summary>
    /// Number of notifications sent
    /// </summary>
    public int Notificationssent { get; set; }

    /// <summary>
    /// Number of available spots that were filled
    /// </summary>
    public int SpotsFilled { get; set; }

    /// <summary>
    /// List of member IDs that are still on the waitlist
    /// </summary>
    public List<int> RemainingWaitlist { get; set; } = new();

    /// <summary>
    /// Whether the processing was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Error message if processing failed
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Response containing waitlist entry information
/// </summary>
public class WaitlistEntryResponse
{
    /// <summary>
    /// Unique identifier for the waitlist entry
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The event this waitlist entry is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// The member on the waitlist
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member name for display
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Position in the waitlist (1 = first in line)
    /// </summary>
    public int Position { get; set; }

    /// <summary>
    /// Priority level for this waitlist entry
    /// </summary>
    public WaitlistPriority Priority { get; set; }

    /// <summary>
    /// Optional notes about the waitlist entry
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// When this waitlist entry was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the member was added to the waitlist
    /// </summary>
    public DateTime AddedAt { get; set; }

    /// <summary>
    /// Current status of the waitlist entry
    /// </summary>
    public WaitlistStatus Status { get; set; } = WaitlistStatus.Active;

    /// <summary>
    /// Whether the member was notified of their position
    /// </summary>
    public bool NotificationSent { get; set; }
}

/// <summary>
/// Response containing member's waitlist status
/// </summary>
public class MemberWaitlistStatus
{
    /// <summary>
    /// Member ID for this status
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Event ID for this status
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Whether the member is currently on the waitlist
    /// </summary>
    public bool IsOnWaitlist { get; set; }

    /// <summary>
    /// Member's position in the waitlist
    /// </summary>
    public int Position { get; set; }

    /// <summary>
    /// Total number of people in the waitlist
    /// </summary>
    public int TotalInWaitlist { get; set; }

    /// <summary>
    /// Estimated wait time based on historical data
    /// </summary>
    public TimeSpan EstimatedWaitTime { get; set; }

    /// <summary>
    /// Priority level of the member's waitlist entry
    /// </summary>
    public WaitlistPriority Priority { get; set; }

    /// <summary>
    /// When the member was added to the waitlist
    /// </summary>
    public DateTime AddedAt { get; set; }

    /// <summary>
    /// Current status of the waitlist entry
    /// </summary>
    public WaitlistStatus Status { get; set; } = WaitlistStatus.Active;

    /// <summary>
    /// Whether the member has been notified of their status
    /// </summary>
    public bool NotificationSent { get; set; }
}