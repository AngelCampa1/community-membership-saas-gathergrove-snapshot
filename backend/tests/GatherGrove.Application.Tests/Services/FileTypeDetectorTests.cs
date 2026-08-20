using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using System.Text;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class FileTypeDetectorTests
{
    private FileTypeDetector _detector = null!;
    private ILogger<FileTypeDetector> _logger = null!;

    [SetUp]
    public void SetUp()
    {
        _logger = NullLogger<FileTypeDetector>.Instance;
        _detector = new FileTypeDetector(_logger);
    }

    #region Constructor Tests

    [Test]
    public void Constructor_WithLogger_CreatesInstance()
    {
        // Act
        var detector = new FileTypeDetector(_logger);

        // Assert
        Assert.That(detector, Is.Not.Null);
    }

    [Test]
    public void Constructor_WithoutLogger_CreatesInstance()
    {
        // Act
        var detector = new FileTypeDetector();

        // Assert
        Assert.That(detector, Is.Not.Null);
    }

    #endregion

    #region DetectFileType Tests - PDF

    [Test]
    public void DetectFileType_ValidPdfSignature_ReturnsPdf()
    {
        // Arrange - PDF magic bytes: %PDF
        var pdfData = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34 }; // %PDF-1.4

        // Act
        var result = _detector.DetectFileType(pdfData);

        // Assert
        Assert.That(result, Is.EqualTo("PDF"));
    }

    [Test]
    public void DetectFileType_PdfWithContent_ReturnsPdf()
    {
        // Arrange - PDF header + some content
        var pdfData = Encoding.ASCII.GetBytes("%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj");

        // Act
        var result = _detector.DetectFileType(pdfData);

        // Assert
        Assert.That(result, Is.EqualTo("PDF"));
    }

    #endregion

    #region DetectFileType Tests - ZIP

    [Test]
    public void DetectFileType_ZipSignature_ReturnsZip()
    {
        // Arrange - ZIP magic bytes: PK
        var zipData = new byte[] { 0x50, 0x4B, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00 };

        // Act
        var result = _detector.DetectFileType(zipData);

        // Assert
        Assert.That(result, Is.EqualTo("ZIP"));
    }

    [Test]
    public void DetectFileType_ExcelXlsxSignature_ReturnsExcel()
    {
        // Arrange - XLSX file (ZIP with xl/ content)
        var xlsxData = Encoding.ASCII.GetBytes("PK\x03\x04xl/worksheets/sheet1.xml");

        // Act
        var result = _detector.DetectFileType(xlsxData);

        // Assert
        Assert.That(result, Is.EqualTo("Excel"));
    }

    [Test]
    public void DetectFileType_ExcelWithSharedStrings_ReturnsExcel()
    {
        // Arrange - XLSX file with sharedStrings marker
        var xlsxData = Encoding.ASCII.GetBytes("PK\x03\x04sharedStrings.xml content here");

        // Act
        var result = _detector.DetectFileType(xlsxData);

        // Assert
        Assert.That(result, Is.EqualTo("Excel"));
    }

    #endregion

    #region DetectFileType Tests - JSON

    [Test]
    public void DetectFileType_ValidJsonObject_ReturnsJson()
    {
        // Arrange
        var jsonData = Encoding.UTF8.GetBytes("{\"name\": \"test\", \"value\": 123}");

        // Act
        var result = _detector.DetectFileType(jsonData);

        // Assert
        Assert.That(result, Is.EqualTo("JSON"));
    }

    [Test]
    public void DetectFileType_ValidJsonArray_ReturnsJson()
    {
        // Arrange
        var jsonData = Encoding.UTF8.GetBytes("[{\"id\": 1}, {\"id\": 2}]");

        // Act
        var result = _detector.DetectFileType(jsonData);

        // Assert
        Assert.That(result, Is.EqualTo("JSON"));
    }

    [Test]
    public void DetectFileType_InvalidJsonStartingWithBrace_ReturnsText()
    {
        // Arrange - Starts with { but isn't valid JSON
        var invalidJson = Encoding.UTF8.GetBytes("{this is not valid json at all}");

        // Act
        var result = _detector.DetectFileType(invalidJson);

        // Assert
        Assert.That(result, Is.EqualTo("Text").Or.EqualTo("Unknown"));
    }

    [Test]
    public void DetectFileType_NestedJson_ReturnsJson()
    {
        // Arrange
        var jsonData = Encoding.UTF8.GetBytes("{\"data\": {\"items\": [{\"name\": \"test\"}]}}");

        // Act
        var result = _detector.DetectFileType(jsonData);

        // Assert
        Assert.That(result, Is.EqualTo("JSON"));
    }

    #endregion

    #region DetectFileType Tests - CSV

    [Test]
    public void DetectFileType_ValidCsvWithCommas_ReturnsCsv()
    {
        // Arrange - CSV with header and data rows
        var csvData = Encoding.UTF8.GetBytes("Name,Email,Age\nJohn,john@test.com,30\nJane,jane@test.com,25\nBob,bob@test.com,35");

        // Act
        var result = _detector.DetectFileType(csvData);

        // Assert
        Assert.That(result, Is.EqualTo("CSV"));
    }

    [Test]
    public void DetectFileType_ValidCsvWithSemicolons_ReturnsCsv()
    {
        // Arrange - CSV with semicolon delimiter (European format)
        var csvData = Encoding.UTF8.GetBytes("Name;Email;Age\nJohn;john@test.com;30\nJane;jane@test.com;25\nBob;bob@test.com;35");

        // Act
        var result = _detector.DetectFileType(csvData);

        // Assert
        Assert.That(result, Is.EqualTo("CSV"));
    }

    [Test]
    public void DetectFileType_CsvManyRows_ReturnsCsv()
    {
        // Arrange - CSV with many rows
        var sb = new StringBuilder();
        sb.AppendLine("Id,Name,Value");
        for (int i = 0; i < 20; i++)
        {
            sb.AppendLine($"{i},Item{i},{i * 10}");
        }
        var csvData = Encoding.UTF8.GetBytes(sb.ToString());

        // Act
        var result = _detector.DetectFileType(csvData);

        // Assert
        Assert.That(result, Is.EqualTo("CSV"));
    }

    #endregion

    #region DetectFileType Tests - Text

    [Test]
    public void DetectFileType_PlainText_ReturnsTextOrUnknown()
    {
        // Arrange
        var textData = Encoding.UTF8.GetBytes("This is just plain text without any specific format.");

        // Act
        var result = _detector.DetectFileType(textData);

        // Assert - plain text without structure might return Text or Unknown
        Assert.That(result, Is.EqualTo("Text").Or.EqualTo("Unknown"));
    }

    [Test]
    public void DetectFileType_TextWithNewlines_ReturnsText()
    {
        // Arrange
        var textData = Encoding.UTF8.GetBytes("Line 1\nLine 2\nLine 3\nLine 4\nLine 5");

        // Act
        var result = _detector.DetectFileType(textData);

        // Assert
        Assert.That(result, Is.EqualTo("Text").Or.EqualTo("Unknown"));
    }

    #endregion

    #region DetectFileType Tests - Edge Cases

    [Test]
    public void DetectFileType_NullData_ReturnsUnknown()
    {
        // Act
        var result = _detector.DetectFileType(null!);

        // Assert
        Assert.That(result, Is.EqualTo("Unknown"));
    }

    [Test]
    public void DetectFileType_EmptyData_ReturnsUnknown()
    {
        // Act
        var result = _detector.DetectFileType(Array.Empty<byte>());

        // Assert
        Assert.That(result, Is.EqualTo("Unknown"));
    }

    [Test]
    public void DetectFileType_VeryShortData_ReturnsUnknown()
    {
        // Arrange - less than 4 bytes
        var shortData = new byte[] { 0x00, 0x01 };

        // Act
        var result = _detector.DetectFileType(shortData);

        // Assert
        Assert.That(result, Is.EqualTo("Text").Or.EqualTo("Unknown"));
    }

    [Test]
    public void DetectFileType_BinaryData_ReturnsUnknown()
    {
        // Arrange - random binary data
        var binaryData = new byte[] { 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07 };

        // Act
        var result = _detector.DetectFileType(binaryData);

        // Assert
        Assert.That(result, Is.EqualTo("Unknown"));
    }

    #endregion

    #region IsValidFileType Tests

    [Test]
    public void IsValidFileType_PdfDataWithPdfExtension_ReturnsTrue()
    {
        // Arrange
        var pdfData = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34 };

        // Act
        var result = _detector.IsValidFileType(pdfData, ".pdf");

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void IsValidFileType_PdfDataWithPdfExtensionNoDot_ReturnsTrue()
    {
        // Arrange
        var pdfData = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34 };

        // Act
        var result = _detector.IsValidFileType(pdfData, "PDF");

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void IsValidFileType_PdfDataWithWrongExtension_ReturnsFalse()
    {
        // Arrange
        var pdfData = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34 };

        // Act
        var result = _detector.IsValidFileType(pdfData, ".csv");

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void IsValidFileType_CsvDataWithCsvExtension_ReturnsTrue()
    {
        // Arrange
        var csvData = Encoding.UTF8.GetBytes("Name,Email,Age\nJohn,john@test.com,30\nJane,jane@test.com,25\nBob,bob@test.com,35");

        // Act
        var result = _detector.IsValidFileType(csvData, ".csv");

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void IsValidFileType_CsvDataWithTxtExtension_ReturnsTrue()
    {
        // Arrange - CSV data should also be valid as TXT
        var csvData = Encoding.UTF8.GetBytes("Name,Email,Age\nJohn,john@test.com,30\nJane,jane@test.com,25\nBob,bob@test.com,35");

        // Act
        var result = _detector.IsValidFileType(csvData, ".txt");

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void IsValidFileType_JsonDataWithJsonExtension_ReturnsTrue()
    {
        // Arrange
        var jsonData = Encoding.UTF8.GetBytes("{\"name\": \"test\"}");

        // Act
        var result = _detector.IsValidFileType(jsonData, ".json");

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void IsValidFileType_ZipDataWithXlsxExtension_ReturnsTrue()
    {
        // Arrange - ZIP-based files (XLSX is a ZIP)
        var xlsxData = Encoding.ASCII.GetBytes("PK\x03\x04xl/worksheets/");

        // Act
        var result = _detector.IsValidFileType(xlsxData, ".xlsx");

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void IsValidFileType_DataWithUnknownExtension_ReturnsFalse()
    {
        // Arrange
        var pdfData = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34 };

        // Act
        var result = _detector.IsValidFileType(pdfData, ".xyz");

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void IsValidFileType_NullData_ReturnsFalse()
    {
        // Act
        var result = _detector.IsValidFileType(null!, ".pdf");

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void IsValidFileType_ExtensionCaseInsensitive()
    {
        // Arrange
        var pdfData = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34 };

        // Act & Assert
        Assert.That(_detector.IsValidFileType(pdfData, ".PDF"), Is.True);
        Assert.That(_detector.IsValidFileType(pdfData, ".pdf"), Is.True);
        Assert.That(_detector.IsValidFileType(pdfData, ".Pdf"), Is.True);
    }

    #endregion

    #region GetMimeType Tests

    [Test]
    public void GetMimeType_Pdf_ReturnsCorrectMimeType()
    {
        // Act
        var result = _detector.GetMimeType(".pdf");

        // Assert
        Assert.That(result, Is.EqualTo("application/pdf"));
    }

    [Test]
    public void GetMimeType_Csv_ReturnsCorrectMimeType()
    {
        // Act
        var result = _detector.GetMimeType(".csv");

        // Assert
        Assert.That(result, Is.EqualTo("text/csv"));
    }

    [Test]
    public void GetMimeType_Xlsx_ReturnsCorrectMimeType()
    {
        // Act
        var result = _detector.GetMimeType(".xlsx");

        // Assert
        Assert.That(result, Is.EqualTo("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    [Test]
    public void GetMimeType_Xls_ReturnsCorrectMimeType()
    {
        // Act
        var result = _detector.GetMimeType(".xls");

        // Assert
        Assert.That(result, Is.EqualTo("application/vnd.ms-excel"));
    }

    [Test]
    public void GetMimeType_Json_ReturnsCorrectMimeType()
    {
        // Act
        var result = _detector.GetMimeType(".json");

        // Assert
        Assert.That(result, Is.EqualTo("application/json"));
    }

    [Test]
    public void GetMimeType_Txt_ReturnsCorrectMimeType()
    {
        // Act
        var result = _detector.GetMimeType(".txt");

        // Assert
        Assert.That(result, Is.EqualTo("text/plain"));
    }

    [Test]
    public void GetMimeType_Zip_ReturnsCorrectMimeType()
    {
        // Act
        var result = _detector.GetMimeType(".zip");

        // Assert
        Assert.That(result, Is.EqualTo("application/zip"));
    }

    [Test]
    public void GetMimeType_UnknownExtension_ReturnsOctetStream()
    {
        // Act
        var result = _detector.GetMimeType(".xyz");

        // Assert
        Assert.That(result, Is.EqualTo("application/octet-stream"));
    }

    [Test]
    public void GetMimeType_WithoutDot_ReturnsCorrectMimeType()
    {
        // Act
        var result = _detector.GetMimeType("pdf");

        // Assert
        Assert.That(result, Is.EqualTo("application/pdf"));
    }

    [Test]
    public void GetMimeType_ExtensionCaseInsensitive()
    {
        // Act & Assert
        Assert.That(_detector.GetMimeType(".PDF"), Is.EqualTo("application/pdf"));
        Assert.That(_detector.GetMimeType(".Json"), Is.EqualTo("application/json"));
        Assert.That(_detector.GetMimeType(".CSV"), Is.EqualTo("text/csv"));
    }

    #endregion

    #region Interface Method Tests

    [Test]
    public void IFileTypeDetector_DetectFileType_ReturnsFileTypeResult()
    {
        // Arrange
        IFileTypeDetector detector = _detector;
        var pdfData = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34 };

        // Act
        var result = detector.DetectFileType(pdfData);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FileType, Is.EqualTo("PDF"));
        Assert.That(result.IsValid, Is.True);
    }

    [Test]
    public void IFileTypeDetector_DetectFileType_NullData_ReturnsInvalidResult()
    {
        // Arrange
        IFileTypeDetector detector = _detector;

        // Act
        var result = detector.DetectFileType(null!);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FileType, Is.EqualTo("Unknown"));
        Assert.That(result.IsValid, Is.False);
    }

    [Test]
    public void IFileTypeDetector_DetectFileType_JsonData_ReturnsValidResult()
    {
        // Arrange
        IFileTypeDetector detector = _detector;
        var jsonData = Encoding.UTF8.GetBytes("{\"test\": true}");

        // Act
        var result = detector.DetectFileType(jsonData);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FileType, Is.EqualTo("JSON"));
        Assert.That(result.IsValid, Is.True);
    }

    #endregion

    #region CSV Detection Edge Cases

    [Test]
    public void DetectFileType_SingleLineCsv_DoesNotDetectAsCsv()
    {
        // Arrange - CSV needs at least 2 lines to detect pattern
        var csvData = Encoding.UTF8.GetBytes("Name,Email,Age");

        // Act
        var result = _detector.DetectFileType(csvData);

        // Assert - single line won't be detected as CSV
        Assert.That(result, Is.EqualTo("Text").Or.EqualTo("Unknown"));
    }

    [Test]
    public void DetectFileType_CsvWithInconsistentDelimiters_StillDetects()
    {
        // Arrange - slight variance in delimiter count allowed
        var csvData = Encoding.UTF8.GetBytes("Name,Email,Age\nJohn,john@test.com,30\nJane,jane@test.com,25,extra\nBob,bob@test.com,35");

        // Act
        var result = _detector.DetectFileType(csvData);

        // Assert
        Assert.That(result, Is.EqualTo("CSV"));
    }

    [Test]
    public void DetectFileType_EmptyCsv_ReturnsUnknown()
    {
        // Arrange
        var csvData = Encoding.UTF8.GetBytes("");

        // Act
        var result = _detector.DetectFileType(csvData);

        // Assert
        Assert.That(result, Is.EqualTo("Unknown"));
    }

    #endregion

    #region Parameterless Constructor Tests

    [Test]
    public void ParameterlessConstructor_DetectsFileTypesCorrectly()
    {
        // Arrange
        var detector = new FileTypeDetector();
        var pdfData = new byte[] { 0x25, 0x50, 0x44, 0x46 };

        // Act
        var result = detector.DetectFileType(pdfData);

        // Assert
        Assert.That(result, Is.EqualTo("PDF"));
    }

    [Test]
    public void ParameterlessConstructor_ValidatesFileTypesCorrectly()
    {
        // Arrange
        var detector = new FileTypeDetector();
        var jsonData = Encoding.UTF8.GetBytes("{\"valid\": true}");

        // Act
        var result = detector.IsValidFileType(jsonData, ".json");

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void ParameterlessConstructor_GetsMimeTypeCorrectly()
    {
        // Arrange
        var detector = new FileTypeDetector();

        // Act
        var result = detector.GetMimeType(".pdf");

        // Assert
        Assert.That(result, Is.EqualTo("application/pdf"));
    }

    #endregion
}
