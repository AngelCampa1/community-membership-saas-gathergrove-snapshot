using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class PushNotificationServiceTests
{
    private Mock<ILogger<PushNotificationService>> _mockLogger = null!;
    private GatherGroveDbContext _context = null!;
    private PushNotificationService _pushNotificationService = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<PushNotificationService>>();

        _pushNotificationService = new PushNotificationService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<User> CreateTestUser(string email = "test@example.com", string fullName = "Test User")
    {
        var user = new User
        {
            FullName = fullName,
            Email = email,
            PasswordHash = "hash",
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
    }

    private async Task<UserDeviceToken> CreateTestDeviceToken(int userId, string deviceToken = "test_token", string deviceType = "android")
    {
        var token = new UserDeviceToken
        {
            UserId = userId,
            DeviceToken = deviceToken,
            DeviceType = deviceType,
            LastLogin = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.UserDeviceTokens.Add(token);
        await _context.SaveChangesAsync();

        return token;
    }

    [Test]
    public async Task RegisterDeviceTokenAsync_WithNewToken_ReturnsSuccessResponse()
    {
        // Arrange
        var user = await CreateTestUser();
        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "new_test_token",
            DeviceType = "ios"
        };

        // Act
        var result = await _pushNotificationService.RegisterDeviceTokenAsync(user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Device token registered successfully"));
        Assert.That(result.DeviceToken, Is.EqualTo(request.DeviceToken));
        Assert.That(result.DeviceType, Is.EqualTo(request.DeviceType));
        Assert.That(result.RegisteredAt, Is.Not.EqualTo(DateTime.MinValue));

        // Verify token was saved to database
        var savedToken = await _context.UserDeviceTokens
            .FirstOrDefaultAsync(t => t.UserId == user.Id && t.DeviceToken == request.DeviceToken);

        Assert.That(savedToken, Is.Not.Null);
        Assert.That(savedToken.DeviceType, Is.EqualTo(request.DeviceType));
    }

    [Test]
    public async Task RegisterDeviceTokenAsync_WithExistingToken_UpdatesAndReturnsSuccessResponse()
    {
        // Arrange
        var user = await CreateTestUser();
        var existingToken = await CreateTestDeviceToken(user.Id, "existing_token", "android");

        // Add a small delay to ensure different timestamp
        await Task.Delay(10);

        var request = new RegisterDeviceTokenRequest
        {
            DeviceToken = "existing_token",
            DeviceType = "ios" // Different device type
        };

        // Act
        var result = await _pushNotificationService.RegisterDeviceTokenAsync(user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Device token updated successfully"));
        Assert.That(result.DeviceToken, Is.EqualTo(request.DeviceToken));
        Assert.That(result.DeviceType, Is.EqualTo(request.DeviceType));

        // Verify token was updated in database
        var updatedToken = await _context.UserDeviceTokens
            .FirstOrDefaultAsync(t => t.UserId == user.Id && t.DeviceToken == request.DeviceToken);

        Assert.That(updatedToken, Is.Not.Null);
        Assert.That(updatedToken.DeviceType, Is.EqualTo("ios"));
        Assert.That(updatedToken.UpdatedAt, Is.GreaterThanOrEqualTo(existingToken.UpdatedAt));
    }

    [Test]
    public async Task RegisterDeviceTokenAsync_WithNullRequest_ThrowsArgumentNullException()
    {
        // Arrange
        var user = await CreateTestUser();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentNullException>(
            () => _pushNotificationService.RegisterDeviceTokenAsync(user.Id, null!));

        Assert.That(ex.ParamName, Is.EqualTo("request"));
    }

    [Test]
    public async Task SendNotificationToDeviceAsync_WithValidParameters_ReturnsTrue()
    {
        // Act
        var result = await _pushNotificationService.SendNotificationToDeviceAsync(
            "test_token", "android", "Test Title", "Test Body");

        // Assert
        Assert.That(result, Is.True);

        // Verify logging occurred
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Would send push notification")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendNotificationToUserAsync_WithValidUser_ReturnsCorrectSuccessCount()
    {
        // Arrange
        var user = await CreateTestUser();
        await CreateTestDeviceToken(user.Id, "token1", "android");
        await CreateTestDeviceToken(user.Id, "token2", "ios");

        // Act
        var result = await _pushNotificationService.SendNotificationToUserAsync(
            user.Id, "Test Title", "Test Body");

        // Assert
        Assert.That(result, Is.EqualTo(2));

        // Verify logging occurred
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Sent push notification to 2/2 devices")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendNotificationToUserAsync_WithNoDeviceTokens_ReturnsZero()
    {
        // Arrange
        var user = await CreateTestUser();

        // Act
        var result = await _pushNotificationService.SendNotificationToUserAsync(
            user.Id, "Test Title", "Test Body");

        // Assert
        Assert.That(result, Is.EqualTo(0));

        // Verify warning logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No device tokens found")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task SendNotificationToUsersAsync_WithMultipleUsers_ReturnsCorrectTotalCount()
    {
        // Arrange
        var user1 = await CreateTestUser("user1@example.com", "User 1");
        var user2 = await CreateTestUser("user2@example.com", "User 2");

        await CreateTestDeviceToken(user1.Id, "token1", "android");
        await CreateTestDeviceToken(user2.Id, "token2", "ios");
        await CreateTestDeviceToken(user2.Id, "token3", "android");

        var userIds = new[] { user1.Id, user2.Id };

        // Act
        var result = await _pushNotificationService.SendNotificationToUsersAsync(
            userIds, "Test Title", "Test Body");

        // Assert
        Assert.That(result, Is.EqualTo(3)); // 1 from user1 + 2 from user2
    }

    [Test]
    public async Task RemoveDeviceTokenAsync_WithExistingToken_ReturnsTrue()
    {
        // Arrange
        var user = await CreateTestUser();
        var deviceToken = await CreateTestDeviceToken(user.Id, "token_to_remove", "android");

        // Act
        var result = await _pushNotificationService.RemoveDeviceTokenAsync(user.Id, "token_to_remove");

        // Assert
        Assert.That(result, Is.True);

        // Verify token was removed from database
        var removedToken = await _context.UserDeviceTokens
            .FirstOrDefaultAsync(t => t.UserId == user.Id && t.DeviceToken == "token_to_remove");

        Assert.That(removedToken, Is.Null);
    }

    [Test]
    public async Task RemoveDeviceTokenAsync_WithNonExistentToken_ReturnsFalse()
    {
        // Arrange
        var user = await CreateTestUser();

        // Act
        var result = await _pushNotificationService.RemoveDeviceTokenAsync(user.Id, "non_existent_token");

        // Assert
        Assert.That(result, Is.False);

        // Verify warning logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Device token not found")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task GetUserDeviceTokensAsync_WithExistingTokens_ReturnsAllTokens()
    {
        // Arrange
        var user = await CreateTestUser();
        await CreateTestDeviceToken(user.Id, "token1", "android");
        await CreateTestDeviceToken(user.Id, "token2", "ios");
        await CreateTestDeviceToken(user.Id, "token3", "android");

        // Act
        var result = await _pushNotificationService.GetUserDeviceTokensAsync(user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count(), Is.EqualTo(3));
        Assert.That(result, Contains.Item("token1"));
        Assert.That(result, Contains.Item("token2"));
        Assert.That(result, Contains.Item("token3"));
    }

    [Test]
    public async Task GetUserDeviceTokensAsync_WithNoTokens_ReturnsEmptyCollection()
    {
        // Arrange
        var user = await CreateTestUser();

        // Act
        var result = await _pushNotificationService.GetUserDeviceTokensAsync(user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task GetUserDeviceTokensAsync_WithNonExistentUser_ReturnsEmptyCollection()
    {
        // Act
        var result = await _pushNotificationService.GetUserDeviceTokensAsync(9999);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task SendNotificationToDeviceAsync_WithDataPayload_LogsCorrectly()
    {
        // Arrange
        var data = new Dictionary<string, string>
        {
            { "eventId", "123" },
            { "type", "reminder" }
        };

        // Act
        var result = await _pushNotificationService.SendNotificationToDeviceAsync(
            "test_token", "android", "Test Title", "Test Body", data);

        // Assert
        Assert.That(result, Is.True);

        // Verify logging occurred with title and body
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Test Title") && v.ToString()!.Contains("Test Body")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task RegisterDeviceTokenAsync_MultipleDevicesForSameUser_AllowsUniqueTokens()
    {
        // Arrange
        var user = await CreateTestUser();

        var request1 = new RegisterDeviceTokenRequest
        {
            DeviceToken = "device1_token",
            DeviceType = "android"
        };

        var request2 = new RegisterDeviceTokenRequest
        {
            DeviceToken = "device2_token",
            DeviceType = "ios"
        };

        // Act
        var result1 = await _pushNotificationService.RegisterDeviceTokenAsync(user.Id, request1);
        var result2 = await _pushNotificationService.RegisterDeviceTokenAsync(user.Id, request2);

        // Assert
        Assert.That(result1.Success, Is.True);
        Assert.That(result2.Success, Is.True);

        // Verify both tokens exist in database
        var tokens = await _context.UserDeviceTokens
            .Where(t => t.UserId == user.Id)
            .ToListAsync();

        Assert.That(tokens.Count, Is.EqualTo(2));
        Assert.That(tokens.Any(t => t.DeviceToken == "device1_token"), Is.True);
        Assert.That(tokens.Any(t => t.DeviceToken == "device2_token"), Is.True);
    }
}