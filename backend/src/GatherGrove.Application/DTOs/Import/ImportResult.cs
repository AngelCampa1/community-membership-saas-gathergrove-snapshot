namespace GatherGrove.Application.DTOs.Import;

/// <summary>
/// Result of member import execution
/// </summary>
public class ImportResult
{
    public Guid ImportId { get; set; }
    public string Status { get; set; } = string.Empty;
    public ImportSummary Summary { get; set; } = new();
    public List<ImportError> Errors { get; set; } = new();
}

/// <summary>
/// Summary of import results
/// </summary>
public class ImportSummary
{
    public int TotalProcessed { get; set; }
    public int Successful { get; set; }
    public int Skipped { get; set; }
    public int Failed { get; set; }
}

/// <summary>
/// Error that occurred during import for a specific member
/// </summary>
public class ImportError
{
    public int RowNumber { get; set; }
    public Dictionary<string, object> MemberData { get; set; } = new();
    public string Error { get; set; } = string.Empty;
}