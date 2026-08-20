using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Services.Interfaces;

public interface IExportFormatValidator
{
    bool IsValidFormat(ExportFormat format);
    bool ValidateFileExtension(string fileName, ExportFormat expectedFormat);
    Task<ValidationResult> ValidateExportDataAsync(byte[] data, ExportFormat format);
    ValidationResult ValidateCsvFormat(byte[] csvData);
    ValidationResult ValidateExcelFormat(byte[] excelData);
    Task<FileTypeResult> DetectFileTypeAsync(byte[] data);
    Task<ValidationResult> ValidateJsonFormat(byte[] jsonData);
    Task<ValidationResult> ValidateJsonFormat(byte[] jsonData, List<string> requiredFields);
    Task<ValidationResult> ValidatePdfFormat(byte[] pdfData);
    Task<ValidationResult> ValidateDataIntegrity(byte[] csvData, byte[] jsonData);
    Task<ValidationResult> ValidateExportPerformance(byte[] data, ExportPerformanceCriteria criteria);
}

public class ErrorLocation
{
    public int LineNumber { get; set; }
    public int ColumnNumber { get; set; }
}

public class ExportPerformanceCriteria
{
    public double MaxProcessingTimeSeconds { get; set; }
    public double MaxMemoryUsageMB { get; set; }
    public double MinThroughputRecordsPerSecond { get; set; }
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public int RowCount { get; set; }
    public int ColumnCount { get; set; }
    public bool HasHeader { get; set; }
    public string Encoding { get; set; } = "UTF-8";
    public string Delimiter { get; set; } = ",";
    public List<string> ValidationErrors { get; set; } = new();
    public bool ContainsSpecialCharacters { get; set; }
    public double EncodingConfidence { get; set; }
    public int WorksheetCount { get; set; }
    public bool HasData { get; set; }
    public string FileFormat { get; set; } = string.Empty;
    public int TotalCells { get; set; }
    public List<string> WorksheetNames { get; set; } = new();
    public bool ContainsFormulas { get; set; }
    public int FormulaCount { get; set; }
    public bool HasCircularReferences { get; set; }
    public bool IsWellFormed { get; set; }
    public int ObjectCount { get; set; }
    public int ArrayCount { get; set; }
    public int MaxDepth { get; set; }
    public List<string> SyntaxErrors { get; set; } = new();
    public ErrorLocation ErrorLocation { get; set; } = new();
    public List<string> MissingFields { get; set; } = new();
    public long FileSizeBytes { get; set; }
    public bool ContainsUnicodeCharacters { get; set; }
    public string PdfVersion { get; set; } = string.Empty;
    public int PageCount { get; set; }
    public bool HasText { get; set; }
    public bool IsEncrypted { get; set; }
    public bool RequiresPassword { get; set; }
    public string SecurityLevel { get; set; } = string.Empty;
    public bool HasImages { get; set; }
    public int ImageCount { get; set; }
    public bool IsConsistent { get; set; }
    public bool RecordCountMatch { get; set; }
    public bool FieldCountMatch { get; set; }
    public double DataTypeConsistency { get; set; }
    public List<string> IntegrityErrors { get; set; } = new();
    public int CsvRecordCount { get; set; }
    public int JsonRecordCount { get; set; }
    public bool MeetsPerformanceRequirements { get; set; }
    public double ProcessingTimeSeconds { get; set; }
    public double MemoryUsageMB { get; set; }
    public double ThroughputRecordsPerSecond { get; set; }
}

public class FileTypeResult
{
    public string? DetectedType { get; set; }
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public string? FileType { get; set; }
    public double Confidence { get; set; }

    public static implicit operator string(FileTypeResult result)
    {
        return result.FileType ?? result.DetectedType ?? string.Empty;
    }
}

