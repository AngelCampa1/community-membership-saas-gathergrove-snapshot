using FluentAssertions;
using GatherGrove.API.Middleware;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.TierValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using System.Text.Json;

namespace GatherGrove.API.Tests.Middleware;

[TestFixture]
public class TierValidationMiddlewareTests
{
    private Mock<RequestDelegate> _nextMock = null!;
    private Mock<ITierGateService> _tierGateServiceMock = null!;
    private Mock<IClubAuthorizationService> _clubAuthServiceMock = null!;
    private Mock<ILogger<TierValidationMiddleware>> _loggerMock = null!;
    private TierValidationMiddleware _middleware = null!;
    private DefaultHttpContext _context = null!;

    [SetUp]
    public void SetUp()
    {
        _nextMock = new Mock<RequestDelegate>();
        _tierGateServiceMock = new Mock<ITierGateService>();
        _clubAuthServiceMock = new Mock<IClubAuthorizationService>();
        _loggerMock = new Mock<ILogger<TierValidationMiddleware>>();

        _middleware = new TierValidationMiddleware(
            _nextMock.Object,
            _loggerMock.Object);

        _context = new DefaultHttpContext();
        _context.Response.Body = new MemoryStream();
    }

    #region Non-API Endpoint Tests

    [Test]
    public async Task InvokeAsync_NonApiEndpoint_SkipsValidationAndCallsNext()
    {
        // Arrange
        _context.Request.Path = "/health";

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _nextMock.Verify(n => n(_context), Times.Once);
        _tierGateServiceMock.Verify(t => t.ValidateUnlimitedAccessAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task InvokeAsync_StaticFileEndpoint_SkipsValidation()
    {
        // Arrange
        _context.Request.Path = "/static/image.png";

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _nextMock.Verify(n => n(_context), Times.Once);
        _tierGateServiceMock.Verify(t => t.ValidateUnlimitedAccessAsync(It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region Club ID Extraction Tests

    [Test]
    public async Task InvokeAsync_NoClubId_ContinuesToNextMiddleware()
    {
        // Arrange
        _context.Request.Path = "/api/events";

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _nextMock.Verify(n => n(_context), Times.Once);
        _tierGateServiceMock.Verify(t => t.ValidateUnlimitedAccessAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task InvokeAsync_ClubIdFromRoute_ExtractsCorrectly()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/advanced";
        _context.Request.RouteValues["clubId"] = "123";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(123)).ReturnsAsync(true);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _tierGateServiceMock.Verify(t => t.ValidateUnlimitedAccessAsync(123), Times.Once);
        _nextMock.Verify(n => n(_context), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_ClubIdFromClaims_ExtractsCorrectly()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/advanced";
        var claims = new[] { new Claim("ClubId", "456") };
        _context.User = new ClaimsPrincipal(new ClaimsIdentity(claims));
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(456)).ReturnsAsync(true);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _tierGateServiceMock.Verify(t => t.ValidateUnlimitedAccessAsync(456), Times.Once);
        _nextMock.Verify(n => n(_context), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_ClubIdFromQuery_ExtractsCorrectly()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/advanced";
        _context.Request.QueryString = new QueryString("?clubId=789");
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(789)).ReturnsAsync(true);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _tierGateServiceMock.Verify(t => t.ValidateUnlimitedAccessAsync(789), Times.Once);
        _nextMock.Verify(n => n(_context), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_InvalidClubIdInRoute_ContinuesToNext()
    {
        // Arrange
        _context.Request.Path = "/api/events";
        _context.Request.RouteValues["clubId"] = "invalid";

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _nextMock.Verify(n => n(_context), Times.Once);
        _tierGateServiceMock.Verify(t => t.ValidateUnlimitedAccessAsync(It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region Unlimited Tier Endpoint Tests

    [Test]
    public async Task InvokeAsync_UnlimitedEndpoint_WithAccess_AllowsRequest()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/advanced";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(true);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _nextMock.Verify(n => n(_context), Times.Once);
        _context.Response.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task InvokeAsync_UnlimitedEndpoint_WithoutAccess_Returns403()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/advanced";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _nextMock.Verify(n => n(_context), Times.Never);
        _context.Response.StatusCode.Should().Be(403);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        var responseBody = await new StreamReader(_context.Response.Body).ReadToEndAsync();
        responseBody.Should().Contain("You need Expand for this feature");
    }

    [Test]
    public async Task InvokeAsync_EngagementTrendsEndpoint_RequiresUnlimitedTier()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/engagement-trends";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Response.StatusCode.Should().Be(403);
    }

    [Test]
    public async Task InvokeAsync_CohortAnalysisEndpoint_RequiresUnlimitedTier()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/cohort-analysis";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Response.StatusCode.Should().Be(403);
    }

    [Test]
    public async Task InvokeAsync_BrandingEndpoint_RequiresUnlimitedTier()
    {
        // Arrange
        _context.Request.Path = "/api/branding";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Response.StatusCode.Should().Be(403);
    }

    [Test]
    public async Task InvokeAsync_DataExportEndpoint_RequiresUnlimitedTier()
    {
        // Arrange
        _context.Request.Path = "/api/data-export";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Response.StatusCode.Should().Be(403);
    }

    #endregion

    #region Basic Tier Blocked Endpoint Tests

    [Test]
    public async Task InvokeAsync_BlockedBasicTierEndpoint_BasicTier_Returns403()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/background-processing";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _nextMock.Verify(n => n(_context), Times.Never);
        _context.Response.StatusCode.Should().Be(403);

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        var responseBody = await new StreamReader(_context.Response.Body).ReadToEndAsync();
        responseBody.Should().Contain("not available for your subscription tier");
    }

    [Test]
    public async Task InvokeAsync_BlockedBasicTierEndpoint_UnlimitedTier_AllowsRequest()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/background-processing";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(true);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _nextMock.Verify(n => n(_context), Times.Once);
        _context.Response.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task InvokeAsync_AdvancedAnalyticsEndpoint_BlockedForBasicTier()
    {
        // Arrange
        _context.Request.Path = "/api/advanced-analytics";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Response.StatusCode.Should().Be(403);
    }

    [Test]
    public async Task InvokeAsync_MemberSegmentationEndpoint_BlockedForBasicTier()
    {
        // Arrange
        _context.Request.Path = "/api/member-segmentation";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Response.StatusCode.Should().Be(403);
    }

    #endregion

    #region Context Items Tests

    [Test]
    public async Task InvokeAsync_ValidRequest_SetsClubIdInContext()
    {
        // Arrange
        _context.Request.Path = "/api/events";
        _context.Request.RouteValues["clubId"] = "100";

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Items["ClubId"].Should().Be(100);
        _context.Items["TierValidated"].Should().Be(true);
    }

    [Test]
    public async Task InvokeAsync_ResourceIntensivePost_SetsResourceLimitsInContext()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/generate";
        _context.Request.Method = "POST";
        _context.Request.RouteValues["clubId"] = "100";

        var resourceLimits = new TierResourceLimits
        {
            MaxAnalyticsQueries = 1000,
            MaxBackgroundJobs = 50,
            BackgroundProcessingEnabled = true
        };
        _tierGateServiceMock.Setup(t => t.GetTierResourceLimitsAsync(100)).ReturnsAsync(resourceLimits);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Items["TierResourceLimits"].Should().NotBeNull();
        _context.Items["TierResourceLimits"].Should().Be(resourceLimits);
    }

    [Test]
    public async Task InvokeAsync_ReportsGenerateEndpoint_IsResourceIntensive()
    {
        // Arrange
        _context.Request.Path = "/api/reports/generate";
        _context.Request.Method = "POST";
        _context.Request.RouteValues["clubId"] = "100";

        var resourceLimits = new TierResourceLimits
        {
            MaxAnalyticsQueries = 1000,
            MaxBackgroundJobs = 25
        };
        _tierGateServiceMock.Setup(t => t.GetTierResourceLimitsAsync(100)).ReturnsAsync(resourceLimits);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _tierGateServiceMock.Verify(t => t.GetTierResourceLimitsAsync(100), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_ExportsEndpoint_IsResourceIntensive()
    {
        // Arrange
        _context.Request.Path = "/api/exports/members";
        _context.Request.Method = "POST";
        _context.Request.RouteValues["clubId"] = "100";

        var resourceLimits = new TierResourceLimits
        {
            MaxAnalyticsQueries = 10000,
            AdvancedFeaturesEnabled = true
        };
        _tierGateServiceMock.Setup(t => t.GetTierResourceLimitsAsync(100)).ReturnsAsync(resourceLimits);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _tierGateServiceMock.Verify(t => t.GetTierResourceLimitsAsync(100), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_NonPostRequest_DoesNotCheckResourceLimits()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/dashboard";
        _context.Request.Method = "GET";
        _context.Request.RouteValues["clubId"] = "100";

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _tierGateServiceMock.Verify(t => t.GetTierResourceLimitsAsync(It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region Error Handling Tests

    [Test]
    public async Task InvokeAsync_TierGateServiceThrows_ContinuesToNextMiddleware()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/advanced";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert - Should continue despite error
        _nextMock.Verify(n => n(_context), Times.Once);
        _context.Response.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task InvokeAsync_GetResourceLimitsThrows_ContinuesToNextMiddleware()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/generate";
        _context.Request.Method = "POST";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.GetTierResourceLimitsAsync(100))
            .ThrowsAsync(new Exception("Service unavailable"));

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert - Should continue despite error
        _nextMock.Verify(n => n(_context), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_ExceptionDuringExtraction_ContinuesToNext()
    {
        // Arrange
        _context.Request.Path = "/api/events";
        _context.Request.RouteValues["clubId"] = null;
        _context.User = null; // Could cause NullReferenceException in poorly written code

        // Act & Assert - Should not throw
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);
        _nextMock.Verify(n => n(_context), Times.Once);
    }

    #endregion

    #region Logging Tests

    [Test]
    public async Task InvokeAsync_UnlimitedEndpointWithoutAccess_LogsWarning()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/advanced";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _loggerMock.Verify(
            l => l.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("attempted to access Expand endpoint")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task InvokeAsync_BasicTierBlockedEndpoint_LogsInformation()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/background-processing";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _loggerMock.Verify(
            l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Blocked basic tier club")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task InvokeAsync_ExceptionOccurs_LogsError()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/advanced";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100))
            .ThrowsAsync(new InvalidOperationException("Test error"));

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _loggerMock.Verify(
            l => l.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error in tier validation middleware")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Response Format Tests

    [Test]
    public async Task InvokeAsync_BlockedRequest_ReturnsJsonResponse()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/advanced";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Response.ContentType.Should().Be("application/json");

        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        var responseBody = await new StreamReader(_context.Response.Body).ReadToEndAsync();

        var jsonDoc = JsonDocument.Parse(responseBody);
        jsonDoc.RootElement.GetProperty("error").GetString().Should().NotBeNullOrEmpty();
        jsonDoc.RootElement.GetProperty("statusCode").GetInt32().Should().Be(403);
        jsonDoc.RootElement.GetProperty("timestamp").GetDateTime().Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        jsonDoc.RootElement.GetProperty("path").GetString().Should().Be("/api/analytics/advanced");
    }

    [Test]
    public async Task InvokeAsync_BlockedRequest_UsesCamelCaseJson()
    {
        // Arrange
        _context.Request.Path = "/api/branding";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        var responseBody = await new StreamReader(_context.Response.Body).ReadToEndAsync();

        // Verify camelCase
        responseBody.Should().Contain("\"error\":");
        responseBody.Should().Contain("\"statusCode\":");
        responseBody.Should().Contain("\"timestamp\":");
        responseBody.Should().Contain("\"path\":");
    }

    #endregion

    #region Edge Cases

    [Test]
    public async Task InvokeAsync_CaseInsensitiveEndpointMatching_Works()
    {
        // Arrange - Test with mixed case
        _context.Request.Path = "/API/ANALYTICS/ADVANCED";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert - Should still match and block
        _context.Response.StatusCode.Should().Be(403);
    }

    [Test]
    public async Task InvokeAsync_PartialEndpointMatch_MatchesCorrectly()
    {
        // Arrange - Test that /api/analytics/advanced/details matches /api/analytics/advanced
        _context.Request.Path = "/api/analytics/advanced/details/123";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(100)).ReturnsAsync(true);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert - Should match and validate
        _tierGateServiceMock.Verify(t => t.ValidateUnlimitedAccessAsync(100), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_ClubIdZero_TreatsAsValid()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/advanced";
        _context.Request.RouteValues["clubId"] = "0";
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(0)).ReturnsAsync(true);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _tierGateServiceMock.Verify(t => t.ValidateUnlimitedAccessAsync(0), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_NegativeClubId_TreatsAsValid()
    {
        // Arrange - Negative IDs shouldn't exist but test defensive coding
        _context.Request.Path = "/api/events";
        _context.Request.RouteValues["clubId"] = "-1";

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert - Should continue (no validation on negative IDs)
        _nextMock.Verify(n => n(_context), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_VeryLargeClubId_HandlesCorrectly()
    {
        // Arrange
        _context.Request.Path = "/api/analytics/advanced";
        _context.Request.RouteValues["clubId"] = int.MaxValue.ToString();
        _tierGateServiceMock.Setup(t => t.ValidateUnlimitedAccessAsync(int.MaxValue)).ReturnsAsync(true);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _tierGateServiceMock.Verify(t => t.ValidateUnlimitedAccessAsync(int.MaxValue), Times.Once);
    }

    #endregion

    #region Extension Method Tests

    [Test]
    public void UseTierValidation_RegistersMiddleware()
    {
        // Arrange
        var appBuilder = new Mock<IApplicationBuilder>();
        appBuilder.Setup(a => a.Use(It.IsAny<Func<RequestDelegate, RequestDelegate>>()))
            .Returns(appBuilder.Object);

        // Act
        var result = appBuilder.Object.UseTierValidation();

        // Assert
        result.Should().NotBeNull();
    }

    #endregion

    #region Seed Tier Blocked Endpoint Tests

    [Test]
    public async Task InvokeAsync_ChatEndpoint_BlockedForSeedTier()
    {
        // Arrange
        _context.Request.Path = "/api/chat/messages";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateGrowOrAboveAccessAsync(100)).ReturnsAsync(false);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Response.Body.Seek(0, SeekOrigin.Begin);
        _context.Response.StatusCode.Should().Be(403);
        var responseBody = await new StreamReader(_context.Response.Body).ReadToEndAsync();
        responseBody.Should().Contain("Grow or higher tier subscription");
    }

    [Test]
    public async Task InvokeAsync_ChatEndpoint_AllowedForGrowTier()
    {
        // Arrange
        _context.Request.Path = "/api/chat/messages";
        _context.Request.RouteValues["clubId"] = "100";
        _tierGateServiceMock.Setup(t => t.ValidateGrowOrAboveAccessAsync(100)).ReturnsAsync(true);

        // Act
        await _middleware.InvokeAsync(_context, _tierGateServiceMock.Object, _clubAuthServiceMock.Object);

        // Assert
        _context.Response.StatusCode.Should().NotBe(403);
        _nextMock.Verify(n => n(_context), Times.Once);
    }

    #endregion
}
