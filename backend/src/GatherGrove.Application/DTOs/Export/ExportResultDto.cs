using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// DTO for export result data
/// US-005 Data Export & Reporting Engine
/// </summary>
public class ExportResultDto
{
    public string ExportId { get; set; } = string.Empty;
    public ExportFormat Format { get; set; }
    public ExportStatus Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public long? FileSizeBytes { get; set; }
    public string? ErrorMessage { get; set; }
    public string? DownloadUrl { get; set; }
}