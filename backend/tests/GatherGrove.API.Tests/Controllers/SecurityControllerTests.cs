using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class SecurityControllerTests
{
    private Mock<ISecurityAuditService> _securityAuditServiceMock = null!;
    private Mock<IMemoryCache> _cacheMock = null!;
    private Mock<ILogger<SecurityController>> _loggerMock = null!;
    private IConfiguration _configuration = null!;
    private SecurityController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _securityAuditServiceMock = new Mock<ISecurityAuditService>();
        _cacheMock = new Mock<IMemoryCache>();
        _loggerMock = new Mock<ILogger<SecurityController>>();
        _configuration = new ConfigurationBuilder().Build();

        _controller = new SecurityController(
            _securityAuditServiceMock.Object,
            _cacheMock.Object,
            _loggerMock.Object,
            _configuration);

        // Setup HTTP context with claims
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
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

    #region GetSecurityEvents Tests

    [Test]
    public async Task GetSecurityEvents_WithDefaultHours_ReturnsOkWithEvents()
    {
        // Arrange
        var events = new List<SecurityEvent>
        {
            new()
            {
                Timestamp = DateTime.UtcNow.AddHours(-1),
                EventType = "FailedLogin",
                Severity = SecurityEventSeverity.High,
                ClientIP = "192.168.1.1",
                Description = "Failed login attempt"
            },
            new()
            {
                Timestamp = DateTime.UtcNow.AddHours(-2),
                EventType = "UnauthorizedAccess",
                Severity = SecurityEventSeverity.Critical,
                ClientIP = "192.168.1.2",
                Description = "Unauthorized access attempt"
            }
        };

        _securityAuditServiceMock
            .Setup(s => s.GetRecentSecurityEventsAsync(24))
            .ReturnsAsync(events);

        // Act
        var actionResult = await _controller.GetSecurityEvents();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedEvents = okResult.Value as List<SecurityEvent>;
        returnedEvents.Should().NotBeNull();
        returnedEvents.Should().HaveCount(2);
        returnedEvents![0].EventType.Should().Be("FailedLogin");
        returnedEvents[1].EventType.Should().Be("UnauthorizedAccess");
    }

    [Test]
    public async Task GetSecurityEvents_WithCustomHours_ReturnsOkWithEvents()
    {
        // Arrange
        var hours = 48;
        var events = new List<SecurityEvent>
        {
            new()
            {
                Timestamp = DateTime.UtcNow.AddHours(-30),
                EventType = "DataExport",
                Severity = SecurityEventSeverity.Medium,
                ClientIP = "192.168.1.3",
                Description = "Data export performed"
            }
        };

        _securityAuditServiceMock
            .Setup(s => s.GetRecentSecurityEventsAsync(hours))
            .ReturnsAsync(events);

        // Act
        var actionResult = await _controller.GetSecurityEvents(hours);

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedEvents = okResult.Value as List<SecurityEvent>;
        returnedEvents.Should().HaveCount(1);
        returnedEvents![0].EventType.Should().Be("DataExport");
    }

    [Test]
    public async Task GetSecurityEvents_WhenNoEvents_ReturnsOkWithEmptyList()
    {
        // Arrange
        _securityAuditServiceMock
            .Setup(s => s.GetRecentSecurityEventsAsync(24))
            .ReturnsAsync(new List<SecurityEvent>());

        // Act
        var actionResult = await _controller.GetSecurityEvents();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedEvents = okResult!.Value as List<SecurityEvent>;
        returnedEvents.Should().NotBeNull();
        returnedEvents.Should().BeEmpty();
    }

    [Test]
    public async Task GetSecurityEvents_WhenServiceThrows_Returns500()
    {
        // Arrange
        _securityAuditServiceMock
            .Setup(s => s.GetRecentSecurityEventsAsync(It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var actionResult = await _controller.GetSecurityEvents();

        // Assert
        var statusCodeResult = actionResult.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetThreatSummary Tests

    [Test]
    public async Task GetThreatSummary_WithThreats_ReturnsOkWithSummary()
    {
        // Arrange
        var threatSummary = new Dictionary<string, int>
        {
            { "FailedLogin", 15 },
            { "UnauthorizedAccess", 5 },
            { "RateLimitExceeded", 3 }
        };

        _securityAuditServiceMock
            .Setup(s => s.GetThreatSummaryAsync())
            .ReturnsAsync(threatSummary);

        // Act
        var actionResult = await _controller.GetThreatSummary();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedSummary = okResult.Value as Dictionary<string, int>;
        returnedSummary.Should().NotBeNull();
        returnedSummary.Should().HaveCount(3);
        returnedSummary!["FailedLogin"].Should().Be(15);
        returnedSummary["UnauthorizedAccess"].Should().Be(5);
        returnedSummary["RateLimitExceeded"].Should().Be(3);
    }

    [Test]
    public async Task GetThreatSummary_WithNoThreats_ReturnsOkWithEmptyDictionary()
    {
        // Arrange
        _securityAuditServiceMock
            .Setup(s => s.GetThreatSummaryAsync())
            .ReturnsAsync(new Dictionary<string, int>());

        // Act
        var actionResult = await _controller.GetThreatSummary();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();

        var returnedSummary = okResult!.Value as Dictionary<string, int>;
        returnedSummary.Should().NotBeNull();
        returnedSummary.Should().BeEmpty();
    }

    [Test]
    public async Task GetThreatSummary_WhenServiceThrows_Returns500()
    {
        // Arrange
        _securityAuditServiceMock
            .Setup(s => s.GetThreatSummaryAsync())
            .ThrowsAsync(new Exception("Service error"));

        // Act
        var actionResult = await _controller.GetThreatSummary();

        // Assert
        var statusCodeResult = actionResult.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSecurityHealth Tests

    [Test]
    public async Task GetSecurityHealth_WithNormalActivity_ReturnsGoodStatus()
    {
        // Arrange
        var events = new List<SecurityEvent>
        {
            new()
            {
                Timestamp = DateTime.UtcNow.AddHours(-1),
                EventType = "Login",
                Severity = SecurityEventSeverity.Low,
                ClientIP = "192.168.1.1",
                Description = "Normal login"
            }
        };

        _securityAuditServiceMock
            .Setup(s => s.GetRecentSecurityEventsAsync(24))
            .ReturnsAsync(events);

        // Act
        var actionResult = await _controller.GetSecurityHealth();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var healthData = okResult.Value;
        healthData.Should().NotBeNull();

        // Use reflection to check properties since it's an anonymous type
        var statusProperty = healthData!.GetType().GetProperty("Status");
        statusProperty.Should().NotBeNull();
        statusProperty!.GetValue(healthData).Should().Be("Good");

        var totalEventsProperty = healthData.GetType().GetProperty("TotalEvents");
        totalEventsProperty.Should().NotBeNull();
        totalEventsProperty!.GetValue(healthData).Should().Be(1);

        var criticalEventsProperty = healthData.GetType().GetProperty("CriticalEvents");
        criticalEventsProperty.Should().NotBeNull();
        criticalEventsProperty!.GetValue(healthData).Should().Be(0);
    }

    [Test]
    public async Task GetSecurityHealth_WithCriticalEvents_ReturnsCriticalStatus()
    {
        // Arrange
        var events = new List<SecurityEvent>
        {
            new()
            {
                Timestamp = DateTime.UtcNow.AddHours(-1),
                EventType = "UnauthorizedAccess",
                Severity = SecurityEventSeverity.Critical,
                ClientIP = "192.168.1.1",
                Description = "Critical security event"
            },
            new()
            {
                Timestamp = DateTime.UtcNow.AddHours(-2),
                EventType = "DataBreach",
                Severity = SecurityEventSeverity.Critical,
                ClientIP = "192.168.1.2",
                Description = "Another critical event"
            }
        };

        _securityAuditServiceMock
            .Setup(s => s.GetRecentSecurityEventsAsync(24))
            .ReturnsAsync(events);

        // Act
        var actionResult = await _controller.GetSecurityHealth();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();

        var healthData = okResult!.Value;
        var statusProperty = healthData!.GetType().GetProperty("Status");
        statusProperty!.GetValue(healthData).Should().Be("Critical");

        var criticalEventsProperty = healthData.GetType().GetProperty("CriticalEvents");
        criticalEventsProperty!.GetValue(healthData).Should().Be(2);
    }

    [Test]
    public async Task GetSecurityHealth_WithHighVolumeEvents_ReturnsElevatedStatus()
    {
        // Arrange
        var events = new List<SecurityEvent>();
        for (int i = 0; i < 101; i++)
        {
            events.Add(new SecurityEvent
            {
                Timestamp = DateTime.UtcNow.AddHours(-i),
                EventType = "FailedLogin",
                Severity = SecurityEventSeverity.Medium,
                ClientIP = $"192.168.1.{i % 255}",
                Description = "Failed login attempt"
            });
        }

        _securityAuditServiceMock
            .Setup(s => s.GetRecentSecurityEventsAsync(24))
            .ReturnsAsync(events);

        // Act
        var actionResult = await _controller.GetSecurityHealth();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();

        var healthData = okResult!.Value;
        var statusProperty = healthData!.GetType().GetProperty("Status");
        statusProperty!.GetValue(healthData).Should().Be("Elevated");

        var totalEventsProperty = healthData.GetType().GetProperty("TotalEvents");
        totalEventsProperty!.GetValue(healthData).Should().Be(101);
    }

    [Test]
    public async Task GetSecurityHealth_WhenServiceThrows_Returns500()
    {
        // Arrange
        _securityAuditServiceMock
            .Setup(s => s.GetRecentSecurityEventsAsync(It.IsAny<int>()))
            .ThrowsAsync(new Exception("Service error"));

        // Act
        var actionResult = await _controller.GetSecurityHealth();

        // Assert
        var statusCodeResult = actionResult.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetRateLimitStatus Tests

    [Test]
    public void GetRateLimitStatus_WithNormalUsage_ReturnsOkWithStatus()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.Connection.RemoteIpAddress =
            System.Net.IPAddress.Parse("192.168.1.1");

        // Act
        var actionResult = _controller.GetRateLimitStatus();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var rateLimitData = okResult.Value;
        rateLimitData.Should().NotBeNull();

        // Check properties exist
        var rateLimitingEnabledProperty = rateLimitData!.GetType().GetProperty("RateLimitingEnabled");
        rateLimitingEnabledProperty.Should().NotBeNull();
        rateLimitingEnabledProperty!.GetValue(rateLimitData).Should().Be(true);

        var wellKnownProtectionProperty = rateLimitData.GetType().GetProperty("WellKnownProtectionEnabled");
        wellKnownProtectionProperty.Should().NotBeNull();
        wellKnownProtectionProperty!.GetValue(rateLimitData).Should().Be(true);

        var currentClientIPProperty = rateLimitData.GetType().GetProperty("CurrentClientIP");
        currentClientIPProperty.Should().NotBeNull();
    }

    [Test]
    public void GetRateLimitStatus_ReturnsValidData()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.Connection.RemoteIpAddress =
            System.Net.IPAddress.Parse("192.168.1.2");

        // Act
        var actionResult = _controller.GetRateLimitStatus();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        var rateLimitData = okResult!.Value;

        var blockedIPsCountProperty = rateLimitData!.GetType().GetProperty("BlockedIPsCount");
        var blockedIPsCount = (int)blockedIPsCountProperty!.GetValue(rateLimitData)!;
        blockedIPsCount.Should().BeGreaterOrEqualTo(0);

        var lastCheckedProperty = rateLimitData.GetType().GetProperty("LastChecked");
        var lastChecked = (DateTime)lastCheckedProperty!.GetValue(rateLimitData)!;
        lastChecked.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    #endregion

    #region TestWellKnownProtection Tests

    [Test]
    public void TestWellKnownProtection_FirstRequest_ReturnsOk()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.Connection.RemoteIpAddress =
            System.Net.IPAddress.Parse("192.168.1.1");

        // Act
        var actionResult = _controller.TestWellKnownProtection();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var responseData = okResult.Value;
        responseData.Should().NotBeNull();

        var clientIPProperty = responseData!.GetType().GetProperty("ClientIP");
        clientIPProperty.Should().NotBeNull();

        var maxAllowedProperty = responseData.GetType().GetProperty("MaxAllowed");
        maxAllowedProperty.Should().NotBeNull();
        maxAllowedProperty!.GetValue(responseData).Should().Be(3);
    }

    [Test]
    public void TestWellKnownProtection_HasCurrentRequestCount()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.Connection.RemoteIpAddress =
            System.Net.IPAddress.Parse("192.168.1.2");

        // Act
        var actionResult = _controller.TestWellKnownProtection();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        var responseData = okResult!.Value;

        var currentRequestCountProperty = responseData!.GetType().GetProperty("CurrentRequestCount");
        currentRequestCountProperty.Should().NotBeNull();

        var currentRequestCount = (int)currentRequestCountProperty!.GetValue(responseData)!;
        currentRequestCount.Should().BeGreaterOrEqualTo(0);
    }

    [Test]
    public void TestWellKnownProtection_WithNoIpAddress_StillReturnsOk()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.Connection.RemoteIpAddress = null;

        // Act
        var actionResult = _controller.TestWellKnownProtection();

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    #endregion
}
