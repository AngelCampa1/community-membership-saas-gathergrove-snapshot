using NUnit.Framework;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class ComplianceServiceTests
{
    private ComplianceService _complianceService = null!;
    private Mock<ILogger<ComplianceService>> _mockLogger = null!;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<ComplianceService>>();
        _complianceService = new ComplianceService(_mockLogger.Object);
    }

    #region ValidateGdprComplianceAsync Tests

    [Test]
    public async Task ValidateGdprComplianceAsync_WithValidData_ReturnsTrue()
    {
        // Arrange
        var data = new { Name = "Test", Email = "test@example.com" };

        // Act
        var result = await _complianceService.ValidateGdprComplianceAsync(data);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateGdprComplianceAsync_WithNullData_ReturnsFalse()
    {
        // Act
        var result = await _complianceService.ValidateGdprComplianceAsync(null!);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task ValidateGdprComplianceAsync_WithEmptyObject_ReturnsTrue()
    {
        // Arrange
        var data = new object();

        // Act
        var result = await _complianceService.ValidateGdprComplianceAsync(data);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateGdprComplianceAsync_WithStringData_ReturnsTrue()
    {
        // Arrange
        var data = "Simple string data";

        // Act
        var result = await _complianceService.ValidateGdprComplianceAsync(data);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateGdprComplianceAsync_LogsInformation()
    {
        // Arrange
        var data = new { Test = "data" };

        // Act
        await _complianceService.ValidateGdprComplianceAsync(data);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Validating GDPR compliance")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task ValidateGdprComplianceAsync_WithNull_LogsWarning()
    {
        // Act
        await _complianceService.ValidateGdprComplianceAsync(null!);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Data is null")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region ValidateGDPRComplianceAsync Tests (uppercase variant)

    [Test]
    public async Task ValidateGDPRComplianceAsync_WithValidData_ReturnsTrue()
    {
        // Arrange
        var data = new { Name = "Test" };

        // Act
        var result = await _complianceService.ValidateGDPRComplianceAsync(data);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateGDPRComplianceAsync_WithNullData_ReturnsFalse()
    {
        // Act
        var result = await _complianceService.ValidateGDPRComplianceAsync(null!);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region ValidateCCPAComplianceAsync Tests

    [Test]
    public async Task ValidateCCPAComplianceAsync_WithValidData_ReturnsTrue()
    {
        // Arrange
        var data = new { ConsumerInfo = "California consumer" };

        // Act
        var result = await _complianceService.ValidateCCPAComplianceAsync(data);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateCCPAComplianceAsync_WithNullData_ReturnsFalse()
    {
        // Act
        var result = await _complianceService.ValidateCCPAComplianceAsync(null!);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task ValidateCCPAComplianceAsync_LogsInformation()
    {
        // Arrange
        var data = new { Test = "data" };

        // Act
        await _complianceService.ValidateCCPAComplianceAsync(data);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Validating CCPA compliance")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region ValidateDataRetentionAsync Tests

    [Test]
    public async Task ValidateDataRetentionAsync_WithRecentData_ReturnsTrue()
    {
        // Arrange
        var dataDate = DateTime.UtcNow.AddDays(-30);

        // Act
        var result = await _complianceService.ValidateDataRetentionAsync(dataDate);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateDataRetentionAsync_WithDataWithinSevenYears_ReturnsTrue()
    {
        // Arrange
        var dataDate = DateTime.UtcNow.AddYears(-6);

        // Act
        var result = await _complianceService.ValidateDataRetentionAsync(dataDate);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateDataRetentionAsync_WithDataOlderThanSevenYears_ReturnsFalse()
    {
        // Arrange
        var dataDate = DateTime.UtcNow.AddYears(-8);

        // Act
        var result = await _complianceService.ValidateDataRetentionAsync(dataDate);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task ValidateDataRetentionAsync_WithDataExactlySevenYearsOld_ReturnsTrue()
    {
        // Arrange - just under 7 years to ensure within retention period
        var dataDate = DateTime.UtcNow.AddDays(-(7 * 365) + 1);

        // Act
        var result = await _complianceService.ValidateDataRetentionAsync(dataDate);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateDataRetentionAsync_LogsInformation()
    {
        // Arrange
        var dataDate = DateTime.UtcNow;

        // Act
        await _complianceService.ValidateDataRetentionAsync(dataDate);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Validating data retention")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task ValidateDataRetentionAsync_WithOldData_LogsWarning()
    {
        // Arrange
        var dataDate = DateTime.UtcNow.AddYears(-10);

        // Act
        await _complianceService.ValidateDataRetentionAsync(dataDate);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Data retention validation failed")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region GenerateComplianceReportAsync Tests

    [Test]
    public async Task GenerateComplianceReportAsync_ReturnsReport()
    {
        // Arrange
        var clubId = 1;

        // Act
        var report = await _complianceService.GenerateComplianceReportAsync(clubId);

        // Assert
        Assert.That(report, Is.Not.Null);
    }

    [Test]
    public async Task GenerateComplianceReportAsync_ReturnsCompliantReport()
    {
        // Arrange
        var clubId = 1;

        // Act
        var report = await _complianceService.GenerateComplianceReportAsync(clubId);

        // Assert
        Assert.That(report.IsCompliant, Is.True);
    }

    [Test]
    public async Task GenerateComplianceReportAsync_ReturnsEmptyViolations()
    {
        // Arrange
        var clubId = 1;

        // Act
        var report = await _complianceService.GenerateComplianceReportAsync(clubId);

        // Assert
        Assert.That(report.Violations, Is.Empty);
    }

    [Test]
    public async Task GenerateComplianceReportAsync_SetsGeneratedAt()
    {
        // Arrange
        var clubId = 1;
        var before = DateTime.UtcNow;

        // Act
        var report = await _complianceService.GenerateComplianceReportAsync(clubId);

        var after = DateTime.UtcNow;

        // Assert
        Assert.That(report.GeneratedAt, Is.InRange(before, after));
    }

    [Test]
    public async Task GenerateComplianceReportAsync_LogsInformation()
    {
        // Arrange
        var clubId = 42;

        // Act
        await _complianceService.GenerateComplianceReportAsync(clubId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) =>
                    v.ToString()!.Contains("Generating compliance report") &&
                    v.ToString()!.Contains("42")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task GenerateComplianceReportAsync_DifferentClubs_ReturnsReports()
    {
        // Act
        var report1 = await _complianceService.GenerateComplianceReportAsync(1);
        var report2 = await _complianceService.GenerateComplianceReportAsync(2);

        // Assert
        Assert.That(report1, Is.Not.Null);
        Assert.That(report2, Is.Not.Null);
    }

    #endregion

    #region GetSanitizationRulesForCompliance Tests

    [Test]
    public void GetSanitizationRulesForCompliance_Basic_ReturnsNoRedaction()
    {
        // Act
        var rules = _complianceService.GetSanitizationRulesForCompliance(ComplianceLevel.Basic);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(rules.RedactPersonalInfo, Is.False);
            Assert.That(rules.RedactContactInfo, Is.False);
            Assert.That(rules.RedactPhoneNumbers, Is.False);
            Assert.That(rules.RedactFinancialData, Is.False);
        });
    }

    [Test]
    public void GetSanitizationRulesForCompliance_GDPR_ReturnsFullRedaction()
    {
        // Act
        var rules = _complianceService.GetSanitizationRulesForCompliance(ComplianceLevel.GDPR);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(rules.RedactPersonalInfo, Is.True);
            Assert.That(rules.RedactContactInfo, Is.True);
            Assert.That(rules.RedactPhoneNumbers, Is.True);
            Assert.That(rules.RedactFinancialData, Is.True);
            Assert.That(rules.RequireExplicitConsent, Is.True);
            Assert.That(rules.DataMinimization, Is.True);
            Assert.That(rules.PurposeLimitation, Is.True);
        });
    }

    [Test]
    public void GetSanitizationRulesForCompliance_CCPA_ReturnsCaliforniaRules()
    {
        // Act
        var rules = _complianceService.GetSanitizationRulesForCompliance(ComplianceLevel.CCPA);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(rules.RedactPersonalInfo, Is.True);
            Assert.That(rules.RedactContactInfo, Is.True);
            Assert.That(rules.RedactPhoneNumbers, Is.True);
            Assert.That(rules.RedactFinancialData, Is.True);
            Assert.That(rules.RequireExplicitConsent, Is.True);
            Assert.That(rules.DataMinimization, Is.True);
        });
    }

    [Test]
    public void GetSanitizationRulesForCompliance_HIPAA_ReturnsHealthcareRules()
    {
        // Act
        var rules = _complianceService.GetSanitizationRulesForCompliance(ComplianceLevel.HIPAA);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(rules.RedactPersonalInfo, Is.True);
            Assert.That(rules.RedactContactInfo, Is.True);
            Assert.That(rules.RedactSSN, Is.True);
            Assert.That(rules.HashPersonalIdentifiers, Is.True);
        });
    }

    [Test]
    public void GetSanitizationRulesForCompliance_SOX_ReturnsFinancialRules()
    {
        // Act
        var rules = _complianceService.GetSanitizationRulesForCompliance(ComplianceLevel.SOX);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(rules.RedactFinancialData, Is.True);
            Assert.That(rules.RedactCreditCardNumbers, Is.True);
            Assert.That(rules.RedactBankAccountNumbers, Is.True);
            Assert.That(rules.RedactTaxIdentifiers, Is.True);
        });
    }

    [Test]
    public void GetSanitizationRulesForCompliance_PCI_DSS_ReturnsPaymentRules()
    {
        // Act
        var rules = _complianceService.GetSanitizationRulesForCompliance(ComplianceLevel.PCI_DSS);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(rules.RedactCreditCardInfo, Is.True);
            Assert.That(rules.RedactCreditCardNumbers, Is.True);
            Assert.That(rules.RedactBankAccountNumbers, Is.True);
        });
    }

    [Test]
    public void GetSanitizationRulesForCompliance_LogsInformation()
    {
        // Act
        _complianceService.GetSanitizationRulesForCompliance(ComplianceLevel.GDPR);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Getting sanitization rules")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public void GetSanitizationRulesForCompliance_AllLevels_ReturnsNonNull()
    {
        // Act & Assert
        foreach (ComplianceLevel level in Enum.GetValues(typeof(ComplianceLevel)))
        {
            var rules = _complianceService.GetSanitizationRulesForCompliance(level);
            Assert.That(rules, Is.Not.Null, $"Rules for {level} should not be null");
        }
    }

    #endregion

    #region Edge Cases

    [Test]
    public async Task MultipleValidations_SequentialCalls_AllComplete()
    {
        // Arrange
        var data = new { Test = "data" };

        // Act & Assert
        for (int i = 0; i < 10; i++)
        {
            var gdprResult = await _complianceService.ValidateGdprComplianceAsync(data);
            var ccpaResult = await _complianceService.ValidateCCPAComplianceAsync(data);
            var retentionResult = await _complianceService.ValidateDataRetentionAsync(DateTime.UtcNow);

            Assert.That(gdprResult, Is.True);
            Assert.That(ccpaResult, Is.True);
            Assert.That(retentionResult, Is.True);
        }
    }

    [Test]
    public async Task ConcurrentValidations_AllComplete()
    {
        // Arrange
        var data = new { Test = "data" };

        var tasks = new List<Task<bool>>
        {
            _complianceService.ValidateGdprComplianceAsync(data),
            _complianceService.ValidateCCPAComplianceAsync(data),
            _complianceService.ValidateGDPRComplianceAsync(data),
            _complianceService.ValidateDataRetentionAsync(DateTime.UtcNow)
        };

        // Act
        var results = await Task.WhenAll(tasks);

        // Assert
        Assert.That(results, Has.All.EqualTo(true));
    }

    [Test]
    public async Task GenerateComplianceReportAsync_ZeroClubId_ReturnsReport()
    {
        // Act
        var report = await _complianceService.GenerateComplianceReportAsync(0);

        // Assert
        Assert.That(report, Is.Not.Null);
    }

    [Test]
    public async Task GenerateComplianceReportAsync_NegativeClubId_ReturnsReport()
    {
        // Act
        var report = await _complianceService.GenerateComplianceReportAsync(-1);

        // Assert
        Assert.That(report, Is.Not.Null);
    }

    [Test]
    public async Task ValidateDataRetentionAsync_FutureDate_ReturnsTrue()
    {
        // Arrange - future dates should be valid
        var futureDate = DateTime.UtcNow.AddYears(1);

        // Act
        var result = await _complianceService.ValidateDataRetentionAsync(futureDate);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateDataRetentionAsync_MinValue_ReturnsFalse()
    {
        // Act
        var result = await _complianceService.ValidateDataRetentionAsync(DateTime.MinValue);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion
}
