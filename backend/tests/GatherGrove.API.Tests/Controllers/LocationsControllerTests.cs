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
public class LocationsControllerTests
{
    private Mock<ILocationManagementService> _locationServiceMock = null!;
    private Mock<ILogger<LocationsController>> _loggerMock = null!;
    private LocationsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _locationServiceMock = new Mock<ILocationManagementService>();
        _loggerMock = new Mock<ILogger<LocationsController>>();

        _controller = new LocationsController(
            _locationServiceMock.Object,
            _loggerMock.Object);

        // Setup controller context with authenticated user
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = CreateAuthenticatedUser(userId: 1)
            }
        };
    }

    #region CreateLocation Tests

    [Test]
    public async Task CreateLocation_ValidRequest_ReturnsCreatedLocation()
    {
        // Arrange
        var clubId = 1;
        var request = new CreateLocationRequest
        {
            LocationName = "Downtown Office",
            LocationCode = "DTN",
            Address = "123 Main St"
        };
        var response = new LocationResponse
        {
            Id = 1,
            LocationName = "Downtown Office",
            LocationCode = "DTN",
            Address = "123 Main St"
        };
        _locationServiceMock.Setup(s => s.CreateLocationAsync(clubId, 1, request))
            .ReturnsAsync(response);

        // Act
        var result = await _controller.CreateLocation(clubId, request);

        // Assert
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult.Should().NotBeNull();
        createdResult!.Value.Should().BeEquivalentTo(response);
        createdResult.ActionName.Should().Be(nameof(_controller.GetLocation));
    }

    [Test]
    public async Task CreateLocation_InvalidUserId_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();
        var request = new CreateLocationRequest { LocationName = "Test", LocationCode = "TST" };

        // Act
        var result = await _controller.CreateLocation(1, request);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
    }

    [Test]
    public async Task CreateLocation_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var request = new CreateLocationRequest { LocationName = "Test", LocationCode = "TST" };
        _locationServiceMock.Setup(s => s.CreateLocationAsync(1, 1, request))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.CreateLocation(1, request);

        // Assert
        result.Result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task CreateLocation_InvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateLocationRequest { LocationName = "Test", LocationCode = "TST" };
        _locationServiceMock.Setup(s => s.CreateLocationAsync(1, 1, request))
            .ThrowsAsync(new InvalidOperationException("Club is not on Unlimited tier"));

        // Act
        var result = await _controller.CreateLocation(1, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
    }

    [Test]
    public async Task CreateLocation_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateLocationRequest { LocationName = "Test", LocationCode = "TST" };
        _locationServiceMock.Setup(s => s.CreateLocationAsync(1, 1, request))
            .ThrowsAsync(new ArgumentException("Invalid request"));

        // Act
        var result = await _controller.CreateLocation(1, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
    }

    [Test]
    public async Task CreateLocation_UnexpectedException_Returns500()
    {
        // Arrange
        var request = new CreateLocationRequest { LocationName = "Test", LocationCode = "TST" };
        _locationServiceMock.Setup(s => s.CreateLocationAsync(1, 1, request))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.CreateLocation(1, request);

        // Assert
        var objectResult = result.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetClubLocations Tests

    [Test]
    public async Task GetClubLocations_ValidRequest_ReturnsLocations()
    {
        // Arrange
        var clubId = 1;
        var locations = new List<LocationResponse>
        {
            new() { Id = 1, LocationName = "Location 1", Address = "Address 1" },
            new() { Id = 2, LocationName = "Location 2", Address = "Address 2" }
        };
        _locationServiceMock.Setup(s => s.GetClubLocationsAsync(clubId, 1))
            .ReturnsAsync(locations);

        // Act
        var result = await _controller.GetClubLocations(clubId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        var returnedLocations = okResult!.Value as List<LocationResponse>;
        returnedLocations.Should().NotBeNull();
        returnedLocations!.Should().HaveCount(2);
    }

    [Test]
    public async Task GetClubLocations_InvalidUserId_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.GetClubLocations(1);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetClubLocations_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.GetClubLocationsAsync(1, 1))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.GetClubLocations(1);

        // Assert
        result.Result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetClubLocations_UnexpectedException_Returns500()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.GetClubLocationsAsync(1, 1))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.GetClubLocations(1);

        // Assert
        var objectResult = result.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetLocation Tests

    [Test]
    public async Task GetLocation_ValidRequest_ReturnsLocation()
    {
        // Arrange
        var locationId = 1;
        var location = new LocationResponse
        {
            Id = 1,
            LocationName = "Downtown Office",
            Address = "123 Main St"
        };
        _locationServiceMock.Setup(s => s.GetLocationAsync(locationId, 1))
            .ReturnsAsync(location);

        // Act
        var result = await _controller.GetLocation(locationId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(location);
    }

    [Test]
    public async Task GetLocation_InvalidUserId_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.GetLocation(1);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetLocation_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.GetLocationAsync(1, 1))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.GetLocation(1);

        // Assert
        result.Result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetLocation_LocationNotFound_ReturnsNotFound()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.GetLocationAsync(1, 1))
            .ThrowsAsync(new ArgumentException("Location not found"));

        // Act
        var result = await _controller.GetLocation(1);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetLocation_UnexpectedException_Returns500()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.GetLocationAsync(1, 1))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.GetLocation(1);

        // Assert
        var objectResult = result.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region UpdateLocation Tests

    [Test]
    public async Task UpdateLocation_ValidRequest_ReturnsUpdatedLocation()
    {
        // Arrange
        var locationId = 1;
        var request = new UpdateLocationRequest
        {
            LocationName = "Updated Name",
            Address = "Updated Address"
        };
        var response = new LocationResponse
        {
            Id = 1,
            LocationName = "Updated Name",
            Address = "Updated Address"
        };
        _locationServiceMock.Setup(s => s.UpdateLocationAsync(locationId, 1, request))
            .ReturnsAsync(response);

        // Act
        var result = await _controller.UpdateLocation(locationId, request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(response);
    }

    [Test]
    public async Task UpdateLocation_InvalidUserId_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();
        var request = new UpdateLocationRequest { LocationName = "Test" };

        // Act
        var result = await _controller.UpdateLocation(1, request);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
    }

    [Test]
    public async Task UpdateLocation_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        var request = new UpdateLocationRequest { LocationName = "Test" };
        _locationServiceMock.Setup(s => s.UpdateLocationAsync(1, 1, request))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.UpdateLocation(1, request);

        // Assert
        result.Result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task UpdateLocation_LocationNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new UpdateLocationRequest { LocationName = "Test" };
        _locationServiceMock.Setup(s => s.UpdateLocationAsync(1, 1, request))
            .ThrowsAsync(new ArgumentException("Location not found"));

        // Act
        var result = await _controller.UpdateLocation(1, request);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
    }

    [Test]
    public async Task UpdateLocation_UnexpectedException_Returns500()
    {
        // Arrange
        var request = new UpdateLocationRequest { LocationName = "Test" };
        _locationServiceMock.Setup(s => s.UpdateLocationAsync(1, 1, request))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.UpdateLocation(1, request);

        // Assert
        var objectResult = result.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region DeactivateLocation Tests

    [Test]
    public async Task DeactivateLocation_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var locationId = 1;
        _locationServiceMock.Setup(s => s.DeactivateLocationAsync(locationId, 1))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeactivateLocation(locationId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
        _locationServiceMock.Verify(s => s.DeactivateLocationAsync(locationId, 1), Times.Once);
    }

    [Test]
    public async Task DeactivateLocation_InvalidUserId_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.DeactivateLocation(1);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
    }

    [Test]
    public async Task DeactivateLocation_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.DeactivateLocationAsync(1, 1))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.DeactivateLocation(1);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task DeactivateLocation_InvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.DeactivateLocationAsync(1, 1))
            .ThrowsAsync(new InvalidOperationException("Cannot deactivate primary location"));

        // Act
        var result = await _controller.DeactivateLocation(1);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
    }

    [Test]
    public async Task DeactivateLocation_LocationNotFound_ReturnsNotFound()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.DeactivateLocationAsync(1, 1))
            .ThrowsAsync(new ArgumentException("Location not found"));

        // Act
        var result = await _controller.DeactivateLocation(1);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
    }

    [Test]
    public async Task DeactivateLocation_UnexpectedException_Returns500()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.DeactivateLocationAsync(1, 1))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.DeactivateLocation(1);

        // Assert
        var objectResult = result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetLocationStats Tests

    [Test]
    public async Task GetLocationStats_ValidRequest_ReturnsStats()
    {
        // Arrange
        var locationId = 1;
        var stats = new LocationResponse
        {
            Id = 1,
            MemberCount = 150,
            EventCount = 25
        };
        _locationServiceMock.Setup(s => s.GetLocationStatsAsync(locationId, 1))
            .ReturnsAsync(stats);

        // Act
        var result = await _controller.GetLocationStats(locationId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.Value.Should().BeEquivalentTo(stats);
    }

    [Test]
    public async Task GetLocationStats_InvalidUserId_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.GetLocationStats(1);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetLocationStats_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.GetLocationStatsAsync(1, 1))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.GetLocationStats(1);

        // Assert
        result.Result.Should().BeOfType<ForbidResult>();
    }

    [Test]
    public async Task GetLocationStats_LocationNotFound_ReturnsNotFound()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.GetLocationStatsAsync(1, 1))
            .ThrowsAsync(new ArgumentException("Location not found"));

        // Act
        var result = await _controller.GetLocationStats(1);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetLocationStats_UnexpectedException_Returns500()
    {
        // Arrange
        _locationServiceMock.Setup(s => s.GetLocationStatsAsync(1, 1))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.GetLocationStats(1);

        // Assert
        var objectResult = result.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region Helper Methods

    private ClaimsPrincipal CreateAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, $"user{userId}@example.com"),
            new("ClubId", "1")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        return new ClaimsPrincipal(identity);
    }

    #endregion
}
