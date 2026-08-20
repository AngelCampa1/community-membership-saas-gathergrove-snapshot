namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Types of notifications that can be sent
/// </summary>
public enum NotificationType
{
    ExportReady,
    ExportFailed,
    ReportGenerated,
    ReportReady,
    ScheduledReportDelivery,
    EmailBounce,
    DeliveryConfirmation,
    RetryAttempt,
    DeliveryDigest
}