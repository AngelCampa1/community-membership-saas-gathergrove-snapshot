using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class ExportControllerTests
{
    private Mock<IMemberDataExportService> _memberExportServiceMock = null!;
    private Mock<IFinancialExportService> _financialExportServiceMock = null!;
    private Mock<IEventReportsService> _eventReportsServiceMock = null!;
    private Mock<IScheduledReportsService> _scheduledReportsServiceMock = null!;
    private Mock<IClubAuthorizationService> _clubAuthorizationServiceMock = null!;
    private Mock<ILogger<ExportController>> _loggerMock = null!;
    private ExportController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _memberExportServiceMock = new Mock<IMemberDataExportService>();
        _financialExportServiceMock = new Mock<IFinancialExportService>();
        _eventReportsServiceMock = new Mock<IEventReportsService>();
        _scheduledReportsServiceMock = new Mock<IScheduledReportsService>();
        _clubAuthorizationServiceMock = new Mock<IClubAuthorizationService>();
        _clubAuthorizationServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<int>()))
            .ReturnsAsync(true);
        _clubAuthorizationServiceMock
            .Setup(s => s.GetClubIdFromClaims(It.IsAny<ClaimsPrincipal>()))
            .Returns(1);
        _loggerMock = new Mock<ILogger<ExportController>>();

        _controller = new ExportController(
            _memberExportServiceMock.Object,
            _financialExportServiceMock.Object,
            _eventReportsServiceMock.Object,
            _scheduledReportsServiceMock.Object,
            _clubAuthorizationServiceMock.Object,
            _loggerMock.Object);

        SetupControllerContext();
    }

    private void SetupControllerContext(string userId = "1")
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Role, "Admin"),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region ExportMembers Tests

    [Test]
    public async Task ExportMembers_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var clubId = 1;
        var request = new MemberExportRequest
        {
            Format = ExportFormat.Excel,
            IncludePersonalInfo = true,
            IncludeMembershipDetails = true
        };
        var result = new ExportResult
        {
            ExportId = "export-123",
            Status = ExportStatus.Completed,
            FileName = "members.xlsx",
            FileSizeBytes = 102400
        };
        _memberExportServiceMock
            .Setup(s => s.ExportMembersAsync(clubId, request))
            .ReturnsAsync(result);

        // Act
        var response = await _controller.ExportMembers(clubId, request);

        // Assert
        var okResult = response as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(result);
    }

    [Test]
    public async Task ExportMembers_AdminFromDifferentClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 2;
        var request = new MemberExportRequest();
        _clubAuthorizationServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var response = await _controller.ExportMembers(clubId, request);

        // Assert
        response.Should().BeOfType<ForbidResult>();
        _memberExportServiceMock.Verify(s => s.ExportMembersAsync(It.IsAny<int>(), It.IsAny<MemberExportRequest>()), Times.Never);
    }

    [Test]
    public async Task ExportMembers_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new MemberExportRequest();
        _memberExportServiceMock
            .Setup(s => s.ExportMembersAsync(clubId, request))
            .ThrowsAsync(new UnauthorizedAccessException());

        // Act
        var response = await _controller.ExportMembers(clubId, request);

        // Assert
        response.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task ExportMembers_ServiceUnavailable_Returns503()
    {
        // Arrange
        var clubId = 1;
        var request = new MemberExportRequest();
        _memberExportServiceMock
            .Setup(s => s.ExportMembersAsync(clubId, request))
            .ThrowsAsync(new GatherGrove.Domain.Exceptions.ServiceUnavailableException("Export service down"));

        // Act
        var response = await _controller.ExportMembers(clubId, request);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(503);
    }

    [Test]
    public async Task ExportMembers_Exception_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new MemberExportRequest();
        _memberExportServiceMock
            .Setup(s => s.ExportMembersAsync(clubId, request))
            .ThrowsAsync(new Exception("Export failed"));

        // Act
        var response = await _controller.ExportMembers(clubId, request);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetExportStatus Tests

    [Test]
    public async Task GetExportStatus_ValidExportId_ReturnsOkWithStatus()
    {
        // Arrange
        var clubId = 1;
        var exportId = "export-123";
        var status = new ExportStatusResponse
        {
            ExportId = exportId,
            Status = ExportStatus.Processing,
            ProgressPercentage = 75,
            Progress = 75
        };
        _memberExportServiceMock
            .Setup(s => s.GetExportStatus(exportId, clubId))
            .ReturnsAsync(status);

        // Act
        var response = await _controller.GetExportStatus(clubId, exportId);

        // Assert
        var okResult = response as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(status);
    }

    [Test]
    public async Task GetExportStatus_Exception_Returns500()
    {
        // Arrange
        var clubId = 1;
        var exportId = "export-123";
        _memberExportServiceMock
            .Setup(s => s.GetExportStatus(exportId, clubId))
            .ThrowsAsync(new Exception("Status check failed"));

        // Act
        var response = await _controller.GetExportStatus(clubId, exportId);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region DownloadExport Tests

    [Test]
    public async Task DownloadExport_ValidExportId_ReturnsFile()
    {
        // Arrange
        var clubId = 1;
        var exportId = "export-123";
        var stream = new MemoryStream(new byte[] { 1, 2, 3, 4 });
        var fileName = "members.xlsx";
        _memberExportServiceMock
            .Setup(s => s.DownloadExportAsync(exportId, clubId))
            .ReturnsAsync(stream);
        _memberExportServiceMock
            .Setup(s => s.GetExportFileName(exportId))
            .Returns(fileName);

        // Act
        var response = await _controller.DownloadExport(clubId, exportId);

        // Assert
        var fileResult = response as FileStreamResult;
        fileResult.Should().NotBeNull();
        fileResult!.FileStream.Should().NotBeNull();
        fileResult.FileDownloadName.Should().Be(fileName);
        fileResult.ContentType.Should().Be("application/octet-stream");
    }

    [Test]
    public async Task DownloadExport_NullStream_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var exportId = "export-123";
        _memberExportServiceMock
            .Setup(s => s.DownloadExportAsync(exportId, clubId))
            .ReturnsAsync((Stream?)null);

        // Act
        var response = await _controller.DownloadExport(clubId, exportId);

        // Assert
        response.Should().BeOfType<NotFoundResult>();
    }

    [Test]
    public async Task DownloadExport_FileNotFoundException_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var exportId = "export-123";
        _memberExportServiceMock
            .Setup(s => s.DownloadExportAsync(exportId, clubId))
            .ThrowsAsync(new FileNotFoundException("Export file not found"));

        // Act
        var response = await _controller.DownloadExport(clubId, exportId);

        // Assert
        response.Should().BeOfType<NotFoundResult>();
    }

    [Test]
    public async Task DownloadExport_Exception_Returns500()
    {
        // Arrange
        var clubId = 1;
        var exportId = "export-123";
        _memberExportServiceMock
            .Setup(s => s.DownloadExportAsync(exportId, clubId))
            .ThrowsAsync(new Exception("Download failed"));

        // Act
        var response = await _controller.DownloadExport(clubId, exportId);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region ExportFinancialData Tests

    [Test]
    public async Task ExportFinancialData_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var clubId = 1;
        var request = new FinancialExportRequest
        {
            Format = ExportFormat.Excel,
            ReportType = "Revenue",
            IncludeRevenue = true,
            IncludeExpenses = true,
            DateFrom = DateTime.UtcNow.AddMonths(-1),
            DateTo = DateTime.UtcNow
        };
        var result = new ExportResult
        {
            ExportId = "export-fin-123",
            Status = ExportStatus.Completed,
            FileName = "financial.xlsx"
        };
        _financialExportServiceMock
            .Setup(s => s.ExportFinancialDataAsync(clubId, request))
            .ReturnsAsync(result);

        // Act
        var response = await _controller.ExportFinancialData(clubId, request);

        // Assert
        var okResult = response as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(result);
    }

    [Test]
    public async Task ExportFinancialData_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new FinancialExportRequest();
        _financialExportServiceMock
            .Setup(s => s.ExportFinancialDataAsync(clubId, request))
            .ThrowsAsync(new UnauthorizedAccessException());

        // Act
        var response = await _controller.ExportFinancialData(clubId, request);

        // Assert
        response.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task ExportFinancialData_Exception_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new FinancialExportRequest();
        _financialExportServiceMock
            .Setup(s => s.ExportFinancialDataAsync(clubId, request))
            .ThrowsAsync(new Exception("Financial export failed"));

        // Act
        var response = await _controller.ExportFinancialData(clubId, request);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region ExportEventAnalytics Tests

    [Test]
    public async Task ExportEventAnalytics_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var clubId = 1;
        var request = new EventExportRequest
        {
            Format = ExportFormat.Excel,
            IncludeAttendanceData = true,
            IncludeEngagementMetrics = true,
            EventTypes = new List<string> { "Conference", "Workshop" },
            DateFrom = DateTime.UtcNow.AddMonths(-1),
            DateTo = DateTime.UtcNow
        };
        var exportId = "export-event-123";
        _eventReportsServiceMock
            .Setup(s => s.ScheduleEventAnalyticsExport(clubId, It.IsAny<EventExportOptions>()))
            .ReturnsAsync(exportId);

        // Act
        var response = await _controller.ExportEventAnalytics(clubId, request);

        // Assert
        var okResult = response as OkObjectResult;
        okResult.Should().NotBeNull();
        var resultValue = okResult!.Value as ExportResult;
        resultValue.Should().NotBeNull();
        resultValue!.ExportId.Should().Be(exportId);
        resultValue.Status.Should().Be(ExportStatus.Completed);
    }

    [Test]
    public async Task ExportEventAnalytics_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new EventExportRequest();
        _eventReportsServiceMock
            .Setup(s => s.ScheduleEventAnalyticsExport(clubId, It.IsAny<EventExportOptions>()))
            .ThrowsAsync(new UnauthorizedAccessException());

        // Act
        var response = await _controller.ExportEventAnalytics(clubId, request);

        // Assert
        response.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task ExportEventAnalytics_Exception_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new EventExportRequest();
        _eventReportsServiceMock
            .Setup(s => s.ScheduleEventAnalyticsExport(clubId, It.IsAny<EventExportOptions>()))
            .ThrowsAsync(new Exception("Event analytics export failed"));

        // Act
        var response = await _controller.ExportEventAnalytics(clubId, request);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region CreateScheduledReport Tests

    [Test]
    public async Task CreateScheduledReport_ValidRequest_ReturnsCreatedWithResult()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateScheduledReportRequest
        {
            ReportName = "Monthly Members Report",
            ReportType = "Members",
            Format = ExportFormat.Excel,
            Frequency = ReportFrequency.Monthly,
            Recipients = new List<string> { "admin@example.com" },
            DeliveryTime = new TimeSpan(9, 0, 0),
            IsActive = true
        };
        var result = new ScheduledReportResult
        {
            ScheduleId = "schedule-123",
            Status = "Active",
            ReportName = "Monthly Members Report",
            NextRunDate = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };
        _scheduledReportsServiceMock
            .Setup(s => s.CreateScheduledReport(clubId, It.IsAny<ScheduledReportRequest>(), 1))
            .ReturnsAsync(result);

        // Act
        var response = await _controller.CreateScheduledReport(clubId, request);

        // Assert
        var createdResult = response as CreatedAtActionResult;
        createdResult.Should().NotBeNull();
        createdResult!.Value.Should().BeEquivalentTo(result);
        createdResult.ActionName.Should().Be(nameof(_controller.GetScheduledReports));
    }

    [Test]
    public async Task CreateScheduledReport_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateScheduledReportRequest();
        _scheduledReportsServiceMock
            .Setup(s => s.CreateScheduledReport(clubId, It.IsAny<ScheduledReportRequest>(), 1))
            .ThrowsAsync(new UnauthorizedAccessException());

        // Act
        var response = await _controller.CreateScheduledReport(clubId, request);

        // Assert
        response.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task CreateScheduledReport_Exception_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateScheduledReportRequest();
        _scheduledReportsServiceMock
            .Setup(s => s.CreateScheduledReport(clubId, It.IsAny<ScheduledReportRequest>(), 1))
            .ThrowsAsync(new Exception("Scheduled report creation failed"));

        // Act
        var response = await _controller.CreateScheduledReport(clubId, request);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(500);
    }

    [Test]
    public async Task CreateScheduledReport_UsesAuthenticatedUserId()
    {
        // Arrange
        var clubId = 1;
        var userId = 42;
        SetupControllerContext(userId.ToString());
        var request = new CreateScheduledReportRequest
        {
            ReportName = "Monthly Members Report",
            ReportType = "Members",
            Format = ExportFormat.Excel,
            Frequency = ReportFrequency.Monthly,
            Recipients = new List<string> { "admin@example.com" },
            DeliveryTime = new TimeSpan(9, 0, 0),
            IsActive = true
        };
        var result = new ScheduledReportResult
        {
            ScheduleId = "schedule-123",
            Status = "Active",
            ReportName = "Monthly Members Report"
        };
        _scheduledReportsServiceMock
            .Setup(s => s.CreateScheduledReport(clubId, It.IsAny<ScheduledReportRequest>(), userId))
            .ReturnsAsync(result);

        // Act
        var response = await _controller.CreateScheduledReport(clubId, request);

        // Assert
        response.Should().BeOfType<CreatedAtActionResult>();
        _scheduledReportsServiceMock.Verify(
            s => s.CreateScheduledReport(clubId, It.IsAny<ScheduledReportRequest>(), userId),
            Times.Once);
        _scheduledReportsServiceMock.Verify(
            s => s.CreateScheduledReport(clubId, It.IsAny<ScheduledReportRequest>(), 1),
            Times.Never);
    }

    [Test]
    public async Task CreateScheduledReport_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;
        SetupControllerContext("not-an-int");

        // Act
        var response = await _controller.CreateScheduledReport(clubId, new CreateScheduledReportRequest());

        // Assert
        response.Should().BeOfType<UnauthorizedResult>();
        _scheduledReportsServiceMock.Verify(
            s => s.CreateScheduledReport(It.IsAny<int>(), It.IsAny<ScheduledReportRequest>(), It.IsAny<int>()),
            Times.Never);
    }

    #endregion

    #region GetScheduledReports Tests

    [Test]
    public async Task GetScheduledReports_ValidClubId_ReturnsOkWithReports()
    {
        // Arrange
        var clubId = 1;
        var reports = new List<ScheduledReport>
        {
            new ScheduledReport
            {
                Id = "schedule-1",
                ClubId = clubId,
                ReportName = "Weekly Members",
                ReportType = "Members",
                IsActive = true
            },
            new ScheduledReport
            {
                Id = "schedule-2",
                ClubId = clubId,
                ReportName = "Monthly Financial",
                ReportType = "Financial",
                IsActive = true
            }
        };
        _scheduledReportsServiceMock
            .Setup(s => s.GetScheduledReports(clubId))
            .ReturnsAsync(reports);

        // Act
        var response = await _controller.GetScheduledReports(clubId);

        // Assert
        var okResult = response as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(reports);
    }

    [Test]
    public async Task GetScheduledReports_Exception_Returns500()
    {
        // Arrange
        var clubId = 1;
        _scheduledReportsServiceMock
            .Setup(s => s.GetScheduledReports(clubId))
            .ThrowsAsync(new Exception("Failed to get scheduled reports"));

        // Act
        var response = await _controller.GetScheduledReports(clubId);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(500);
    }

    [Test]
    public async Task GetScheduledReportsAlternative_ValidClubId_ReturnsOkWithReports()
    {
        // Arrange
        var clubId = 1;
        var reports = new List<ScheduledReport>
        {
            new ScheduledReport
            {
                Id = "schedule-1",
                ClubId = clubId,
                ReportName = "Weekly Members",
                IsActive = true
            }
        };
        _scheduledReportsServiceMock
            .Setup(s => s.GetScheduledReports(clubId))
            .ReturnsAsync(reports);

        // Act
        var response = await _controller.GetScheduledReportsAlternative(clubId);

        // Assert
        var okResult = response as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(reports);
    }

    #endregion

    #region UpdateScheduledReport Tests

    [Test]
    public async Task UpdateScheduledReport_ValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var scheduleId = "schedule-123";
        var request = new UpdateScheduledReportRequest
        {
            ReportName = "Updated Report Name",
            IsActive = false
        };
        var updatedReport = new ScheduledReport
        {
            Id = scheduleId,
            ReportName = "Updated Report Name",
            IsActive = false,
            NextRunDate = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };
        _scheduledReportsServiceMock
            .Setup(s => s.UpdateScheduledReport(scheduleId, 1, request))
            .ReturnsAsync(updatedReport);

        // Act
        var response = await _controller.UpdateScheduledReport(scheduleId, request);

        // Assert
        var okResult = response as OkObjectResult;
        okResult.Should().NotBeNull();
        var resultValue = okResult!.Value as ScheduledReportResult;
        resultValue.Should().NotBeNull();
        resultValue!.ScheduleId.Should().Be(scheduleId);
        resultValue.Status.Should().Be("Inactive");
        resultValue.ReportName.Should().Be("Updated Report Name");
    }

    [Test]
    public async Task UpdateScheduledReport_NotFound_ReturnsNotFound()
    {
        // Arrange
        var scheduleId = "schedule-999";
        var request = new UpdateScheduledReportRequest();
        _scheduledReportsServiceMock
            .Setup(s => s.UpdateScheduledReport(scheduleId, 1, request))
            .ThrowsAsync(new KeyNotFoundException());

        // Act
        var response = await _controller.UpdateScheduledReport(scheduleId, request);

        // Assert
        response.Should().BeOfType<NotFoundResult>();
    }

    [Test]
    public async Task UpdateScheduledReport_Exception_Returns500()
    {
        // Arrange
        var scheduleId = "schedule-123";
        var request = new UpdateScheduledReportRequest();
        _scheduledReportsServiceMock
            .Setup(s => s.UpdateScheduledReport(scheduleId, 1, request))
            .ThrowsAsync(new Exception("Update failed"));

        // Act
        var response = await _controller.UpdateScheduledReport(scheduleId, request);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region RemoveScheduledReport Tests

    [Test]
    public async Task RemoveScheduledReport_ValidScheduleId_ReturnsNoContent()
    {
        // Arrange
        var scheduleId = "schedule-123";
        _scheduledReportsServiceMock
            .Setup(s => s.DeleteScheduledReport(scheduleId, 1))
            .ReturnsAsync(true);

        // Act
        var response = await _controller.RemoveScheduledReport(scheduleId);

        // Assert
        response.Should().BeOfType<NoContentResult>();
    }

    [Test]
    public async Task RemoveScheduledReport_NotFound_ReturnsNotFound()
    {
        // Arrange
        var scheduleId = "schedule-999";
        _scheduledReportsServiceMock
            .Setup(s => s.DeleteScheduledReport(scheduleId, 1))
            .ReturnsAsync(false);

        // Act
        var response = await _controller.RemoveScheduledReport(scheduleId);

        // Assert
        response.Should().BeOfType<NotFoundResult>();
    }

    [Test]
    public async Task RemoveScheduledReport_KeyNotFoundException_ReturnsNotFound()
    {
        // Arrange
        var scheduleId = "schedule-999";
        _scheduledReportsServiceMock
            .Setup(s => s.DeleteScheduledReport(scheduleId, 1))
            .ThrowsAsync(new KeyNotFoundException());

        // Act
        var response = await _controller.RemoveScheduledReport(scheduleId);

        // Assert
        response.Should().BeOfType<NotFoundResult>();
    }

    [Test]
    public async Task RemoveScheduledReport_Exception_Returns500()
    {
        // Arrange
        var scheduleId = "schedule-123";
        _scheduledReportsServiceMock
            .Setup(s => s.DeleteScheduledReport(scheduleId, 1))
            .ThrowsAsync(new Exception("Deletion failed"));

        // Act
        var response = await _controller.RemoveScheduledReport(scheduleId);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region RunScheduledReport Tests

    [Test]
    public async Task RunScheduledReport_ValidScheduleId_ReturnsOkWithResult()
    {
        // Arrange
        var scheduleId = "schedule-123";
        var result = new ReportExecutionResult
        {
            ScheduleId = scheduleId,
            ExecutionId = "exec-123"
        };
        _scheduledReportsServiceMock
            .Setup(s => s.ExecuteScheduledReport(scheduleId))
            .ReturnsAsync(result);

        // Act
        var response = await _controller.RunScheduledReport(scheduleId);

        // Assert
        var okResult = response as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(result);
    }

    [Test]
    public async Task RunScheduledReport_NotFound_ReturnsNotFound()
    {
        // Arrange
        var scheduleId = "schedule-999";
        _scheduledReportsServiceMock
            .Setup(s => s.ExecuteScheduledReport(scheduleId))
            .ThrowsAsync(new KeyNotFoundException());

        // Act
        var response = await _controller.RunScheduledReport(scheduleId);

        // Assert
        response.Should().BeOfType<NotFoundResult>();
    }

    [Test]
    public async Task RunScheduledReport_Exception_Returns500()
    {
        // Arrange
        var scheduleId = "schedule-123";
        _scheduledReportsServiceMock
            .Setup(s => s.ExecuteScheduledReport(scheduleId))
            .ThrowsAsync(new Exception("Run failed"));

        // Act
        var response = await _controller.RunScheduledReport(scheduleId);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetScheduledReportHistory Tests

    [Test]
    public async Task GetScheduledReportHistory_ValidScheduleId_ReturnsOkWithHistory()
    {
        // Arrange
        var scheduleId = "schedule-123";
        var history = new List<GatherGrove.Domain.Entities.ReportExecutionHistory>
        {
            new GatherGrove.Domain.Entities.ReportExecutionHistory { ScheduleId = scheduleId },
            new GatherGrove.Domain.Entities.ReportExecutionHistory { ScheduleId = scheduleId }
        };
        _scheduledReportsServiceMock
            .Setup(s => s.GetScheduledReportHistory(scheduleId, 50))
            .ReturnsAsync(history);

        // Act
        var response = await _controller.GetScheduledReportHistory(scheduleId);

        // Assert
        var okResult = response as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(history);
    }

    [Test]
    public async Task GetScheduledReportHistory_DefaultLimit_PassesFiftyToService()
    {
        // Arrange
        var scheduleId = "schedule-123";
        _scheduledReportsServiceMock
            .Setup(s => s.GetScheduledReportHistory(scheduleId, It.IsAny<int>()))
            .ReturnsAsync(new List<GatherGrove.Domain.Entities.ReportExecutionHistory>());

        // Act
        await _controller.GetScheduledReportHistory(scheduleId);

        // Assert
        _scheduledReportsServiceMock.Verify(s => s.GetScheduledReportHistory(scheduleId, 50), Times.Once);
    }

    [Test]
    public async Task GetScheduledReportHistory_CustomLimit_PassesLimitToService()
    {
        // Arrange
        var scheduleId = "schedule-123";
        var limit = 10;
        _scheduledReportsServiceMock
            .Setup(s => s.GetScheduledReportHistory(scheduleId, It.IsAny<int>()))
            .ReturnsAsync(new List<GatherGrove.Domain.Entities.ReportExecutionHistory>());

        // Act
        await _controller.GetScheduledReportHistory(scheduleId, limit);

        // Assert
        _scheduledReportsServiceMock.Verify(s => s.GetScheduledReportHistory(scheduleId, limit), Times.Once);
    }

    [Test]
    public async Task GetScheduledReportHistory_NotFound_ReturnsNotFound()
    {
        // Arrange
        var scheduleId = "schedule-999";
        _scheduledReportsServiceMock
            .Setup(s => s.GetScheduledReportHistory(scheduleId, It.IsAny<int>()))
            .ThrowsAsync(new KeyNotFoundException());

        // Act
        var response = await _controller.GetScheduledReportHistory(scheduleId);

        // Assert
        response.Should().BeOfType<NotFoundResult>();
    }

    [Test]
    public async Task GetScheduledReportHistory_Exception_Returns500()
    {
        // Arrange
        var scheduleId = "schedule-123";
        _scheduledReportsServiceMock
            .Setup(s => s.GetScheduledReportHistory(scheduleId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("History failed"));

        // Act
        var response = await _controller.GetScheduledReportHistory(scheduleId);

        // Assert
        var statusResult = response as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(500);
    }

    #endregion
}
