using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request to create a new multi-session event
/// </summary>
public class CreateMultiSessionEventRequest
{
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
    /// The location where sessions will be held
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// Maximum capacity across all sessions
    /// </summary>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// Whether registration is required for this event
    /// </summary>
    public bool RegistrationRequired { get; set; } = true;

    /// <summary>
    /// Whether members can register for individual sessions
    /// </summary>
    public bool AllowIndividualSessionRegistration { get; set; } = false;

    /// <summary>
    /// The sessions that make up this multi-session event
    /// </summary>
    [Required]
    public List<EventSessionRequest> Sessions { get; set; } = new();
}

/// <summary>
/// Request to create or update an event session
/// </summary>
public class EventSessionRequest
{
    /// <summary>
    /// The name of the session
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The description of the session
    /// </summary>
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// When the session starts
    /// </summary>
    [Required]
    public DateTime StartDateTime { get; set; }

    /// <summary>
    /// When the session ends
    /// </summary>
    [Required]
    public DateTime EndDateTime { get; set; }

    /// <summary>
    /// The session number in the sequence
    /// </summary>
    [Required]
    public int SessionNumber { get; set; }

    /// <summary>
    /// Maximum capacity for this specific session
    /// </summary>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// Whether this session is mandatory for completion
    /// </summary>
    public bool IsMandatory { get; set; } = true;

    /// <summary>
    /// Prerequisites for attending this session
    /// </summary>
    public string? Prerequisites { get; set; }
}

/// <summary>
/// Request to update a multi-session event
/// </summary>
public class UpdateMultiSessionEventRequest
{
    /// <summary>
    /// The name of the multi-session event
    /// </summary>
    [MaxLength(200)]
    public string? Name { get; set; }

    /// <summary>
    /// The description of the multi-session event
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// The location where sessions will be held
    /// </summary>
    [MaxLength(500)]
    public string? Location { get; set; }

    /// <summary>
    /// Maximum capacity across all sessions
    /// </summary>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// Whether registration is required for this event
    /// </summary>
    public bool? RegistrationRequired { get; set; }

    /// <summary>
    /// Whether members can register for individual sessions
    /// </summary>
    public bool? AllowIndividualSessionRegistration { get; set; }

    /// <summary>
    /// Whether this event is currently active
    /// </summary>
    public bool? IsActive { get; set; }
}

/// <summary>
/// Request to add a new session to an existing multi-session event
/// </summary>
public class AddEventSessionRequest
{
    /// <summary>
    /// The name of the session
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The description of the session
    /// </summary>
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// When the session starts
    /// </summary>
    [Required]
    public DateTime StartDateTime { get; set; }

    /// <summary>
    /// When the session ends
    /// </summary>
    [Required]
    public DateTime EndDateTime { get; set; }

    /// <summary>
    /// The session number in the sequence
    /// </summary>
    [Required]
    public int SessionNumber { get; set; }

    /// <summary>
    /// Maximum capacity for this specific session
    /// </summary>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// Whether this session is mandatory for completion
    /// </summary>
    public bool IsMandatory { get; set; } = true;

    /// <summary>
    /// Prerequisites for attending this session
    /// </summary>
    public string? Prerequisites { get; set; }
}

/// <summary>
/// Request to update an existing event session
/// </summary>
public class UpdateEventSessionRequest
{
    /// <summary>
    /// The name of the session
    /// </summary>
    [MaxLength(200)]
    public string? Name { get; set; }

    /// <summary>
    /// The description of the session
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// When the session starts
    /// </summary>
    public DateTime? StartDateTime { get; set; }

    /// <summary>
    /// When the session ends
    /// </summary>
    public DateTime? EndDateTime { get; set; }

    /// <summary>
    /// Maximum capacity for this specific session
    /// </summary>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// Whether this session is mandatory for completion
    /// </summary>
    public bool? IsMandatory { get; set; }

    /// <summary>
    /// Prerequisites for attending this session
    /// </summary>
    public string? Prerequisites { get; set; }
}

/// <summary>
/// Request to register for a multi-session event
/// </summary>
public class MultiSessionRegistrationRequest
{
    /// <summary>
    /// The member to register
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// Whether to register for all sessions
    /// </summary>
    public bool RegisterForAllSessions { get; set; } = true;

    /// <summary>
    /// Specific session IDs to register for (when not registering for all)
    /// </summary>
    public List<int>? SelectedSessionIds { get; set; }

    /// <summary>
    /// Optional notes for the registration
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// Response containing multi-session event information
/// </summary>
public class MultiSessionEventResponse
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
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The description of the multi-session event
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// The location where sessions will be held
    /// </summary>
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// Maximum capacity across all sessions
    /// </summary>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// Whether registration is required for this event
    /// </summary>
    public bool RegistrationRequired { get; set; }

