namespace GatherGrove.Application.DTOs.Export;

public class EventAnalytics
{
    public int EventId { get; set; }
    public int TotalRegistrations { get; set; }
    public int ActualAttendance { get; set; }
    public double AttendanceRate { get; set; }
    public double NoShowRate { get; set; }
    public DateTime? EventDate { get; set; }
    public string? EventName { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string VenueType { get; set; } = string.Empty;
    public double EngagementScore { get; set; }
    public decimal Revenue { get; set; }
}