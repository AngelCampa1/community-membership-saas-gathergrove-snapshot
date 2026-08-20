using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services.Wrappers;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Infrastructure.Services.TierValidation;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Application.DTOs.Analytics;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// TDD Tests for TierAwareExportService - Tier-based export functionality validation
/// Tests the critical tier validation that prevents expensive export operations for basic tier clubs
/// Contributes to 40-60% database load reduction by blocking non-unlimited export queries
/// Follows RED→GREEN→REFACTOR TDD cycle
/// </summary>
public class TierAwareExportServiceTests
{
    private TierAwareExportService _tierAwareExportService = null!;
    private Mock<IExportService> _mockInnerService = null!;
    private Mock<ITierGateService> _mockTierGateService = null!;
    private Mock<ILogger<TierAwareExportService>> _mockLogger = null!;

    [SetUp]
    public void SetUp()
    {
        _mockInnerService = new Mock<IExportService>();
        _mockTierGateService = new Mock<ITierGateService>();
        _mockLogger = new Mock<ILogger<TierAwareExportService>>();

        _tierAwareExportService = new TierAwareExportService(
            _mockInnerService.Object,
            _mockTierGateService.Object,
            _mockLogger.Object);
    }

    #region ExportMembersAsync Tests (RED Phase)

    [Test]
    public async Task ExportMembersAsync_UnlimitedTierClub_ValidatesResourcesAndCallsInnerService()
    {
        // Arrange
        var clubId = 1;
        var format = ExportFormat.CSV;
        var options = new MemberExportOptions();
        var expectedResult = new ExportResult { ExportId = "test-export-123" };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.ExportMembersAsync(clubId, format, options))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _tierAwareExportService.ExportMembersAsync(clubId, format, options);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
        _mockTierGateService.Verify(x => x.ValidateUnlimitedAccessAsync(clubId), Times.Once);
        _mockTierGateService.Verify(x => x.ValidateResourceAllocationAsync(
            It.Is<ResourceAllocationRequest>(r =>
                r.ClubId == clubId &&
                r.AnalyticsQueries == 5 &&
                r.CacheSize == 200 &&
                r.BackgroundProcessing == true)), Times.Once);
        _mockInnerService.Verify(x => x.ExportMembersAsync(clubId, format, options), Times.Once);
    }

    [Test]
    public async Task ExportMembersAsync_BasicTierClub_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var clubId = 1;
        var format = ExportFormat.CSV;
        var options = new MemberExportOptions();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(() => _tierAwareExportService.ExportMembersAsync(clubId, format, options));

        Assert.That(exception.Message, Does.Contain("Member data export requires Expand tier subscription"));

        // Verify blocking was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Club {clubId} blocked from member export")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);

        // Verify inner service was NOT called
        _mockInnerService.Verify(x => x.ExportMembersAsync(It.IsAny<int>(), It.IsAny<ExportFormat>(), It.IsAny<MemberExportOptions>()), Times.Never);
    }

    [Test]
    public async Task ExportMembersAsync_UnlimitedTierResourceAllocationFails_PropagatesException()
    {
        // Arrange
        var clubId = 1;
        var format = ExportFormat.CSV;
        var options = new MemberExportOptions();
        var resourceException = new InvalidOperationException("Resource limit exceeded");

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ThrowsAsync(resourceException);

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(() => _tierAwareExportService.ExportMembersAsync(clubId, format, options));

        Assert.That(exception.Message, Is.EqualTo(resourceException.Message));
        _mockInnerService.Verify(x => x.ExportMembersAsync(It.IsAny<int>(), It.IsAny<ExportFormat>(), It.IsAny<MemberExportOptions>()), Times.Never);
    }

    #endregion

    #region ExportEventsAsync Tests (RED Phase)

    [Test]
    public async Task ExportEventsAsync_UnlimitedTierClub_ValidatesResourcesAndCallsInnerService()
    {
        // Arrange
        var clubId = 1;
        var format = ExportFormat.Excel;
        var options = new EventExportOptions();
        var expectedResult = new ExportResult { ExportId = "event-export-456" };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.ExportEventsAsync(clubId, format, options))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _tierAwareExportService.ExportEventsAsync(clubId, format, options);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
        _mockTierGateService.Verify(x => x.ValidateResourceAllocationAsync(
            It.Is<ResourceAllocationRequest>(r =>
                r.ClubId == clubId &&
                r.AnalyticsQueries == 7 && // Events export is more complex
                r.CacheSize == 300 &&
                r.BackgroundProcessing == true)), Times.Once);
        _mockInnerService.Verify(x => x.ExportEventsAsync(clubId, format, options), Times.Once);
    }

    [Test]
    public async Task ExportEventsAsync_BasicTierClub_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var clubId = 1;
        var format = ExportFormat.Excel;
        var options = new EventExportOptions();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(() => _tierAwareExportService.ExportEventsAsync(clubId, format, options));

        Assert.That(exception.Message, Does.Contain("Event data export requires Expand tier subscription"));

        // Verify blocking was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Club {clubId} blocked from event export")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion

    #region ExportFinancialDataAsync Tests (RED Phase)

    [Test]
    public async Task ExportFinancialDataAsync_UnlimitedTierClub_ValidatesResourcesAndCallsInnerService()
    {
        // Arrange
        var clubId = 1;
        var format = ExportFormat.PDF;
        var options = new FinancialExportOptions();
        var expectedResult = new ExportResult { ExportId = "financial-export-789" };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.ExportFinancialDataAsync(clubId, format, options))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _tierAwareExportService.ExportFinancialDataAsync(clubId, format, options);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
        _mockTierGateService.Verify(x => x.ValidateResourceAllocationAsync(
            It.Is<ResourceAllocationRequest>(r =>
                r.ClubId == clubId &&
                r.AnalyticsQueries == 10 && // Financial export requires many complex queries
                r.CacheSize == 500 && // Large cache for financial calculations
                r.BackgroundProcessing == true)), Times.Once);
        _mockInnerService.Verify(x => x.ExportFinancialDataAsync(clubId, format, options), Times.Once);
    }

    [Test]
    public async Task ExportFinancialDataAsync_BasicTierClub_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var clubId = 1;
        var format = ExportFormat.PDF;
        var options = new FinancialExportOptions();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(() => _tierAwareExportService.ExportFinancialDataAsync(clubId, format, options));

        Assert.That(exception.Message, Does.Contain("Financial data export requires Expand tier subscription"));

        // Verify blocking was logged with maximum optimization message
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Club {clubId} blocked from financial export - maximum database optimization")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion

    #region ExportAnalyticsDataAsync Tests (RED Phase)

    [Test]
    public async Task ExportAnalyticsDataAsync_UnlimitedTierClub_ValidatesResourcesAndCallsInnerService()
    {
        // Arrange
        var clubId = 1;
        var format = ExportFormat.JSON;
        var options = new AnalyticsExportOptions();
        var expectedResult = new ExportResult { ExportId = "analytics-export-abc" };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.ExportAnalyticsDataAsync(clubId, format, options))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _tierAwareExportService.ExportAnalyticsDataAsync(clubId, format, options);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
        _mockTierGateService.Verify(x => x.ValidateResourceAllocationAsync(
            It.Is<ResourceAllocationRequest>(r =>
                r.ClubId == clubId &&
                r.AnalyticsQueries == 15 && // Most complex export type
                r.CacheSize == 600 &&
                r.BackgroundProcessing == true)), Times.Once);
        _mockInnerService.Verify(x => x.ExportAnalyticsDataAsync(clubId, format, options), Times.Once);
    }

    [Test]
    public async Task ExportAnalyticsDataAsync_BasicTierClub_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var clubId = 1;
        var format = ExportFormat.JSON;
        var options = new AnalyticsExportOptions();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(() => _tierAwareExportService.ExportAnalyticsDataAsync(clubId, format, options));

        Assert.That(exception.Message, Does.Contain("Analytics data export requires Expand tier subscription"));

        // Verify blocking was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Club {clubId} blocked from analytics export")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion

    #region GetExportHistoryAsync Tests (RED Phase)

    [Test]
    public async Task GetExportHistoryAsync_UnlimitedTierClub_ReturnsHistory()
    {
        // Arrange
        var clubId = 1;
        var limit = 25;
        var expectedHistory = new List<ExportHistoryItem> { new ExportHistoryItem() };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetExportHistoryAsync(clubId, limit))
            .ReturnsAsync(expectedHistory);

        // Act
        var result = await _tierAwareExportService.GetExportHistoryAsync(clubId, limit);

        // Assert
        Assert.That(result, Is.EqualTo(expectedHistory));
        _mockInnerService.Verify(x => x.GetExportHistoryAsync(clubId, limit), Times.Once);
    }

    [Test]
    public async Task GetExportHistoryAsync_BasicTierClub_ReturnsEmptyList()
    {
        // Arrange
        var clubId = 1;
        var limit = 25;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _tierAwareExportService.GetExportHistoryAsync(clubId, limit);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Empty);

        // Verify inner service was NOT called
        _mockInnerService.Verify(x => x.GetExportHistoryAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region GetExportStatusAsync Tests (RED Phase)

    [Test]
    public async Task GetExportStatusAsync_UnlimitedTierClub_ReturnsStatus()
    {
        // Arrange
        var exportId = "test-export-123";
        var clubId = 1;
        var expectedStatus = ExportStatus.Completed;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetExportStatusAsync(exportId, clubId))
            .ReturnsAsync(expectedStatus);

        // Act
        var result = await _tierAwareExportService.GetExportStatusAsync(exportId, clubId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedStatus));
        _mockInnerService.Verify(x => x.GetExportStatusAsync(exportId, clubId), Times.Once);
    }

    [Test]
    public async Task GetExportStatusAsync_BasicTierClub_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var exportId = "test-export-123";
        var clubId = 1;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(() => _tierAwareExportService.GetExportStatusAsync(exportId, clubId));

        Assert.That(exception.Message, Does.Contain("Export status requires Expand tier subscription"));
        _mockInnerService.Verify(x => x.GetExportStatusAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region CancelExportAsync Tests (RED Phase)

    [Test]
    public async Task CancelExportAsync_UnlimitedTierClub_ReturnsResult()
    {
        // Arrange
        var exportId = "test-export-123";
        var clubId = 1;
        var expectedResult = true;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.CancelExportAsync(exportId, clubId))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _tierAwareExportService.CancelExportAsync(exportId, clubId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
        _mockInnerService.Verify(x => x.CancelExportAsync(exportId, clubId), Times.Once);
    }

    [Test]
    public async Task CancelExportAsync_BasicTierClub_ReturnsFalse()
    {
        // Arrange
        var exportId = "test-export-123";
        var clubId = 1;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _tierAwareExportService.CancelExportAsync(exportId, clubId);

        // Assert
        Assert.That(result, Is.False);
        _mockInnerService.Verify(x => x.CancelExportAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region DownloadExportAsync Tests (RED Phase)

    [Test]
    public async Task DownloadExportAsync_UnlimitedTierClub_ReturnsStream()
    {
        // Arrange
        var exportId = "test-export-123";
        var clubId = 1;
        var expectedStream = new MemoryStream();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.DownloadExportAsync(exportId, clubId))
            .ReturnsAsync(expectedStream);

        // Act
        var result = await _tierAwareExportService.DownloadExportAsync(exportId, clubId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedStream));
        _mockInnerService.Verify(x => x.DownloadExportAsync(exportId, clubId), Times.Once);
    }

    [Test]
    public async Task DownloadExportAsync_BasicTierClub_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var exportId = "test-export-123";
        var clubId = 1;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(() => _tierAwareExportService.DownloadExportAsync(exportId, clubId));

        Assert.That(exception.Message, Does.Contain("Export download requires Expand tier subscription"));

        // Verify blocking was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Club {clubId} blocked from export download - preventing file access")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);

        _mockInnerService.Verify(x => x.DownloadExportAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region GetAvailableFormatsAsync Tests (RED Phase)

    [Test]
    public async Task GetAvailableFormatsAsync_ReturnsFormatsFromInnerService()
    {
        // Arrange
        var dataType = "members";
        var expectedFormats = new List<ExportFormatInfo> { new ExportFormatInfo() };

        _mockInnerService.Setup(x => x.GetAvailableFormatsAsync(dataType))
            .ReturnsAsync(expectedFormats);

        // Act
        var result = await _tierAwareExportService.GetAvailableFormatsAsync(dataType);

        // Assert
        Assert.That(result, Is.EqualTo(expectedFormats));
        _mockInnerService.Verify(x => x.GetAvailableFormatsAsync(dataType), Times.Once);

        // This method should NOT validate tier since it doesn't have club context
        _mockTierGateService.Verify(x => x.ValidateUnlimitedAccessAsync(It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region ValidateExportOptionsAsync Tests (RED Phase)

    [Test]
    public async Task ValidateExportOptionsAsync_UnlimitedTierClub_ReturnsValidationResult()
    {
        // Arrange
        var clubId = 1;
        var dataType = "members";
        var format = ExportFormat.CSV;
        var options = new MemberExportOptions();
        var expectedResult = new ExportValidationResult { IsValid = true };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.ValidateExportOptionsAsync(clubId, dataType, format, options))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _tierAwareExportService.ValidateExportOptionsAsync(clubId, dataType, format, options);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
        _mockInnerService.Verify(x => x.ValidateExportOptionsAsync(clubId, dataType, format, options), Times.Once);
    }

    [Test]
    public async Task ValidateExportOptionsAsync_BasicTierClub_ReturnsInvalidResult()
    {
        // Arrange
        var clubId = 1;
        var dataType = "members";
        var format = ExportFormat.CSV;
        var options = new MemberExportOptions();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _tierAwareExportService.ValidateExportOptionsAsync(clubId, dataType, format, options);

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.Errors.First(), Does.Contain("Export functionality requires Expand tier subscription"));
        _mockInnerService.Verify(x => x.ValidateExportOptionsAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<ExportFormat>(), It.IsAny<object>()), Times.Never);
    }

    #endregion

    #region GetExportQuotaAsync Tests (RED Phase)

    [Test]
    public async Task GetExportQuotaAsync_UnlimitedTierClub_ReturnsQuota()
    {
        // Arrange
        var clubId = 1;
        var expectedQuota = new ExportQuota
        {
            MaxExportsPerDay = 100,
            MaxExportsPerMonth = 1000,
            MaxFileSizeBytes = 1073741824 // 1GB
        };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetExportQuotaAsync(clubId))
            .ReturnsAsync(expectedQuota);

        // Act
        var result = await _tierAwareExportService.GetExportQuotaAsync(clubId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedQuota));
        _mockInnerService.Verify(x => x.GetExportQuotaAsync(clubId), Times.Once);
    }

    [Test]
    public async Task GetExportQuotaAsync_BasicTierClub_ReturnsZeroQuota()
    {
        // Arrange
        var clubId = 1;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _tierAwareExportService.GetExportQuotaAsync(clubId);

        // Assert
        Assert.That(result.MaxExportsPerDay, Is.EqualTo(0));
        Assert.That(result.MaxExportsPerMonth, Is.EqualTo(0));
        Assert.That(result.MaxFileSizeBytes, Is.EqualTo(0));
        Assert.That(result.UsedExportsToday, Is.EqualTo(0));
        Assert.That(result.UsedExportsThisMonth, Is.EqualTo(0));

        _mockInnerService.Verify(x => x.GetExportQuotaAsync(It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region ScheduleBackgroundExportAsync Tests (RED Phase)

    [Test]
    public async Task ScheduleBackgroundExportAsync_UnlimitedTierClub_WithBackgroundProcessingEnabled_ReturnsExportId()
    {
        // Arrange
        var clubId = 1;
        var request = new BackgroundExportRequest();
        var expectedExportId = "background-export-xyz";

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ShouldEnableBackgroundProcessingAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.ScheduleBackgroundExportAsync(clubId, request))
            .ReturnsAsync(expectedExportId);

        // Act
        var result = await _tierAwareExportService.ScheduleBackgroundExportAsync(clubId, request);

        // Assert
        Assert.That(result, Is.EqualTo(expectedExportId));
        _mockTierGateService.Verify(x => x.ValidateUnlimitedAccessAsync(clubId), Times.Once);
        _mockTierGateService.Verify(x => x.ShouldEnableBackgroundProcessingAsync(clubId), Times.Once);
        _mockInnerService.Verify(x => x.ScheduleBackgroundExportAsync(clubId, request), Times.Once);
    }

    [Test]
    public async Task ScheduleBackgroundExportAsync_BasicTierClub_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var clubId = 1;
        var request = new BackgroundExportRequest();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(() => _tierAwareExportService.ScheduleBackgroundExportAsync(clubId, request));

        Assert.That(exception.Message, Does.Contain("Background exports require Expand tier subscription"));

        // Verify blocking was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Club {clubId} blocked from background export scheduling")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);

        _mockInnerService.Verify(x => x.ScheduleBackgroundExportAsync(It.IsAny<int>(), It.IsAny<BackgroundExportRequest>()), Times.Never);
    }

    [Test]
    public async Task ScheduleBackgroundExportAsync_UnlimitedTierClub_BackgroundProcessingDisabled_ThrowsInvalidOperationException()
    {
        // Arrange
        var clubId = 1;
        var request = new BackgroundExportRequest();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ShouldEnableBackgroundProcessingAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(() => _tierAwareExportService.ScheduleBackgroundExportAsync(clubId, request));

        Assert.That(exception.Message, Does.Contain("Background processing is not enabled for this club"));

        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Club {clubId} blocked from background export - background processing not enabled")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);

        _mockInnerService.Verify(x => x.ScheduleBackgroundExportAsync(It.IsAny<int>(), It.IsAny<BackgroundExportRequest>()), Times.Never);
    }

    #endregion

    #region Resource Allocation Validation Tests (RED Phase)

    [TestCase(5, 200, true)] // Member export
    [TestCase(7, 300, true)] // Event export
    [TestCase(10, 500, true)] // Financial export
    [TestCase(15, 600, true)] // Analytics export
    public async Task AllExportMethods_ValidateCorrectResourceAllocation(int expectedQueries, int expectedCacheSize, bool expectedBackgroundProcessing)
    {
        // Arrange
        var clubId = 1;
        ResourceAllocationRequest capturedRequest = null;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .Callback<ResourceAllocationRequest>(r => capturedRequest = r)
            .ReturnsAsync(true);

        // Setup all export service methods to return results
        _mockInnerService.Setup(x => x.ExportMembersAsync(It.IsAny<int>(), It.IsAny<ExportFormat>(), It.IsAny<MemberExportOptions>()))
            .ReturnsAsync(new ExportResult());
        _mockInnerService.Setup(x => x.ExportEventsAsync(It.IsAny<int>(), It.IsAny<ExportFormat>(), It.IsAny<EventExportOptions>()))
            .ReturnsAsync(new ExportResult());
        _mockInnerService.Setup(x => x.ExportFinancialDataAsync(It.IsAny<int>(), It.IsAny<ExportFormat>(), It.IsAny<FinancialExportOptions>()))
            .ReturnsAsync(new ExportResult());
        _mockInnerService.Setup(x => x.ExportAnalyticsDataAsync(It.IsAny<int>(), It.IsAny<ExportFormat>(), It.IsAny<AnalyticsExportOptions>()))
            .ReturnsAsync(new ExportResult());

        // Act - Call the specific export method based on expected values
        if (expectedQueries == 5) // Member export
        {
            await _tierAwareExportService.ExportMembersAsync(clubId, ExportFormat.CSV, new MemberExportOptions());
        }
        else if (expectedQueries == 7) // Event export
        {
            await _tierAwareExportService.ExportEventsAsync(clubId, ExportFormat.Excel, new EventExportOptions());
        }
        else if (expectedQueries == 10) // Financial export
        {
            await _tierAwareExportService.ExportFinancialDataAsync(clubId, ExportFormat.PDF, new FinancialExportOptions());
        }
        else if (expectedQueries == 15) // Analytics export
        {
            await _tierAwareExportService.ExportAnalyticsDataAsync(clubId, ExportFormat.JSON, new AnalyticsExportOptions());
        }

        // Assert
        Assert.That(capturedRequest, Is.Not.Null, $"ResourceAllocationRequest should not be null for export with {expectedQueries} queries");
        Assert.That(capturedRequest.ClubId, Is.EqualTo(clubId));
        Assert.That(capturedRequest.AnalyticsQueries, Is.EqualTo(expectedQueries));
        Assert.That(capturedRequest.CacheSize, Is.EqualTo(expectedCacheSize));
        Assert.That(capturedRequest.BackgroundProcessing, Is.EqualTo(expectedBackgroundProcessing));
    }

    #endregion

    #region Performance and Resource Optimization Tests (RED Phase)

    [Test]
    public async Task AllExportMethods_BasicTier_CompleteQuicklyWithoutDatabaseAccess()
    {
        // Arrange
        var clubId = 1; // Basic tier club
        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act - Try all export methods and verify they throw UnauthorizedAccessException
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _tierAwareExportService.ExportMembersAsync(clubId, ExportFormat.CSV, new MemberExportOptions()));
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _tierAwareExportService.ExportEventsAsync(clubId, ExportFormat.Excel, new EventExportOptions()));
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _tierAwareExportService.ExportFinancialDataAsync(clubId, ExportFormat.PDF, new FinancialExportOptions()));
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _tierAwareExportService.ExportAnalyticsDataAsync(clubId, ExportFormat.JSON, new AnalyticsExportOptions()));
        stopwatch.Stop();

        // Assert - All should complete very quickly since database access was blocked
        Assert.That(stopwatch.ElapsedMilliseconds < 50, Is.True,
            $"4 blocked export operations took {stopwatch.ElapsedMilliseconds}ms, should be under 50ms for optimization");

        // Verify inner service was never called - achieving database load reduction
        _mockInnerService.Verify(x => x.ExportMembersAsync(It.IsAny<int>(), It.IsAny<ExportFormat>(), It.IsAny<MemberExportOptions>()), Times.Never);
        _mockInnerService.Verify(x => x.ExportEventsAsync(It.IsAny<int>(), It.IsAny<ExportFormat>(), It.IsAny<EventExportOptions>()), Times.Never);
        _mockInnerService.Verify(x => x.ExportFinancialDataAsync(It.IsAny<int>(), It.IsAny<ExportFormat>(), It.IsAny<FinancialExportOptions>()), Times.Never);
        _mockInnerService.Verify(x => x.ExportAnalyticsDataAsync(It.IsAny<int>(), It.IsAny<ExportFormat>(), It.IsAny<AnalyticsExportOptions>()), Times.Never);
    }

    [Test]
    public async Task GetExportHistoryAsync_BasicTier_ReturnsEmptyWithoutDatabaseQuery()
    {
        // Arrange
        var clubId = 1; // Basic tier club
        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        var result = await _tierAwareExportService.GetExportHistoryAsync(clubId, 50);

        stopwatch.Stop();

        // Assert
        Assert.That(result, Is.Empty);

        // Should complete very quickly since no database access
        Assert.That(stopwatch.ElapsedMilliseconds < 10, Is.True,
            $"Blocked export history took {stopwatch.ElapsedMilliseconds}ms, should be under 10ms");

        // Verify database was not accessed
        _mockInnerService.Verify(x => x.GetExportHistoryAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region ExportAnalyticsToPDFAsync(ExportAnalyticsRequest) Tests

    [Test]
    public async Task ExportAnalyticsToPDFAsync_ExportRequest_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateResourceAllocationAsync(It.Is<ResourceAllocationRequest>(
                r => r.ClubId == 1 && r.AnalyticsQueries == 8 && r.CacheSize == 400)))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToPDFAsync(request))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportAnalyticsToPDFAsync(request);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportAnalyticsToPDFAsync_ExportRequest_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportAnalyticsToPDFAsync(request));

        Assert.That(ex.Message, Does.Contain("PDF export requires Expand tier"));
    }

    #endregion

    #region ExportAnalyticsToExcelAsync(ExportAnalyticsRequest) Tests

    [Test]
    public async Task ExportAnalyticsToExcelAsync_ExportRequest_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateResourceAllocationAsync(It.Is<ResourceAllocationRequest>(
                r => r.ClubId == 1 && r.AnalyticsQueries == 6 && r.CacheSize == 300)))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToExcelAsync(request))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportAnalyticsToExcelAsync(request);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportAnalyticsToExcelAsync_ExportRequest_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportAnalyticsToExcelAsync(request));

        Assert.That(ex.Message, Does.Contain("Excel export requires Expand tier"));
    }

    #endregion

    #region ExportAnalyticsToCSVAsync(ExportAnalyticsRequest) Tests

    [Test]
    public async Task ExportAnalyticsToCSVAsync_ExportRequest_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateResourceAllocationAsync(It.Is<ResourceAllocationRequest>(
                r => r.ClubId == 1 && r.AnalyticsQueries == 4 && r.CacheSize == 200)))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToCSVAsync(request))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportAnalyticsToCSVAsync(request);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportAnalyticsToCSVAsync_ExportRequest_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportAnalyticsToCSVAsync(request));

        Assert.That(ex.Message, Does.Contain("CSV export requires Expand tier"));
    }

    #endregion

    #region ExportAnalyticsToPDFAsync(ExportAnalyticsRequest, int) Tests

    [Test]
    public async Task ExportAnalyticsToPDFAsync_WithUserId_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateResourceAllocationAsync(It.Is<ResourceAllocationRequest>(
                r => r.ClubId == 1 && r.AnalyticsQueries == 8 && r.CacheSize == 400)))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToPDFAsync(request))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportAnalyticsToPDFAsync(request, userId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportAnalyticsToPDFAsync_WithUserId_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportAnalyticsToPDFAsync(request, userId));

        Assert.That(ex.Message, Does.Contain("PDF export requires Expand tier"));
    }

    #endregion

    #region ExportAnalyticsToExcelAsync(ExportAnalyticsRequest, int) Tests

    [Test]
    public async Task ExportAnalyticsToExcelAsync_WithUserId_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateResourceAllocationAsync(It.Is<ResourceAllocationRequest>(
                r => r.ClubId == 1 && r.AnalyticsQueries == 6 && r.CacheSize == 300)))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToExcelAsync(request))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportAnalyticsToExcelAsync(request, userId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportAnalyticsToExcelAsync_WithUserId_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportAnalyticsToExcelAsync(request, userId));

        Assert.That(ex.Message, Does.Contain("Excel export requires Expand tier"));
    }

    #endregion

    #region ExportAnalyticsToCSVAsync(ExportAnalyticsRequest, int) Tests

    [Test]
    public async Task ExportAnalyticsToCSVAsync_WithUserId_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateResourceAllocationAsync(It.Is<ResourceAllocationRequest>(
                r => r.ClubId == 1 && r.AnalyticsQueries == 4 && r.CacheSize == 200)))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToCSVAsync(request))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportAnalyticsToCSVAsync(request, userId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportAnalyticsToCSVAsync_WithUserId_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportAnalyticsToCSVAsync(request, userId));

        Assert.That(ex.Message, Does.Contain("CSV export requires Expand tier"));
    }

    #endregion

    #region ExportToPdfAsync Tests

    [Test]
    public async Task ExportToPdfAsync_UnlimitedTier_CallsExportAnalyticsToPDFAsync()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToPDFAsync(request))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportToPdfAsync(request, userId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportToPdfAsync_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportToPdfAsync(request, userId));

        Assert.That(ex.Message, Does.Contain("PDF export requires Expand tier"));
    }

    #endregion

    #region ExportToExcelAsync Tests

    [Test]
    public async Task ExportToExcelAsync_UnlimitedTier_CallsExportAnalyticsToExcelAsync()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToExcelAsync(request))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportToExcelAsync(request, userId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportToExcelAsync_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportToExcelAsync(request, userId));

        Assert.That(ex.Message, Does.Contain("Excel export requires Expand tier"));
    }

    #endregion

    #region ExportToCsvAsync Tests

    [Test]
    public async Task ExportToCsvAsync_UnlimitedTier_CallsExportAnalyticsToCSVAsync()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockTierGateService
            .Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToCSVAsync(request))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportToCsvAsync(request, userId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportToCsvAsync_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new ExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportToCsvAsync(request, userId));

        Assert.That(ex.Message, Does.Contain("CSV export requires Expand tier"));
    }

    #endregion

    #region ExportAnalyticsToPDFAsync(AdvancedExportAnalyticsRequest) Tests

    [Test]
    public async Task ExportAnalyticsToPDFAsync_AdvancedRequest_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new AdvancedExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToPDFAsync(request, userId))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportAnalyticsToPDFAsync(request, userId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportAnalyticsToPDFAsync_AdvancedRequest_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new AdvancedExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportAnalyticsToPDFAsync(request, userId));

        Assert.That(ex.Message, Does.Contain("Advanced PDF export requires Expand tier"));
    }

    #endregion

    #region ExportAnalyticsToExcelAsync(AdvancedExportAnalyticsRequest) Tests

    [Test]
    public async Task ExportAnalyticsToExcelAsync_AdvancedRequest_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new AdvancedExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToExcelAsync(request, userId))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportAnalyticsToExcelAsync(request, userId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportAnalyticsToExcelAsync_AdvancedRequest_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new AdvancedExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportAnalyticsToExcelAsync(request, userId));

        Assert.That(ex.Message, Does.Contain("Advanced Excel export requires Expand tier"));
    }

    #endregion

    #region ExportAnalyticsToCSVAsync(AdvancedExportAnalyticsRequest) Tests

    [Test]
    public async Task ExportAnalyticsToCSVAsync_AdvancedRequest_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new AdvancedExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;
        var expectedData = new byte[] { 1, 2, 3 };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsToCSVAsync(request, userId))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _tierAwareExportService.ExportAnalyticsToCSVAsync(request, userId);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
    }

    [Test]
    public void ExportAnalyticsToCSVAsync_AdvancedRequest_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new AdvancedExportAnalyticsRequest { ClubId = 1 };
        var userId = 5;

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportAnalyticsToCSVAsync(request, userId));

        Assert.That(ex.Message, Does.Contain("Advanced CSV export requires Expand tier"));
    }

    #endregion

    #region ExportDataAsync Tests

    [Test]
    public async Task ExportDataAsync_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var clubId = 1;
        var userId = 5;
        var dataType = "Members";
        var format = "CSV";
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var expectedResult = new ExportResponseDto { DownloadUrl = "https://export.com/export123.csv" };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportDataAsync(clubId, userId, dataType, format, startDate, endDate))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _tierAwareExportService.ExportDataAsync(clubId, userId, dataType, format, startDate, endDate);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
    }

    [Test]
    public void ExportDataAsync_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var clubId = 1;
        var userId = 5;
        var dataType = "Members";
        var format = "CSV";
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportDataAsync(clubId, userId, dataType, format, startDate, endDate));

        Assert.That(ex.Message, Does.Contain("Data export requires Expand tier"));
    }

    #endregion

    #region ExportFinancialsAsync(ExportRequestDto) Tests

    [Test]
    public async Task ExportFinancialsAsync_ExportRequestDto_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.Export.ExportRequestDto { ClubId = 1, Format = ExportFormat.PDF };
        var expectedResult = new ExportResult { ExportId = "export123" };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportFinancialsAsync(request))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _tierAwareExportService.ExportFinancialsAsync(request);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
    }

    [Test]
    public void ExportFinancialsAsync_ExportRequestDto_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.Export.ExportRequestDto { ClubId = 1, Format = ExportFormat.PDF };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportFinancialsAsync(request));

        Assert.That(ex.Message, Does.Contain("Financial export requires Expand tier"));
    }

    #endregion

    #region ExportMembersAsync(ExportRequestDto) Tests

    [Test]
    public async Task ExportMembersAsync_ExportRequestDto_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.Export.ExportRequestDto { ClubId = 1, Format = ExportFormat.CSV };
        var expectedResult = new ExportResult { ExportId = "export456" };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportMembersAsync(request))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _tierAwareExportService.ExportMembersAsync(request);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
    }

    [Test]
    public void ExportMembersAsync_ExportRequestDto_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.Export.ExportRequestDto { ClubId = 1, Format = ExportFormat.CSV };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportMembersAsync(request));

        Assert.That(ex.Message, Does.Contain("Member export requires Expand tier"));
    }

    #endregion

    #region ExportEventsAsync(ExportRequestDto) Tests

    [Test]
    public async Task ExportEventsAsync_ExportRequestDto_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.Export.ExportRequestDto { ClubId = 1, Format = ExportFormat.Excel };
        var expectedResult = new ExportResult { ExportId = "export789" };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportEventsAsync(request))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _tierAwareExportService.ExportEventsAsync(request);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
    }

    [Test]
    public void ExportEventsAsync_ExportRequestDto_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.Export.ExportRequestDto { ClubId = 1, Format = ExportFormat.Excel };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportEventsAsync(request));

        Assert.That(ex.Message, Does.Contain("Events export requires Expand tier"));
    }

    #endregion

    #region ExportAnalyticsAsync(ExportRequestDto) Tests

    [Test]
    public async Task ExportAnalyticsAsync_ExportRequestDto_UnlimitedTier_ReturnsResult()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.Export.ExportRequestDto { ClubId = 1, Format = ExportFormat.CSV };
        var expectedResult = new ExportResult { ExportId = "export999" };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        _mockInnerService
            .Setup(x => x.ExportAnalyticsAsync(request))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _tierAwareExportService.ExportAnalyticsAsync(request);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
    }

    [Test]
    public void ExportAnalyticsAsync_ExportRequestDto_BasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.Export.ExportRequestDto { ClubId = 1, Format = ExportFormat.CSV };

        _mockTierGateService
            .Setup(x => x.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _tierAwareExportService.ExportAnalyticsAsync(request));

        Assert.That(ex.Message, Does.Contain("Analytics export requires Expand tier"));
    }

    #endregion
}