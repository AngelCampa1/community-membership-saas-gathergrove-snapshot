using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents an event with multiple sessions (e.g., workshops, courses)
/// </summary>
public class MultiSessionEvent
{
    /// <summary>
    /// Unique identifier for the multi-session event
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The club this event belongs to
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// The name of the multi-session event
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The description of the multi-session event
    /// </summary>
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Location for the event (can be overridden per session)
    /// </summary>
    [MaxLength(500)]
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// Maximum capacity for the entire event
    /// </summary>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// Whether registration is required for participation
    /// </summary>
    public bool RegistrationRequired { get; set; } = true;

    /// <summary>
    /// Whether members can register for individual sessions
    /// </summary>
    public bool AllowIndividualSessionRegistration { get; set; } = false;

    /// <summary>
    /// Cost for the entire multi-session event
    /// </summary>
    public decimal? TotalCost { get; set; }

    /// <summary>
    /// Whether this event is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When this event was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this event was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the club
    /// </summary>
    public virtual Club Club { get; set; } = null!;

    /// <summary>
    /// Navigation property for event sessions
    /// </summary>
    public virtual ICollection<EventSession> Sessions { get; set; } = new List<EventSession>();

    /// <summary>
    /// Navigation property for event registrations
    /// </summary>
    public virtual ICollection<MultiSessionEventRegistration> Registrations { get; set; } = new List<MultiSessionEventRegistration>();
}

/// <summary>
/// Represents an individual session within a multi-session event
/// </summary>
public class EventSession
{
    /// <summary>
    /// Unique identifier for the session
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The multi-session event this session belongs to
    /// </summary>
    public int MultiSessionEventId { get; set; }

    /// <summary>
    /// Session number/order within the event
    /// </summary>
    public int SessionNumber { get; set; }

    /// <summary>
    /// The name of this session
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of this session
    /// </summary>
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Start date and time for this session
    /// </summary>
    public DateTime StartDateTime { get; set; }

    /// <summary>
    /// End date and time for this session
    /// </summary>
    public DateTime EndDateTime { get; set; }

    /// <summary>
    /// Location for this session (overrides event location if specified)
    /// </summary>
    [MaxLength(500)]
    public string? Location { get; set; }

    /// <summary>
    /// Maximum capacity for this session (overrides event capacity if specified)
    /// </summary>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// Prerequisites for attending this session
    /// </summary>
    [MaxLength(500)]
    public string? Prerequisites { get; set; }

    /// <summary>
    /// Materials or resources needed for this session
    /// </summary>
    [MaxLength(500)]
    public string? Materials { get; set; }

    /// <summary>
    /// Whether this session is mandatory for completion
    /// </summary>
    public bool IsMandatory { get; set; } = true;

    /// <summary>
    /// When this session was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this session was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the multi-session event
    /// </summary>
    public virtual MultiSessionEvent MultiSessionEvent { get; set; } = null!;

    /// <summary>
    /// Navigation property for session registrations
    /// </summary>
    public virtual ICollection<EventSessionRegistration> SessionRegistrations { get; set; } = new List<EventSessionRegistration>();

    /// <summary>
    /// Navigation property for session attendance
    /// </summary>
    public virtual ICollection<EventSessionAttendance> SessionAttendances { get; set; } = new List<EventSessionAttendance>();
}

/// <summary>
/// Represents a member's registration for a multi-session event
/// </summary>
public class MultiSessionEventRegistration
{
    /// <summary>
    /// Unique identifier for the registration
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The multi-session event being registered for
    /// </summary>
    public int MultiSessionEventId { get; set; }

    /// <summary>
    /// The member registering
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Whether registered for all sessions
    /// </summary>
    public bool RegisteredForAllSessions { get; set; } = true;

    /// <summary>
    /// When the registration was made
    /// </summary>
    public DateTime RegisteredAt { get; set; }

    /// <summary>
    /// When this registration was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Registration status
    /// </summary>
    public RegistrationStatus Status { get; set; } = RegistrationStatus.Confirmed;

    /// <summary>
    /// Payment status for the registration
    /// </summary>
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    /// <summary>
    /// Amount paid for the registration
    /// </summary>
    public decimal? AmountPaid { get; set; }

    /// <summary>
    /// Optional notes about the registration
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    /// <summary>
    /// Navigation property for the multi-session event
    /// </summary>
    public virtual MultiSessionEvent MultiSessionEvent { get; set; } = null!;

    /// <summary>
    /// Navigation property for the member
    /// </summary>
    public virtual Member Member { get; set; } = null!;

    /// <summary>
    /// Navigation property for individual session registrations
    /// </summary>
    public virtual ICollection<EventSessionRegistration> SessionRegistrations { get; set; } = new List<EventSessionRegistration>();
}

/// <summary>
/// Represents a member's registration for an individual session
/// </summary>
public class EventSessionRegistration
{
    /// <summary>
    /// Unique identifier for the session registration
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The session being registered for
    /// </summary>
    public int SessionId { get; set; }

    /// <summary>
    /// The overall multi-session event registration
    /// </summary>
    public int MultiSessionEventRegistrationId { get; set; }

    /// <summary>
    /// Registration status for this session
    /// </summary>
    public RegistrationStatus Status { get; set; } = RegistrationStatus.Confirmed;

    /// <summary>
    /// When registered for this session
    /// </summary>
    public DateTime RegisteredAt { get; set; }

    /// <summary>
    /// Navigation property for the session
    /// </summary>
    public virtual EventSession Session { get; set; } = null!;

    /// <summary>
    /// Navigation property for the overall registration
    /// </summary>
    public virtual MultiSessionEventRegistration MultiSessionEventRegistration { get; set; } = null!;
}

/// <summary>
/// Represents a member's attendance at an individual session
/// </summary>
public class EventSessionAttendance
{
    /// <summary>
    /// Unique identifier for the session attendance
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The session that was attended
    /// </summary>
    public int SessionId { get; set; }

    /// <summary>
    /// The member who attended
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// When the member checked in (null if not attended)
    /// </summary>
    public DateTime? AttendedAt { get; set; }

    /// <summary>
    /// When the member checked out
    /// </summary>
    public DateTime? CheckOutTime { get; set; }

    /// <summary>
    /// Optional notes about the attendance
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    /// <summary>
    /// Navigation property for the session
    /// </summary>
    public virtual EventSession Session { get; set; } = null!;

    /// <summary>
    /// Navigation property for the member
    /// </summary>
    public virtual Member Member { get; set; } = null!;
}

/// <summary>
/// Registration status enumeration
/// </summary>
public enum RegistrationStatus
{
    Pending = 1,
    Confirmed = 2,
    Cancelled = 3,
    Waitlisted = 4
}

/// <summary>
/// Payment status enumeration
/// </summary>
public enum PaymentStatus
{
    Pending = 1,
    Paid = 2,
    Refunded = 3,
    Failed = 4
}