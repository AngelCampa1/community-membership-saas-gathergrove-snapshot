namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a club in the GatherGrove system
/// </summary>
public class Club
{
    /// <summary>
    /// Unique identifier for the club
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Name of the club
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Current subscription tier (Seed, Grow, Unlimited)
    /// </summary>
    public string Tier { get; set; } = "Seed";

    /// <summary>
    /// When the trial expires (null if not on trial)
    /// </summary>
    public DateTime? TrialExpiresAt { get; set; }

    /// <summary>
    /// Stripe customer ID for this club
    /// </summary>
    public string? StripeCustomerId { get; set; }

    /// <summary>
    /// Stripe subscription ID for active subscriptions
    /// </summary>
    public string? StripeSubscriptionId { get; set; }

    /// <summary>
    /// Current status of the Stripe subscription (active, cancelled, past_due, etc.)
    /// </summary>
    public string? SubscriptionStatus { get; set; }

    /// <summary>
    /// Stripe Connect account ID for receiving member payments (Story 18)
    /// </summary>
    public string? StripeAccountId { get; set; }

    /// <summary>
    /// Country code where the club's Stripe account is located (e.g., "US", "CA", "MX")
    /// Used for determining payment processing compatibility
    /// </summary>
    public string? StripeAccountCountry { get; set; }

    /// <summary>
    /// Whether the member directory is enabled for this club (Story 28)
    /// </summary>
    public bool IsDirectoryEnabled { get; set; } = false;

    /// <summary>
    /// Comma-separated list of member profile fields that can be optionally shared in the directory (Story 28)
    /// </summary>
    public string? DirectoryAllowedSharableFields { get; set; }

    /// <summary>
    /// Whether the club chat feature is enabled (Story 31)
    /// </summary>
    public bool IsChatEnabled { get; set; } = false;

    /// <summary>
    /// When the club membership/subscription expires (null if no expiration)
    /// Used for expired membership validation in security tests
    /// </summary>
    public DateTime? MembershipExpiresAt { get; set; }

    /// <summary>
    /// ID of the user who created this club (primary admin)
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// When the club was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the club was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for club administrators
    /// </summary>
    public virtual ICollection<ClubAdmin> ClubAdmins { get; set; } = new List<ClubAdmin>();

    /// <summary>
    /// Navigation property for membership types in this club
    /// </summary>
    public virtual ICollection<MembershipType> MembershipTypes { get; set; } = new List<MembershipType>();

    /// <summary>
    /// Navigation property for members in this club
    /// </summary>
    public virtual ICollection<Member> Members { get; set; } = new List<Member>();

    /// <summary>
    /// Navigation property for events in this club
    /// </summary>
    public virtual ICollection<Event> Events { get; set; } = new List<Event>();

    /// <summary>
    /// ID of the promotion that was applied to this club's subscription (if any)
    /// </summary>
    public int? AppliedPromotionId { get; set; }

    /// <summary>
    /// Navigation property for the promotion applied to this club
    /// </summary>
    public virtual Promotion? AppliedPromotion { get; set; }
}
