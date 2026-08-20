using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for LocationBrandingService.
/// This service manages location-specific branding for multi-location clubs.
///
/// Key features tested:
/// - Permission validation (user must be club admin)
/// - Tier validation (only Unlimited tier can use location branding)
/// - Create and update branding operations
/// - Public access to branding information
///
/// Uses in-memory EF Core database for real database behavior testing.
/// </summary>
[TestFixture]
public class LocationBrandingServiceTests
{
    private GatherGroveDbContext _context = null!;
    private LocationBrandingService _service = null!;
    private ILogger<LocationBrandingService> _logger = null!;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new GatherGroveDbContext(options);
        _logger = NullLogger<LocationBrandingService>.Instance;
        _service = new LocationBrandingService(_context, _logger);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region Test Data Helpers

    private async Task<Club> CreateTestClub(string tier = "Unlimited")
    {
        var club = new Club
        {
            Name = "Test Club",
            Tier = tier
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();
        return club;
    }

    private async Task<ClubLocation> CreateTestLocation(int parentClubId)
    {
        var location = new ClubLocation
        {
            ParentClubId = parentClubId,
            LocationName = "Main Office",
            LocationCode = "MAIN",
            Address = "123 Test St",
            City = "Test City"
        };
        _context.ClubLocations.Add(location);
        await _context.SaveChangesAsync();
        return location;
    }

    private async Task<User> CreateTestUser()
    {
        var user = new User
        {
            Email = "admin@test.com",
            FullName = "Test Admin",
            PasswordHash = "hashedpassword",
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    private async Task AddClubAdmin(int clubId, int userId)
    {
        var admin = new ClubAdmin
        {
            ClubId = clubId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubAdmins.Add(admin);
        await _context.SaveChangesAsync();
    }

    private async Task<LocationBranding> CreateTestBranding(int locationId)
    {
        var branding = new LocationBranding
        {
            LocationId = locationId,
            CustomLogoUrl = "https://example.com/logo.png",
            ColorScheme = "{\"primary\": \"#FF0000\"}",
            CustomNameOverride = "Custom Name",
            SettingsJson = "{\"key\": \"value\"}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.LocationBrandings.Add(branding);
        await _context.SaveChangesAsync();
        return branding;
    }

    #endregion

    #region UpdateLocationBrandingAsync Tests

    [Test]
    public async Task UpdateLocationBrandingAsync_LocationNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        // Act
        Func<Task> act = async () => await _service.UpdateLocationBrandingAsync(999, 1, request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Location 999 not found*");
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_UserNotAdmin_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        // Note: Not adding user as admin

        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        // Act
        Func<Task> act = async () => await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*do not have permission*");
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_NonUnlimitedTier_ThrowsInvalidOperationException()
    {
        // Arrange
        var club = await CreateTestClub(tier: "Basic");
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);

        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        // Act
        Func<Task> act = async () => await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*only available for Expand tier*");
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_ProfessionalTier_ThrowsInvalidOperationException()
    {
        // Arrange
        var club = await CreateTestClub(tier: "Professional");
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);

        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        // Act
        Func<Task> act = async () => await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*only available for Expand tier*");
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_NoExistingBranding_CreatesNewBranding()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);

        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/new-logo.png",
            ColorScheme = "{\"primary\": \"#00FF00\"}",
            CustomNameOverride = "New Custom Name",
            SettingsJson = "{\"setting1\": true}"
        };

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        result.Should().NotBeNull();
        result.LocationId.Should().Be(location.Id);
        result.CustomLogoUrl.Should().Be("https://example.com/new-logo.png");
        result.ColorScheme.Should().Be("{\"primary\": \"#00FF00\"}");
        result.CustomNameOverride.Should().Be("New Custom Name");
        result.SettingsJson.Should().Be("{\"setting1\": true}");

        // Verify persisted to database
        var savedBranding = await _context.LocationBrandings.FirstOrDefaultAsync(b => b.LocationId == location.Id);
        savedBranding.Should().NotBeNull();
        savedBranding!.CustomLogoUrl.Should().Be("https://example.com/new-logo.png");
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_ExistingBranding_UpdatesFields()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);
        var existingBranding = await CreateTestBranding(location.Id);
        var originalUpdatedAt = existingBranding.UpdatedAt;

        // Wait a bit to ensure UpdatedAt changes
        await Task.Delay(10);

        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/updated-logo.png",
            ColorScheme = "{\"primary\": \"#0000FF\"}"
        };

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        result.CustomLogoUrl.Should().Be("https://example.com/updated-logo.png");
        result.ColorScheme.Should().Be("{\"primary\": \"#0000FF\"}");
        // CustomNameOverride should remain unchanged since it wasn't in the request
        result.CustomNameOverride.Should().Be("Custom Name");
        result.UpdatedAt.Should().BeAfter(originalUpdatedAt);
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_OnlyLogoUrl_UpdatesOnlyLogoUrl()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);
        await CreateTestBranding(location.Id);

        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/only-logo.png"
            // Other fields are null
        };

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        result.CustomLogoUrl.Should().Be("https://example.com/only-logo.png");
        // Other fields should remain unchanged
        result.ColorScheme.Should().Be("{\"primary\": \"#FF0000\"}");
        result.CustomNameOverride.Should().Be("Custom Name");
        result.SettingsJson.Should().Be("{\"key\": \"value\"}");
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_OnlyColorScheme_UpdatesOnlyColorScheme()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);
        await CreateTestBranding(location.Id);

        var request = new UpdateLocationBrandingRequest
        {
            ColorScheme = "{\"primary\": \"#AABBCC\"}"
        };

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        result.ColorScheme.Should().Be("{\"primary\": \"#AABBCC\"}");
        result.CustomLogoUrl.Should().Be("https://example.com/logo.png");
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_OnlyNameOverride_UpdatesOnlyNameOverride()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);
        await CreateTestBranding(location.Id);

        var request = new UpdateLocationBrandingRequest
        {
            CustomNameOverride = "New Override Name"
        };

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        result.CustomNameOverride.Should().Be("New Override Name");
        result.CustomLogoUrl.Should().Be("https://example.com/logo.png");
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_OnlySettingsJson_UpdatesOnlySettingsJson()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);
        await CreateTestBranding(location.Id);

        var request = new UpdateLocationBrandingRequest
        {
            SettingsJson = "{\"newKey\": \"newValue\"}"
        };

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        result.SettingsJson.Should().Be("{\"newKey\": \"newValue\"}");
        result.CustomLogoUrl.Should().Be("https://example.com/logo.png");
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_EmptyRequest_OnlyUpdatesTimestamp()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);
        var existingBranding = await CreateTestBranding(location.Id);
        var originalValues = new
        {
            existingBranding.CustomLogoUrl,
            existingBranding.ColorScheme,
            existingBranding.CustomNameOverride,
            existingBranding.SettingsJson
        };

        await Task.Delay(10);

        var request = new UpdateLocationBrandingRequest();

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert - All values should remain the same
        result.CustomLogoUrl.Should().Be(originalValues.CustomLogoUrl);
        result.ColorScheme.Should().Be(originalValues.ColorScheme);
        result.CustomNameOverride.Should().Be(originalValues.CustomNameOverride);
        result.SettingsJson.Should().Be(originalValues.SettingsJson);
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_ReturnsCorrectLocationName()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);

        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        result.LocationName.Should().Be("Main Office");
    }

    #endregion

    #region GetLocationBrandingAsync Tests

    [Test]
    public async Task GetLocationBrandingAsync_BrandingNotFound_ThrowsArgumentException()
    {
        // Arrange - no branding exists for location 999

        // Act
        Func<Task> act = async () => await _service.GetLocationBrandingAsync(999);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Branding not found for location 999*");
    }

    [Test]
    public async Task GetLocationBrandingAsync_BrandingExists_ReturnsCorrectResponse()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var branding = await CreateTestBranding(location.Id);

        // Act
        var result = await _service.GetLocationBrandingAsync(location.Id);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(branding.Id);
        result.LocationId.Should().Be(location.Id);
        result.LocationName.Should().Be("Main Office");
        result.CustomLogoUrl.Should().Be("https://example.com/logo.png");
        result.ColorScheme.Should().Be("{\"primary\": \"#FF0000\"}");
        result.CustomNameOverride.Should().Be("Custom Name");
        result.SettingsJson.Should().Be("{\"key\": \"value\"}");
    }

    [Test]
    public async Task GetLocationBrandingAsync_MapsAllProperties()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var branding = await CreateTestBranding(location.Id);

        // Act
        var result = await _service.GetLocationBrandingAsync(location.Id);

        // Assert - All properties should be mapped correctly
        result.Id.Should().BeGreaterThan(0);
        result.LocationId.Should().Be(branding.LocationId);
        result.LocationName.Should().NotBeNullOrEmpty();
        result.CustomLogoUrl.Should().Be(branding.CustomLogoUrl);
        result.ColorScheme.Should().Be(branding.ColorScheme);
        result.CustomNameOverride.Should().Be(branding.CustomNameOverride);
        result.SettingsJson.Should().Be(branding.SettingsJson);
        result.CreatedAt.Should().BeCloseTo(branding.CreatedAt, TimeSpan.FromSeconds(1));
        result.UpdatedAt.Should().BeCloseTo(branding.UpdatedAt, TimeSpan.FromSeconds(1));
    }

    [Test]
    public async Task GetLocationBrandingAsync_WithNullOptionalFields_ReturnsNulls()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);

        // Create branding with minimal data
        var branding = new LocationBranding
        {
            LocationId = location.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.LocationBrandings.Add(branding);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetLocationBrandingAsync(location.Id);

        // Assert
        result.CustomLogoUrl.Should().BeNull();
        result.ColorScheme.Should().BeNull();
        result.CustomNameOverride.Should().BeNull();
        result.SettingsJson.Should().BeNull();
    }

    [Test]
    public async Task GetLocationBrandingAsync_IsReadOnlyOperation()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var branding = await CreateTestBranding(location.Id);
        var originalLogo = branding.CustomLogoUrl;

        // Act - Get branding multiple times
        var result1 = await _service.GetLocationBrandingAsync(location.Id);
        var result2 = await _service.GetLocationBrandingAsync(location.Id);

        // Assert - Database should not be modified
        var dbBranding = await _context.LocationBrandings.FindAsync(branding.Id);
        dbBranding!.CustomLogoUrl.Should().Be(originalLogo);
        result1.CustomLogoUrl.Should().Be(result2.CustomLogoUrl);
    }

    #endregion

    #region Edge Cases

    [Test]
    public async Task UpdateLocationBrandingAsync_MultipleLocations_UpdatesCorrectOne()
    {
        // Arrange
        var club = await CreateTestClub();
        var location1 = await CreateTestLocation(club.Id);
        var location2 = new ClubLocation
        {
            ParentClubId = club.Id,
            LocationName = "Second Office",
            LocationCode = "SEC",
            Address = "456 Other St",
            City = "Other City"
        };
        _context.ClubLocations.Add(location2);
        await _context.SaveChangesAsync();

        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);

        await CreateTestBranding(location1.Id);
        var branding2 = new LocationBranding
        {
            LocationId = location2.Id,
            CustomLogoUrl = "https://example.com/logo2.png",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.LocationBrandings.Add(branding2);
        await _context.SaveChangesAsync();

        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/updated-logo1.png"
        };

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location1.Id, user.Id, request);

        // Assert - Only location1's branding should be updated
        result.CustomLogoUrl.Should().Be("https://example.com/updated-logo1.png");

        var location2Branding = await _context.LocationBrandings
            .FirstOrDefaultAsync(b => b.LocationId == location2.Id);
        location2Branding!.CustomLogoUrl.Should().Be("https://example.com/logo2.png");
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_LongUrlValues_HandledCorrectly()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);

        var longUrl = "https://example.com/" + new string('a', 450);
        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = longUrl
        };

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        result.CustomLogoUrl.Should().Be(longUrl);
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_SpecialCharactersInJson_HandledCorrectly()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);

        var complexJson = @"{""primary"": ""#FF0000"", ""secondary"": ""rgb(255, 128, 0)"", ""font"": ""Arial, 'Helvetica Neue', sans-serif""}";
        var request = new UpdateLocationBrandingRequest
        {
            ColorScheme = complexJson
        };

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        result.ColorScheme.Should().Be(complexJson);
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_UnicodeInNameOverride_HandledCorrectly()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);

        var unicodeName = "Caf\u00e9 du Nord \u2764\ufe0f";
        var request = new UpdateLocationBrandingRequest
        {
            CustomNameOverride = unicodeName
        };

        // Act
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        result.CustomNameOverride.Should().Be(unicodeName);
    }

    [Test]
    public async Task UpdateLocationBrandingAsync_AdminForDifferentClub_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var club1 = await CreateTestClub();
        var club2 = await CreateTestClub();
        var location = await CreateTestLocation(club1.Id);
        var user = await CreateTestUser();
        // User is admin for club2, not club1
        await AddClubAdmin(club2.Id, user.Id);

        var request = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo.png"
        };

        // Act
        Func<Task> act = async () => await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    #endregion

    #region Concurrent Access Tests

    [Test]
    public async Task UpdateLocationBrandingAsync_ConcurrentUpdates_LastWriteWins()
    {
        // Arrange
        var club = await CreateTestClub();
        var location = await CreateTestLocation(club.Id);
        var user = await CreateTestUser();
        await AddClubAdmin(club.Id, user.Id);

        var request1 = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo1.png"
        };
        var request2 = new UpdateLocationBrandingRequest
        {
            CustomLogoUrl = "https://example.com/logo2.png"
        };

        // Act - Execute updates sequentially (in-memory doesn't support real concurrency)
        await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request1);
        var result = await _service.UpdateLocationBrandingAsync(location.Id, user.Id, request2);

        // Assert - Last update wins
        result.CustomLogoUrl.Should().Be("https://example.com/logo2.png");
    }

    #endregion
}
