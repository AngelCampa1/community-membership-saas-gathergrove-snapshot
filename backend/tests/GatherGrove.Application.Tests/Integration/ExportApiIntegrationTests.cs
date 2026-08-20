using Microsoft.AspNetCore.Mvc.Testing;
using GatherGrove.Domain.Enums;
using GatherGrove.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs.Export;
using GatherGrove.API;
using GatherGrove.Domain.Exceptions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using GatherGrove.API.Tests.Shared;
using GatherGrove.API.Tests.Helpers;

namespace GatherGrove.Application.Tests.Integration;

/// <summary>
/// TDD Integration Tests for Export API Endpoints - US-005 Data Export & Reporting Engine
/// Tests all export endpoints with authentication, validation, and error handling
/// </summary>
[TestFixture]
public class ExportApiIntegrationTests
{
    private TestWebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;
    private Mock<IMemberDataExportService> _mockMemberExportService = null!;
    private Mock<IFinancialExportService> _mockFinancialExportService = null!;
    private Mock<IEventReportsService> _mockEventReportsService = null!;
    private Mock<IScheduledReportsService> _mockScheduledReportsService = null!;

    [SetUp]
    public void SetUp()
    {
        _mockMemberExportService = new Mock<IMemberDataExportService>();
        _mockFinancialExportService = new Mock<IFinancialExportService>();
        _mockEventReportsService = new Mock<IEventReportsService>();
        _mockScheduledReportsService = new Mock<IScheduledReportsService>();

        _factory = new CustomTestWebApplicationFactory(
            _mockMemberExportService.Object,
            _mockFinancialExportService.Object,
            _mockEventReportsService.Object,
            _mockScheduledReportsService.Object);

        _client = _factory.CreateClient();
        // Use test authentication headers instead of JWT
        _client.WithTestAuth(userId: 1, clubId: 1, isAdmin: true, role: "Admin");
    }

    // Custom factory that inherits from TestWebApplicationFactory and adds our mocks
    private class CustomTestWebApplicationFactory : TestWebApplicationFactory<Program>
    {
        private readonly IMemberDataExportService _memberExportService;
        private readonly IFinancialExportService _financialExportService;
        private readonly IEventReportsService _eventReportsService;
        private readonly IScheduledReportsService _scheduledReportsService;

        public CustomTestWebApplicationFactory(
            IMemberDataExportService memberExportService,
            IFinancialExportService financialExportService,
            IEventReportsService eventReportsService,
            IScheduledReportsService scheduledReportsService)
        {
            _memberExportService = memberExportService;
            _financialExportService = financialExportService;
            _eventReportsService = eventReportsService;
            _scheduledReportsService = scheduledReportsService;
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);

            builder.ConfigureServices(services =>
            {
                // Remove existing services
                var memberExportServiceDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IMemberDataExportService));
                if (memberExportServiceDescriptor != null)
                    services.Remove(memberExportServiceDescriptor);

