namespace GatherGrove.Application.DTOs.Export;

public class AttendanceRecord
{
    public int MemberId { get; set; }
    public int EventId { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string AttendanceStatus { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string EventName { get; set; } = string.Empty;
    public string AttendeeName { get; set; } = string.Empty;
    public string AttendeeEmail { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
}