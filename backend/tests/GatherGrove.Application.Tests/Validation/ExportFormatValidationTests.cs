using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using GatherGrove.Domain.Enums;
using Moq;
using NUnit.Framework;
using System.Text;
using System.Text.Json;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Application.Validators;

namespace GatherGrove.Application.Tests.Validation;

/// <summary>
/// TDD Tests for Export Format Validation - US-005 Data Export & Reporting Engine
/// RED PHASE: Comprehensive failing tests for format validation and data integrity
/// Tests CSV, Excel, JSON, and PDF format validation with data integrity checks
/// Follows RED→GREEN→REFACTOR TDD cycle
/// </summary>
[TestFixture]
public class ExportFormatValidationTests
{
    private IExportFormatValidator _exportFormatValidator = null!;
    private Mock<ILogger<ExportFormatValidator>> _mockLogger = null!;
    private Mock<IConfiguration> _mockConfiguration = null!;
    private Mock<IFileTypeDetector> _mockFileTypeDetector = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<ExportFormatValidator>>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockFileTypeDetector = new Mock<IFileTypeDetector>();

        // This will fail until implementation exists - RED PHASE
        _exportFormatValidator = new ExportFormatValidator(
            _mockLogger.Object,
            _mockConfiguration.Object);
    }

    #region CSV Format Validation Tests (RED Phase)

    [Test]
    public void ValidateCsvFormat_ValidCsvData_ReturnsValidResult()
    {
        // Arrange
        var validCsvData = CreateValidCsvData();
        var csvBytes = Encoding.UTF8.GetBytes(validCsvData);

        // Act
        var result = _exportFormatValidator.ValidateCsvFormat(csvBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.RowCount, Is.EqualTo(3)); // Header + 2 data rows
        Assert.That(result.ColumnCount, Is.EqualTo(5));
        Assert.That(result.HasHeader, Is.True);
        Assert.That(result.Encoding, Is.EqualTo("UTF-8"));
        Assert.That(result.Delimiter, Is.EqualTo(","));
    }

    [Test]
    public void ValidateCsvFormat_ValidCsvDataWithCustomDelimiter_ReturnsValidResult()
    {
        // Arrange
        var validCsvData = CreateValidCsvDataWithSemicolonDelimiter();
        var csvBytes = Encoding.UTF8.GetBytes(validCsvData);

        // Act
        var result = _exportFormatValidator.ValidateCsvFormat(csvBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.Delimiter, Is.EqualTo(";"));
        Assert.That(result.ColumnCount, Is.EqualTo(4));
    }

    [Test]
    public void ValidateCsvFormat_MalformedCsvData_ReturnsInvalidResult()
    {
        // Arrange
        var malformedCsvData = CreateMalformedCsvData();
        var csvBytes = Encoding.UTF8.GetBytes(malformedCsvData);

        // Act
        var result = _exportFormatValidator.ValidateCsvFormat(csvBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationErrors.Count, Is.GreaterThan(0));
        Assert.That(result.ValidationErrors.Any(e => e.Contains("Inconsistent column count")), Is.True);
        Assert.That(result.ValidationErrors.Any(e => e.Contains("Unescaped quotes")), Is.True);
    }

    [Test]
    public void ValidateCsvFormat_EmptyCsvData_ReturnsInvalidResult()
    {
        // Arrange
        var emptyCsvData = "";
        var csvBytes = Encoding.UTF8.GetBytes(emptyCsvData);

        // Act
        var result = _exportFormatValidator.ValidateCsvFormat(csvBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationErrors.Any(e => e.Contains("Empty CSV data")), Is.True);
    }

    [Test]
    public void ValidateCsvFormat_CsvWithSpecialCharacters_HandlesCorrectly()
    {
        // Arrange
        var csvWithSpecialChars = CreateCsvWithSpecialCharacters();
        var csvBytes = Encoding.UTF8.GetBytes(csvWithSpecialChars);

        // Act
        var result = _exportFormatValidator.ValidateCsvFormat(csvBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.ContainsSpecialCharacters, Is.True);
        Assert.That(result.EncodingConfidence, Is.GreaterThan(0.9));
    }

    #endregion

    #region Excel Format Validation Tests (RED Phase)

    [Test]
    public void ValidateExcelFormat_ValidExcelFile_ReturnsValidResult()
    {
        // Arrange
        var validExcelBytes = CreateMockValidExcelBytes();

        _mockFileTypeDetector.Setup(x => x.DetectFileType(validExcelBytes))
            .Returns(new FileTypeResult
            {
                FileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                IsValid = true,
                Confidence = 1.0
            });

        // Act
        var result = _exportFormatValidator.ValidateExcelFormat(validExcelBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.WorksheetCount, Is.GreaterThan(0));
        Assert.That(result.HasData, Is.True);
        Assert.That(result.FileFormat, Is.EqualTo("XLSX"));
        Assert.That(result.TotalCells, Is.GreaterThan(0));
    }

    [Test]
    public void ValidateExcelFormat_CorruptedExcelFile_ReturnsInvalidResult()
    {
        // Arrange
        var corruptedExcelBytes = CreateMockCorruptedExcelBytes();

        _mockFileTypeDetector.Setup(x => x.DetectFileType(corruptedExcelBytes))
            .Returns(new FileTypeResult
            {
                FileType = "application/octet-stream",
                IsValid = false,
                Confidence = 0.3
            });

        // Act
        var result = _exportFormatValidator.ValidateExcelFormat(corruptedExcelBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationErrors.Any(e => e.Contains("Corrupted or invalid Excel file")), Is.True);
    }

    [Test]
    public void ValidateExcelFormat_ExcelWithMultipleWorksheets_ValidatesAllSheets()
    {
        // Arrange
        var multiWorksheetExcelBytes = CreateMockMultiWorksheetExcelBytes();

        _mockFileTypeDetector.Setup(x => x.DetectFileType(multiWorksheetExcelBytes))
            .Returns(new FileTypeResult
            {
                FileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                IsValid = true,
                Confidence = 1.0
            });

        // Act
        var result = _exportFormatValidator.ValidateExcelFormat(multiWorksheetExcelBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.WorksheetCount, Is.EqualTo(3));
        Assert.That(result.WorksheetNames.Count, Is.EqualTo(3));
        Assert.That(result.WorksheetNames, Does.Contain("Members"));
        Assert.That(result.WorksheetNames, Does.Contain("Events"));
        Assert.That(result.WorksheetNames, Does.Contain("Summary"));
    }

    [Test]
    public void ValidateExcelFormat_ExcelWithFormulas_ValidatesFormulas()
    {
        // Arrange
        var excelWithFormulasBytes = CreateMockExcelWithFormulasBytes();

        _mockFileTypeDetector.Setup(x => x.DetectFileType(excelWithFormulasBytes))
            .Returns(new FileTypeResult
            {
                FileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                IsValid = true,
                Confidence = 1.0
            });

        // Act
        var result = _exportFormatValidator.ValidateExcelFormat(excelWithFormulasBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.ContainsFormulas, Is.True);
        Assert.That(result.FormulaCount, Is.GreaterThan(0));
        Assert.That(result.HasCircularReferences, Is.False);
    }

    #endregion

    #region JSON Format Validation Tests (RED Phase)

    [Test]
    public async Task ValidateJsonFormat_ValidJsonData_ReturnsValidResult()
    {
        // Arrange
        var validJsonData = CreateValidJsonData();
        var jsonBytes = Encoding.UTF8.GetBytes(validJsonData);

        // Act
        var result = await _exportFormatValidator.ValidateJsonFormat(jsonBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.IsWellFormed, Is.True);
        Assert.That(result.ObjectCount, Is.GreaterThan(0));
        Assert.That(result.ArrayCount, Is.GreaterThan(0));
        Assert.That(result.MaxDepth, Is.LessThanOrEqualTo(10));
        Assert.That(result.Encoding, Is.EqualTo("UTF-8"));
    }

    [Test]
    public async Task ValidateJsonFormat_InvalidJsonSyntax_ReturnsInvalidResult()
    {
        // Arrange
        var invalidJsonData = CreateInvalidJsonData();
        var jsonBytes = Encoding.UTF8.GetBytes(invalidJsonData);

        // Act
        var result = await _exportFormatValidator.ValidateJsonFormat(jsonBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.SyntaxErrors.Count, Is.GreaterThan(0));
        Assert.That(result.SyntaxErrors.Any(e => e.Contains("Unexpected character")), Is.True);
        Assert.That(result.ErrorLocation.LineNumber, Is.GreaterThan(0));
        Assert.That(result.ErrorLocation.ColumnNumber, Is.GreaterThan(0));
    }

    [Test]
    public async Task ValidateJsonFormat_JsonWithMissingRequiredFields_ReturnsValidationErrors()
    {
        // Arrange
        var jsonWithMissingFields = CreateJsonWithMissingRequiredFields();
        var jsonBytes = Encoding.UTF8.GetBytes(jsonWithMissingFields);

        var requiredFields = new List<string> { "clubId", "exportType", "timestamp", "data" };

        // Act
        var result = await _exportFormatValidator.ValidateJsonFormat(jsonBytes, requiredFields);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationErrors.Any(e => e.Contains("Missing required field: timestamp")), Is.True);
        Assert.That(result.MissingFields.Contains("timestamp"), Is.True);
    }

    [Test]
    public async Task ValidateJsonFormat_LargeJsonData_ValidatesEfficiently()
    {
        // Arrange
        var largeJsonData = CreateLargeJsonData(10000); // 10k records
        var jsonBytes = Encoding.UTF8.GetBytes(largeJsonData);

        var startTime = DateTime.UtcNow;

        // Act
        var result = await _exportFormatValidator.ValidateJsonFormat(jsonBytes);

        // Assert
        var endTime = DateTime.UtcNow;
        var processingTime = endTime - startTime;

        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(processingTime.TotalSeconds, Is.LessThan(5)); // Should complete within 5 seconds
        Assert.That(result.FileSizeBytes, Is.GreaterThan(100000)); // Large file
        Assert.That(result.ObjectCount, Is.EqualTo(10000));
    }

    [Test]
    public async Task ValidateJsonFormat_JsonWithUnicodeCharacters_HandlesCorrectly()
    {
        // Arrange
        var jsonWithUnicode = CreateJsonWithUnicodeCharacters();
        var jsonBytes = Encoding.UTF8.GetBytes(jsonWithUnicode);

        // Act
        var result = await _exportFormatValidator.ValidateJsonFormat(jsonBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.ContainsUnicodeCharacters, Is.True);
        Assert.That(result.Encoding, Is.EqualTo("UTF-8"));
    }

    #endregion

    #region PDF Format Validation Tests (RED Phase)

    [Test]
    public async Task ValidatePdfFormat_ValidPdfFile_ReturnsValidResult()
    {
        // Arrange
        var validPdfBytes = CreateMockValidPdfBytes();

        _mockFileTypeDetector.Setup(x => x.DetectFileType(validPdfBytes))
            .Returns(new FileTypeResult
            {
                FileType = "application/pdf",
                IsValid = true,
                Confidence = 1.0
            });

        // Act
        var result = await _exportFormatValidator.ValidatePdfFormat(validPdfBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.PdfVersion, Does.StartWith("1."));
        Assert.That(result.PageCount, Is.GreaterThan(0));
        Assert.That(result.HasText, Is.True);
        Assert.That(result.IsEncrypted, Is.False);
        Assert.That(result.FileSizeBytes, Is.GreaterThan(0));
    }

    [Test]
    public async Task ValidatePdfFormat_CorruptedPdfFile_ReturnsInvalidResult()
    {
        // Arrange
        var corruptedPdfBytes = CreateMockCorruptedPdfBytes();

        _mockFileTypeDetector.Setup(x => x.DetectFileType(corruptedPdfBytes))
            .Returns(new FileTypeResult
            {
                FileType = "application/octet-stream",
                IsValid = false,
                Confidence = 0.2
            });

        // Act
        var result = await _exportFormatValidator.ValidatePdfFormat(corruptedPdfBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ValidationErrors.Any(e => e.Contains("Invalid or corrupted PDF file")), Is.True);
    }

    [Test]
    public async Task ValidatePdfFormat_EncryptedPdf_DetectsEncryption()
    {
        // Arrange
        var encryptedPdfBytes = CreateMockEncryptedPdfBytes();

        _mockFileTypeDetector.Setup(x => x.DetectFileType(encryptedPdfBytes))
            .Returns(new FileTypeResult
            {
                FileType = "application/pdf",
                IsValid = true,
                Confidence = 1.0
            });

        // Act
        var result = await _exportFormatValidator.ValidatePdfFormat(encryptedPdfBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.IsEncrypted, Is.True);
        Assert.That(result.RequiresPassword, Is.True);
        Assert.That(result.SecurityLevel, Is.Not.Empty);
    }

    [Test]
    public async Task ValidatePdfFormat_PdfWithImages_ValidatesImageContent()
    {
        // Arrange
        var pdfWithImagesBytes = CreateMockPdfWithImagesBytes();

        _mockFileTypeDetector.Setup(x => x.DetectFileType(pdfWithImagesBytes))
            .Returns(new FileTypeResult
            {
                FileType = "application/pdf",
                IsValid = true,
                Confidence = 1.0
            });

        // Act
        var result = await _exportFormatValidator.ValidatePdfFormat(pdfWithImagesBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.HasImages, Is.True);
        Assert.That(result.ImageCount, Is.GreaterThan(0));
        Assert.That(result.HasText, Is.True);
    }

    #endregion

    #region Data Integrity Tests (RED Phase)

    [Test]
    public async Task ValidateDataIntegrity_ConsistentData_ReturnsValidResult()
    {
        // Arrange
        var csvData = CreateValidCsvData();
        var jsonData = CreateValidJsonData();
        var csvBytes = Encoding.UTF8.GetBytes(csvData);
        var jsonBytes = Encoding.UTF8.GetBytes(jsonData);

        // Act
        var result = await _exportFormatValidator.ValidateDataIntegrity(csvBytes, jsonBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsConsistent, Is.True);
        Assert.That(result.RecordCountMatch, Is.True);
        Assert.That(result.FieldCountMatch, Is.True);
        Assert.That(result.DataTypeConsistency, Is.GreaterThan(0.95)); // 95% consistency threshold
    }

    [Test]
    public async Task ValidateDataIntegrity_InconsistentRecordCounts_ReturnsInconsistencyErrors()
    {
        // Arrange
        var csvData = CreateValidCsvData(); // 2 data rows
        var jsonData = CreateJsonDataWithDifferentRecordCount(); // 3 data rows
        var csvBytes = Encoding.UTF8.GetBytes(csvData);
        var jsonBytes = Encoding.UTF8.GetBytes(jsonData);

        // Act
        var result = await _exportFormatValidator.ValidateDataIntegrity(csvBytes, jsonBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsConsistent, Is.False);
        Assert.That(result.RecordCountMatch, Is.False);
        Assert.That(result.IntegrityErrors.Any(e => e.Contains("Record count mismatch")), Is.True);
        Assert.That(result.CsvRecordCount, Is.Not.EqualTo(result.JsonRecordCount));
    }

    [Test]
    public async Task ValidateDataIntegrity_InconsistentFieldTypes_ReturnsTypeErrors()
    {
        // Arrange
        var csvData = CreateCsvWithInconsistentTypes();
        var jsonData = CreateJsonWithConsistentTypes();
        var csvBytes = Encoding.UTF8.GetBytes(csvData);
        var jsonBytes = Encoding.UTF8.GetBytes(jsonData);

        // Act
        var result = await _exportFormatValidator.ValidateDataIntegrity(csvBytes, jsonBytes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsConsistent, Is.False);
        Assert.That(result.DataTypeConsistency, Is.LessThan(0.8)); // Below threshold
        Assert.That(result.IntegrityErrors.Any(e => e.Contains("Data type inconsistency")), Is.True);
    }

    #endregion

    #region Performance Validation Tests (RED Phase)

    [Test]
    public async Task ValidateExportPerformance_LargeDataset_MeetsPerformanceRequirements()
    {
        // Arrange
        var largeDataset = CreateLargeDatasetBytes(50000); // 50k records
        var performanceCriteria = new ExportPerformanceCriteria
        {
            MaxProcessingTimeSeconds = 30,
            MaxMemoryUsageMB = 200,
            MinThroughputRecordsPerSecond = 1000
        };

        var startTime = DateTime.UtcNow;
        var initialMemory = GC.GetTotalMemory(true);

        // Act
        var result = await _exportFormatValidator.ValidateExportPerformance(largeDataset, performanceCriteria);

        // Assert
        var endTime = DateTime.UtcNow;
        var finalMemory = GC.GetTotalMemory(true);
        var processingTime = (endTime - startTime).TotalSeconds;
        var memoryUsed = (finalMemory - initialMemory) / (1024 * 1024); // MB

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.MeetsPerformanceRequirements, Is.True);
        Assert.That(result.ProcessingTimeSeconds, Is.LessThanOrEqualTo(performanceCriteria.MaxProcessingTimeSeconds));
        Assert.That(result.MemoryUsageMB, Is.LessThanOrEqualTo(performanceCriteria.MaxMemoryUsageMB));
        Assert.That(result.ThroughputRecordsPerSecond, Is.GreaterThanOrEqualTo(performanceCriteria.MinThroughputRecordsPerSecond));
    }

    #endregion

    #region Helper Methods

    private string CreateValidCsvData()
    {
        return @"MemberId,FirstName,LastName,Email,JoinDate
1,John,Doe,john.doe@test.com,2024-01-15
2,Jane,Smith,jane.smith@test.com,2024-02-20";
    }

    private string CreateValidCsvDataWithSemicolonDelimiter()
    {
        return @"MemberId;FirstName;LastName;Email
1;John;Doe;john.doe@test.com
2;Jane;Smith;jane.smith@test.com";
    }

    private string CreateMalformedCsvData()
    {
        return @"MemberId,FirstName,LastName,Email
1,John,Doe,john.doe@test.com,ExtraColumn
2,Jane,""Unclosed quotes,jane.smith@test.com
3,Bob"; // Incomplete row
    }

    private string CreateCsvWithSpecialCharacters()
    {
        return @"MemberId,FirstName,LastName,Description
1,José,García,""Member with special chars: àáâãäåæçèéêë""
2,François,Müller,""Description with newline:
Second line here""";
    }

    private string CreateValidJsonData()
    {
        return @"{
  ""clubId"": 1,
  ""exportType"": ""members"",
  ""timestamp"": ""2024-01-15T10:00:00Z"",
  ""data"": [
    {
      ""memberId"": 1,
      ""firstName"": ""John"",
      ""lastName"": ""Doe"",
      ""email"": ""john.doe@test.com""
    },
    {
      ""memberId"": 2,
      ""firstName"": ""Jane"",
      ""lastName"": ""Smith"",
      ""email"": ""jane.smith@test.com""
    }
  ]
}";
    }

    private string CreateInvalidJsonData()
    {
        return @"{
  ""clubId"": 1,
  ""exportType"": ""members"",
  ""timestamp"": ""2024-01-15T10:00:00Z"",
  ""data"": [
    {
      ""memberId"": 1,
      ""firstName"": ""John"",
      ""lastName"": ""Doe"",, // Extra comma
      ""email"": ""john.doe@test.com""
    }
  } // Missing closing bracket
";
    }

    private string CreateJsonWithMissingRequiredFields()
    {
        return @"{
  ""clubId"": 1,
  ""exportType"": ""members"",
  ""data"": [
    {
      ""memberId"": 1,
      ""firstName"": ""John""
    }
  ]
}"; // Missing timestamp field
    }

    private string CreateLargeJsonData(int recordCount)
    {
        var sb = new StringBuilder();
        sb.AppendLine(@"{
  ""clubId"": 1,
  ""exportType"": ""members"",
  ""timestamp"": ""2024-01-15T10:00:00Z"",
  ""data"": [");

        for (int i = 1; i <= recordCount; i++)
        {
            sb.AppendLine($@"    {{
      ""memberId"": {i},
      ""firstName"": ""Member{i}"",
      ""lastName"": ""User{i}"",
      ""email"": ""member{i}@test.com""
    }}{(i < recordCount ? "," : "")}");
        }

        sb.AppendLine(@"  ]
}");
        return sb.ToString();
    }

    private string CreateJsonWithUnicodeCharacters()
    {
        return @"{
  ""clubId"": 1,
  ""exportType"": ""members"",
  ""timestamp"": ""2024-01-15T10:00:00Z"",
  ""data"": [
    {
      ""memberId"": 1,
      ""firstName"": ""José"",
      ""lastName"": ""García"",
      ""description"": ""Unicode test: 你好世界 🌍 café naïve résumé""
    }
  ]
}";
    }

    private string CreateJsonDataWithDifferentRecordCount()
    {
        return @"{
  ""clubId"": 1,
  ""exportType"": ""members"",
  ""timestamp"": ""2024-01-15T10:00:00Z"",
  ""data"": [
    {""memberId"": 1, ""firstName"": ""John""},
    {""memberId"": 2, ""firstName"": ""Jane""},
    {""memberId"": 3, ""firstName"": ""Bob""}
  ]
}";
    }

    private string CreateCsvWithInconsistentTypes()
    {
        return @"MemberId,FirstName,LastName,Age
1,John,Doe,30
2,Jane,Smith,""NotANumber""
3,Bob,Johnson,25";
    }

    private string CreateJsonWithConsistentTypes()
    {
        return @"{
  ""data"": [
    {""memberId"": 1, ""firstName"": ""John"", ""age"": 30},
    {""memberId"": 2, ""firstName"": ""Jane"", ""age"": 25},
    {""memberId"": 3, ""firstName"": ""Bob"", ""age"": 35}
  ]
}";
    }

    // Mock binary file creation methods
    private byte[] CreateMockValidExcelBytes()
    {
        // In real implementation, this would create actual Excel binary data
        var mockExcelHeader = new byte[] { 0x50, 0x4B, 0x03, 0x04 }; // ZIP signature (XLSX is ZIP)
        var mockContent = Encoding.UTF8.GetBytes("Mock Excel Content");
        return mockExcelHeader.Concat(mockContent).ToArray();
    }

    private byte[] CreateMockCorruptedExcelBytes()
    {
        return new byte[] { 0x00, 0x01, 0x02, 0x03 }; // Invalid bytes
    }

    private byte[] CreateMockMultiWorksheetExcelBytes()
    {
        var mockData = Encoding.UTF8.GetBytes("Mock Multi-Worksheet Excel Data");
        return new byte[] { 0x50, 0x4B, 0x03, 0x04 }.Concat(mockData).ToArray();
    }

    private byte[] CreateMockExcelWithFormulasBytes()
    {
        var mockData = Encoding.UTF8.GetBytes("Mock Excel with Formulas");
        return new byte[] { 0x50, 0x4B, 0x03, 0x04 }.Concat(mockData).ToArray();
    }

    private byte[] CreateMockValidPdfBytes()
    {
        var pdfHeader = Encoding.UTF8.GetBytes("%PDF-1.4\n");
        var mockContent = Encoding.UTF8.GetBytes("Mock PDF Content");
        return pdfHeader.Concat(mockContent).ToArray();
    }

    private byte[] CreateMockCorruptedPdfBytes()
    {
        return new byte[] { 0xFF, 0xFE, 0xFD, 0xFC }; // Invalid PDF bytes
    }

    private byte[] CreateMockEncryptedPdfBytes()
    {
        var pdfHeader = Encoding.UTF8.GetBytes("%PDF-1.4\n");
        var encryptedFlag = Encoding.UTF8.GetBytes("/Encrypt");
        return pdfHeader.Concat(encryptedFlag).ToArray();
    }

    private byte[] CreateMockPdfWithImagesBytes()
    {
        var pdfHeader = Encoding.UTF8.GetBytes("%PDF-1.4\n");
        var imageData = Encoding.UTF8.GetBytes("/Image /XObject");
        return pdfHeader.Concat(imageData).ToArray();
    }

    private byte[] CreateLargeDatasetBytes(int recordCount)
    {
        var largeData = CreateLargeJsonData(recordCount);
        return Encoding.UTF8.GetBytes(largeData);
    }

    #endregion
}