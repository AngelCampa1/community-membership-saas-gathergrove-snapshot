namespace GatherGrove.Application.DTOs.Import;

/// <summary>
/// Result of CSV validation before import
/// </summary>
public class ImportValidationResult
{
    public bool IsValid { get; set; }
    public int TotalRows { get; set; }
    public int ValidRows { get; set; }
    public int InvalidRows { get; set; }
    public int DuplicateEmails { get; set; }
    public List<ValidationError> ValidationErrors { get; set; } = new();
    public List<ValidationWarning> Warnings { get; set; } = new();
}

/// <summary>
/// Validation error for a specific row/field
/// </summary>
public class ValidationError
{
    public int RowNumber { get; set; }
    public string Field { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
}

/// <summary>
/// Validation warning for a specific row/field
/// </summary>
public class ValidationWarning
{
    public int RowNumber { get; set; }
    public string Field { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Warning { get; set; } = string.Empty;
}