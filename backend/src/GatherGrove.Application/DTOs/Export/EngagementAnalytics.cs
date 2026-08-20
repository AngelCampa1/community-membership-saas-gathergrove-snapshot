namespace GatherGrove.Application.DTOs.Export;

public class EngagementAnalytics
{
    public int ClubId { get; set; }
    public int TotalEvents { get; set; }
    public int TotalAttendance { get; set; }
    public double AverageAttendancePerEvent { get; set; }
    public double EngagementScore { get; set; }
    public DateTime GeneratedDate { get; set; } = DateTime.UtcNow;
    public string EventName { get; set; } = string.Empty;
    public int SocialInteractions { get; set; }
    public int SurveyResponses { get; set; }
    public double SatisfactionRating { get; set; }
    public double ReturnAttendeeRate { get; set; }
}