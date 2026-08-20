using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a member's attendance at an event
/// </summary>
public class EventAttendance
{
    /// <summary>
    /// Unique identifier for the event attendance record
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ID of the event that was attended
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// ID of the member who attended the event
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Timestamp when the attendance was recorded
    /// </summary>
    public DateTime AttendedAt { get; set; }

    /// <summary>
    /// Timestamp when this record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Optional notes about the attendance
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Time when the member checked in to the event
    /// </summary>
    public DateTime? CheckInTime { get; set; }

    /// <summary>
    /// Time when the member checked out of the event  
    /// </summary>
    public DateTime? CheckOutTime { get; set; }

    /// <summary>
    /// Status of the member's attendance
    /// </summary>
    public AttendanceStatus AttendanceStatus { get; set; }

    /// <summary>
    /// Navigation property to the associated event
    /// </summary>
    public virtual Event Event { get; set; } = null!;

    /// <summary>
    /// Navigation property to the associated member
    /// </summary>
    public virtual Member Member { get; set; } = null!;
}