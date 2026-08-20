using NUnit.Framework;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs.Audit;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class AuditLogServiceTests
{
    private AuditLogService _auditLogService = null!;
    private Mock<ILogger<AuditLogService>> _mockLogger = null!;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<AuditLogService>>();
        _auditLogService = new AuditLogService(_mockLogger.Object);
    }

    #region LogExportActionAsync Tests

    [Test]
    public async Task LogExportActionAsync_ValidEntry_AddsEntry()
    {
        // Arrange
        var entry = CreateValidAuditEntry();

        // Act
        await _auditLogService.LogExportActionAsync(entry);

        // Assert - verify via GetAuditLogsAsync
        var logs = await _auditLogService.GetAuditLogsAsync(entry.ClubId);
        Assert.That(logs.Count(), Is.EqualTo(1));
    }

    [Test]
    public void LogExportActionAsync_NullEntry_ThrowsArgumentNullException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentNullException>(
            async () => await _auditLogService.LogExportActionAsync(null!));
    }

    [Test]
    public async Task LogExportActionAsync_EntryWithoutTimestamp_SetsTimestamp()
    {
        // Arrange
        var entry = CreateValidAuditEntry();
        entry.Timestamp = default;

        // Act
        await _auditLogService.LogExportActionAsync(entry);

        // Assert
        var logs = await _auditLogService.GetAuditLogsAsync(entry.ClubId);
        Assert.That(logs.First().Timestamp, Is.Not.EqualTo(default(DateTime)));
    }

    [Test]
    public async Task LogExportActionAsync_CriticalAction_GeneratesDigitalSignature()
    {
        // Arrange
        var entry = CreateValidAuditEntry();
        entry.Action = "EXPORT_FINANCIALS"; // Critical action

        // Act
        await _auditLogService.LogExportActionAsync(entry);

        // Assert
        var logs = await _auditLogService.GetAuditLogsAsync(entry.ClubId);
        var loggedEntry = logs.First();
        Assert.That(loggedEntry.DigitalSignature, Is.Not.Null.And.Not.Empty);
        Assert.That(loggedEntry.IsSignatureValid, Is.True);
    }

    [Test]
    public async Task LogExportActionAsync_NonCriticalAction_NoDigitalSignature()
    {
        // Arrange
        var entry = CreateValidAuditEntry();
        entry.Action = "VIEW_REPORT"; // Non-critical action

        // Act
        await _auditLogService.LogExportActionAsync(entry);

        // Assert
        var logs = await _auditLogService.GetAuditLogsAsync(entry.ClubId);
        var loggedEntry = logs.First();
        Assert.That(loggedEntry.DigitalSignature, Is.Null);
    }

    [Test]
    public async Task LogExportActionAsync_AddsIntegrityChecksum()
    {
        // Arrange
        var entry = CreateValidAuditEntry();
        entry.Details = "Original details";

        // Act
        await _auditLogService.LogExportActionAsync(entry);

        // Assert
        var logs = await _auditLogService.GetAuditLogsAsync(entry.ClubId);
        Assert.That(logs.First().Details, Does.Contain("CHECKSUM:"));
    }

    #endregion

    #region LogSensitiveDataAccessAsync Tests

    [Test]
    public async Task LogSensitiveDataAccessAsync_ValidLog_AddsEntry()
    {
        // Arrange
        var log = new SensitiveDataAccessLog
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            DataType = "FinancialRecords",
            AccessReason = "Audit review",
            Severity = AuditSeverity.High,
            IPAddress = "192.168.1.1"
        };

        // Act
        await _auditLogService.LogSensitiveDataAccessAsync(log);

        // Assert - verify logging was called
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Sensitive data access")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public void LogSensitiveDataAccessAsync_NullLog_ThrowsArgumentNullException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentNullException>(
            async () => await _auditLogService.LogSensitiveDataAccessAsync(null!));
    }

    [Test]
    public async Task LogSensitiveDataAccessAsync_SetsAccessedAtTimestamp()
    {
        // Arrange
        var log = new SensitiveDataAccessLog
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            DataType = "MemberPII",
            AccessReason = "Export",
            Severity = AuditSeverity.Medium
        };

        var before = DateTime.UtcNow;

        // Act
        await _auditLogService.LogSensitiveDataAccessAsync(log);

        var after = DateTime.UtcNow;

        // Assert
        Assert.That(log.AccessedAt, Is.InRange(before, after));
    }

    #endregion

    #region LogBatchExportActionsAsync Tests

    [Test]
    public async Task LogBatchExportActionsAsync_MultipleEntries_LogsAll()
    {
        // Arrange
        var clubId = Guid.NewGuid();
        var entries = Enumerable.Range(1, 5).Select(i => CreateValidAuditEntry(clubId)).ToList();

        // Act
        await _auditLogService.LogBatchExportActionsAsync(entries);

        // Assert
        var logs = await _auditLogService.GetAuditLogsAsync(clubId);
        Assert.That(logs.Count(), Is.EqualTo(5));
    }

    [Test]
    public void LogBatchExportActionsAsync_NullEntries_ThrowsArgumentNullException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentNullException>(
            async () => await _auditLogService.LogBatchExportActionsAsync(null!));
    }

    [Test]
    public async Task LogBatchExportActionsAsync_EmptyList_CompletesSuccessfully()
    {
        // Arrange
        var entries = new List<AuditLogEntry>();

        // Act & Assert - should not throw
        await _auditLogService.LogBatchExportActionsAsync(entries);
    }

    #endregion

    #region UpdateAuditLogAsync Tests

    [Test]
    public void UpdateAuditLogAsync_AlwaysThrowsInvalidOperationException()
    {
        // Arrange
        var entry = CreateValidAuditEntry();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _auditLogService.UpdateAuditLogAsync(entry));
        Assert.That(ex!.Message, Does.Contain("immutable"));
    }

    #endregion

    #region ValidateAuditIntegrityAsync Tests

    [Test]
    public async Task ValidateAuditIntegrityAsync_NoEntries_ReturnsValid()
    {
        // Act
        var result = await _auditLogService.ValidateAuditIntegrityAsync();

        // Assert
        Assert.That(result.IsValid, Is.True);
    }

    [Test]
    public async Task ValidateAuditIntegrityAsync_WithValidEntries_ReturnsValid()
    {
        // Arrange
        var entry = CreateValidAuditEntry();
        await _auditLogService.LogExportActionAsync(entry);

        // Act
        var result = await _auditLogService.ValidateAuditIntegrityAsync();

        // Assert
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.ChecksumMatches, Is.True);
        Assert.That(result.TamperedEntries, Is.Empty);
    }

    #endregion

    #region GetDataSubjectAuditDataAsync Tests

    [Test]
    public async Task GetDataSubjectAuditDataAsync_UserWithEntries_ReturnsEntries()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entry = CreateValidAuditEntry();
        entry.UserId = userId;
        await _auditLogService.LogExportActionAsync(entry);

        // Act
        var result = await _auditLogService.GetDataSubjectAuditDataAsync(userId);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetDataSubjectAuditDataAsync_UserWithNoEntries_ReturnsEmpty()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = await _auditLogService.GetDataSubjectAuditDataAsync(userId);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetDataSubjectAuditDataAsync_MultipleUsers_ReturnsOnlyMatchingUser()
    {
        // Arrange
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();

        var entry1 = CreateValidAuditEntry();
        entry1.UserId = userId1;
        await _auditLogService.LogExportActionAsync(entry1);

        var entry2 = CreateValidAuditEntry();
        entry2.UserId = userId2;
        await _auditLogService.LogExportActionAsync(entry2);

        // Act
        var result = await _auditLogService.GetDataSubjectAuditDataAsync(userId1);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().UserId, Is.EqualTo(userId1));
    }

    #endregion

    #region ExportDataSubjectAuditDataAsync Tests

    [Test]
    public async Task ExportDataSubjectAuditDataAsync_JSONFormat_ReturnsJsonData()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entry = CreateValidAuditEntry();
        entry.UserId = userId;
        await _auditLogService.LogExportActionAsync(entry);

        // Act
        var result = await _auditLogService.ExportDataSubjectAuditDataAsync(userId, ExportFormat.JSON);

        // Assert
        Assert.That(result.Format, Is.EqualTo(ExportFormat.JSON));
        Assert.That(result.ContentType, Is.EqualTo("application/json"));
        Assert.That(result.FileName, Does.EndWith(".json"));
        Assert.That(result.Data.Length, Is.GreaterThan(0));
    }

    [Test]
    public async Task ExportDataSubjectAuditDataAsync_CSVFormat_ReturnsCsvData()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entry = CreateValidAuditEntry();
        entry.UserId = userId;
        await _auditLogService.LogExportActionAsync(entry);

        // Act
        var result = await _auditLogService.ExportDataSubjectAuditDataAsync(userId, ExportFormat.CSV);

        // Assert
        Assert.That(result.Format, Is.EqualTo(ExportFormat.CSV));
        Assert.That(result.ContentType, Is.EqualTo("text/csv"));
        Assert.That(result.FileName, Does.EndWith(".csv"));
    }

    [Test]
    public async Task ExportDataSubjectAuditDataAsync_PDFFormat_ReturnsPdfData()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = await _auditLogService.ExportDataSubjectAuditDataAsync(userId, ExportFormat.PDF);

        // Assert
        Assert.That(result.Format, Is.EqualTo(ExportFormat.PDF));
        Assert.That(result.ContentType, Is.EqualTo("application/pdf"));
        Assert.That(result.FileName, Does.EndWith(".pdf"));
    }

    [Test]
    public async Task ExportDataSubjectAuditDataAsync_ExcelFormat_ReturnsExcelData()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = await _auditLogService.ExportDataSubjectAuditDataAsync(userId, ExportFormat.Excel);

        // Assert
        Assert.That(result.Format, Is.EqualTo(ExportFormat.Excel));
        Assert.That(result.ContentType, Does.Contain("spreadsheet"));
        Assert.That(result.FileName, Does.EndWith(".xlsx"));
    }

    #endregion

    #region GenerateComplianceReportAsync Tests

    [Test]
    public async Task GenerateComplianceReportAsync_ReturnsComplianceReport()
    {
        // Arrange
        var clubId = Guid.NewGuid();
        var period = new AuditDateRange
        {
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow
        };

        // Act
        var result = await _auditLogService.GenerateComplianceReportAsync(clubId, period);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ReportPeriod, Is.EqualTo(period));
        Assert.That(result.AuditTrailIntegrity, Is.True);
        Assert.That(result.GDPRCompliance, Is.True);
        Assert.That(result.SOX404Compliance, Is.True);
        Assert.That(result.ISO27001Compliance, Is.True);
    }

    [Test]
    public async Task GenerateComplianceReportAsync_WithExportEntries_CountsCorrectly()
    {
        // Arrange
        var clubId = Guid.NewGuid();
        var entry1 = CreateValidAuditEntry(clubId);
        entry1.Action = "EXPORT_MEMBERS";
        await _auditLogService.LogExportActionAsync(entry1);

        var entry2 = CreateValidAuditEntry(clubId);
        entry2.Action = "EXPORT_FINANCIALS";
        await _auditLogService.LogExportActionAsync(entry2);

        var period = new AuditDateRange
        {
            StartDate = DateTime.UtcNow.AddHours(-1),
            EndDate = DateTime.UtcNow.AddHours(1)
        };

        // Act
        var result = await _auditLogService.GenerateComplianceReportAsync(clubId, period);

        // Assert
        Assert.That(result.TotalExportActions, Is.EqualTo(2));
    }

    #endregion

    #region GetAuditLogsAsync Tests

    [Test]
    public async Task GetAuditLogsAsync_ClubWithEntries_ReturnsEntries()
    {
        // Arrange
        var clubId = Guid.NewGuid();
        var entry = CreateValidAuditEntry(clubId);
        await _auditLogService.LogExportActionAsync(entry);

        // Act
        var result = await _auditLogService.GetAuditLogsAsync(clubId);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetAuditLogsAsync_ClubWithNoEntries_ReturnsEmpty()
    {
        // Arrange
        var clubId = Guid.NewGuid();

        // Act
        var result = await _auditLogService.GetAuditLogsAsync(clubId);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetAuditLogsAsync_ExcludesArchivedEntries()
    {
        // Arrange
        var clubId = Guid.NewGuid();
        var entry = CreateValidAuditEntry(clubId);
        entry.IsArchived = true;
        await _auditLogService.LogExportActionAsync(entry);

        // Act
        var result = await _auditLogService.GetAuditLogsAsync(clubId);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region GetArchivedAuditLogsAsync Tests

    [Test]
    public async Task GetArchivedAuditLogsAsync_WithArchivedEntries_ReturnsEntries()
    {
        // Arrange - need to trigger archival
        var clubId = Guid.NewGuid();
        var entry = CreateValidAuditEntry(clubId);
        entry.Timestamp = DateTime.UtcNow.AddYears(-3); // Very old entry
        await _auditLogService.LogExportActionAsync(entry);
        await _auditLogService.TriggerArchivalProcessAsync();

        // Act
        var result = await _auditLogService.GetArchivedAuditLogsAsync(clubId);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
    }

    #endregion

    #region TriggerArchivalProcessAsync Tests

    [Test]
    public async Task TriggerArchivalProcessAsync_OldEntries_MovesToArchive()
    {
        // Arrange
        var clubId = Guid.NewGuid();
        var oldEntry = CreateValidAuditEntry(clubId);
        oldEntry.Timestamp = DateTime.UtcNow.AddYears(-3); // 3 years old (beyond 2 year threshold)
        await _auditLogService.LogExportActionAsync(oldEntry);

        var recentEntry = CreateValidAuditEntry(clubId);
        recentEntry.Timestamp = DateTime.UtcNow; // Recent
        await _auditLogService.LogExportActionAsync(recentEntry);

        // Act
        await _auditLogService.TriggerArchivalProcessAsync();

        // Assert
        var activeLogs = await _auditLogService.GetAuditLogsAsync(clubId);
        var archivedLogs = await _auditLogService.GetArchivedAuditLogsAsync(clubId);

        Assert.That(activeLogs.Count(), Is.EqualTo(1)); // Only recent entry
        Assert.That(archivedLogs.Count(), Is.EqualTo(1)); // Old entry archived
    }

    [Test]
    public async Task TriggerArchivalProcessAsync_NoOldEntries_DoesNothing()
    {
        // Arrange
        var clubId = Guid.NewGuid();
        var recentEntry = CreateValidAuditEntry(clubId);
        await _auditLogService.LogExportActionAsync(recentEntry);

        // Act
        await _auditLogService.TriggerArchivalProcessAsync();

        // Assert
        var activeLogs = await _auditLogService.GetAuditLogsAsync(clubId);
        var archivedLogs = await _auditLogService.GetArchivedAuditLogsAsync(clubId);

        Assert.That(activeLogs.Count(), Is.EqualTo(1));
        Assert.That(archivedLogs, Is.Empty);
    }

    #endregion

    #region Helper Methods

    private AuditLogEntry CreateValidAuditEntry(Guid? clubId = null)
    {
        return new AuditLogEntry
        {
            Id = Guid.NewGuid(),
            Action = "TEST_ACTION",
            UserId = Guid.NewGuid(),
            ClubId = clubId ?? Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Details = "Test details"
        };
    }

    #endregion
}
