namespace GatherGrove.Application.DTOs.Export;

public class ReportDeliveryDigestData
{
    public DateTime DigestDate { get; set; }
    public int TotalReportsSent { get; set; }
    public int TotalRecipientsReached { get; set; }

    /// <summary>
    /// Number of successfully delivered reports
    /// </summary>
    public int SuccessfulDeliveries { get; set; }

    /// <summary>
    /// Number of failed report deliveries
    /// </summary>
    public int FailedDeliveries { get; set; }

    /// <summary>
    /// Delivery success rate as a percentage (0.0 to 1.0)
    /// </summary>
    public decimal DeliveryRate { get; set; }

    /// <summary>
    /// The most frequently requested report type during this period
    /// </summary>
    public string MostRequestedReportType { get; set; } = string.Empty;

    /// <summary>
    /// Hour of day (0-23) when most deliveries occur
    /// </summary>
    public int PeakDeliveryHour { get; set; }

    public List<ReportDeliverySummary> ReportSummaries { get; set; } = new();
    public EmailDeliveryStatistics OverallStatistics { get; set; } = new();
}

public class ReportDeliverySummary
{
    public string ReportType { get; set; } = string.Empty;
    public string ReportName { get; set; } = string.Empty;
    public DateTime DeliveryDate { get; set; }
    public int RecipientCount { get; set; }
    public EmailDeliveryStatus Status { get; set; }
}