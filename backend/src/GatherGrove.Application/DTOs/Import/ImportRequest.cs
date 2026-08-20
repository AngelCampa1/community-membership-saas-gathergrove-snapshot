namespace GatherGrove.Application.DTOs.Import;

/// <summary>
/// Request to execute member import
/// </summary>
public class ImportRequest
{
    public string CsvData { get; set; } = string.Empty;
    public ImportOptions Options { get; set; } = new();
}

/// <summary>
/// Options for import execution
/// </summary>
public class ImportOptions
{
    public bool SkipDuplicates { get; set; } = true;
    public bool SkipInvalid { get; set; } = true;
    public bool NotifyMembers { get; set; } = false;
}