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
public class ChatSettingsServiceTests
{
    private ChatSettingsService _chatSettingsService;
    private GatherGroveDbContext _context;
    private Mock<ILogger<ChatSettingsService>> _mockLogger;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<ChatSettingsService>>();
        _chatSettingsService = new ChatSettingsService(_context, _mockLogger.Object);
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
    public async Task GetChatSettingsAsync_WithValidAdmin_ReturnsSettings()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        club.IsChatEnabled = true;
        await _context.SaveChangesAsync();

        // Act
        var result = await _chatSettingsService.GetChatSettingsAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsChatEnabled, Is.True);
    }

    [Test]
    public async Task GetChatSettingsAsync_WithDefaultSettings_ReturnsDefaults()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        // Act
        var result = await _chatSettingsService.GetChatSettingsAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsChatEnabled, Is.False);
    }

    [Test]
    public async Task GetChatSettingsAsync_WithNonAdminUser_ThrowsUnauthorized()
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
            () => _chatSettingsService.GetChatSettingsAsync(club.Id, nonAdminUser.Id));

        Assert.That(exception.Message, Does.Contain("not authorized"));
    }

    [Test]
    public async Task GetChatSettingsAsync_WithNonExistentClub_ThrowsUnauthorized()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var nonExistentClubId = 999;

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _chatSettingsService.GetChatSettingsAsync(nonExistentClubId, user.Id));

        Assert.That(exception.Message, Does.Contain("not authorized"));
    }

    [Test]
    public async Task UpdateChatSettingsAsync_EnableChat_UpdatesSettings()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var request = new UpdateChatSettingsRequest
        {
            IsChatEnabled = true
        };

        // Act
        var result = await _chatSettingsService.UpdateChatSettingsAsync(club.Id, user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsChatEnabled, Is.True);

        // Verify database was updated
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub.IsChatEnabled, Is.True);
    }

    [Test]
    public async Task UpdateChatSettingsAsync_DisableChat_UpdatesSettings()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        club.IsChatEnabled = true; // Start with chat enabled
        await _context.SaveChangesAsync();

        var request = new UpdateChatSettingsRequest
        {
            IsChatEnabled = false
        };

        // Act
        var result = await _chatSettingsService.UpdateChatSettingsAsync(club.Id, user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsChatEnabled, Is.False);

        // Verify database was updated
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub.IsChatEnabled, Is.False);
    }

    [Test]
    public async Task UpdateChatSettingsAsync_WithNonAdminUser_ThrowsUnauthorized()
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

        var request = new UpdateChatSettingsRequest
        {
            IsChatEnabled = true
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _chatSettingsService.UpdateChatSettingsAsync(club.Id, nonAdminUser.Id, request));

        Assert.That(exception.Message, Does.Contain("not authorized"));
    }

    [Test]
    public async Task UpdateChatSettingsAsync_WithNonExistentClub_ThrowsUnauthorized()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var nonExistentClubId = 999;
        var request = new UpdateChatSettingsRequest
        {
            IsChatEnabled = true
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _chatSettingsService.UpdateChatSettingsAsync(nonExistentClubId, user.Id, request));

        Assert.That(exception.Message, Does.Contain("not authorized"));
    }

    [Test]
    public async Task UpdateChatSettingsAsync_UpdatesTimestamp()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();
        var originalTimestamp = club.UpdatedAt;

        // Wait a small amount to ensure timestamp difference
        await Task.Delay(10);

        var request = new UpdateChatSettingsRequest
        {
            IsChatEnabled = true
        };

        // Act
        await _chatSettingsService.UpdateChatSettingsAsync(club.Id, user.Id, request);

        // Assert
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub.UpdatedAt, Is.GreaterThan(originalTimestamp));
    }
}