namespace GatherGrove.Domain.Enums;

/// <summary>
/// Enum representing different attendance statuses for events
/// </summary>
public enum AttendanceStatus
{
    /// <summary>
    /// Member registered but status unknown
    /// </summary>
    Unknown = 0,

    /// <summary>
    /// Member attended the event
    /// </summary>
    Present = 1,

    /// <summary>
    /// Member registered but did not show up
    /// </summary>
    NoShow = 2,

    /// <summary>
    /// Member attended partially (left early or arrived late)
    /// </summary>
    PartialAttendance = 3,

    /// <summary>
    /// Member cancelled attendance in advance
    /// </summary>
    Cancelled = 4,

    /// <summary>
    /// Member was excused from the event
    /// </summary>
    Excused = 5
}