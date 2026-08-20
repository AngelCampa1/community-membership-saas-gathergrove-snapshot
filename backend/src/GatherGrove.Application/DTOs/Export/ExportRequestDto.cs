using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.DTOs.Export;

public class DateRange
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class ExportRequestDto
{
    public int ClubId { get; set; }
    public ExportFormat Format { get; set; }
    public ExportType Type { get; set; }
    public ExportType ExportType { get; set; } // Alias for backward compatibility
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateRange? DateRange { get; set; } // Expected by tests
    public List<string> IncludedFields { get; set; } = new();
    public Dictionary<string, object> FilterCriteria { get; set; } = new();
    public Dictionary<string, object> Filters { get; set; } = new(); // Alias for tests
    public bool IncludeSensitiveData { get; set; }
    public string? NotificationEmail { get; set; }
    public Guid RequestedBy { get; set; } // Required by tests
    public bool RequiresApproval { get; set; } // Required by tests
}