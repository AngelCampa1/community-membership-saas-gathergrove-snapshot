namespace GatherGrove.Application.DTOs.Export;

public class EventReportData
{
    public int ClubId { get; set; }
    public ReportPeriod ReportPeriod { get; set; } = new();
    public List<EventReport> Events { get; set; } = new();
    public EventSummary Summary { get; set; } = new();
    public DateTime GeneratedDate { get; set; } = DateTime.UtcNow;
}

public class ReportPeriod
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class EventReport
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public int TotalRegistrations { get; set; }
    public int ActualAttendance { get; set; }
    public double AttendanceRate { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class EventSummary
{
    public int TotalEvents { get; set; }
    public int TotalAttendance { get; set; }
    public double AverageAttendanceRate { get; set; }
    public double TotalRevenue { get; set; }
    public int TotalRegistrations { get; set; }
}