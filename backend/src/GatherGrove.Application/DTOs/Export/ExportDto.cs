using System.ComponentModel.DataAnnotations;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;



// Export Options DTOs - Removed EventExportOptions duplicate (defined in EventExportOptions.cs)
public class AnalyticsExportOptions { }
public class ExportHistoryItem { }
public class ExportFormatInfo
{
    public ExportFormat Format { get; set; }
    public string Name { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> SupportedFields { get; set; } = new List<string>();
}

public class ExportValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new List<string>();
    public List<string> ValidationMessages { get; set; } = new List<string>();
    public List<string> Warnings { get; set; } = new List<string>();
    public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();
}

public class ExportQuota
{
    public int MaxExportsPerDay { get; set; }
    public int MaxExportsPerMonth { get; set; }
    public long MaxFileSizeBytes { get; set; }
    public int UsedExportsToday { get; set; }
    public int UsedExportsThisMonth { get; set; }
    public int Limit { get; set; }
    public int Used { get; set; }
    public int Remaining { get; set; }
    public DateTime ResetDate { get; set; }
    public string QuotaType { get; set; } = string.Empty;

    /// <summary>
    /// Maximum exports per hour
    /// </summary>
    public int MaxExportsPerHour { get; set; }

    /// <summary>
    /// Used exports this hour
    /// </summary>
    public int UsedExportsThisHour { get; set; }
}

public class BackgroundExportRequest
{
    public string ExportType { get; set; } = string.Empty;
    public ExportFormat Format { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public BackgroundTaskPriority Priority { get; set; } = BackgroundTaskPriority.Normal;
    public string NotificationEmail { get; set; } = string.Empty;
    public bool SendCompletionNotification { get; set; } = true;
    public bool IncludeLargeDatasets { get; set; } = false;
}