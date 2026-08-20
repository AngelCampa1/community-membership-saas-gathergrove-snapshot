using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class HierarchicalPermissionsServiceTests
{
    private GatherGroveDbContext _context = null!;
    private HierarchicalPermissionsService _service = null!;
    private Mock<ILogger<HierarchicalPermissionsService>> _mockLogger = null!;

    private int _testClubId;
    private int _testLocation1Id;
    private int _testLocation2Id;
    private int _testClubAdminUserId;
    private int _testLocationAdminUserId;
    private int _testSuperAdminUserId;
    private int _testRegularUserId;
    private int _testUserToAssignId;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<HierarchicalPermissionsService>>();
        _service = new HierarchicalPermissionsService(_context, _mockLogger.Object);

        SetupTestData();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private void SetupTestData()
    {
        // Create test club
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Enterprise",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        _context.SaveChanges();
        _testClubId = club.Id;

        // Create test users
        var clubAdminUser = new User
        {
            FullName = "Club Admin",
            Email = "clubadmin@test.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var locationAdminUser = new User
        {
            FullName = "Location Admin",
            Email = "locationadmin@test.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var superAdminUser = new User
        {
            FullName = "Super Admin",
            Email = "superadmin@test.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var regularUser = new User
        {
            FullName = "Regular User",
            Email = "regular@test.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var userToAssign = new User
        {
            FullName = "User To Assign",
            Email = "assign@test.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(clubAdminUser, locationAdminUser, superAdminUser, regularUser, userToAssign);
        _context.SaveChanges();
        _testClubAdminUserId = clubAdminUser.Id;
        _testLocationAdminUserId = locationAdminUser.Id;
        _testSuperAdminUserId = superAdminUser.Id;
        _testRegularUserId = regularUser.Id;
        _testUserToAssignId = userToAssign.Id;

        // Create club admin
        var clubAdmin = new ClubAdmin
        {
            ClubId = _testClubId,
            UserId = _testClubAdminUserId,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubAdmins.Add(clubAdmin);

        // Create test locations
        var location1 = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Location 1",
            Address = "123 Test St",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var location2 = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Location 2",
            Address = "456 Test Ave",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.ClubLocations.AddRange(location1, location2);
        _context.SaveChanges();
        _testLocation1Id = location1.Id;
        _testLocation2Id = location2.Id;

        // Create location admin for location 1
        var locationAdmin = new LocationAdmin
        {
            LocationId = _testLocation1Id,
            UserId = _testLocationAdminUserId,
            PermissionLevel = LocationPermissionLevel.LocationAdmin,
            AssignedAt = DateTime.UtcNow,
            AssignedBy = _testClubAdminUserId
        };
        _context.LocationAdmins.Add(locationAdmin);

        // Create super admin for location 1
        var superAdmin = new LocationAdmin
        {
            LocationId = _testLocation1Id,
            UserId = _testSuperAdminUserId,
            PermissionLevel = LocationPermissionLevel.SuperAdmin,
            AssignedAt = DateTime.UtcNow,
            AssignedBy = _testClubAdminUserId
        };
        _context.LocationAdmins.Add(superAdmin);

        _context.SaveChanges();
    }

    #region AssignLocationAdminAsync Tests

    [Test]
    public async Task AssignLocationAdminAsync_ClubAdminAssigns_CreatesNewLocationAdmin()
    {
        // Arrange
        var request = new AssignLocationAdminRequest
        {
            UserId = _testUserToAssignId,
            PermissionLevel = LocationPermissionLevel.Staff
        };

        // Act
        var result = await _service.AssignLocationAdminAsync(_testLocation1Id, _testClubAdminUserId, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.UserId, Is.EqualTo(_testUserToAssignId));
        Assert.That(result.PermissionLevel, Is.EqualTo(LocationPermissionLevel.Staff));
        Assert.That(result.LocationId, Is.EqualTo(_testLocation1Id));
    }

    [Test]
    public async Task AssignLocationAdminAsync_SuperAdminAssigns_CreatesNewLocationAdmin()
    {
        // Arrange
        var request = new AssignLocationAdminRequest
        {
            UserId = _testUserToAssignId,
            PermissionLevel = LocationPermissionLevel.Staff
        };

        // Act
        var result = await _service.AssignLocationAdminAsync(_testLocation1Id, _testSuperAdminUserId, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.UserId, Is.EqualTo(_testUserToAssignId));
    }

    [Test]
    public async Task AssignLocationAdminAsync_SavesAdminToDatabase()
    {
        // Arrange
        var request = new AssignLocationAdminRequest
        {
            UserId = _testUserToAssignId,
            PermissionLevel = LocationPermissionLevel.Staff
        };

        // Act
        await _service.AssignLocationAdminAsync(_testLocation1Id, _testClubAdminUserId, request);

        // Assert
        var savedAdmin = await _context.LocationAdmins
            .FirstOrDefaultAsync(la => la.LocationId == _testLocation1Id && la.UserId == _testUserToAssignId);
        Assert.That(savedAdmin, Is.Not.Null);
        Assert.That(savedAdmin!.PermissionLevel, Is.EqualTo(LocationPermissionLevel.Staff));
    }

    [Test]
    public async Task AssignLocationAdminAsync_ExistingAdmin_UpdatesPermissionLevel()
    {
        // Arrange
        var request = new AssignLocationAdminRequest
        {
            UserId = _testLocationAdminUserId, // Already an admin
            PermissionLevel = LocationPermissionLevel.SuperAdmin // Upgrade
        };

        // Act
        var result = await _service.AssignLocationAdminAsync(_testLocation1Id, _testClubAdminUserId, request);

        // Assert
        Assert.That(result.PermissionLevel, Is.EqualTo(LocationPermissionLevel.SuperAdmin));

        var updatedAdmin = await _context.LocationAdmins
            .FirstOrDefaultAsync(la => la.LocationId == _testLocation1Id && la.UserId == _testLocationAdminUserId);
        Assert.That(updatedAdmin!.PermissionLevel, Is.EqualTo(LocationPermissionLevel.SuperAdmin));
    }

    [Test]
    public void AssignLocationAdminAsync_LocationNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new AssignLocationAdminRequest
        {
            UserId = _testUserToAssignId,
            PermissionLevel = LocationPermissionLevel.Staff
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.AssignLocationAdminAsync(999, _testClubAdminUserId, request));
        Assert.That(ex!.Message, Does.Contain("Location 999 not found"));
    }

    [Test]
    public void AssignLocationAdminAsync_UserNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new AssignLocationAdminRequest
        {
            UserId = 999,
            PermissionLevel = LocationPermissionLevel.Staff
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.AssignLocationAdminAsync(_testLocation1Id, _testClubAdminUserId, request));
        Assert.That(ex!.Message, Does.Contain("User 999 not found"));
    }

    [Test]
    public void AssignLocationAdminAsync_UnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var request = new AssignLocationAdminRequest
        {
            UserId = _testUserToAssignId,
            PermissionLevel = LocationPermissionLevel.Staff
        };

        // Act & Assert - Regular user (not club admin, not super admin) cannot assign
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _service.AssignLocationAdminAsync(_testLocation1Id, _testRegularUserId, request));
        Assert.That(ex!.Message, Does.Contain("do not have permission"));
    }

    [Test]
    public void AssignLocationAdminAsync_LocationAdminCannotAssign_ThrowsUnauthorizedAccessException()
    {
        // Arrange - Location admin is not club admin or super admin
        var request = new AssignLocationAdminRequest
        {
            UserId = _testUserToAssignId,
            PermissionLevel = LocationPermissionLevel.Staff
        };

        // Act & Assert - Location admin (not super admin) cannot assign
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _service.AssignLocationAdminAsync(_testLocation1Id, _testLocationAdminUserId, request));
        Assert.That(ex!.Message, Does.Contain("do not have permission"));
    }

    [Test]
    public async Task AssignLocationAdminAsync_LogsInformation()
    {
        // Arrange
        var request = new AssignLocationAdminRequest
        {
            UserId = _testUserToAssignId,
            PermissionLevel = LocationPermissionLevel.Staff
        };

        // Act
        await _service.AssignLocationAdminAsync(_testLocation1Id, _testClubAdminUserId, request);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Assigning user")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task AssignLocationAdminAsync_NewAdmin_ReturnsCorrectResponse()
    {
        // Arrange
        var request = new AssignLocationAdminRequest
        {
            UserId = _testUserToAssignId,
            PermissionLevel = LocationPermissionLevel.LocationAdmin
        };

        // Act
        var result = await _service.AssignLocationAdminAsync(_testLocation1Id, _testClubAdminUserId, request);

        // Assert
        Assert.That(result.UserFullName, Is.EqualTo("User To Assign"));
        Assert.That(result.UserEmail, Is.EqualTo("assign@test.com"));
        Assert.That(result.LocationName, Is.EqualTo("Location 1"));
        Assert.That(result.PermissionLevelName, Is.EqualTo("LocationAdmin"));
        Assert.That(result.AssignedBy, Is.EqualTo(_testClubAdminUserId));
    }

    [Test]
    public async Task AssignLocationAdminAsync_AllPermissionLevels_AreAccepted()
    {
        // Arrange & Act & Assert - Test all permission levels
        var levels = Enum.GetValues<LocationPermissionLevel>();
        foreach (var level in levels)
        {
            // Create a unique user for each level
            var user = new User
            {
                FullName = $"User {level}",
                Email = $"user{level}@test.com",
                PasswordHash = "hash",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new AssignLocationAdminRequest
            {
                UserId = user.Id,
                PermissionLevel = level
            };

            var result = await _service.AssignLocationAdminAsync(_testLocation1Id, _testClubAdminUserId, request);
            Assert.That(result.PermissionLevel, Is.EqualTo(level), $"Failed for level {level}");
        }
    }

    #endregion

    #region RemoveLocationAdminAsync Tests

    [Test]
    public async Task RemoveLocationAdminAsync_ValidRequest_RemovesAdmin()
    {
        // Arrange - The location admin already exists from setup

        // Act
        await _service.RemoveLocationAdminAsync(_testLocation1Id, _testLocationAdminUserId, _testClubAdminUserId);

        // Assert
        var removed = await _context.LocationAdmins
            .FirstOrDefaultAsync(la => la.LocationId == _testLocation1Id && la.UserId == _testLocationAdminUserId);
        Assert.That(removed, Is.Null);
    }

    [Test]
    public void RemoveLocationAdminAsync_LocationNotFound_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.RemoveLocationAdminAsync(999, _testLocationAdminUserId, _testClubAdminUserId));
        Assert.That(ex!.Message, Does.Contain("Location 999 not found"));
    }

    [Test]
    public void RemoveLocationAdminAsync_UnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Act & Assert - Regular user cannot remove admins
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _service.RemoveLocationAdminAsync(_testLocation1Id, _testLocationAdminUserId, _testRegularUserId));
        Assert.That(ex!.Message, Does.Contain("do not have permission"));
    }

    [Test]
    public void RemoveLocationAdminAsync_AdminNotFound_ThrowsArgumentException()
    {
        // Act & Assert - Try to remove user who isn't an admin
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.RemoveLocationAdminAsync(_testLocation1Id, _testUserToAssignId, _testClubAdminUserId));
        Assert.That(ex!.Message, Does.Contain($"User {_testUserToAssignId} is not an admin"));
    }

    [Test]
    public async Task RemoveLocationAdminAsync_LogsInformation()
    {
        // Act
        await _service.RemoveLocationAdminAsync(_testLocation1Id, _testLocationAdminUserId, _testClubAdminUserId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Removing user") || v.ToString()!.Contains("Removed user")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    #endregion

    #region GetUserLocationPermissionsAsync Tests

    [Test]
    public async Task GetUserLocationPermissionsAsync_UserWithPermissions_ReturnsPermissions()
    {
        // Act
        var results = await _service.GetUserLocationPermissionsAsync(_testLocationAdminUserId, _testClubId);

        // Assert
        Assert.That(results, Has.Count.EqualTo(1));
        Assert.That(results[0].UserId, Is.EqualTo(_testLocationAdminUserId));
        Assert.That(results[0].PermissionLevel, Is.EqualTo(LocationPermissionLevel.LocationAdmin));
    }

    [Test]
    public async Task GetUserLocationPermissionsAsync_UserWithNoPermissions_ReturnsEmptyList()
    {
        // Act
        var results = await _service.GetUserLocationPermissionsAsync(_testRegularUserId, _testClubId);

        // Assert
        Assert.That(results, Is.Empty);
    }

    [Test]
    public async Task GetUserLocationPermissionsAsync_UserWithMultiplePermissions_ReturnsAll()
    {
        // Arrange - Give super admin permissions in location 2 too
        var newAdmin = new LocationAdmin
        {
            LocationId = _testLocation2Id,
            UserId = _testSuperAdminUserId,
            PermissionLevel = LocationPermissionLevel.LocationAdmin,
            AssignedAt = DateTime.UtcNow,
            AssignedBy = _testClubAdminUserId
        };
        _context.LocationAdmins.Add(newAdmin);
        await _context.SaveChangesAsync();

        // Act
        var results = await _service.GetUserLocationPermissionsAsync(_testSuperAdminUserId, _testClubId);

        // Assert
        Assert.That(results, Has.Count.EqualTo(2));
    }

    [Test]
    public async Task GetUserLocationPermissionsAsync_DifferentClub_ReturnsEmptyList()
    {
        // Arrange - Create another club
        var otherClub = new Club
        {
            Name = "Other Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(otherClub);
        await _context.SaveChangesAsync();

        // Act - Query for other club where user has no permissions
        var results = await _service.GetUserLocationPermissionsAsync(_testLocationAdminUserId, otherClub.Id);

        // Assert
        Assert.That(results, Is.Empty);
    }

    [Test]
    public async Task GetUserLocationPermissionsAsync_LogsInformation()
    {
        // Act
        await _service.GetUserLocationPermissionsAsync(_testLocationAdminUserId, _testClubId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Getting location permissions")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region CheckLocationPermissionAsync Tests

    [Test]
    public async Task CheckLocationPermissionAsync_UserWithSufficientPermission_ReturnsTrue()
    {
        // Act - Super admin (level 1) should have Staff access (level 5)
        var result = await _service.CheckLocationPermissionAsync(_testSuperAdminUserId, _testLocation1Id, LocationPermissionLevel.Staff);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CheckLocationPermissionAsync_UserWithExactPermission_ReturnsTrue()
    {
        // Act - Location admin checking for location admin level
        var result = await _service.CheckLocationPermissionAsync(_testLocationAdminUserId, _testLocation1Id, LocationPermissionLevel.LocationAdmin);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CheckLocationPermissionAsync_UserWithInsufficientPermission_ReturnsFalse()
    {
        // Act - Location admin (level 2) checking for super admin (level 1)
        var result = await _service.CheckLocationPermissionAsync(_testLocationAdminUserId, _testLocation1Id, LocationPermissionLevel.SuperAdmin);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CheckLocationPermissionAsync_UserWithNoPermission_ReturnsFalse()
    {
        // Act - Regular user (no permission) checking for any level
        var result = await _service.CheckLocationPermissionAsync(_testRegularUserId, _testLocation1Id, LocationPermissionLevel.Staff);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CheckLocationPermissionAsync_ClubAdmin_AlwaysReturnsTrue()
    {
        // Act - Club admin should have access to any location in their club
        var resultSuperAdmin = await _service.CheckLocationPermissionAsync(_testClubAdminUserId, _testLocation1Id, LocationPermissionLevel.SuperAdmin);
        var resultStaff = await _service.CheckLocationPermissionAsync(_testClubAdminUserId, _testLocation1Id, LocationPermissionLevel.Staff);
        var resultModerator = await _service.CheckLocationPermissionAsync(_testClubAdminUserId, _testLocation1Id, LocationPermissionLevel.LocationModerator);

        // Assert
        Assert.That(resultSuperAdmin, Is.True);
        Assert.That(resultStaff, Is.True);
        Assert.That(resultModerator, Is.True);
    }

    [Test]
    public async Task CheckLocationPermissionAsync_ClubAdminForOtherLocation_ReturnsTrue()
    {
        // Act - Club admin should have access to location 2 as well
        var result = await _service.CheckLocationPermissionAsync(_testClubAdminUserId, _testLocation2Id, LocationPermissionLevel.SuperAdmin);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CheckLocationPermissionAsync_LocationNotFound_ReturnsFalse()
    {
        // Act
        var result = await _service.CheckLocationPermissionAsync(_testClubAdminUserId, 999, LocationPermissionLevel.Staff);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CheckLocationPermissionAsync_PermissionHierarchy_WorksCorrectly()
    {
        // Test that lower enum values (SuperAdmin=1) have access to higher levels (Staff=5)
        // SuperAdmin should have access to all levels
        var superAdminAccessesSuperAdmin = await _service.CheckLocationPermissionAsync(_testSuperAdminUserId, _testLocation1Id, LocationPermissionLevel.SuperAdmin);
        var superAdminAccessesLocationAdmin = await _service.CheckLocationPermissionAsync(_testSuperAdminUserId, _testLocation1Id, LocationPermissionLevel.LocationAdmin);
        var superAdminAccessesRegionalMgr = await _service.CheckLocationPermissionAsync(_testSuperAdminUserId, _testLocation1Id, LocationPermissionLevel.RegionalManager);
        var superAdminAccessesStaff = await _service.CheckLocationPermissionAsync(_testSuperAdminUserId, _testLocation1Id, LocationPermissionLevel.Staff);
        var superAdminAccessesModerator = await _service.CheckLocationPermissionAsync(_testSuperAdminUserId, _testLocation1Id, LocationPermissionLevel.LocationModerator);

        Assert.That(superAdminAccessesSuperAdmin, Is.True);
        Assert.That(superAdminAccessesLocationAdmin, Is.True);
        Assert.That(superAdminAccessesRegionalMgr, Is.True);
        Assert.That(superAdminAccessesStaff, Is.True);
        Assert.That(superAdminAccessesModerator, Is.True);
    }

    #endregion

    #region GetLocationAdminsAsync Tests

    [Test]
    public async Task GetLocationAdminsAsync_ValidRequest_ReturnsAdmins()
    {
        // Act
        var results = await _service.GetLocationAdminsAsync(_testLocation1Id, _testClubAdminUserId);

        // Assert - Should have location admin and super admin from setup
        Assert.That(results, Has.Count.EqualTo(2));
    }

    [Test]
    public async Task GetLocationAdminsAsync_LocationWithNoAdmins_ReturnsEmptyList()
    {
        // Act - Location 2 has no admins from setup
        var results = await _service.GetLocationAdminsAsync(_testLocation2Id, _testClubAdminUserId);

        // Assert
        Assert.That(results, Is.Empty);
    }

    [Test]
    public void GetLocationAdminsAsync_LocationNotFound_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.GetLocationAdminsAsync(999, _testClubAdminUserId));
        Assert.That(ex!.Message, Does.Contain("Location 999 not found"));
    }

    [Test]
    public void GetLocationAdminsAsync_UnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Act & Assert - Regular user cannot view admins
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _service.GetLocationAdminsAsync(_testLocation1Id, _testRegularUserId));
        Assert.That(ex!.Message, Does.Contain("do not have permission"));
    }

    [Test]
    public async Task GetLocationAdminsAsync_ReturnsCorrectDetails()
    {
        // Act
        var results = await _service.GetLocationAdminsAsync(_testLocation1Id, _testClubAdminUserId);

        // Assert
        var locationAdmin = results.FirstOrDefault(r => r.PermissionLevel == LocationPermissionLevel.LocationAdmin);
        Assert.That(locationAdmin, Is.Not.Null);
        Assert.That(locationAdmin!.UserFullName, Is.EqualTo("Location Admin"));
        Assert.That(locationAdmin.LocationName, Is.EqualTo("Location 1"));
        Assert.That(locationAdmin.PermissionLevelName, Is.EqualTo("LocationAdmin"));
    }

    [Test]
    public async Task GetLocationAdminsAsync_LogsInformation()
    {
        // Act
        await _service.GetLocationAdminsAsync(_testLocation1Id, _testClubAdminUserId);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Getting admins for location")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion
}