                var financialExportServiceDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IFinancialExportService));
                if (financialExportServiceDescriptor != null)
                    services.Remove(financialExportServiceDescriptor);

                var eventReportsServiceDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IEventReportsService));
                if (eventReportsServiceDescriptor != null)
                    services.Remove(eventReportsServiceDescriptor);

                var scheduledReportsServiceDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IScheduledReportsService));
                if (scheduledReportsServiceDescriptor != null)
                    services.Remove(scheduledReportsServiceDescriptor);

                var applicationClubAuthDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(GatherGrove.Application.Services.IClubAuthorizationService));
                if (applicationClubAuthDescriptor != null)
                    services.Remove(applicationClubAuthDescriptor);

                // Replace services with mocks for testing
                services.AddSingleton<IMemberDataExportService>(_memberExportService);
                services.AddSingleton<IFinancialExportService>(_financialExportService);
                services.AddSingleton<IEventReportsService>(_eventReportsService);
                services.AddSingleton<IScheduledReportsService>(_scheduledReportsService);
                services.AddScoped<GatherGrove.Application.Services.IClubAuthorizationService, TestClubAuthorizationService>();
            });
        }
    }

    [TearDown]
    public void TearDown()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }

    #region Member Export API Tests (RED Phase)

    [Test]
    public async Task POST_ExportMembers_ValidRequest_ReturnsExportResult()
    {
        // Arrange
        var clubId = 1;
        var exportRequest = new MemberExportRequest
        {
            Format = ExportFormat.CSV,
            IncludePersonalInfo = true,
            IncludeMembershipDetails = true,
            DateFrom = DateTime.UtcNow.AddMonths(-6),
            DateTo = DateTime.UtcNow
        };

        var mockExportResult = new ExportResult
        {
            ExportId = Guid.NewGuid().ToString(),
            FileName = "members-export.csv",
            DownloadUrl = "/api/exports/download/123",
            Status = ExportStatus.Completed,
            CreatedAt = DateTime.UtcNow,
            FileSizeBytes = 1024000
        };

        _mockMemberExportService.Setup(x => x.ExportMembersAsync(It.IsAny<int>(), It.IsAny<MemberExportRequest>()))
            .Returns(Task.FromResult(mockExportResult));

        var json = JsonSerializer.Serialize(exportRequest);
        var content = new StringContent(json, Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));

        // Act
        var response = await _client.PostAsync($"/api/clubs/{clubId}/members/export", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ExportResult>(responseJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.That(result, Is.Not.Null);
        Assert.That(result.ExportId, Is.EqualTo(mockExportResult.ExportId));
        Assert.That(result.FileName, Is.EqualTo(mockExportResult.FileName));
        Assert.That(result.Status, Is.EqualTo(ExportStatus.Completed));
    }

    [Test]
    public async Task GET_ExportMembersStatus_ValidExportId_ReturnsExportStatus()
    {
        // Arrange
        var clubId = 1;
        var exportId = "export-123";
        var mockStatus = ExportStatus.Processing;

        var mockStatusResponse = new ExportStatusResponse { Status = mockStatus, ExportId = exportId };
        _mockMemberExportService.Setup(x => x.GetExportStatus(exportId, clubId))
            .Returns(Task.FromResult(mockStatusResponse));

        // Act
        var response = await _client.GetAsync($"/api/clubs/{clubId}/members/export/{exportId}/status");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ExportStatusResponse>(responseJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Status, Is.EqualTo(mockStatus));
        Assert.That(result.ExportId, Is.EqualTo(exportId));
    }

    [Test]
    public async Task POST_ExportMembers_UnauthorizedUser_ReturnsUnauthorized()
    {
        // Arrange - Create a new client without authentication
        var unauthClient = _factory.CreateClient();
        var clubId = 999; // User not authorized for this club

        var exportRequest = new MemberExportRequest
        {
            Format = ExportFormat.CSV,
            IncludePersonalInfo = true
        };

        var json = JsonSerializer.Serialize(exportRequest);
        var content = new StringContent(json, Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));

        // Act
        var response = await unauthClient.PostAsync($"/api/clubs/{clubId}/members/export", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task POST_ExportMembers_InvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var invalidRequest = new { Format = "InvalidFormat" }; // Invalid export format

        var json = JsonSerializer.Serialize(invalidRequest);
        var content = new StringContent(json, Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));

        // Act
        var response = await _client.PostAsync($"/api/clubs/{clubId}/members/export", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

        var responseJson = await response.Content.ReadAsStringAsync();
        Assert.That(responseJson, Does.Contain("validation"));
    }

    #endregion

    #region Financial Export API Tests (RED Phase)

    [Test]
    public async Task POST_ExportFinancialData_ValidRequest_ReturnsExportResult()
    {
        // Arrange
        var clubId = 2;
        _client.WithoutAuth().WithTestAuth(userId: 1, clubId: clubId, isAdmin: true, role: "Admin");
        var exportRequest = new FinancialExportRequest
        {
            Format = ExportFormat.PDF,
            ReportType = "Annual",
            IncludeRevenue = true,
            IncludeExpenses = true,
            DateFrom = DateTime.UtcNow.AddYears(-1),
            DateTo = DateTime.UtcNow
        };

        var mockExportResult = new ExportResult
        {
            ExportId = Guid.NewGuid().ToString(),
            FileName = "financial-report-2024.pdf",
            DownloadUrl = "/api/exports/download/456",
            Status = ExportStatus.Queued,
            CreatedAt = DateTime.UtcNow
        };

        _mockFinancialExportService.Setup(x => x.ExportFinancialDataAsync(It.IsAny<int>(), It.IsAny<FinancialExportRequest>()))
            .Returns(Task.FromResult(mockExportResult));

        var json = JsonSerializer.Serialize(exportRequest);
        var content = new StringContent(json, Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));

        // Act
        var response = await _client.PostAsync($"/api/clubs/{clubId}/financial/export", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ExportResult>(responseJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.That(result, Is.Not.Null);
        Assert.That(result.FileName, Does.StartWith("financial-report"));
        Assert.That(result.Status, Is.EqualTo(ExportStatus.Queued));
    }

    [Test]
    public async Task POST_ExportFinancialData_InsufficientPermissions_ReturnsForbidden()
    {
        // Arrange
        var clubId = 2;
        var exportRequest = new FinancialExportRequest { Format = ExportFormat.CSV };

        _mockFinancialExportService.Setup(x => x.ExportFinancialDataAsync(It.IsAny<int>(), It.IsAny<FinancialExportRequest>()))
            .ThrowsAsync(new UnauthorizedAccessException("Financial data export requires administrative privileges"));

        var json = JsonSerializer.Serialize(exportRequest);
        var content = new StringContent(json, Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));

        // Act
        var response = await _client.PostAsync($"/api/clubs/{clubId}/financial/export", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    #endregion

    #region Event Export API Tests (RED Phase)

    [Test]
    public async Task POST_ExportEventAnalytics_ValidRequest_ReturnsExportResult()
    {
        // Arrange
        var clubId = 3;
        _client.WithoutAuth().WithTestAuth(userId: 1, clubId: clubId, isAdmin: true, role: "Admin");
        var exportRequest = new EventExportRequest
        {
            Format = ExportFormat.Excel,
            IncludeAttendanceData = true,
            IncludeEngagementMetrics = true,
            EventTypes = new List<string> { "Meeting", "Workshop" },
            DateFrom = DateTime.UtcNow.AddMonths(-3),
            DateTo = DateTime.UtcNow
        };

        var mockExportResult = new ExportResult
        {
            ExportId = Guid.NewGuid().ToString(),
            FileName = "event-analytics.excel",
            DownloadUrl = "/api/exports/download/789",
            Status = ExportStatus.Completed,
            CreatedAt = DateTime.UtcNow,
            FileSizeBytes = 2048000
        };

        _mockEventReportsService.Setup(x => x.ScheduleEventAnalyticsExport(
            clubId, It.IsAny<EventExportOptions>()))
            .Returns(Task.FromResult(mockExportResult.ExportId));

        var json = JsonSerializer.Serialize(exportRequest);
        var content = new StringContent(json, Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));

        // Act
        var response = await _client.PostAsync($"/api/clubs/{clubId}/events/export", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ExportResult>(responseJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.That(result, Is.Not.Null);
        Assert.That(result.FileName, Does.Contain("event-analytics"));
        Assert.That(result.FileSizeBytes, Is.GreaterThan(0));
    }

    #endregion

    #region Scheduled Reports API Tests (RED Phase)

    [Test]
    public async Task POST_CreateScheduledReport_ValidRequest_ReturnsScheduleResult()
    {
        // Arrange
        var clubId = 4;
        _client.WithoutAuth().WithTestAuth(userId: 1, clubId: clubId, isAdmin: true, role: "Admin");
        var scheduleRequest = new CreateScheduledReportRequest
        {
            ReportName = "Monthly Member Report",
            ReportType = "Members",
            Format = ExportFormat.PDF,
            Frequency = ReportFrequency.Monthly,
            Recipients = new List<string> { "admin@club.com" },
            DeliveryTime = new TimeSpan(9, 0, 0),
            IsActive = true
        };

        var mockScheduleResult = new ScheduledReportResult
        {
            ScheduleId = Guid.NewGuid().ToString(),
            Status = "Active",
            NextRunDate = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };

        _mockScheduledReportsService.Setup(x => x.CreateScheduledReport(
            clubId, It.IsAny<ScheduledReportRequest>(), It.IsAny<int>()))
            .Returns(Task.FromResult(mockScheduleResult));

        var json = JsonSerializer.Serialize(scheduleRequest);
        var content = new StringContent(json, Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));

        // Act
        var response = await _client.PostAsync($"/api/clubs/{clubId}/reports/scheduled", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));

        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ScheduledReportResult>(responseJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.That(result, Is.Not.Null);
        Assert.That(result.ScheduleId, Is.Not.Empty);
        Assert.That(result.Status, Is.EqualTo("Active"));
        Assert.That(result.NextRunDate, Is.GreaterThan(DateTime.UtcNow));
    }

    [Test]
    public async Task GET_ListScheduledReports_ValidClubId_ReturnsScheduledReports()
    {
        // Arrange
        var clubId = 4;
        _client.WithoutAuth().WithTestAuth(userId: 1, clubId: clubId, isAdmin: true, role: "Admin");
        var mockScheduledReports = CreateMockScheduledReportsList();

        _mockScheduledReportsService.Setup(x => x.GetScheduledReports(clubId))
            .Returns(Task.FromResult(mockScheduledReports));

        // Act
        var response = await _client.GetAsync($"/api/clubs/{clubId}/reports/scheduled");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<List<ScheduledReportSummary>>(responseJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(mockScheduledReports.Count));
        Assert.That(result.Any(r => r.ReportType == "Members"), Is.True);
        Assert.That(result.Any(r => r.ReportType == "Financial"), Is.True);
    }

    [Test]
    public async Task PUT_UpdateScheduledReport_ValidRequest_ReturnsUpdatedResult()
    {
        // Arrange
        var scheduleId = "schedule-123";
        var updateRequest = new UpdateScheduledReportRequest
        {
            ReportName = "Updated Monthly Report",
            IsActive = false,
            Recipients = new List<string> { "newadmin@club.com" }
        };

        var mockUpdatedResult = new ScheduledReportResult
        {
            ScheduleId = scheduleId,
            Status = "Inactive",
            ReportName = updateRequest.ReportName
        };

        var mockScheduledReport = new ScheduledReport
        {
            Id = scheduleId,
            ReportName = updateRequest.ReportName,
            IsActive = updateRequest.IsActive ?? false,
            Frequency = ReportFrequency.Weekly
        };
        _mockScheduledReportsService.Setup(x => x.UpdateScheduledReport(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<UpdateScheduledReportRequest>()))
            .Returns(Task.FromResult(mockScheduledReport));

        var json = JsonSerializer.Serialize(updateRequest);
        var content = new StringContent(json, Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));

        // Act
        var response = await _client.PutAsync($"/api/reports/scheduled/{scheduleId}", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ScheduledReportResult>(responseJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.That(result, Is.Not.Null);
        Assert.That(result.ReportName, Is.EqualTo(updateRequest.ReportName));
        Assert.That(result.Status, Is.EqualTo("Inactive"));
    }

    [Test]
    public async Task DELETE_RemoveScheduledReport_ValidScheduleId_ReturnsSuccess()
    {
        // Arrange
        var scheduleId = "schedule-456";

        _mockScheduledReportsService.Setup(x => x.DeleteScheduledReport(scheduleId, It.IsAny<int>()))
            .Returns(Task.FromResult(true));

        // Act
        var response = await _client.DeleteAsync($"/api/reports/scheduled/{scheduleId}");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    #endregion

    #region Export Download API Tests (RED Phase)

    [Test]
    public async Task GET_DownloadExport_ValidExportId_ReturnsFileContent()
    {
        // Arrange
        var clubId = 5;
        _client.WithoutAuth().WithTestAuth(userId: 1, clubId: clubId, isAdmin: true, role: "Admin");
        var exportId = "export-download-123";
        var mockFileContent = Encoding.UTF8.GetBytes("Mock CSV content");
        var mockFileName = "members-export.csv";

        _mockMemberExportService.Setup(x => x.DownloadExportAsync(exportId, clubId))
            .Returns(Task.FromResult<Stream>(new MemoryStream(mockFileContent)));

        _mockMemberExportService.Setup(x => x.GetExportFileName(exportId))
            .Returns(mockFileName);

        // Act
        var response = await _client.GetAsync($"/api/clubs/{clubId}/exports/{exportId}/download");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/octet-stream"));
        Assert.That(response.Content.Headers.ContentDisposition?.FileName, Does.Contain("members-export"));

        var content = await response.Content.ReadAsByteArrayAsync();
        Assert.That(content, Is.EqualTo(mockFileContent));
    }

    [Test]
    public async Task GET_DownloadExport_ExpiredExportId_ReturnsNotFound()
    {
        // Arrange
        var clubId = 5;
        _client.WithoutAuth().WithTestAuth(userId: 1, clubId: clubId, isAdmin: true, role: "Admin");
        var expiredExportId = "export-expired-456";

        _mockMemberExportService.Setup(x => x.DownloadExportAsync(expiredExportId, clubId))
            .ThrowsAsync(new FileNotFoundException("Export file has expired"));

        // Act
        var response = await _client.GetAsync($"/api/clubs/{clubId}/exports/{expiredExportId}/download");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    #endregion

    #region Rate Limiting Tests (RED Phase)

    [Test]
    public async Task POST_ExportMembers_ExceedsRateLimit_ReturnsTooManyRequests()
    {
        // Arrange
        var clubId = 6;
        _client.WithoutAuth().WithTestAuth(userId: 1, clubId: clubId, isAdmin: true, role: "Admin");
        var exportRequest = new MemberExportRequest { Format = ExportFormat.CSV };
        var json = JsonSerializer.Serialize(exportRequest);

        // Act - Make sequential requests to trigger rate limiting (avoid race conditions)
        var responses = new List<HttpResponseMessage>();
        for (int i = 0; i < 10; i++) // Exceed rate limit (3 requests allowed)
        {
            var content = new StringContent(json, Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));
            var response = await _client.PostAsync($"/api/clubs/{clubId}/members/export", content);
            responses.Add(response);

            // Add small delay to ensure requests are processed individually
            await Task.Delay(10);

            // Stop early if we hit rate limit
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
                break;
        }

        // Debug output
        TestContext.WriteLine($"Total responses: {responses.Count}");
        foreach (var (response, index) in responses.Select((r, i) => (r, i)))
        {
            TestContext.WriteLine($"Response {index + 1}: {response.StatusCode}");
        }

        // Assert - At least one response should be rate limited
        Assert.That(responses.Any(r => r.StatusCode == HttpStatusCode.TooManyRequests), Is.True,
            $"Expected at least one 429 status code, but got: {string.Join(", ", responses.Select(r => r.StatusCode))}");

        // Verify rate limit headers are present
        var rateLimitedResponse = responses.First(r => r.StatusCode == HttpStatusCode.TooManyRequests);
        Assert.That(rateLimitedResponse.Headers.RetryAfter, Is.Not.Null);
    }

    #endregion

    #region Error Handling Tests (RED Phase)

    [Test]
    public async Task POST_ExportMembers_ServiceUnavailable_ReturnsServiceUnavailable()
    {
        // Arrange
        var clubId = 7;
        _client.WithoutAuth().WithTestAuth(userId: 1, clubId: clubId, isAdmin: true, role: "Admin");
        var exportRequest = new MemberExportRequest { Format = ExportFormat.CSV };

        _mockMemberExportService.Setup(x => x.ExportMembersAsync(It.IsAny<int>(), It.IsAny<MemberExportRequest>()))
            .ThrowsAsync(new ServiceUnavailableException("Export service is temporarily unavailable"));

        var json = JsonSerializer.Serialize(exportRequest);
        var content = new StringContent(json, Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));

        // Act
        var response = await _client.PostAsync($"/api/clubs/{clubId}/members/export", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.ServiceUnavailable));

        var responseJson = await response.Content.ReadAsStringAsync();
        Assert.That(responseJson, Does.Contain("temporarily unavailable"));
    }

    [Test]
    public async Task POST_ExportMembers_InternalServerError_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 8;
        _client.WithoutAuth().WithTestAuth(userId: 1, clubId: clubId, isAdmin: true, role: "Admin");
        var exportRequest = new MemberExportRequest { Format = ExportFormat.CSV };

        _mockMemberExportService.Setup(x => x.ExportMembersAsync(It.IsAny<int>(), It.IsAny<MemberExportRequest>()))
            .ThrowsAsync(new Exception("Unexpected database error"));

        var json = JsonSerializer.Serialize(exportRequest);
        var content = new StringContent(json, Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));

        // Act
        var response = await _client.PostAsync($"/api/clubs/{clubId}/members/export", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.InternalServerError));

        var responseJson = await response.Content.ReadAsStringAsync();
        Assert.That(responseJson, Does.Contain("Internal server error during export"));

        // Verify error details are not exposed to client
        Assert.That(responseJson, Does.Not.Contain("database error"));
    }

    #endregion

    #region Helper Methods

    private List<ScheduledReport> CreateMockScheduledReportsList()
    {
        return new List<ScheduledReport>
        {
            new ScheduledReport
            {
                Id = "schedule-1",
                ClubId = 1,
                ReportName = "Daily Member Report",
                ReportType = "Members",
                Format = ExportFormat.PDF,
                Frequency = ReportFrequency.Daily,
                IsActive = true,
                NextRunDate = DateTime.UtcNow.AddDays(1)
            },
            new ScheduledReport
            {
                Id = "schedule-2",
                ClubId = 1,
                ReportName = "Monthly Financial Report",
                ReportType = "Financial",
                Format = ExportFormat.Excel,
                Frequency = ReportFrequency.Monthly,
                IsActive = true,
                NextRunDate = DateTime.UtcNow.AddDays(15)
            }
        };
    }

    #endregion
}
