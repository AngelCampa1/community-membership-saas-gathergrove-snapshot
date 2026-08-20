namespace GatherGrove.Application.DTOs.Export;

public class EmailDeliveryStatistics
{
    public int ClubId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalEmails { get; set; }
    public int DeliveredEmails { get; set; }
    public int FailedEmails { get; set; }
    public double OpenRate { get; set; }
    public double ClickRate { get; set; }

    // Existing properties
    public int TotalSent { get; set; }
    public int TotalEmailsSent { get; set; }
    public int TotalDelivered { get; set; }
    public int TotalEmailsDelivered { get; set; }
    public int TotalFailed { get; set; }
    public int TotalBounced { get; set; }
    public double DeliveryRate { get; set; }
    public double BounceRate { get; set; }

    /// <summary>
    /// Total number of emails that failed to deliver
    /// </summary>
    public int TotalEmailsFailed { get; set; }

    /// <summary>
    /// Total number of emails that bounced
    /// </summary>
    public int TotalEmailsBounced { get; set; }

    /// <summary>
    /// Average delivery time in seconds
    /// </summary>
    public double AverageDeliveryTime { get; set; }

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}