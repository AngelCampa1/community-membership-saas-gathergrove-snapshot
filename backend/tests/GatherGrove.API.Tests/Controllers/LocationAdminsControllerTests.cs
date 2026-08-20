using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class LocationAdminsControllerTests
{
    private Mock<IHierarchicalPermissionsService> _permissionsServiceMock = null!;
    private Mock<ILogger<LocationAdminsController>> _loggerMock = null!;
    private LocationAdminsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _permissionsServiceMock = new Mock<IHierarchicalPermissionsService>();
        _loggerMock = new Mock<ILogger<LocationAdminsController>>();

        _controller = new LocationAdminsController(
            _permissionsServiceMock.Object,
            _loggerMock.Object);

        // Setup default HTTP context with authenticated user
        SetupAuthenticatedUser(userId: 1);
    }

    private void SetupAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
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

    #region AssignLocationAdmin Tests

    [Test]
    public async Task AssignLocationAdmin_ValidRequest_ReturnsOkWithAdmin()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;
        var request = new AssignLocationAdminRequest
        {
            UserId = 10,
            PermissionLevel = LocationPermissionLevel.LocationAdmin
        };

        var expectedResponse = new LocationAdminResponse
        {
            Id = 100,
            LocationId = locationId,
            LocationName = "Test Location",
            UserId = request.UserId,
            UserFullName = "John Doe",
            UserEmail = "john@example.com",
            PermissionLevel = request.PermissionLevel,
            PermissionLevelName = "LocationAdmin",
            AssignedAt = DateTime.UtcNow,
            AssignedBy = userId,
            AssignedByName = "Admin User"
        };

        _permissionsServiceMock
            .Setup(s => s.AssignLocationAdminAsync(locationId, userId, request))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.AssignLocationAdmin(locationId, request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var admin = okResult.Value as LocationAdminResponse;
        admin.Should().NotBeNull();
        admin!.Id.Should().Be(100);
        admin.UserId.Should().Be(request.UserId);
        admin.PermissionLevel.Should().Be(LocationPermissionLevel.LocationAdmin);
        admin.LocationName.Should().Be("Test Location");
    }

    [Test]
    public async Task AssignLocationAdmin_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var locationId = 1;
        var request = new AssignLocationAdminRequest
        {
            UserId = 10,
            PermissionLevel = LocationPermissionLevel.LocationAdmin
        };

        // Act
        var result = await _controller.AssignLocationAdmin(locationId, request);

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
        _permissionsServiceMock.Verify(
            s => s.AssignLocationAdminAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<AssignLocationAdminRequest>()),
            Times.Never);
    }

    [Test]
    public async Task AssignLocationAdmin_InvalidUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "invalid-user-id"), // Non-numeric
            new(ClaimTypes.Role, "Admin")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var locationId = 1;
        var request = new AssignLocationAdminRequest
        {
            UserId = 10,
            PermissionLevel = LocationPermissionLevel.LocationAdmin
        };

        // Act
        var result = await _controller.AssignLocationAdmin(locationId, request);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _permissionsServiceMock.Verify(
            s => s.AssignLocationAdminAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<AssignLocationAdminRequest>()),
            Times.Never);
    }

    [Test]
    public async Task AssignLocationAdmin_UnauthorizedAccessException_ReturnsForbid()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;
        var request = new AssignLocationAdminRequest
        {
            UserId = 10,
            PermissionLevel = LocationPermissionLevel.LocationAdmin
        };

        _permissionsServiceMock
            .Setup(s => s.AssignLocationAdminAsync(locationId, userId, request))
            .ThrowsAsync(new UnauthorizedAccessException("User does not have permission to assign admins"));

        // Act
        var result = await _controller.AssignLocationAdmin(locationId, request);

        // Assert
        var forbidResult = result.Result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task AssignLocationAdmin_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;
        var request = new AssignLocationAdminRequest
        {
            UserId = 10,
            PermissionLevel = LocationPermissionLevel.LocationAdmin
        };

        _permissionsServiceMock
            .Setup(s => s.AssignLocationAdminAsync(locationId, userId, request))
            .ThrowsAsync(new ArgumentException("Invalid permission level"));

        // Act
        var result = await _controller.AssignLocationAdmin(locationId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("Invalid permission level");
    }

    [Test]
    public async Task AssignLocationAdmin_GenericException_Returns500()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;
        var request = new AssignLocationAdminRequest
        {
            UserId = 10,
            PermissionLevel = LocationPermissionLevel.LocationAdmin
        };

        _permissionsServiceMock
            .Setup(s => s.AssignLocationAdminAsync(locationId, userId, request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.AssignLocationAdmin(locationId, request);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        value.Should().NotBeNull();

        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty.Should().NotBeNull();
        messageProperty!.GetValue(value).Should().Be("An error occurred while assigning the admin");
    }

    #endregion

    #region GetLocationAdmins Tests

    [Test]
    public async Task GetLocationAdmins_ValidRequest_ReturnsOkWithAdminList()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;
        var expectedAdmins = new List<LocationAdminResponse>
        {
            new()
            {
                Id = 100,
                LocationId = locationId,
                LocationName = "Test Location",
                UserId = 10,
                UserFullName = "John Doe",
                UserEmail = "john@example.com",
                PermissionLevel = LocationPermissionLevel.LocationAdmin,
                PermissionLevelName = "LocationAdmin",
                AssignedAt = DateTime.UtcNow,
                AssignedBy = 1,
                AssignedByName = "Super Admin"
            },
            new()
            {
                Id = 101,
                LocationId = locationId,
                LocationName = "Test Location",
                UserId = 11,
                UserFullName = "Jane Smith",
                UserEmail = "jane@example.com",
                PermissionLevel = LocationPermissionLevel.LocationModerator,
                PermissionLevelName = "LocationModerator",
                AssignedAt = DateTime.UtcNow.AddDays(-5),
                AssignedBy = 1,
                AssignedByName = "Super Admin"
            }
        };

        _permissionsServiceMock
            .Setup(s => s.GetLocationAdminsAsync(locationId, userId))
            .ReturnsAsync(expectedAdmins);

        // Act
        var result = await _controller.GetLocationAdmins(locationId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var admins = okResult.Value as List<LocationAdminResponse>;
        admins.Should().NotBeNull();
        admins.Should().HaveCount(2);
        admins![0].UserFullName.Should().Be("John Doe");
        admins[0].PermissionLevel.Should().Be(LocationPermissionLevel.LocationAdmin);
        admins[1].UserFullName.Should().Be("Jane Smith");
        admins[1].PermissionLevel.Should().Be(LocationPermissionLevel.LocationModerator);
    }

    [Test]
    public async Task GetLocationAdmins_NoAdmins_ReturnsOkWithEmptyList()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;
        var expectedAdmins = new List<LocationAdminResponse>();

        _permissionsServiceMock
            .Setup(s => s.GetLocationAdminsAsync(locationId, userId))
            .ReturnsAsync(expectedAdmins);

        // Act
        var result = await _controller.GetLocationAdmins(locationId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();

        var admins = okResult!.Value as List<LocationAdminResponse>;
        admins.Should().NotBeNull();
        admins.Should().BeEmpty();
    }

    [Test]
    public async Task GetLocationAdmins_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var locationId = 1;

        // Act
        var result = await _controller.GetLocationAdmins(locationId);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        var value = unauthorizedResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid user authentication");

        // Verify service was never called
        _permissionsServiceMock.Verify(
            s => s.GetLocationAdminsAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetLocationAdmins_UnauthorizedAccessException_ReturnsForbid()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;

        _permissionsServiceMock
            .Setup(s => s.GetLocationAdminsAsync(locationId, userId))
            .ThrowsAsync(new UnauthorizedAccessException("User does not have access to this location"));

        // Act
        var result = await _controller.GetLocationAdmins(locationId);

        // Assert
        var forbidResult = result.Result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetLocationAdmins_ArgumentException_ReturnsNotFound()
    {
        // Arrange
        var locationId = 999; // Non-existent location
        var userId = 1;

        _permissionsServiceMock
            .Setup(s => s.GetLocationAdminsAsync(locationId, userId))
            .ThrowsAsync(new ArgumentException("Location not found"));

        // Act
        var result = await _controller.GetLocationAdmins(locationId);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);

        var value = notFoundResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Location not found");
    }

    [Test]
    public async Task GetLocationAdmins_GenericException_Returns500()
    {
        // Arrange
        var locationId = 1;
        var userId = 1;

        _permissionsServiceMock
            .Setup(s => s.GetLocationAdminsAsync(locationId, userId))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetLocationAdmins(locationId);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while retrieving admins");
    }

    #endregion

    #region RemoveLocationAdmin Tests

    [Test]
    public async Task RemoveLocationAdmin_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var locationId = 1;
        var adminUserId = 10;
        var removingUserId = 1;

        _permissionsServiceMock
            .Setup(s => s.RemoveLocationAdminAsync(locationId, adminUserId, removingUserId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.RemoveLocationAdmin(locationId, adminUserId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
        var noContentResult = result as NoContentResult;
        noContentResult!.StatusCode.Should().Be(204);

        _permissionsServiceMock.Verify(
            s => s.RemoveLocationAdminAsync(locationId, adminUserId, removingUserId),
            Times.Once);
    }

    [Test]
    public async Task RemoveLocationAdmin_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var locationId = 1;
        var adminUserId = 10;

        // Act
        var result = await _controller.RemoveLocationAdmin(locationId, adminUserId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        var value = unauthorizedResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid user authentication");

        // Verify service was never called
        _permissionsServiceMock.Verify(
            s => s.RemoveLocationAdminAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task RemoveLocationAdmin_UnauthorizedAccessException_ReturnsForbid()
    {
        // Arrange
        var locationId = 1;
        var adminUserId = 10;
        var removingUserId = 1;

        _permissionsServiceMock
            .Setup(s => s.RemoveLocationAdminAsync(locationId, adminUserId, removingUserId))
            .ThrowsAsync(new UnauthorizedAccessException("Cannot remove admin with higher permission level"));

        // Act
        var result = await _controller.RemoveLocationAdmin(locationId, adminUserId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task RemoveLocationAdmin_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var locationId = 1;
        var adminUserId = 10;
        var removingUserId = 1;

        _permissionsServiceMock
            .Setup(s => s.RemoveLocationAdminAsync(locationId, adminUserId, removingUserId))
            .ThrowsAsync(new ArgumentException("Admin assignment not found"));

        // Act
        var result = await _controller.RemoveLocationAdmin(locationId, adminUserId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Admin assignment not found");
    }

    [Test]
    public async Task RemoveLocationAdmin_GenericException_Returns500()
    {
        // Arrange
        var locationId = 1;
        var adminUserId = 10;
        var removingUserId = 1;

        _permissionsServiceMock
            .Setup(s => s.RemoveLocationAdminAsync(locationId, adminUserId, removingUserId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.RemoveLocationAdmin(locationId, adminUserId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while removing the admin");
    }

    #endregion

    #region GetUserLocationPermissions Tests

    [Test]
    public async Task GetUserLocationPermissions_UserViewingOwnPermissions_ReturnsOkWithPermissions()
    {
        // Arrange
        var userId = 1; // Same as authenticated user
        var clubId = 1;
        var expectedPermissions = new List<LocationAdminResponse>
        {
            new()
            {
                Id = 100,
                LocationId = 1,
                LocationName = "Location A",
                UserId = userId,
                UserFullName = "Current User",
                UserEmail = "user@example.com",
                PermissionLevel = LocationPermissionLevel.LocationAdmin,
                PermissionLevelName = "LocationAdmin",
                AssignedAt = DateTime.UtcNow.AddMonths(-1),
                AssignedBy = 5,
                AssignedByName = "Super Admin"
            },
            new()
            {
                Id = 101,
                LocationId = 2,
                LocationName = "Location B",
                UserId = userId,
                UserFullName = "Current User",
                UserEmail = "user@example.com",
                PermissionLevel = LocationPermissionLevel.LocationModerator,
                PermissionLevelName = "LocationModerator",
                AssignedAt = DateTime.UtcNow.AddMonths(-2),
                AssignedBy = 5,
                AssignedByName = "Super Admin"
            }
        };

        _permissionsServiceMock
            .Setup(s => s.GetUserLocationPermissionsAsync(userId, clubId))
            .ReturnsAsync(expectedPermissions);

        // Act
        var result = await _controller.GetUserLocationPermissions(userId, clubId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var permissions = okResult.Value as List<LocationAdminResponse>;
        permissions.Should().NotBeNull();
        permissions.Should().HaveCount(2);
        permissions![0].LocationName.Should().Be("Location A");
        permissions[0].PermissionLevel.Should().Be(LocationPermissionLevel.LocationAdmin);
        permissions[1].LocationName.Should().Be("Location B");
        permissions[1].PermissionLevel.Should().Be(LocationPermissionLevel.LocationModerator);
    }

    [Test]
    public async Task GetUserLocationPermissions_UserViewingAnotherUsersPermissions_ReturnsForbid()
    {
        // Arrange
        SetupAuthenticatedUser(userId: 1);
        var targetUserId = 2; // Different user
        var clubId = 1;

        // Act
        var result = await _controller.GetUserLocationPermissions(targetUserId, clubId);

        // Assert
        var forbidResult = result.Result as ForbidResult;
        forbidResult.Should().NotBeNull();

        // Verify service was never called
        _permissionsServiceMock.Verify(
            s => s.GetUserLocationPermissionsAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetUserLocationPermissions_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var userId = 1;
        var clubId = 1;

        // Act
        var result = await _controller.GetUserLocationPermissions(userId, clubId);

        // Assert
        var unauthorizedResult = result.Result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        var value = unauthorizedResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid user authentication");

        // Verify service was never called
        _permissionsServiceMock.Verify(
            s => s.GetUserLocationPermissionsAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetUserLocationPermissions_NoPermissions_ReturnsOkWithEmptyList()
    {
        // Arrange
        var userId = 1;
        var clubId = 1;
        var expectedPermissions = new List<LocationAdminResponse>();

        _permissionsServiceMock
            .Setup(s => s.GetUserLocationPermissionsAsync(userId, clubId))
            .ReturnsAsync(expectedPermissions);

        // Act
        var result = await _controller.GetUserLocationPermissions(userId, clubId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();

        var permissions = okResult!.Value as List<LocationAdminResponse>;
        permissions.Should().NotBeNull();
        permissions.Should().BeEmpty();
    }

    [Test]
    public async Task GetUserLocationPermissions_GenericException_Returns500()
    {
        // Arrange
        var userId = 1;
        var clubId = 1;

        _permissionsServiceMock
            .Setup(s => s.GetUserLocationPermissionsAsync(userId, clubId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetUserLocationPermissions(userId, clubId);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);

        var value = statusCodeResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("An error occurred while retrieving location permissions");
    }

    #endregion
}
