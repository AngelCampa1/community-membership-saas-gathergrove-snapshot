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
public class LocationBrandingControllerTests
{
    private Mock<ILocationBrandingService> _brandingServiceMock = null!;
    private Mock<ILogger<LocationBrandingController>> _loggerMock = null!;
    private LocationBrandingController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _brandingServiceMock = new Mock<ILocationBrandingService>();
        _loggerMock = new Mock<ILogger<LocationBrandingController>>();

        _controller = new LocationBrandingController(
            _brandingServiceMock.Object,
            _loggerMock.Object);

        // Setup default HTTP context with authenticated user
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

    private void SetupAnonymousUser()
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    #region GetLocationBranding Tests

    [Test]
    public async Task GetLocationBranding_ValidLocation_ReturnsOkWithBranding()
    {
        // Arrange
        SetupAnonymousUser(); // Endpoint is AllowAnonymous
        var locationId = 1;
        var expectedBranding = new LocationBrandingResponse
        {
            Id = 100,
            LocationId = locationId,
            LocationName = "Downtown Location",
            CustomLogoUrl = "https://example.com/logo.png",
            ColorScheme = "{\"primary\":\"#FF5733\",\"secondary\":\"#33FF57\"}",
            CustomNameOverride = "Downtown Hub",
            SettingsJson = "{\"showHeader\":true}",
            CreatedAt = DateTime.UtcNow.AddMonths(-6),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _brandingServiceMock
            .Setup(s => s.GetLocationBrandingAsync(locationId))
            .ReturnsAsync(expectedBranding);

        // Act
        var result = await _controller.GetLocationBranding(locationId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var branding = okResult.Value as LocationBrandingResponse;
        branding.Should().NotBeNull();
        branding!.Id.Should().Be(100);
        branding.LocationId.Should().Be(locationId);
        branding.LocationName.Should().Be("Downtown Location");
        branding.CustomLogoUrl.Should().Be("https://example.com/logo.png");
        branding.ColorScheme.Should().Contain("primary");
        branding.CustomNameOverride.Should().Be("Downtown Hub");
    }

    [Test]
    public async Task GetLocationBranding_MinimalBranding_ReturnsOkWithNulls()
    {
        // Arrange
        SetupAnonymousUser();
        var locationId = 2;
        var expectedBranding = new LocationBrandingResponse
        {
            Id = 101,
            LocationId = locationId,
            LocationName = "North Location",
            CustomLogoUrl = null,
            ColorScheme = null,
            CustomNameOverride = null,
            SettingsJson = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _brandingServiceMock
            .Setup(s => s.GetLocationBrandingAsync(locationId))
            .ReturnsAsync(expectedBranding);

        // Act
        var result = await _controller.GetLocationBranding(locationId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();

        var branding = okResult!.Value as LocationBrandingResponse;
        branding!.CustomLogoUrl.Should().BeNull();
        branding.ColorScheme.Should().BeNull();
        branding.CustomNameOverride.Should().BeNull();
        branding.SettingsJson.Should().BeNull();
    }

    [Test]
    public async Task GetLocationBranding_LocationNotFound_ReturnsNotFound()
    {
        // Arrange
        SetupAnonymousUser();
        var locationId = 999; // Non-existent location

        _brandingServiceMock
            .Setup(s => s.GetLocationBrandingAsync(locationId))
            .ThrowsAsync(new ArgumentException("Location not found"));

        // Act
        var result = await _controller.GetLocationBranding(locationId);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);

        var value = notFoundResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Location not found");
    }

    [Test]
    public async Task GetLocationBranding_ServiceThrowsException_Returns500()
    {
        // Arrange
        SetupAnonymousUser();
        var locationId = 1;

        _brandingServiceMock
            .Setup(s => s.GetLocationBrandingAsync(locationId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetLocationBranding(locationId);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while retrieving location branding");
    }

    #endregion

    #region UpdateLocationBranding Tests

    [Test]
    public async Task UpdateLocationBranding_ValidRequest_ReturnsOkWithUpdatedBranding()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;
        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/new-logo.png",
            ColorScheme = "{\"primary\":\"#0000FF\",\"secondary\":\"#FFFF00\"}",
            CustomNameOverride = "Central Hub",
            SettingsJson = "{\"showHeader\":false,\"showFooter\":true}"
        };

        var expectedBranding = new LocationBrandingResponse
        {
            Id = 100,
            LocationId = locationId,
            LocationName = "Downtown Location",
            CustomLogoUrl = request.CustomLogoUrl,
            ColorScheme = request.ColorScheme,
            CustomNameOverride = request.CustomNameOverride,
            SettingsJson = request.SettingsJson,
            CreatedAt = DateTime.UtcNow.AddMonths(-6),
            UpdatedAt = DateTime.UtcNow
        };

        _brandingServiceMock
            .Setup(s => s.UpdateLocationBrandingAsync(locationId, userId, request))
            .ReturnsAsync(expectedBranding);

        // Act
        var result = await _controller.UpdateLocationBranding(locationId, request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var branding = okResult.Value as LocationBrandingResponse;
        branding.Should().NotBeNull();
        branding!.CustomLogoUrl.Should().Be(request.CustomLogoUrl);
        branding.ColorScheme.Should().Be(request.ColorScheme);
        branding.CustomNameOverride.Should().Be(request.CustomNameOverride);
        branding.SettingsJson.Should().Be(request.SettingsJson);
    }

    [Test]
    public async Task UpdateLocationBranding_PartialUpdate_ReturnsOkWithUpdatedBranding()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;
        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/updated-logo.png",
            ColorScheme = null,
            CustomNameOverride = null,
            SettingsJson = null
        };

        var expectedBranding = new LocationBrandingResponse
        {
            Id = 100,
            LocationId = locationId,
            LocationName = "Downtown Location",
            CustomLogoUrl = request.CustomLogoUrl,
            ColorScheme = null,
            CustomNameOverride = null,
            SettingsJson = null,
            CreatedAt = DateTime.UtcNow.AddMonths(-6),
            UpdatedAt = DateTime.UtcNow
        };

        _brandingServiceMock
            .Setup(s => s.UpdateLocationBrandingAsync(locationId, userId, request))
            .ReturnsAsync(expectedBranding);

        // Act
        var result = await _controller.UpdateLocationBranding(locationId, request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();

        var branding = okResult!.Value as LocationBrandingResponse;
        branding!.CustomLogoUrl.Should().Be(request.CustomLogoUrl);
    }

    [Test]
    public async Task UpdateLocationBranding_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var locationId = 1;
        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        // Act
        var result = await _controller.UpdateLocationBranding(locationId, request);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        var value = unauthorizedResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid user authentication");

        // Verify service was never called
        _brandingServiceMock.Verify(
            s => s.UpdateLocationBrandingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateLocationBrandingRequest>()),
            Times.Never);
    }

    [Test]
    public async Task UpdateLocationBranding_InvalidUserIdClaim_ReturnsUnauthorized()
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

        var locationId = 1;
        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        // Act
        var result = await _controller.UpdateLocationBranding(locationId, request);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _brandingServiceMock.Verify(
            s => s.UpdateLocationBrandingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateLocationBrandingRequest>()),
            Times.Never);
    }

    [Test]
    public async Task UpdateLocationBranding_UnauthorizedAccessException_ReturnsForbid()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;
        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        _brandingServiceMock
            .Setup(s => s.UpdateLocationBrandingAsync(locationId, userId, request))
            .ThrowsAsync(new UnauthorizedAccessException("User does not have access to this location"));

        // Act
        var result = await _controller.UpdateLocationBranding(locationId, request);

        // Assert
        var forbidResult = result.Result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task UpdateLocationBranding_InvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;
        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        _brandingServiceMock
            .Setup(s => s.UpdateLocationBrandingAsync(locationId, userId, request))
            .ThrowsAsync(new InvalidOperationException("Cannot update branding for inactive location"));

        // Act
        var result = await _controller.UpdateLocationBranding(locationId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Cannot update branding for inactive location");
    }

    [Test]
    public async Task UpdateLocationBranding_ArgumentException_ReturnsNotFound()
    {
        // Arrange
        var locationId = 999; // Non-existent location
        var userId = 1;
        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        _brandingServiceMock
            .Setup(s => s.UpdateLocationBrandingAsync(locationId, userId, request))
            .ThrowsAsync(new ArgumentException("Location not found"));

        // Act
        var result = await _controller.UpdateLocationBranding(locationId, request);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);

        var value = notFoundResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Location not found");
    }

    [Test]
    public async Task UpdateLocationBranding_GenericException_Returns500()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;
        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        _brandingServiceMock
            .Setup(s => s.UpdateLocationBrandingAsync(locationId, userId, request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.UpdateLocationBranding(locationId, request);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while updating location branding");
    }

    #endregion
}
