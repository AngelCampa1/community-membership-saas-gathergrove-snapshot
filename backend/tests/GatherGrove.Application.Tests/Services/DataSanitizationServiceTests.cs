using GatherGrove.Application.Security;
using GatherGrove.Application.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using System.Text;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class DataSanitizationServiceTests
{
    private ILogger<DataSanitizationService> _logger = null!;
    private DataSanitizationService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _logger = NullLogger<DataSanitizationService>.Instance;
        _service = new DataSanitizationService(_logger);
    }

    #region ContainsSensitiveData Tests

    [Test]
    public void ContainsSensitiveData_WithSSN_ReturnsTrue()
    {
        // Arrange
        var content = "User's SSN is 123-45-6789";

        // Act
        var result = _service.ContainsSensitiveData(content);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void ContainsSensitiveData_WithCreditCard_ReturnsTrue()
    {
        // Arrange
        var content = "Card number: 4111-1111-1111-1111";

        // Act
        var result = _service.ContainsSensitiveData(content);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void ContainsSensitiveData_WithPhoneNumber_ReturnsTrue()
    {
        // Arrange
        var content = "Call me at 555-123-4567";

        // Act
        var result = _service.ContainsSensitiveData(content);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void ContainsSensitiveData_WithEmail_ReturnsTrue()
    {
        // Arrange
        var content = "Email: john.doe@example.com";

        // Act
        var result = _service.ContainsSensitiveData(content);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void ContainsSensitiveData_WithPassword_ReturnsTrue()
    {
        // Arrange
        var content = "password:secret123";

        // Act
        var result = _service.ContainsSensitiveData(content);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void ContainsSensitiveData_WithApiKey_ReturnsTrue()
    {
        // Arrange
        var content = "api_key: sk_test_abcd1234";

        // Act
        var result = _service.ContainsSensitiveData(content);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void ContainsSensitiveData_WithSecret_ReturnsTrue()
    {
        // Arrange
        var content = "secret = mySecretValue123";

        // Act
        var result = _service.ContainsSensitiveData(content);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void ContainsSensitiveData_WithBankAccount_ReturnsTrue()
    {
        // Arrange
        var content = "Account number: 12345678901";

        // Act
        var result = _service.ContainsSensitiveData(content);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void ContainsSensitiveData_WithSafeContent_ReturnsFalse()
    {
        // Arrange
        var content = "This is a normal message about our event";

        // Act
        var result = _service.ContainsSensitiveData(content);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void ContainsSensitiveData_WithEmptyString_ReturnsFalse()
    {
        // Act
        var result = _service.ContainsSensitiveData("");

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void ContainsSensitiveData_WithNull_ReturnsFalse()
    {
        // Act
        var result = _service.ContainsSensitiveData(null!);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void ContainsSensitiveData_WithWhitespace_ReturnsFalse()
    {
        // Act
        var result = _service.ContainsSensitiveData("   ");

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region RemovePiiData Tests

    [Test]
    public void RemovePiiData_RedactsSSN()
    {
        // Arrange
        var content = "User's SSN is 123-45-6789";

        // Act
        var result = _service.RemovePiiData(content);

        // Assert
        Assert.That(result, Does.Contain("[SSN_REDACTED]"));
        Assert.That(result, Does.Not.Contain("123-45-6789"));
    }

    [Test]
    public void RemovePiiData_RedactsCreditCard()
    {
        // Arrange
        var content = "Card: 4111-1111-1111-1111";

        // Act
        var result = _service.RemovePiiData(content);

        // Assert
        Assert.That(result, Does.Contain("[CARD_REDACTED]"));
        Assert.That(result, Does.Not.Contain("4111"));
    }

    [Test]
    public void RemovePiiData_RedactsPhoneNumber()
    {
        // Arrange
        var content = "Phone: 555-123-4567";

        // Act
        var result = _service.RemovePiiData(content);

        // Assert
        Assert.That(result, Does.Contain("[PHONE_REDACTED]"));
        Assert.That(result, Does.Not.Contain("555-123-4567"));
    }

    [Test]
    public void RemovePiiData_RedactsEmail()
    {
        // Arrange
        var content = "Contact: john@example.com";

        // Act
        var result = _service.RemovePiiData(content);

        // Assert
        Assert.That(result, Does.Contain("[EMAIL_REDACTED]"));
        Assert.That(result, Does.Not.Contain("john@example.com"));
    }

    [Test]
    public void RemovePiiData_RedactsBankAccount()
    {
        // Arrange
        var content = "Account: 12345678901";

        // Act
        var result = _service.RemovePiiData(content);

        // Assert
        Assert.That(result, Does.Contain("[ACCOUNT_REDACTED]"));
        Assert.That(result, Does.Not.Contain("12345678901"));
    }

    [Test]
    public void RemovePiiData_PreservesNonSensitiveContent()
    {
        // Arrange
        var content = "Normal text with SSN 123-45-6789 and more normal text";

        // Act
        var result = _service.RemovePiiData(content);

        // Assert
        Assert.That(result, Does.Contain("Normal text with"));
        Assert.That(result, Does.Contain("and more normal text"));
    }

    [Test]
    public void RemovePiiData_EmptyString_ReturnsEmpty()
    {
        // Act
        var result = _service.RemovePiiData("");

        // Assert
        Assert.That(result, Is.EqualTo(""));
    }

    [Test]
    public void RemovePiiData_NullInput_ReturnsNull()
    {
        // Act
        var result = _service.RemovePiiData(null!);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public void RemovePiiData_MultiplePiiItems_RedactsAll()
    {
        // Arrange
        var content = "SSN: 123-45-6789, Phone: 555-123-4567, Email: test@test.com";

        // Act
        var result = _service.RemovePiiData(content);

        // Assert
        Assert.That(result, Does.Contain("[SSN_REDACTED]"));
        Assert.That(result, Does.Contain("[PHONE_REDACTED]"));
        Assert.That(result, Does.Contain("[EMAIL_REDACTED]"));
    }

    #endregion

    #region SanitizeAsync Tests

    [Test]
    public async Task SanitizeAsync_StringWithSSN_Redacts()
    {
        // Arrange
        var data = "SSN: 123-45-6789";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[SSN_REDACTED]"));
    }

    [Test]
    public async Task SanitizeAsync_StringWithCreditCard_Redacts()
    {
        // Arrange
        var data = "Card: 4111-1111-1111-1111";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[CARD_REDACTED]"));
    }

    [Test]
    public async Task SanitizeAsync_StringWithPhone_Redacts()
    {
        // Arrange
        var data = "Phone: 555-123-4567";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[PHONE_REDACTED]"));
    }

    [Test]
    public async Task SanitizeAsync_WithCustomRules_RespectsRules()
    {
        // Arrange
        var data = "SSN: 123-45-6789, Email: test@test.com";
        var rules = new DataSanitizationRules
        {
            RedactSSN = true,
            RedactPersonalInfo = false // Don't redact email
        };

        // Act
        var result = await _service.SanitizeAsync(data, rules);

        // Assert
        Assert.That(result, Does.Contain("[SSN_REDACTED]"));
        Assert.That(result, Does.Contain("test@test.com"));
    }

    [Test]
    public async Task SanitizeAsync_NullData_ReturnsNull()
    {
        // Act
        var result = await _service.SanitizeAsync<string>(null!);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task SanitizeAsync_SqlInjection_BlocksAttack()
    {
        // Arrange
        var data = "'; DROP TABLE Users --";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[SQL_BLOCKED]"));
    }

    [Test]
    public async Task SanitizeAsync_XssScript_BlocksAttack()
    {
        // Arrange
        var data = "<script>alert('xss')</script>";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[XSS_BLOCKED]"));
    }

    [Test]
    public async Task SanitizeAsync_JavaScriptUrl_BlocksAttack()
    {
        // Arrange
        var data = "javascript:alert('xss')";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[XSS_BLOCKED]"));
    }

    [Test]
    public async Task SanitizeAsync_OnClickEvent_BlocksAttack()
    {
        // Arrange
        var data = "<button onclick=alert('xss')>Click</button>";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[XSS_BLOCKED]"));
    }

    [Test]
    public async Task SanitizeAsync_WithFinancialData_RedactsAmounts()
    {
        // Arrange
        var data = "Total: $1,234.56";
        var rules = new DataSanitizationRules
        {
            RedactFinancialData = true
        };

        // Act
        var result = await _service.SanitizeAsync(data, rules);

        // Assert
        Assert.That(result, Does.Contain("[AMOUNT_REDACTED]"));
    }

    [Test]
    public async Task SanitizeAsync_WithAddress_RedactsStreet()
    {
        // Arrange
        var data = "Address: 123 Main Street";
        var rules = new DataSanitizationRules
        {
            RedactContactInfo = true
        };

        // Act
        var result = await _service.SanitizeAsync(data, rules);

        // Assert
        Assert.That(result, Does.Contain("[ADDRESS_REDACTED]"));
    }

    [Test]
    public async Task SanitizeAsync_PhoneStandardFormat_Redacts()
    {
        // Arrange - The service specifically handles XXX-XXX-XXXX format
        var data = "Phone: 555-123-4567";
        var rules = new DataSanitizationRules
        {
            RedactPhoneNumbers = true
        };

        // Act
        var result = await _service.SanitizeAsync(data, rules);

        // Assert
        Assert.That(result, Does.Contain("[PHONE_REDACTED]"));
    }

    #endregion

    #region SanitizeFileAsync Tests

    [Test]
    public async Task SanitizeFileAsync_TextFile_SanitizesContent()
    {
        // Arrange
        var content = "SSN: 123-45-6789";
        var fileData = Encoding.UTF8.GetBytes(content);

        // Act
        var result = await _service.SanitizeFileAsync(fileData, ".txt");

        // Assert
        var sanitized = Encoding.UTF8.GetString(result);
        Assert.That(sanitized, Does.Contain("[SSN_REDACTED]"));
    }

    [Test]
    public async Task SanitizeFileAsync_CsvFile_SanitizesContent()
    {
        // Arrange
        var content = "Name,SSN\nJohn,123-45-6789";
        var fileData = Encoding.UTF8.GetBytes(content);

        // Act
        var result = await _service.SanitizeFileAsync(fileData, ".csv");

        // Assert
        var sanitized = Encoding.UTF8.GetString(result);
        Assert.That(sanitized, Does.Contain("[SSN_REDACTED]"));
    }

    [Test]
    public async Task SanitizeFileAsync_JsonFile_SanitizesContent()
    {
        // Arrange
        var content = "{\"ssn\": \"123-45-6789\"}";
        var fileData = Encoding.UTF8.GetBytes(content);

        // Act
        var result = await _service.SanitizeFileAsync(fileData, ".json");

        // Assert
        var sanitized = Encoding.UTF8.GetString(result);
        Assert.That(sanitized, Does.Contain("[SSN_REDACTED]"));
    }

    [Test]
    public async Task SanitizeFileAsync_XmlFile_SanitizesContent()
    {
        // Arrange
        var content = "<user><ssn>123-45-6789</ssn></user>";
        var fileData = Encoding.UTF8.GetBytes(content);

        // Act
        var result = await _service.SanitizeFileAsync(fileData, ".xml");

        // Assert
        var sanitized = Encoding.UTF8.GetString(result);
        Assert.That(sanitized, Does.Contain("[SSN_REDACTED]"));
    }

    [Test]
    public async Task SanitizeFileAsync_HtmlFile_SanitizesContent()
    {
        // Arrange
        var content = "<p>Phone: 555-123-4567</p>";
        var fileData = Encoding.UTF8.GetBytes(content);

        // Act
        var result = await _service.SanitizeFileAsync(fileData, ".html");

        // Assert
        var sanitized = Encoding.UTF8.GetString(result);
        Assert.That(sanitized, Does.Contain("[PHONE_REDACTED]"));
    }

    [Test]
    public async Task SanitizeFileAsync_BinaryFile_ReturnsOriginal()
    {
        // Arrange
        var fileData = new byte[] { 0x89, 0x50, 0x4E, 0x47 }; // PNG header

        // Act
        var result = await _service.SanitizeFileAsync(fileData, ".png");

        // Assert
        Assert.That(result, Is.EqualTo(fileData));
    }

    [Test]
    public async Task SanitizeFileAsync_EmptyFile_ReturnsEmpty()
    {
        // Act
        var result = await _service.SanitizeFileAsync(Array.Empty<byte>(), ".txt");

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task SanitizeFileAsync_NullFile_ReturnsEmpty()
    {
        // Act
        var result = await _service.SanitizeFileAsync(null!, ".txt");

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task SanitizeFileAsync_CaseInsensitiveExtension_Works()
    {
        // Arrange
        var content = "SSN: 123-45-6789";
        var fileData = Encoding.UTF8.GetBytes(content);

        // Act
        var result = await _service.SanitizeFileAsync(fileData, ".TXT");

        // Assert
        var sanitized = Encoding.UTF8.GetString(result);
        Assert.That(sanitized, Does.Contain("[SSN_REDACTED]"));
    }

    [Test]
    public async Task SanitizeFileAsync_MultiplePii_RedactsAll()
    {
        // Arrange
        var content = "SSN: 123-45-6789, Card: 4111-1111-1111-1111, Phone: 555-123-4567";
        var fileData = Encoding.UTF8.GetBytes(content);

        // Act
        var result = await _service.SanitizeFileAsync(fileData, ".txt");

        // Assert
        var sanitized = Encoding.UTF8.GetString(result);
        Assert.That(sanitized, Does.Contain("[SSN_REDACTED]"));
        Assert.That(sanitized, Does.Contain("[CARD_REDACTED]"));
        Assert.That(sanitized, Does.Contain("[PHONE_REDACTED]"));
    }

    #endregion

    #region Security Tests

    [Test]
    public async Task SanitizeAsync_DeleteStatement_Blocked()
    {
        // Arrange
        var data = "'; DELETE FROM Users --";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[SQL_BLOCKED]"));
    }

    [Test]
    public async Task SanitizeAsync_UpdateStatement_Blocked()
    {
        // Arrange
        var data = "'; UPDATE Users SET admin=1 --";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[SQL_BLOCKED]"));
    }

    [Test]
    public async Task SanitizeAsync_InsertStatement_Blocked()
    {
        // Arrange
        var data = "'; INSERT INTO Users VALUES --";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[SQL_BLOCKED]"));
    }

    [Test]
    public async Task SanitizeAsync_TruncateStatement_Blocked()
    {
        // Arrange
        var data = "TRUNCATE TABLE Users";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[SQL_BLOCKED]"));
    }

    [Test]
    public async Task SanitizeAsync_ExecStatement_Blocked()
    {
        // Arrange
        var data = "EXEC(something)";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[SQL_BLOCKED]"));
    }

    [Test]
    public async Task SanitizeAsync_IframeTag_Blocked()
    {
        // Arrange
        var data = "<iframe src='evil.com'></iframe>";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[XSS_BLOCKED]"));
    }

    [Test]
    public async Task SanitizeAsync_ObjectTag_Blocked()
    {
        // Arrange
        var data = "<object data='evil.swf'></object>";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[XSS_BLOCKED]"));
    }

    [Test]
    public async Task SanitizeAsync_EmbedTag_Blocked()
    {
        // Arrange
        var data = "<embed src='evil.swf'></embed>";

        // Act
        var result = await _service.SanitizeAsync(data);

        // Assert
        Assert.That(result, Does.Contain("[XSS_BLOCKED]"));
    }

    #endregion
}
