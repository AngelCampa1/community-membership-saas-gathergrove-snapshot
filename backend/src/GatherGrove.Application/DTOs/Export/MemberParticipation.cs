namespace GatherGrove.Application.DTOs.Export;

public class MemberParticipation
{
    public int MemberId { get; set; }
    public int EventsAttended { get; set; }
    public DateTime LastAttendance { get; set; }
    public double ParticipationScore { get; set; }
    public string? MemberName { get; set; }
    public string? MemberEmail { get; set; }
    public int TotalEventsAttended { get; set; }
    public double AttendanceRate { get; set; }
    public List<string> PreferredEventTypes { get; set; } = new List<string>();
    public string EngagementLevel { get; set; } = string.Empty;
}