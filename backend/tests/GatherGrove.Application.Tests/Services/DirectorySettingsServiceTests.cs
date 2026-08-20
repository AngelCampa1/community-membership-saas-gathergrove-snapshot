using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class DirectorySettingsServiceTests
{
    private DirectorySettingsService _directorySettingsService;
    private GatherGroveDbContext _context;
    private Mock<ILogger<DirectorySettingsService>> _mockLogger;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<DirectorySettingsService>>();
        _directorySettingsService = new DirectorySettingsService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(User user, Club club)> CreateTestUserAndClub()
    {
        var user = new User
        {
            FullName = "Test Admin",
            Email = "admin@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Sprout"
        };

        var clubAdmin = new ClubAdmin
        {
            User = user,
            Club = club
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        return (user, club);
    }

    [Test]
    public async Task GetDirectorySettingsAsync_WithValidAdmin_ReturnsSettings()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        club.IsDirectoryEnabled = true;
        club.DirectoryAllowedSharableFields = "email,phoneNumber";
        await _context.SaveChangesAsync();

        // Act
        var result = await _directorySettingsService.GetDirectorySettingsAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsEnabled, Is.True);
        Assert.That(result.AllowedSharableFields, Has.Length.EqualTo(2));
        Assert.That(result.AllowedSharableFields, Does.Contain("email"));
        Assert.That(result.AllowedSharableFields, Does.Contain("phoneNumber"));
    }

    [Test]
    public async Task GetDirectorySettingsAsync_WithDefaultSettings_ReturnsDefaults()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        // Act
        var result = await _directorySettingsService.GetDirectorySettingsAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsEnabled, Is.False);
        Assert.That(result.AllowedSharableFields, Is.Empty);
    }

    [Test]
    public async Task GetDirectorySettingsAsync_WithEmptyFields_ReturnsEmptyArray()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        club.IsDirectoryEnabled = true;
        club.DirectoryAllowedSharableFields = "";
        await _context.SaveChangesAsync();

        // Act
        var result = await _directorySettingsService.GetDirectorySettingsAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsEnabled, Is.True);
        Assert.That(result.AllowedSharableFields, Is.Empty);
    }

    [Test]
    public async Task GetDirectorySettingsAsync_WithNonAdminUser_ThrowsUnauthorized()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var nonAdminUser = new User
        {
            FullName = "Non Admin",
            Email = "nonadmin@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(nonAdminUser);
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _directorySettingsService.GetDirectorySettingsAsync(club.Id, nonAdminUser.Id));

        Assert.That(exception.Message, Does.Contain("not authorized"));
    }

    [Test]
    public async Task GetDirectorySettingsAsync_WithNonExistentClub_ThrowsUnauthorized()
    {
        // Arrange
        var nonExistentClubId = 999;
        var (user, club) = await CreateTestUserAndClub();

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _directorySettingsService.GetDirectorySettingsAsync(nonExistentClubId, user.Id));

        Assert.That(exception.Message, Does.Contain("not authorized"));
    }

    [Test]
    public async Task UpdateDirectorySettingsAsync_WithValidRequest_UpdatesSettings()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email", "phoneNumber" }
        };

        // Act
        var result = await _directorySettingsService.UpdateDirectorySettingsAsync(club.Id, user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsEnabled, Is.True);
        Assert.That(result.AllowedSharableFields, Has.Length.EqualTo(2));
        Assert.That(result.AllowedSharableFields, Does.Contain("email"));
        Assert.That(result.AllowedSharableFields, Does.Contain("phoneNumber"));

        // Verify database was updated
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub.IsDirectoryEnabled, Is.True);
        Assert.That(updatedClub.DirectoryAllowedSharableFields, Is.EqualTo("email,phoneNumber"));
    }

    [Test]
    public async Task UpdateDirectorySettingsAsync_DisablingDirectory_ClearsFields()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = false,
            AllowedSharableFields = Array.Empty<string>()
        };

        // Act
        var result = await _directorySettingsService.UpdateDirectorySettingsAsync(club.Id, user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsEnabled, Is.False);
        Assert.That(result.AllowedSharableFields, Is.Empty);

        // Verify database was updated
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub.IsDirectoryEnabled, Is.False);
        Assert.That(updatedClub.DirectoryAllowedSharableFields, Is.Null);
    }

    [Test]
    public async Task UpdateDirectorySettingsAsync_WithInvalidField_ThrowsArgumentException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email", "invalidField" }
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _directorySettingsService.UpdateDirectorySettingsAsync(club.Id, user.Id, request));

        Assert.That(exception.Message, Does.Contain("Invalid fields specified"));
        Assert.That(exception.Message, Does.Contain("invalidField"));
    }

    [Test]
    public async Task UpdateDirectorySettingsAsync_WithNonAdminUser_ThrowsUnauthorized()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var nonAdminUser = new User
        {
            FullName = "Non Admin",
            Email = "nonadmin@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(nonAdminUser);
        await _context.SaveChangesAsync();

        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email" }
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _directorySettingsService.UpdateDirectorySettingsAsync(club.Id, nonAdminUser.Id, request));

        Assert.That(exception.Message, Does.Contain("not authorized"));
    }

    [Test]
    public async Task UpdateDirectorySettingsAsync_WithNonExistentClub_ThrowsUnauthorized()
    {
        // Arrange
        var nonExistentClubId = 999;
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email" }
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _directorySettingsService.UpdateDirectorySettingsAsync(nonExistentClubId, user.Id, request));

        Assert.That(exception.Message, Does.Contain("not authorized"));
    }

    [Test]
    public async Task UpdateDirectorySettingsAsync_UpdatesTimestamp()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var originalUpdatedAt = club.UpdatedAt;

        // Wait a small amount to ensure timestamp difference
        await Task.Delay(10);

        var request = new UpdateDirectorySettingsRequest
        {
            IsEnabled = true,
            AllowedSharableFields = new[] { "email" }
        };

        // Act
        await _directorySettingsService.UpdateDirectorySettingsAsync(club.Id, user.Id, request);

        // Assert
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub.UpdatedAt, Is.GreaterThan(originalUpdatedAt));
    }
}