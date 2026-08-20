using GatherGrove.Application.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// File type detection service for export validation
/// US-005 Data Export & Reporting Engine - File type detection
/// </summary>
public class FileTypeDetector : IFileTypeDetector
{
    private readonly ILogger<FileTypeDetector>? _logger;

    public FileTypeDetector(ILogger<FileTypeDetector> logger)
    {
        _logger = logger;
    }

    public FileTypeDetector()
    {
        // Parameterless constructor for tests
    }

    /// <summary>
    /// Detects file type from binary data using magic bytes (string return)
    /// </summary>
    public string DetectFileType(byte[] fileData)
    {
        var result = DetectFileTypeWithResult(fileData);
        return result.FileType ?? "Unknown";
    }

    /// <summary>
    /// Detects file type from binary data using magic bytes (FileTypeResult return)
    /// </summary>
    FileTypeResult IFileTypeDetector.DetectFileType(byte[] fileData)
    {
        return DetectFileTypeWithResult(fileData);
    }

    /// <summary>
    /// Internal method that returns the full FileTypeResult
    /// </summary>
    private FileTypeResult DetectFileTypeWithResult(byte[] fileData)
    {
        if (fileData == null || fileData.Length == 0)
            return new FileTypeResult { FileType = "Unknown", IsValid = false };

        try
        {
            // Check for various file signatures (magic bytes)
            if (fileData.Length >= 4)
            {
                // PDF signature: %PDF
                if (fileData[0] == 0x25 && fileData[1] == 0x50 && fileData[2] == 0x44 && fileData[3] == 0x46)
                    return new FileTypeResult { FileType = "PDF", IsValid = true };

                // ZIP-based files (Excel, etc.): PK
                if (fileData[0] == 0x50 && fileData[1] == 0x4B)
                {
                    // Check for Excel-specific signatures within ZIP
                    if (fileData.Length >= 8)
                    {
                        var content = System.Text.Encoding.ASCII.GetString(fileData.Take(512).ToArray());
                        if (content.Contains("xl/") || content.Contains("worksheets") || content.Contains("sharedStrings"))
                            return new FileTypeResult { FileType = "Excel", IsValid = true };
                    }
                    return new FileTypeResult { FileType = "ZIP", IsValid = true };
                }

                // JSON check (starts with { or [)
                if (fileData[0] == 0x7B || fileData[0] == 0x5B)
                {
                    try
                    {
                        var content = System.Text.Encoding.UTF8.GetString(fileData);
                        System.Text.Json.JsonDocument.Parse(content);
                        return new FileTypeResult { FileType = "JSON", IsValid = true };
                    }
                    catch
                    {
                        // Not valid JSON, continue checking
                    }
                }
            }

            // Check for CSV by trying to decode as UTF-8 and looking for common CSV patterns
            try
            {
                var content = System.Text.Encoding.UTF8.GetString(fileData);
                if (IsLikelyCsv(content))
                    return new FileTypeResult { FileType = "CSV", IsValid = true };
            }
            catch
            {
                // Not UTF-8 text
            }

            // Check for other text formats
            if (IsLikelyTextFile(fileData))
                return new FileTypeResult { FileType = "Text", IsValid = true };

            return new FileTypeResult { FileType = "Unknown", IsValid = false };
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Error detecting file type");
            return new FileTypeResult { FileType = "Unknown", IsValid = false };
        }
    }

    /// <summary>
    /// Validates if file data matches expected file type
    /// </summary>
    public bool IsValidFileType(byte[] fileData, string expectedExtension)
    {
        var detectedResult = DetectFileTypeWithResult(fileData);
        var detectedType = detectedResult.FileType;
        var normalizedExtension = expectedExtension.TrimStart('.').ToUpperInvariant();

        return normalizedExtension switch
        {
            "PDF" => detectedType == "PDF",
            "CSV" => detectedType == "CSV" || detectedType == "Text",
            "XLSX" or "XLS" => detectedType == "Excel" || detectedType == "ZIP",
            "JSON" => detectedType == "JSON",
            "TXT" => detectedType == "Text" || detectedType == "CSV",
            _ => false
        };
    }

    /// <summary>
    /// Gets MIME type for file extension
    /// </summary>
    public string GetMimeType(string fileExtension)
    {
        var normalizedExtension = fileExtension.TrimStart('.').ToLowerInvariant();

        return normalizedExtension switch
        {
            "pdf" => "application/pdf",
            "csv" => "text/csv",
            "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xls" => "application/vnd.ms-excel",
            "json" => "application/json",
            "txt" => "text/plain",
            "zip" => "application/zip",
            _ => "application/octet-stream"
        };
    }

    /// <summary>
    /// Determines if content is likely a CSV file
    /// </summary>
    private static bool IsLikelyCsv(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return false;

        var lines = content.Split('\n').Take(10).ToArray();
        if (lines.Length < 2)
            return false;

        // Check if first few lines have consistent comma/semicolon patterns
        var firstLineCommas = lines[0].Count(c => c == ',');
        var firstLineSemicolons = lines[0].Count(c => c == ';');
        var delimiter = firstLineCommas >= firstLineSemicolons ? ',' : ';';
        var expectedDelimiterCount = Math.Max(firstLineCommas, firstLineSemicolons);

        if (expectedDelimiterCount == 0)
            return false;

        // Check if subsequent lines have similar delimiter counts (allowing ±1 variance)
        var consistentLines = 0;
        foreach (var line in lines.Skip(1).Take(5))
        {
            var delimiterCount = line.Count(c => c == delimiter);
            if (Math.Abs(delimiterCount - expectedDelimiterCount) <= 1)
                consistentLines++;
        }

        return consistentLines >= Math.Min(3, lines.Length - 1);
    }

    /// <summary>
    /// Determines if file data is likely a text file
    /// </summary>
    private static bool IsLikelyTextFile(byte[] fileData)
    {
        if (fileData == null || fileData.Length == 0)
            return false;

        // Check first 512 bytes for text characters
        var checkLength = Math.Min(512, fileData.Length);
        var textCharacters = 0;

        for (int i = 0; i < checkLength; i++)
        {
            var b = fileData[i];
            // Consider printable ASCII, common whitespace, and UTF-8 continuation bytes as text
            if ((b >= 32 && b <= 126) || b == '\t' || b == '\n' || b == '\r' || (b >= 128 && b <= 255))
            {
                textCharacters++;
            }
        }

        // If more than 70% of characters are text-like, consider it a text file
        return (double)textCharacters / checkLength > 0.7;
    }
}