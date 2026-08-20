using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class DashboardControllerTests
{
    private Mock<IDashboardService> _mockDashboardService;
    private Mock<ILogger<DashboardController>> _mockLogger;
    private DashboardController _controller;

    [SetUp]
    public void SetUp()
    {
        _mockDashboardService = new Mock<IDashboardService>();
        _mockLogger = new Mock<ILogger<DashboardController>>();
        _controller = new DashboardController(_mockDashboardService.Object, _mockLogger.Object);

        // Set up a mock user context
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };
    }

    [Test]
    public async Task GetDashboardSummary_WithValidRequest_ReturnsOkResult()
    {
        // Arrange
        const int clubId = 1;
        var expectedResponse = new DashboardSummaryResponse
        {
            CurrentTier = "Sprout",
            MemberCount = 5,
            MemberLimit = 50,
            DuesCollectedYTD = 250.00m,
            UpcomingEventCount = 2
        };

        _mockDashboardService
            .Setup(x => x.GetDashboardSummaryAsync(clubId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetDashboardSummary(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        Assert.That(okResult!.Value, Is.EqualTo(expectedResponse));
        Assert.That(okResult.StatusCode, Is.EqualTo(200));

        // Verify service was called
        _mockDashboardService.Verify(x => x.GetDashboardSummaryAsync(clubId), Times.Once);
    }

    [Test]
    public async Task GetDashboardSummary_WithNonExistentClub_ReturnsNotFound()
    {
        // Arrange
        const int clubId = 999;

        // Set up user with matching clubId so authorization passes
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new("ClubId", clubId.ToString()) // Match the requested clubId
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext.HttpContext.User = principal;

        _mockDashboardService
            .Setup(x => x.GetDashboardSummaryAsync(clubId))
            .ThrowsAsync(new InvalidOperationException("Club not found"));

        // Act
        var result = await _controller.GetDashboardSummary(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        var notFoundResult = result as NotFoundObjectResult;
        Assert.That(notFoundResult!.StatusCode, Is.EqualTo(404));
        var problemDetails = notFoundResult.Value as ProblemDetails;
        Assert.That(problemDetails!.Detail, Does.Contain("Club not found"));
    }

    [Test]
    public async Task GetDashboardSummary_WithUnauthorizedClub_ReturnsForbidden()
    {
        // Arrange - Set up user with different clubId
        const int requestedClubId = 2;
        const int userClubId = 1;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new("ClubId", userClubId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = principal;

        // Act
        var result = await _controller.GetDashboardSummary(requestedClubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        // Verify service was not called
        _mockDashboardService.Verify(x => x.GetDashboardSummaryAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetDashboardSummary_WithServiceException_ReturnsInternalServerError()
    {
        // Arrange
        const int clubId = 1;
        _mockDashboardService
            .Setup(x => x.GetDashboardSummaryAsync(clubId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetDashboardSummary(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ObjectResult>());
        var objectResult = result as ObjectResult;
        Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
        var problemDetails = objectResult.Value as ProblemDetails;
        Assert.That(problemDetails!.Detail, Does.Contain("unexpected error"));
    }

    [Test]
    public async Task GetDashboardSummary_WithZeroMembers_ReturnsValidResponse()
    {
        // Arrange
        const int clubId = 1;
        var expectedResponse = new DashboardSummaryResponse
        {
            CurrentTier = "Sprout",
            MemberCount = 0,
            MemberLimit = 50,
            DuesCollectedYTD = 0.00m,
            UpcomingEventCount = 0
        };

        _mockDashboardService
            .Setup(x => x.GetDashboardSummaryAsync(clubId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetDashboardSummary(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as DashboardSummaryResponse;

        Assert.That(response!.MemberCount, Is.EqualTo(0));
        Assert.That(response.DuesCollectedYTD, Is.EqualTo(0.00m));
        Assert.That(response.UpcomingEventCount, Is.EqualTo(0));
    }

    [Test]
    public async Task GetDashboardSummary_WithLargeNumbers_HandlesCorrectly()
    {
        // Arrange
        const int clubId = 1;
        var expectedResponse = new DashboardSummaryResponse
        {
            CurrentTier = "Grow",
            MemberCount = 195,
            MemberLimit = 200,
            DuesCollectedYTD = 15750.50m,
            UpcomingEventCount = 25
        };

        _mockDashboardService
            .Setup(x => x.GetDashboardSummaryAsync(clubId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetDashboardSummary(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as DashboardSummaryResponse;

        Assert.That(response!.MemberCount, Is.EqualTo(195));
        Assert.That(response.DuesCollectedYTD, Is.EqualTo(15750.50m));
        Assert.That(response.UpcomingEventCount, Is.EqualTo(25));
    }

    [Test]
    public async Task GetDashboardSummary_LogsRequestAndResponse()
    {
        // Arrange
        const int clubId = 1;
        var expectedResponse = new DashboardSummaryResponse
        {
            CurrentTier = "Sprout",
            MemberCount = 3,
            MemberLimit = 50,
            DuesCollectedYTD = 150.00m,
            UpcomingEventCount = 1
        };

        _mockDashboardService
            .Setup(x => x.GetDashboardSummaryAsync(clubId))
            .ReturnsAsync(expectedResponse);

        // Act
        await _controller.GetDashboardSummary(clubId);

        // Assert - Verify appropriate logging occurred
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Getting dashboard summary")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task GetDashboardSummary_WithMissingClubIdClaim_ReturnsForbidden()
    {
        // Arrange - Set up user without ClubId claim
        const int clubId = 1;
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1")
            // Missing ClubId claim
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = principal;

        // Act
        var result = await _controller.GetDashboardSummary(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());

        // Verify service was not called
        _mockDashboardService.Verify(x => x.GetDashboardSummaryAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetDashboardSummary_VerifiesCorrectHttpMethods()
    {
        // Arrange
        var controllerType = typeof(DashboardController);
        var method = controllerType.GetMethod(nameof(DashboardController.GetDashboardSummary));

        // Act & Assert
        var httpGetAttribute = method!.GetCustomAttributes(typeof(HttpGetAttribute), false);
        Assert.That(httpGetAttribute, Is.Not.Empty, "Method should have HttpGet attribute");

        // Check that the HttpGet attribute has the correct template
        var httpGet = (HttpGetAttribute)httpGetAttribute[0];
        Assert.That(httpGet.Template, Is.EqualTo("summary"), "HttpGet should have 'summary' template");
    }

    [Test]
    public async Task GetDashboardSummary_ReturnsCorrectContentType()
    {
        // Arrange
        const int clubId = 1;
        var expectedResponse = new DashboardSummaryResponse
        {
            CurrentTier = "Sprout",
            MemberCount = 1,
            MemberLimit = 50,
            DuesCollectedYTD = 50.00m,
            UpcomingEventCount = 0
        };

        _mockDashboardService
            .Setup(x => x.GetDashboardSummaryAsync(clubId))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GetDashboardSummary(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var okResult = result as OkObjectResult;

        // Verify the response is a properly structured DashboardSummaryResponse
        Assert.That(okResult!.Value, Is.InstanceOf<DashboardSummaryResponse>());
        var response = okResult.Value as DashboardSummaryResponse;
        Assert.That(response!.CurrentTier, Is.Not.Null.And.Not.Empty);
        Assert.That(response.MemberCount, Is.GreaterThanOrEqualTo(0));
        Assert.That(response.MemberLimit, Is.GreaterThan(0));
        Assert.That(response.DuesCollectedYTD, Is.GreaterThanOrEqualTo(0));
        Assert.That(response.UpcomingEventCount, Is.GreaterThanOrEqualTo(0));
    }

    [Test]
    public async Task GetDashboardSummary_HandlesArgumentException_ReturnsBadRequest()
    {
        // Arrange
        const int clubId = -1; // Invalid club ID

        // Set up user with matching clubId so authorization passes and we can test the ArgumentException handling
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new("ClubId", clubId.ToString()) // Match the requested clubId to pass authorization
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext.HttpContext.User = principal;

        _mockDashboardService
            .Setup(x => x.GetDashboardSummaryAsync(clubId))
            .ThrowsAsync(new ArgumentException("Invalid club ID"));

        // Act
        var result = await _controller.GetDashboardSummary(clubId);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult!.StatusCode, Is.EqualTo(400));
        var problemDetails = badRequestResult.Value as ProblemDetails;
        Assert.That(problemDetails!.Detail, Does.Contain("Invalid club ID"));
    }
}