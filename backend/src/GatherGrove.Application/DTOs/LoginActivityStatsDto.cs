namespace GatherGrove.Application.DTOs;

/// <summary>
/// DTO for club login activity statistics
/// </summary>
public class LoginActivityStatsDto
{
    public int ClubId { get; set; }
    public int PeriodDays { get; set; }
    public int TotalMembers { get; set; }
    public int MembersWithLogins { get; set; }
    public int TotalLogins { get; set; }
    public decimal AverageLoginsPerMember { get; set; }
    public int DailyActiveUsers { get; set; }
    public int WeeklyActiveUsers { get; set; }
    public int MonthlyActiveUsers { get; set; }
    public int InactiveMembers { get; set; }
    public List<LoginTrendDto> LoginTrends { get; set; } = new();
}

/// <summary>
/// DTO for member login activity details
/// </summary>
public class MemberLoginActivityDto
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime? LastLoginDate { get; set; }
    public int LoginCount { get; set; }
    public int? DaysSinceLastLogin { get; set; }
    public string ActivityLevel { get; set; } = string.Empty;
    public bool IsAtRisk { get; set; }
    public string LoginFrequency { get; set; } = string.Empty;
    public List<string> PlatformsUsed { get; set; } = new();
}

/// <summary>
/// DTO for login trends over time
/// </summary>
public class LoginTrendDto
{
    public DateTime Date { get; set; }
    public int TotalLogins { get; set; }
    public int UniqueUsers { get; set; }
    public int WebLogins { get; set; }
    public int MobileLogins { get; set; }
}

/// <summary>
/// DTO for member login statistics used in calculations
/// </summary>
public class MemberLoginStatsDto
{
    public int LoginCount7Days { get; set; }
    public int LoginCount30Days { get; set; }
    public int LoginCount90Days { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public int? DaysSinceLastLogin { get; set; }
    public List<DateTime> LoginDates { get; set; } = new();
}