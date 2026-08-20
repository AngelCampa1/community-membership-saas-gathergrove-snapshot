using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Analytics
{
    public class EngagementTrendDto
    {
        public string Period { get; set; } = string.Empty;
        public double MemberEngagement { get; set; }
        public double EventAttendance { get; set; }
        public double CommunicationActivity { get; set; }
        public double ProfileUpdates { get; set; }
        public double AverageScore { get; set; }
    }

    public class CohortDto
    {
        public string Cohort { get; set; } = string.Empty;
        public int TotalMembers { get; set; }
        public Dictionary<string, double> RetentionRates { get; set; } = new();
        public double ChurnRate { get; set; }
        public double AverageLifetime { get; set; }
    }

    public class ROIDto
    {
        public string Period { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public decimal Costs { get; set; }
        public decimal Profit { get; set; }
        public double ROI { get; set; }
        public string Trend { get; set; } = "stable";
    }

    public class EventComparisonDto
    {
        public int EventId { get; set; }
        public string EventName { get; set; } = string.Empty;
        public int Attendance { get; set; }
        public double EngagementScore { get; set; }
        public decimal Revenue { get; set; }
        public decimal Costs { get; set; }
        public double ROI { get; set; }
        public DateTime Date { get; set; }
    }

    public class MemberSegmentDto
    {
        public string Segment { get; set; } = string.Empty;
        public int Count { get; set; }
        public string EngagementLevel { get; set; } = "medium";
        public decimal AverageRevenue { get; set; }
        public double ChurnRisk { get; set; }
    }

    public class AnalyticsDateRangeDto
    {
        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }
    }

    public class EventComparisonRequestDto
    {
        [Required]
        public List<int> EventIds { get; set; } = new();
    }

    public class ExportRequestDto
    {
        [Required]
        public string DataType { get; set; } = string.Empty; // engagement, cohorts, roi, events, segmentation

        [Required]
        public string Format { get; set; } = string.Empty; // pdf, excel, csv

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }
    }

    public class ExportResponseDto
    {
        public string DownloadUrl { get; set; } = string.Empty;
        public string Filename { get; set; } = string.Empty;
    }
}