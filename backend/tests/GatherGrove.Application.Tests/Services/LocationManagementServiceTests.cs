using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class LocationManagementServiceTests
{
    private GatherGroveDbContext _context = null!;
    private LocationManagementService _locationService = null!;
    private Mock<ILogger<LocationManagementService>> _mockLogger = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<LocationManagementService>>();
        _locationService = new LocationManagementService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(User user, Club club)> CreateTestUserAndClub(string tier = "Unlimited")
    {
        var user = new User
        {
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = tier
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Make user admin of club
        var clubAdmin = new ClubAdmin
        {
            UserId = user.Id,
            ClubId = club.Id
        };
        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        return (user, club);
    }

    private CreateLocationRequest CreateValidLocationRequest(string code = "NYC01")
    {
        return new CreateLocationRequest
        {
            LocationName = "New York Office",
            LocationCode = code,
            Address = "123 Main St",
            City = "New York",
            State = "NY",
            Country = "USA",
            Timezone = "America/New_York",
            ContactEmail = "nyc@example.com",
            ContactPhone = "555-1234"
        };
    }

    #region CreateLocationAsync Tests

    [Test]
    public async Task CreateLocationAsync_ValidRequest_ReturnsLocationResponse()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub("Unlimited");
        var request = CreateValidLocationRequest();

        // Act
        var result = await _locationService.CreateLocationAsync(club.Id, user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.LocationName, Is.EqualTo(request.LocationName));
        Assert.That(result.LocationCode, Is.EqualTo(request.LocationCode));
        Assert.That(result.City, Is.EqualTo(request.City));
        Assert.That(result.ParentClubId, Is.EqualTo(club.Id));
        Assert.That(result.IsActive, Is.True);
    }

    [Test]
    public async Task CreateLocationAsync_ClubNotFound_ThrowsArgumentException()
    {
        // Arrange
        var (user, _) = await CreateTestUserAndClub();
        var request = CreateValidLocationRequest();
        var nonExistentClubId = 99999;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _locationService.CreateLocationAsync(nonExistentClubId, user.Id, request));
        Assert.That(ex!.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task CreateLocationAsync_UserNotAdmin_ThrowsUnauthorizedException()
    {
        // Arrange
        var (_, club) = await CreateTestUserAndClub();
        var nonAdminUser = new User
        {
            FullName = "Non Admin",
            Email = "nonadmin@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(nonAdminUser);
        await _context.SaveChangesAsync();

        var request = CreateValidLocationRequest();

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _locationService.CreateLocationAsync(club.Id, nonAdminUser.Id, request));
        Assert.That(ex!.Message, Does.Contain("permission"));
    }

    [Test]
    public async Task CreateLocationAsync_NotUnlimitedTier_ThrowsInvalidOperationException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub("Basic");
        var request = CreateValidLocationRequest();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _locationService.CreateLocationAsync(club.Id, user.Id, request));
        Assert.That(ex!.Message, Does.Contain("Expand tier"));
    }

    [Test]
    public async Task CreateLocationAsync_DuplicateLocationCode_ThrowsArgumentException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = CreateValidLocationRequest("DUPE01");

        // Create first location
        await _locationService.CreateLocationAsync(club.Id, user.Id, request);

        // Try to create another with same code
        var duplicateRequest = CreateValidLocationRequest("DUPE01");

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _locationService.CreateLocationAsync(club.Id, user.Id, duplicateRequest));
        Assert.That(ex!.Message, Does.Contain("already exists"));
    }

    [Test]
    public async Task CreateLocationAsync_CreatesDefaultBranding()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = CreateValidLocationRequest();

        // Act
        var result = await _locationService.CreateLocationAsync(club.Id, user.Id, request);

        // Assert
        var branding = await _context.LocationBrandings
            .FirstOrDefaultAsync(lb => lb.LocationId == result.Id);
        Assert.That(branding, Is.Not.Null);
    }

    #endregion

    #region UpdateLocationAsync Tests

    [Test]
    public async Task UpdateLocationAsync_ValidRequest_UpdatesLocation()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest();
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);

        var updateRequest = new UpdateLocationRequest
        {
            LocationName = "Updated Name",
            City = "Los Angeles"
        };

        // Act
        var result = await _locationService.UpdateLocationAsync(created.Id, user.Id, updateRequest);

        // Assert
        Assert.That(result.LocationName, Is.EqualTo("Updated Name"));
        Assert.That(result.City, Is.EqualTo("Los Angeles"));
        Assert.That(result.LocationCode, Is.EqualTo(createRequest.LocationCode)); // Unchanged
    }

    [Test]
    public async Task UpdateLocationAsync_LocationNotFound_ThrowsArgumentException()
    {
        // Arrange
        var (user, _) = await CreateTestUserAndClub();
        var updateRequest = new UpdateLocationRequest { LocationName = "New Name" };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _locationService.UpdateLocationAsync(99999, user.Id, updateRequest));
        Assert.That(ex!.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task UpdateLocationAsync_UserNotAdmin_ThrowsUnauthorizedException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest();
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);

        var nonAdminUser = new User
        {
            FullName = "Non Admin",
            Email = "nonadmin@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(nonAdminUser);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateLocationRequest { LocationName = "New Name" };

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _locationService.UpdateLocationAsync(created.Id, nonAdminUser.Id, updateRequest));
        Assert.That(ex!.Message, Does.Contain("permission"));
    }

    [Test]
    public async Task UpdateLocationAsync_PartialUpdate_OnlyUpdatesProvidedFields()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest();
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);

        var updateRequest = new UpdateLocationRequest
        {
            ContactEmail = "updated@example.com"
            // Only update email, leave other fields alone
        };

        // Act
        var result = await _locationService.UpdateLocationAsync(created.Id, user.Id, updateRequest);

        // Assert
        Assert.That(result.ContactEmail, Is.EqualTo("updated@example.com"));
        Assert.That(result.LocationName, Is.EqualTo(createRequest.LocationName)); // Unchanged
        Assert.That(result.City, Is.EqualTo(createRequest.City)); // Unchanged
    }

    [Test]
    public async Task UpdateLocationAsync_UpdateIsActive_ChangesActiveStatus()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest();
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);
        Assert.That(created.IsActive, Is.True);

        var updateRequest = new UpdateLocationRequest { IsActive = false };

        // Act
        var result = await _locationService.UpdateLocationAsync(created.Id, user.Id, updateRequest);

        // Assert
        Assert.That(result.IsActive, Is.False);
    }

    #endregion

    #region GetLocationAsync Tests

    [Test]
    public async Task GetLocationAsync_ValidLocation_ReturnsLocationResponse()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest();
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);

        // Act
        var result = await _locationService.GetLocationAsync(created.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(created.Id));
        Assert.That(result.LocationName, Is.EqualTo(createRequest.LocationName));
    }

    [Test]
    public async Task GetLocationAsync_LocationNotFound_ThrowsArgumentException()
    {
        // Arrange
        var (user, _) = await CreateTestUserAndClub();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _locationService.GetLocationAsync(99999, user.Id));
        Assert.That(ex!.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task GetLocationAsync_UserNoAccess_ThrowsUnauthorizedException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest();
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);

        var otherUser = new User
        {
            FullName = "Other User",
            Email = "other@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(otherUser);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _locationService.GetLocationAsync(created.Id, otherUser.Id));
        Assert.That(ex!.Message, Does.Contain("permission"));
    }

    [Test]
    public async Task GetLocationAsync_IncludesMemberAndEventCounts()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest();
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);

        // Add a member to this location
        var member = new Member
        {
            ClubId = club.Id,
            LocationId = created.Id,
            FirstName = "Test",
            LastName = "Member",
            Email = "member@example.com",
            Status = "Active"
        };
        _context.Members.Add(member);

        // Add an event at this location
        var evt = new Event
        {
            ClubId = club.Id,
            LocationId = created.Id,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7)
        };
        _context.Events.Add(evt);
        await _context.SaveChangesAsync();

        // Act
        var result = await _locationService.GetLocationAsync(created.Id, user.Id);

        // Assert
        Assert.That(result.MemberCount, Is.EqualTo(1));
        Assert.That(result.EventCount, Is.EqualTo(1));
    }

    #endregion

    #region GetClubLocationsAsync Tests

    [Test]
    public async Task GetClubLocationsAsync_MultipleLocations_ReturnsAll()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        await _locationService.CreateLocationAsync(club.Id, user.Id, CreateValidLocationRequest("LOC1"));
        await _locationService.CreateLocationAsync(club.Id, user.Id, CreateValidLocationRequest("LOC2"));
        await _locationService.CreateLocationAsync(club.Id, user.Id, CreateValidLocationRequest("LOC3"));

        // Act
        var result = await _locationService.GetClubLocationsAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(3));
    }

    [Test]
    public async Task GetClubLocationsAsync_NoLocations_ReturnsEmptyList()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        // Act
        var result = await _locationService.GetClubLocationsAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetClubLocationsAsync_UserNoAccess_ThrowsUnauthorizedException()
    {
        // Arrange
        var (_, club) = await CreateTestUserAndClub();
        var otherUser = new User
        {
            FullName = "Other User",
            Email = "other@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(otherUser);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _locationService.GetClubLocationsAsync(club.Id, otherUser.Id));
        Assert.That(ex!.Message, Does.Contain("permission"));
    }

    #endregion

    #region DeactivateLocationAsync Tests

    [Test]
    public async Task DeactivateLocationAsync_ValidRequest_DeactivatesLocation()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest("BRANCH");
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);
        Assert.That(created.IsActive, Is.True);

        // Act
        await _locationService.DeactivateLocationAsync(created.Id, user.Id);

        // Assert
        var location = await _context.ClubLocations.FindAsync(created.Id);
        Assert.That(location!.IsActive, Is.False);
    }

    [Test]
    public async Task DeactivateLocationAsync_LocationNotFound_ThrowsArgumentException()
    {
        // Arrange
        var (user, _) = await CreateTestUserAndClub();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _locationService.DeactivateLocationAsync(99999, user.Id));
        Assert.That(ex!.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task DeactivateLocationAsync_UserNotAdmin_ThrowsUnauthorizedException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest();
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);

        var otherUser = new User
        {
            FullName = "Other User",
            Email = "other@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(otherUser);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _locationService.DeactivateLocationAsync(created.Id, otherUser.Id));
        Assert.That(ex!.Message, Does.Contain("permission"));
    }

    [Test]
    public async Task DeactivateLocationAsync_MainLocation_ThrowsInvalidOperationException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var mainLocationRequest = CreateValidLocationRequest("MAIN");
        mainLocationRequest.LocationName = "Main Location";
        var mainLocation = await _locationService.CreateLocationAsync(club.Id, user.Id, mainLocationRequest);

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _locationService.DeactivateLocationAsync(mainLocation.Id, user.Id));
        Assert.That(ex!.Message, Does.Contain("Main Location"));
    }

    [Test]
    public async Task DeactivateLocationAsync_WithActiveMembers_ThrowsInvalidOperationException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest("BRANCH");
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);

        // Add active member
        var member = new Member
        {
            ClubId = club.Id,
            LocationId = created.Id,
            FirstName = "Active",
            LastName = "Member",
            Email = "active@example.com",
            Status = "Active"
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _locationService.DeactivateLocationAsync(created.Id, user.Id));
        Assert.That(ex!.Message, Does.Contain("active members"));
    }

    [Test]
    public async Task DeactivateLocationAsync_WithInactiveMembers_Succeeds()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest("BRANCH");
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);

        // Add inactive member
        var member = new Member
        {
            ClubId = club.Id,
            LocationId = created.Id,
            FirstName = "Inactive",
            LastName = "Member",
            Email = "inactive@example.com",
            Status = "Inactive"
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act - should succeed since member is not Active
        await _locationService.DeactivateLocationAsync(created.Id, user.Id);

        // Assert
        var location = await _context.ClubLocations.FindAsync(created.Id);
        Assert.That(location!.IsActive, Is.False);
    }

    #endregion

    #region GetLocationStatsAsync Tests

    [Test]
    public async Task GetLocationStatsAsync_CallsGetLocationAsync()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var createRequest = CreateValidLocationRequest();
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);

        // Act
        var result = await _locationService.GetLocationStatsAsync(created.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(created.Id));
    }

    #endregion

    #region Integration Tests

    [Test]
    public async Task FullLocationLifecycle_CreateUpdateDeactivate_Works()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        // Create
        var createRequest = CreateValidLocationRequest("LIFECYCLE");
        var created = await _locationService.CreateLocationAsync(club.Id, user.Id, createRequest);
        Assert.That(created.IsActive, Is.True);

        // Update
        var updateRequest = new UpdateLocationRequest { LocationName = "Updated Name" };
        var updated = await _locationService.UpdateLocationAsync(created.Id, user.Id, updateRequest);
        Assert.That(updated.LocationName, Is.EqualTo("Updated Name"));

        // Get
        var retrieved = await _locationService.GetLocationAsync(created.Id, user.Id);
        Assert.That(retrieved.LocationName, Is.EqualTo("Updated Name"));

        // Deactivate
        await _locationService.DeactivateLocationAsync(created.Id, user.Id);
        var deactivated = await _locationService.GetLocationAsync(created.Id, user.Id);
        Assert.That(deactivated.IsActive, Is.False);
    }

    [Test]
    public async Task MultipleClubs_LocationsAreIsolated()
    {
        // Arrange
        var user = new User
        {
            FullName = "Multi Admin",
            Email = "multi@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(user);

        var club1 = new Club { Name = "Club 1", Tier = "Unlimited" };
        var club2 = new Club { Name = "Club 2", Tier = "Unlimited" };
        _context.Clubs.AddRange(club1, club2);
        await _context.SaveChangesAsync();

        _context.ClubAdmins.Add(new ClubAdmin { UserId = user.Id, ClubId = club1.Id });
        _context.ClubAdmins.Add(new ClubAdmin { UserId = user.Id, ClubId = club2.Id });
        await _context.SaveChangesAsync();

        // Create locations
        await _locationService.CreateLocationAsync(club1.Id, user.Id, CreateValidLocationRequest("C1L1"));
        await _locationService.CreateLocationAsync(club1.Id, user.Id, CreateValidLocationRequest("C1L2"));
        await _locationService.CreateLocationAsync(club2.Id, user.Id, CreateValidLocationRequest("C2L1"));

        // Act
        var club1Locations = await _locationService.GetClubLocationsAsync(club1.Id, user.Id);
        var club2Locations = await _locationService.GetClubLocationsAsync(club2.Id, user.Id);

        // Assert
        Assert.That(club1Locations, Has.Count.EqualTo(2));
        Assert.That(club2Locations, Has.Count.EqualTo(1));
    }

    #endregion
}
