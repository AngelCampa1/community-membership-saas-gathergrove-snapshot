using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class CrossLocationReportsControllerTests
{
    private Mock<ICrossLocationReportingService> _reportingServiceMock = null!;
    private Mock<ILogger<CrossLocationReportsController>> _loggerMock = null!;
    private CrossLocationReportsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _reportingServiceMock = new Mock<ICrossLocationReportingService>();
        _loggerMock = new Mock<ILogger<CrossLocationReportsController>>();

        _controller = new CrossLocationReportsController(
            _reportingServiceMock.Object,
            _loggerMock.Object);

        // Setup HTTP context with default authenticated user
        SetupAuthenticatedUser(userId: 1);
    }

    private void SetupAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, "ClubAdmin"),
            new("ClubId", "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private void SetupUnauthenticatedUser()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Role, "Member")
            // No NameIdentifier claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region GetConsolidatedDashboard Tests

    [Test]
    public async Task GetConsolidatedDashboard_ValidRequest_ReturnsOkWithDashboard()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var expectedDashboard = new ConsolidatedDashboardResponse
        {
            ClubId = clubId,
            ClubName = "Test Club",
            TotalMembers = 150,
            TotalEvents = 25,
            TotalActiveLocations = 3,
            Locations = new List<LocationDashboardSummary>
            {
                new()
                {
                    Id = 1,
                    LocationName = "North Location",
                    LocationCode = "NORTH",
                    ActiveMembers = 50,
                    UpcomingEvents = 10,
                    IsActive = true
                },
                new()
                {
                    Id = 2,
                    LocationName = "South Location",
                    LocationCode = "SOUTH",
                    ActiveMembers = 60,
                    UpcomingEvents = 8,
                    IsActive = true
                },
                new()
                {
                    Id = 3,
                    LocationName = "East Location",
                    LocationCode = "EAST",
                    ActiveMembers = 40,
                    UpcomingEvents = 7,
                    IsActive = true
                }
            }
        };

        _reportingServiceMock
            .Setup(s => s.GetConsolidatedDashboardAsync(clubId, userId))
            .ReturnsAsync(expectedDashboard);

        // Act
        var result = await _controller.GetConsolidatedDashboard(clubId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var dashboard = okResult.Value as ConsolidatedDashboardResponse;
        dashboard.Should().NotBeNull();
        dashboard!.ClubId.Should().Be(clubId);
        dashboard.ClubName.Should().Be("Test Club");
        dashboard.TotalMembers.Should().Be(150);
        dashboard.TotalEvents.Should().Be(25);
        dashboard.TotalActiveLocations.Should().Be(3);
        dashboard.Locations.Should().HaveCount(3);
        dashboard.Locations[0].LocationName.Should().Be("North Location");
        dashboard.Locations[0].ActiveMembers.Should().Be(50);
    }

    [Test]
    public async Task GetConsolidatedDashboard_NoLocations_ReturnsOkWithEmptyLocations()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var expectedDashboard = new ConsolidatedDashboardResponse
        {
            ClubId = clubId,
            ClubName = "New Club",
            TotalMembers = 0,
            TotalEvents = 0,
            TotalActiveLocations = 0,
            Locations = new List<LocationDashboardSummary>()
        };

        _reportingServiceMock
            .Setup(s => s.GetConsolidatedDashboardAsync(clubId, userId))
            .ReturnsAsync(expectedDashboard);

        // Act
        var result = await _controller.GetConsolidatedDashboard(clubId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();

        var dashboard = okResult!.Value as ConsolidatedDashboardResponse;
        dashboard!.Locations.Should().BeEmpty();
        dashboard.TotalActiveLocations.Should().Be(0);
    }

    [Test]
    public async Task GetConsolidatedDashboard_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;

        // Act
        var result = await _controller.GetConsolidatedDashboard(clubId);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        var value = unauthorizedResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Invalid user authentication");

        // Verify service was never called
        _reportingServiceMock.Verify(
            s => s.GetConsolidatedDashboardAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetConsolidatedDashboard_InvalidUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "invalid-user-id"), // Non-numeric
            new(ClaimTypes.Role, "ClubAdmin")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var clubId = 1;

        // Act
        var result = await _controller.GetConsolidatedDashboard(clubId);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _reportingServiceMock.Verify(
            s => s.GetConsolidatedDashboardAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetConsolidatedDashboard_UnauthorizedAccessException_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _reportingServiceMock
            .Setup(s => s.GetConsolidatedDashboardAsync(clubId, userId))
            .ThrowsAsync(new UnauthorizedAccessException("User does not have access to this club"));

        // Act
        var result = await _controller.GetConsolidatedDashboard(clubId);

        // Assert
        var forbidResult = result.Result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetConsolidatedDashboard_InvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _reportingServiceMock
            .Setup(s => s.GetConsolidatedDashboardAsync(clubId, userId))
            .ThrowsAsync(new InvalidOperationException("Invalid operation for this club"));

        // Act
        var result = await _controller.GetConsolidatedDashboard(clubId);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Invalid operation for this club");
    }

    [Test]
    public async Task GetConsolidatedDashboard_ArgumentException_ReturnsNotFound()
    {
        // Arrange
        var clubId = 999; // Non-existent club
        var userId = 1;

        _reportingServiceMock
            .Setup(s => s.GetConsolidatedDashboardAsync(clubId, userId))
            .ThrowsAsync(new ArgumentException("Club not found"));

        // Act
        var result = await _controller.GetConsolidatedDashboard(clubId);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);

        var value = notFoundResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Club not found");
    }

    [Test]
    public async Task GetConsolidatedDashboard_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _reportingServiceMock
            .Setup(s => s.GetConsolidatedDashboardAsync(clubId, userId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetConsolidatedDashboard(clubId);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("An error occurred while retrieving the consolidated dashboard");
    }

    #endregion
}
