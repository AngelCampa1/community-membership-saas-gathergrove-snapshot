using NUnit.Framework;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs.Audit;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class AuditServiceTests
{
    private AuditService _auditService = null!;
    private Mock<ILogger<AuditService>> _mockLogger = null!;
    private Mock<IAuditLogService> _mockAuditLogService = null!;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<AuditService>>();
        _mockAuditLogService = new Mock<IAuditLogService>();
        _auditService = new AuditService(_mockLogger.Object, _mockAuditLogService.Object);
    }

    #region LogFinancialExportAsync Tests

    [Test]
    public async Task LogFinancialExportAsync_ValidParameters_CallsAuditLogService()
    {
        // Arrange
        var userId = 1;
        var clubId = 10;
        var format = "CSV";
        var timestamp = DateTime.UtcNow;

        // Act
        await _auditService.LogFinancialExportAsync(userId, clubId, format, timestamp);

        // Assert
        _mockAuditLogService.Verify(
            x => x.LogExportActionAsync(It.Is<AuditLogEntry>(
                entry => entry.Action == "EXPORT_FINANCIALS" &&
                         entry.Details!.Contains(format))),
            Times.Once);
    }

    [Test]
    public async Task LogFinancialExportAsync_DifferentFormats_LogsCorrectly()
    {
        // Arrange
        var formats = new[] { "CSV", "PDF", "Excel", "JSON" };
        var timestamp = DateTime.UtcNow;

        // Act & Assert
        foreach (var format in formats)
        {
            await _auditService.LogFinancialExportAsync(1, 10, format, timestamp);
        }

        _mockAuditLogService.Verify(
            x => x.LogExportActionAsync(It.IsAny<AuditLogEntry>()),
            Times.Exactly(formats.Length));
    }

    [Test]
    public async Task LogFinancialExportAsync_UsesProvidedTimestamp()
    {
        // Arrange
        var timestamp = new DateTime(2024, 1, 15, 12, 0, 0, DateTimeKind.Utc);
        AuditLogEntry? capturedEntry = null;
        _mockAuditLogService
            .Setup(x => x.LogExportActionAsync(It.IsAny<AuditLogEntry>()))
            .Callback<AuditLogEntry>(entry => capturedEntry = entry);

        // Act
        await _auditService.LogFinancialExportAsync(1, 10, "CSV", timestamp);

        // Assert
        Assert.That(capturedEntry, Is.Not.Null);
        Assert.That(capturedEntry!.Timestamp, Is.EqualTo(timestamp));
    }

    #endregion

    #region LogDataAccessAsync Tests

    [Test]
    public async Task LogDataAccessAsync_ValidParameters_CallsAuditLogService()
    {
        // Arrange
        var userId = 1;
        var clubId = 10;
        var dataType = "MemberData";
        var action = "READ";
        var recordCount = 100;

        // Act
        await _auditService.LogDataAccessAsync(userId, clubId, dataType, action, recordCount);

        // Assert
        _mockAuditLogService.Verify(
            x => x.LogExportActionAsync(It.Is<AuditLogEntry>(
                entry => entry.Action.Contains("DATA_ACCESS") &&
                         entry.Action.Contains("READ") &&
                         entry.Details!.Contains(dataType) &&
                         entry.Details.Contains(recordCount.ToString()))),
            Times.Once);
    }

    [Test]
    public async Task LogDataAccessAsync_DifferentActions_FormatsActionCorrectly()
    {
        // Arrange
        var actions = new[] { "read", "write", "delete" };

        // Act
        foreach (var action in actions)
        {
            await _auditService.LogDataAccessAsync(1, 10, "Data", action, 10);
        }

        // Assert
        _mockAuditLogService.Verify(
            x => x.LogExportActionAsync(It.Is<AuditLogEntry>(
                entry => entry.Action.Contains("READ"))),
            Times.Once);

        _mockAuditLogService.Verify(
            x => x.LogExportActionAsync(It.Is<AuditLogEntry>(
                entry => entry.Action.Contains("WRITE"))),
            Times.Once);

        _mockAuditLogService.Verify(
            x => x.LogExportActionAsync(It.Is<AuditLogEntry>(
                entry => entry.Action.Contains("DELETE"))),
            Times.Once);
    }

    [Test]
    public async Task LogDataAccessAsync_SetsDataScope()
    {
        // Arrange
        AuditLogEntry? capturedEntry = null;
        _mockAuditLogService
            .Setup(x => x.LogExportActionAsync(It.IsAny<AuditLogEntry>()))
            .Callback<AuditLogEntry>(entry => capturedEntry = entry);

        // Act
        await _auditService.LogDataAccessAsync(1, 10, "PaymentData", "READ", 50);

        // Assert
        Assert.That(capturedEntry, Is.Not.Null);
        Assert.That(capturedEntry!.DataScope, Is.EqualTo("PaymentData"));
    }

    #endregion

    #region LogMemberExportAsync Tests

    [Test]
    public async Task LogMemberExportAsync_ValidParameters_CallsAuditLogService()
    {
        // Arrange
        var userId = 1;
        var clubId = 10;
        var format = "CSV";
        var timestamp = DateTime.UtcNow;

        // Act
        await _auditService.LogMemberExportAsync(userId, clubId, format, timestamp);

        // Assert
        _mockAuditLogService.Verify(
            x => x.LogExportActionAsync(It.Is<AuditLogEntry>(
                entry => entry.Action == "EXPORT_MEMBERS" &&
                         entry.Details!.Contains(format))),
            Times.Once);
    }

    [Test]
    public async Task LogMemberExportAsync_LogsCorrectInformation()
    {
        // Arrange
        AuditLogEntry? capturedEntry = null;
        _mockAuditLogService
            .Setup(x => x.LogExportActionAsync(It.IsAny<AuditLogEntry>()))
            .Callback<AuditLogEntry>(entry => capturedEntry = entry);

        var timestamp = DateTime.UtcNow;

        // Act
        await _auditService.LogMemberExportAsync(5, 25, "PDF", timestamp);

        // Assert
        Assert.That(capturedEntry, Is.Not.Null);
        Assert.That(capturedEntry!.Action, Is.EqualTo("EXPORT_MEMBERS"));
        Assert.That(capturedEntry.Timestamp, Is.EqualTo(timestamp));
        Assert.That(capturedEntry.Details, Does.Contain("PDF"));
    }

    #endregion

    #region LogExportActionAsync Tests

    [Test]
    public async Task LogExportActionAsync_ValidParameters_CallsAuditLogService()
    {
        // Arrange
        var action = "CUSTOM_EXPORT";
        var userId = 1;
        var clubId = 10;
        var details = "Custom export details";
        var ipAddress = "192.168.1.1";

        // Act
        await _auditService.LogExportActionAsync(action, userId, clubId, details, ipAddress);

        // Assert
        _mockAuditLogService.Verify(
            x => x.LogExportActionAsync(It.Is<AuditLogEntry>(
                entry => entry.Action == action &&
                         entry.Details == details &&
                         entry.IPAddress == ipAddress)),
            Times.Once);
    }

    [Test]
    public async Task LogExportActionAsync_WithoutIPAddress_StillCompletes()
    {
        // Act
        await _auditService.LogExportActionAsync("EXPORT", 1, 10, "Details");

        // Assert
        _mockAuditLogService.Verify(
            x => x.LogExportActionAsync(It.Is<AuditLogEntry>(
                entry => entry.IPAddress == null)),
            Times.Once);
    }

    [Test]
    public async Task LogExportActionAsync_SetsTimestampToNow()
    {
        // Arrange
        AuditLogEntry? capturedEntry = null;
        _mockAuditLogService
            .Setup(x => x.LogExportActionAsync(It.IsAny<AuditLogEntry>()))
            .Callback<AuditLogEntry>(entry => capturedEntry = entry);

        var before = DateTime.UtcNow;

        // Act
        await _auditService.LogExportActionAsync("ACTION", 1, 10, "Details");

        var after = DateTime.UtcNow;

        // Assert
        Assert.That(capturedEntry, Is.Not.Null);
        Assert.That(capturedEntry!.Timestamp, Is.InRange(before, after));
    }

    #endregion

    #region LogSecurityEventAsync Tests

    [Test]
    public async Task LogSecurityEventAsync_ValidParameters_CallsAuditLogService()
    {
        // Arrange
        var eventType = "UNAUTHORIZED_ACCESS";
        var userId = 1;
        var clubId = 10;
        var details = "Failed login attempt";
        var severity = "High";

        // Act
        await _auditService.LogSecurityEventAsync(eventType, userId, clubId, details, severity);

        // Assert
        _mockAuditLogService.Verify(
            x => x.LogExportActionAsync(It.Is<AuditLogEntry>(
                entry => entry.Action.Contains("SECURITY_EVENT") &&
                         entry.Action.Contains("UNAUTHORIZED_ACCESS") &&
                         entry.Details!.Contains(severity) &&
                         entry.Details.Contains(details))),
            Times.Once);
    }

    [Test]
    public async Task LogSecurityEventAsync_DefaultSeverity_UsesMedium()
    {
        // Arrange
        AuditLogEntry? capturedEntry = null;
        _mockAuditLogService
            .Setup(x => x.LogExportActionAsync(It.IsAny<AuditLogEntry>()))
            .Callback<AuditLogEntry>(entry => capturedEntry = entry);

        // Act - don't pass severity
        await _auditService.LogSecurityEventAsync("FAILED_LOGIN", 1, 10, "Details");

        // Assert
        Assert.That(capturedEntry, Is.Not.Null);
        Assert.That(capturedEntry!.Details, Does.Contain("Medium"));
    }

    [Test]
    public async Task LogSecurityEventAsync_DifferentSeverities_LogsCorrectly()
    {
        // Arrange
        var severities = new[] { "Low", "Medium", "High", "Critical" };

        // Act
        foreach (var severity in severities)
        {
            await _auditService.LogSecurityEventAsync("EVENT", 1, 10, "Details", severity);
        }

        // Assert
        _mockAuditLogService.Verify(
            x => x.LogExportActionAsync(It.IsAny<AuditLogEntry>()),
            Times.Exactly(severities.Length));
    }

    [Test]
    public async Task LogSecurityEventAsync_UppercasesEventType()
    {
        // Arrange
        AuditLogEntry? capturedEntry = null;
        _mockAuditLogService
            .Setup(x => x.LogExportActionAsync(It.IsAny<AuditLogEntry>()))
            .Callback<AuditLogEntry>(entry => capturedEntry = entry);

        // Act
        await _auditService.LogSecurityEventAsync("failed_login", 1, 10, "Details");

        // Assert
        Assert.That(capturedEntry, Is.Not.Null);
        Assert.That(capturedEntry!.Action, Does.Contain("FAILED_LOGIN"));
    }

    #endregion

    #region Edge Cases

    [Test]
    public async Task AllMethods_LargeUserAndClubIds_HandleCorrectly()
    {
        // Arrange
        var largeUserId = int.MaxValue;
        var largeClubId = int.MaxValue;

        // Act & Assert - should not throw
        await _auditService.LogFinancialExportAsync(largeUserId, largeClubId, "CSV", DateTime.UtcNow);
        await _auditService.LogDataAccessAsync(largeUserId, largeClubId, "Data", "READ", 100);
        await _auditService.LogMemberExportAsync(largeUserId, largeClubId, "PDF", DateTime.UtcNow);
        await _auditService.LogExportActionAsync("ACTION", largeUserId, largeClubId, "Details");
        await _auditService.LogSecurityEventAsync("EVENT", largeUserId, largeClubId, "Details");
    }

    [Test]
    public async Task AllMethods_ZeroIds_HandleCorrectly()
    {
        // Act & Assert - should not throw
        await _auditService.LogFinancialExportAsync(0, 0, "CSV", DateTime.UtcNow);
        await _auditService.LogDataAccessAsync(0, 0, "Data", "READ", 0);
        await _auditService.LogMemberExportAsync(0, 0, "PDF", DateTime.UtcNow);
        await _auditService.LogExportActionAsync("ACTION", 0, 0, "Details");
        await _auditService.LogSecurityEventAsync("EVENT", 0, 0, "Details");
    }

    [Test]
    public async Task AllMethods_EmptyStrings_HandleCorrectly()
    {
        // Act & Assert - should not throw
        await _auditService.LogFinancialExportAsync(1, 1, "", DateTime.UtcNow);
        await _auditService.LogDataAccessAsync(1, 1, "", "", 0);
        await _auditService.LogMemberExportAsync(1, 1, "", DateTime.UtcNow);
        await _auditService.LogExportActionAsync("", 1, 1, "");
        await _auditService.LogSecurityEventAsync("", 1, 1, "", "");
    }

    #endregion
}
