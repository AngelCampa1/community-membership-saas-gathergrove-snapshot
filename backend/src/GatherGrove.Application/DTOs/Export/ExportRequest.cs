using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Base export request data
/// US-005 Data Export & Reporting Engine
/// </summary>
public class ExportRequest
{
    public int ClubId { get; set; }
    public ExportFormat Format { get; set; }
    public ExportType ExportType { get; set; }
    public int RequestedBy { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public bool IncludeMetadata { get; set; } = false;
    public bool RedactSensitiveData { get; set; } = true;
    public Dictionary<string, object> Options { get; set; } = new();

    /// <summary>
    /// User ID who made the request
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Time when request was made
    /// </summary>
    public DateTime RequestTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// IP address of the requester
    /// </summary>
    public string IPAddress { get; set; } = string.Empty;

    /// <summary>
    /// Include personal data in export
    /// </summary>
    public bool IncludePersonalData { get; set; } = false;

    /// <summary>
    /// Purpose of the data export
    /// </summary>
    public string Purpose { get; set; } = string.Empty;

    /// <summary>
    /// Legal basis for data processing
    /// </summary>
    public string DataProcessingLegalBasis { get; set; } = string.Empty;
}