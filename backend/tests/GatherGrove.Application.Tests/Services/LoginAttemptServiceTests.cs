using GatherGrove.Application.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class LoginAttemptServiceTests
{
    private ILogger<LoginAttemptService> _logger = null!;
    private LoginAttemptService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _logger = NullLogger<LoginAttemptService>.Instance;
        _service = new LoginAttemptService(_logger);
    }

    #region IsAccountLockedAsync Tests

    [Test]
    public async Task IsAccountLockedAsync_NoAttempts_ReturnsFalse()
    {
        // Act
        var result = await _service.IsAccountLockedAsync("test@example.com");

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task IsAccountLockedAsync_LessThanMaxAttempts_ReturnsFalse()
    {
        // Arrange
        var email = "test@example.com";
        for (int i = 0; i < 4; i++) // Less than 5
        {
            await _service.RecordFailedAttemptAsync(email);
        }

        // Act
        var result = await _service.IsAccountLockedAsync(email);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task IsAccountLockedAsync_ExactlyMaxAttempts_ReturnsTrue()
    {
        // Arrange
        var email = "test@example.com";
        for (int i = 0; i < 5; i++) // Exactly 5
        {
            await _service.RecordFailedAttemptAsync(email);
        }

        // Act
        var result = await _service.IsAccountLockedAsync(email);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task IsAccountLockedAsync_MoreThanMaxAttempts_ReturnsTrue()
    {
        // Arrange
        var email = "test@example.com";
        for (int i = 0; i < 7; i++) // More than 5
        {
            await _service.RecordFailedAttemptAsync(email);
        }

        // Act
        var result = await _service.IsAccountLockedAsync(email);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task IsAccountLockedAsync_EmailCaseInsensitive()
    {
        // Arrange
        await _service.RecordFailedAttemptAsync("TEST@example.com");
        await _service.RecordFailedAttemptAsync("test@EXAMPLE.com");
        await _service.RecordFailedAttemptAsync("Test@Example.Com");
        await _service.RecordFailedAttemptAsync("test@example.com");
        await _service.RecordFailedAttemptAsync("TEST@EXAMPLE.COM");

        // Act
        var result = await _service.IsAccountLockedAsync("TeSt@ExAmPlE.cOm");

        // Assert
        Assert.That(result, Is.True);
    }

    #endregion

    #region RecordFailedAttemptAsync Tests

    [Test]
    public async Task RecordFailedAttemptAsync_FirstAttempt_CountsAsOne()
    {
        // Arrange
        var email = "test@example.com";

        // Act
        await _service.RecordFailedAttemptAsync(email);

        // Assert
        var attempts = await _service.GetFailedAttemptsAsync(email);
        Assert.That(attempts, Is.EqualTo(1));
    }

    [Test]
    public async Task RecordFailedAttemptAsync_MultipleAttempts_Increments()
    {
        // Arrange
        var email = "test@example.com";

        // Act
        await _service.RecordFailedAttemptAsync(email);
        await _service.RecordFailedAttemptAsync(email);
        await _service.RecordFailedAttemptAsync(email);

        // Assert
        var attempts = await _service.GetFailedAttemptsAsync(email);
        Assert.That(attempts, Is.EqualTo(3));
    }

    [Test]
    public async Task RecordFailedAttemptAsync_DifferentEmails_TrackedSeparately()
    {
        // Arrange & Act
        await _service.RecordFailedAttemptAsync("user1@example.com");
        await _service.RecordFailedAttemptAsync("user1@example.com");
        await _service.RecordFailedAttemptAsync("user2@example.com");

        // Assert
        var attemptsUser1 = await _service.GetFailedAttemptsAsync("user1@example.com");
        var attemptsUser2 = await _service.GetFailedAttemptsAsync("user2@example.com");
        Assert.That(attemptsUser1, Is.EqualTo(2));
        Assert.That(attemptsUser2, Is.EqualTo(1));
    }

    #endregion

    #region RecordSuccessfulLoginAsync Tests

    [Test]
    public async Task RecordSuccessfulLoginAsync_ClearsFailedAttempts()
    {
        // Arrange
        var email = "test@example.com";
        await _service.RecordFailedAttemptAsync(email);
        await _service.RecordFailedAttemptAsync(email);
        await _service.RecordFailedAttemptAsync(email);

        // Act
        await _service.RecordSuccessfulLoginAsync(email);

        // Assert
        var attempts = await _service.GetFailedAttemptsAsync(email);
        Assert.That(attempts, Is.EqualTo(0));
    }

    [Test]
    public async Task RecordSuccessfulLoginAsync_UnlocksAccount()
    {
        // Arrange
        var email = "test@example.com";
        for (int i = 0; i < 5; i++)
        {
            await _service.RecordFailedAttemptAsync(email);
        }
        Assert.That(await _service.IsAccountLockedAsync(email), Is.True);

        // Act
        await _service.RecordSuccessfulLoginAsync(email);

        // Assert
        Assert.That(await _service.IsAccountLockedAsync(email), Is.False);
    }

    [Test]
    public async Task RecordSuccessfulLoginAsync_EmailCaseInsensitive()
    {
        // Arrange
        await _service.RecordFailedAttemptAsync("test@example.com");
        await _service.RecordFailedAttemptAsync("test@example.com");

        // Act
        await _service.RecordSuccessfulLoginAsync("TEST@EXAMPLE.COM");

        // Assert
        var attempts = await _service.GetFailedAttemptsAsync("test@example.com");
        Assert.That(attempts, Is.EqualTo(0));
    }

    [Test]
    public async Task RecordSuccessfulLoginAsync_NoExistingAttempts_DoesNotThrow()
    {
        // Act & Assert - should not throw
        Assert.DoesNotThrowAsync(async () =>
            await _service.RecordSuccessfulLoginAsync("nonexistent@example.com"));
    }

    #endregion

    #region GetFailedAttemptsAsync Tests

    [Test]
    public async Task GetFailedAttemptsAsync_NoAttempts_ReturnsZero()
    {
        // Act
        var result = await _service.GetFailedAttemptsAsync("test@example.com");

        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    [Test]
    public async Task GetFailedAttemptsAsync_WithAttempts_ReturnsCorrectCount()
    {
        // Arrange
        var email = "test@example.com";
        await _service.RecordFailedAttemptAsync(email);
        await _service.RecordFailedAttemptAsync(email);
        await _service.RecordFailedAttemptAsync(email);
        await _service.RecordFailedAttemptAsync(email);

        // Act
        var result = await _service.GetFailedAttemptsAsync(email);

        // Assert
        Assert.That(result, Is.EqualTo(4));
    }

    [Test]
    public async Task GetFailedAttemptsAsync_EmailCaseInsensitive()
    {
        // Arrange
        await _service.RecordFailedAttemptAsync("TEST@example.com");
        await _service.RecordFailedAttemptAsync("test@EXAMPLE.com");

        // Act
        var result = await _service.GetFailedAttemptsAsync("TeSt@ExAmPlE.cOm");

        // Assert
        Assert.That(result, Is.EqualTo(2));
    }

    #endregion

    #region Lockout Behavior Tests

    [Test]
    public async Task Lockout_AttemptsAffectLockoutStatus()
    {
        // Arrange
        var email = "test@example.com";

        // Record 4 failed attempts - not locked
        for (int i = 0; i < 4; i++)
        {
            await _service.RecordFailedAttemptAsync(email);
            Assert.That(await _service.IsAccountLockedAsync(email), Is.False);
        }

        // 5th attempt locks the account
        await _service.RecordFailedAttemptAsync(email);
        Assert.That(await _service.IsAccountLockedAsync(email), Is.True);
    }

    [Test]
    public async Task Lockout_RemainsLockedAfterAdditionalAttempts()
    {
        // Arrange
        var email = "test@example.com";
        for (int i = 0; i < 5; i++)
        {
            await _service.RecordFailedAttemptAsync(email);
        }
        Assert.That(await _service.IsAccountLockedAsync(email), Is.True);

        // Act - more failed attempts
        await _service.RecordFailedAttemptAsync(email);
        await _service.RecordFailedAttemptAsync(email);

        // Assert - still locked
        Assert.That(await _service.IsAccountLockedAsync(email), Is.True);
    }

    #endregion

    #region Concurrent Access Tests

    [Test]
    public async Task ConcurrentAccess_HandlesMultipleThreadsSafely()
    {
        // Arrange
        var email = "concurrent@example.com";
        var tasks = new List<Task>();

        // Act - simulate concurrent failed login attempts
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(_service.RecordFailedAttemptAsync(email));
        }

        await Task.WhenAll(tasks);

        // Assert - all 10 attempts should be recorded
        var attempts = await _service.GetFailedAttemptsAsync(email);
        Assert.That(attempts, Is.EqualTo(10));
    }

    [Test]
    public async Task ConcurrentAccess_DifferentEmailsTrackedSeparately()
    {
        // Arrange
        var tasks = new List<Task>();

        // Act - concurrent attempts for different emails
        for (int i = 0; i < 5; i++)
        {
            tasks.Add(_service.RecordFailedAttemptAsync($"user{i}@example.com"));
            tasks.Add(_service.RecordFailedAttemptAsync($"user{i}@example.com"));
        }

        await Task.WhenAll(tasks);

        // Assert - each email should have 2 attempts
        for (int i = 0; i < 5; i++)
        {
            var attempts = await _service.GetFailedAttemptsAsync($"user{i}@example.com");
            Assert.That(attempts, Is.EqualTo(2));
        }
    }

    #endregion

    #region Edge Cases Tests

    [Test]
    public async Task RecordFailedAttemptAsync_EmptyEmail_HandledCorrectly()
    {
        // Act & Assert - should not throw
        Assert.DoesNotThrowAsync(async () =>
            await _service.RecordFailedAttemptAsync(string.Empty));
    }

    [Test]
    public async Task IsAccountLockedAsync_AfterClear_ReturnsFalse()
    {
        // Arrange
        var email = "test@example.com";
        for (int i = 0; i < 5; i++)
        {
            await _service.RecordFailedAttemptAsync(email);
        }
        Assert.That(await _service.IsAccountLockedAsync(email), Is.True);

        // Act
        await _service.RecordSuccessfulLoginAsync(email);

        // Assert
        Assert.That(await _service.IsAccountLockedAsync(email), Is.False);
    }

    [Test]
    public async Task NewServiceInstance_StartsWithNoAttempts()
    {
        // Arrange - create a new service instance
        var newService = new LoginAttemptService(NullLogger<LoginAttemptService>.Instance);

        // Act
        var attempts = await newService.GetFailedAttemptsAsync("test@example.com");
        var isLocked = await newService.IsAccountLockedAsync("test@example.com");

        // Assert
        Assert.That(attempts, Is.EqualTo(0));
        Assert.That(isLocked, Is.False);
    }

    #endregion
}