    /// <summary>
    /// Whether members can register for individual sessions
    /// </summary>
    public bool AllowIndividualSessionRegistration { get; set; }

    /// <summary>
    /// Whether this event is currently active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// The sessions that make up this multi-session event
    /// </summary>
    public List<EventSessionResponse> Sessions { get; set; } = new();

    /// <summary>
    /// Total number of registered members
    /// </summary>
    public int TotalRegistrations { get; set; }

    /// <summary>
    /// When this event was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this event was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Response containing event session information
/// </summary>
public class EventSessionResponse
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
    /// The name of the session
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The description of the session
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// When the session starts
    /// </summary>
    public DateTime StartDateTime { get; set; }

    /// <summary>
    /// When the session ends
    /// </summary>
    public DateTime EndDateTime { get; set; }

    /// <summary>
    /// The session number in the sequence
    /// </summary>
    public int SessionNumber { get; set; }

    /// <summary>
    /// Maximum capacity for this specific session
    /// </summary>
    public int? MaxCapacity { get; set; }

    /// <summary>
    /// Whether this session is mandatory for completion
    /// </summary>
    public bool IsMandatory { get; set; }

    /// <summary>
    /// Prerequisites for attending this session
    /// </summary>
    public string? Prerequisites { get; set; }

    /// <summary>
    /// Number of registered members for this session
    /// </summary>
    public int RegisteredMembers { get; set; }

    /// <summary>
    /// Number of members who attended this session
    /// </summary>
    public int AttendedMembers { get; set; }

    /// <summary>
    /// When this session was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this session was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Response containing multi-session registration information
/// </summary>
public class MultiSessionRegistrationResponse
{
    /// <summary>
    /// Unique identifier for the registration
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The multi-session event ID
    /// </summary>
    public int MultiSessionEventId { get; set; }

    /// <summary>
    /// The registered member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Whether registered for all sessions
    /// </summary>
    public bool RegisteredForAllSessions { get; set; }

    /// <summary>
    /// Individual session registrations
    /// </summary>
    public List<SessionRegistrationInfo> SessionRegistrations { get; set; } = new();

    /// <summary>
    /// Registration notes
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// When the registration was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Information about a session registration
/// </summary>
public class SessionRegistrationInfo
{
    /// <summary>
    /// The session ID
    /// </summary>
    public int SessionId { get; set; }

    /// <summary>
    /// The session number
    /// </summary>
    public int SessionNumber { get; set; }

    /// <summary>
    /// The session name
    /// </summary>
    public string SessionName { get; set; } = string.Empty;

    /// <summary>
    /// Whether the member attended this session
    /// </summary>
    public bool Attended { get; set; }

    /// <summary>
    /// When attendance was recorded (if attended)
    /// </summary>
    public DateTime? AttendedAt { get; set; }
}

/// <summary>
/// Represents a member's progress across all sessions in a multi-session event
/// </summary>
public class MultiSessionMemberProgress
{
    /// <summary>
    /// The member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// The multi-session event ID
    /// </summary>
    public int MultiSessionEventId { get; set; }

    /// <summary>
    /// Total number of sessions in the event
    /// </summary>
    public int TotalSessions { get; set; }

    /// <summary>
    /// Number of sessions completed by the member
    /// </summary>
    public int CompletedSessions { get; set; }

    /// <summary>
    /// Overall progress percentage
    /// </summary>
    public int OverallProgress { get; set; }

    /// <summary>
    /// Progress for individual sessions
    /// </summary>
    public List<SessionProgress> SessionProgresses { get; set; } = new();

    /// <summary>
    /// Whether the member has completed all mandatory sessions
    /// </summary>
    public bool CompletedMandatorySessions { get; set; }

    /// <summary>
    /// When the member's progress was last updated
    /// </summary>
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Represents a member's progress in an individual session
/// </summary>
public class SessionProgress
{
    /// <summary>
    /// The session ID
    /// </summary>
    public int SessionId { get; set; }

    /// <summary>
    /// The session number
    /// </summary>
    public int SessionNumber { get; set; }

    /// <summary>
    /// The session name
    /// </summary>
    public string SessionName { get; set; } = string.Empty;

    /// <summary>
    /// Whether the session has been completed
    /// </summary>
    public bool Completed { get; set; }

    /// <summary>
    /// When the session was completed (if completed)
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Whether this session is mandatory for overall completion
    /// </summary>
    public bool IsMandatory { get; set; }

    /// <summary>
    /// Session attendance duration in minutes
    /// </summary>
    public int? AttendanceDurationMinutes { get; set; }
}