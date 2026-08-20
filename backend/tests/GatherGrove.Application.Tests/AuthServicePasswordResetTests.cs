using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests;

/// <summary>
/// Unit tests for password reset functionality in AuthService
/// </summary>
[TestFixture]
public class AuthServicePasswordResetTests
{
    private GatherGroveDbContext _context = null!;
    private AuthService _authService = null!;
    private Mock<IConfiguration> _mockConfiguration = null!;
    private Mock<ILogger<AuthService>> _mockLogger = null!;
    private Mock<ILoginAttemptService> _mockLoginAttemptService = null!;
    private Mock<IEmailService> _mockEmailService = null!;

    [SetUp]
    public void Setup()
    {
        // Create in-memory database
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);

        // Setup mocks
        _mockConfiguration = new Mock<IConfiguration>();
        _mockLogger = new Mock<ILogger<AuthService>>();
        _mockLoginAttemptService = new Mock<ILoginAttemptService>();

        // Setup JWT configuration
        var jwtSection = new Mock<IConfigurationSection>();
        jwtSection.Setup(x => x["SecretKey"]).Returns("ThisIsASecretKeyForJWTTokensWithAtLeast256Bits");
        jwtSection.Setup(x => x["Issuer"]).Returns("GatherGrove");
        jwtSection.Setup(x => x["Audience"]).Returns("GatherGrove");
        jwtSection.Setup(x => x["ExpiryMinutes"]).Returns("60");

        _mockConfiguration.Setup(x => x.GetSection("JwtSettings")).Returns(jwtSection.Object);

        // Setup login attempt service defaults
        _mockLoginAttemptService.Setup(x => x.IsAccountLockedAsync(It.IsAny<string>())).ReturnsAsync(false);
        _mockLoginAttemptService.Setup(x => x.RecordFailedAttemptAsync(It.IsAny<string>())).Returns(Task.CompletedTask);
        _mockLoginAttemptService.Setup(x => x.RecordSuccessfulLoginAsync(It.IsAny<string>())).Returns(Task.CompletedTask);

        // Setup email service
        _mockEmailService = new Mock<IEmailService>();
        _mockEmailService.Setup(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>())).ReturnsAsync(true);

        _authService = new AuthService(_context, _mockConfiguration.Object, _mockLogger.Object, _mockLoginAttemptService.Object, _mockEmailService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region ForgotPasswordAsync Tests

    [Test]
    public async Task ForgotPasswordAsync_WithValidEmail_CreatesPasswordResetToken()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john.doe@example.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new ForgotPasswordRequest
        {
            Email = "john.doe@example.com"
        };

        // Act
        await _authService.ForgotPasswordAsync(request);

        // Assert
        var resetToken = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.UserId == user.Id);

        Assert.That(resetToken, Is.Not.Null);
        Assert.That(resetToken.UserId, Is.EqualTo(user.Id));
        Assert.That(resetToken.IsUsed, Is.False);
        Assert.That(resetToken.ExpiresAt, Is.GreaterThan(DateTime.UtcNow));
        Assert.That(resetToken.ExpiresAt, Is.LessThanOrEqualTo(DateTime.UtcNow.AddHours(1.1))); // Allow small buffer
        Assert.That(resetToken.TokenHash, Is.Not.Empty);
        Assert.That(resetToken.CreatedAt, Is.LessThanOrEqualTo(DateTime.UtcNow));
    }

    [Test]
    public async Task ForgotPasswordAsync_WithNonExistentEmail_CompletesWithoutError()
    {
        // Arrange
        var request = new ForgotPasswordRequest
        {
            Email = "nonexistent@example.com"
        };

        // Act
        await _authService.ForgotPasswordAsync(request);

        // Assert
        var resetTokens = await _context.PasswordResetTokens.ToListAsync();
        Assert.That(resetTokens, Is.Empty);
    }

    [Test]
    public async Task ForgotPasswordAsync_WithExistingValidTokens_InvalidatesOldTokens()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john.doe@example.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        // Add existing reset token
        var existingToken = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = _authService.HashPassword("old-token"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10)
        };

        _context.PasswordResetTokens.Add(existingToken);
        await _context.SaveChangesAsync();

        var request = new ForgotPasswordRequest
        {
            Email = "john.doe@example.com"
        };

        // Act
        await _authService.ForgotPasswordAsync(request);

        // Assert
        var tokens = await _context.PasswordResetTokens
            .Where(t => t.UserId == user.Id)
            .ToListAsync();

        Assert.That(tokens.Count, Is.EqualTo(2)); // Old + new token
        Assert.That(tokens.Where(t => t.IsUsed).Count(), Is.EqualTo(1)); // Old token marked as used
        Assert.That(tokens.Where(t => !t.IsUsed).Count(), Is.EqualTo(1)); // New token not used
    }

    #endregion

    #region ResetPasswordAsync Tests

    [Test]
    public async Task ResetPasswordAsync_WithValidToken_ResetsPassword()
    {
        // Arrange
        var pastTime = DateTime.UtcNow.AddDays(-1); // Clear past time
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john.doe@example.com",
            PasswordHash = _authService.HashPassword("oldpassword123"),
            CreatedAt = pastTime,
            UpdatedAt = pastTime
        };

        _context.Users.Add(user);

        var plainToken = "secure-reset-token-123";
        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = _authService.HashPassword(plainToken),
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10)
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync();

        var request = new ResetPasswordRequest
        {
            Token = plainToken,
            NewPassword = "NewSecurePassword123!",
            ConfirmPassword = "NewSecurePassword123!"
        };

        // Act
        await _authService.ResetPasswordAsync(request);

        // Assert
        var updatedUser = await _context.Users.FindAsync(user.Id);
        var updatedToken = await _context.PasswordResetTokens.FindAsync(resetToken.Id);

        Assert.That(updatedUser, Is.Not.Null);
        Assert.That(updatedUser.UpdatedAt, Is.GreaterThan(pastTime));
        Assert.That(_authService.VerifyPassword("NewSecurePassword123!", updatedUser.PasswordHash), Is.True);
        Assert.That(_authService.VerifyPassword("oldpassword123", updatedUser.PasswordHash), Is.False);
        Assert.That(updatedToken?.IsUsed, Is.True);
    }

    [Test]
    public async Task ResetPasswordAsync_WithInvalidToken_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john.doe@example.com",
            PasswordHash = _authService.HashPassword("oldpassword123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new ResetPasswordRequest
        {
            Token = "invalid-token",
            NewPassword = "NewSecurePassword123!",
            ConfirmPassword = "NewSecurePassword123!"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _authService.ResetPasswordAsync(request));

        Assert.That(ex?.Message, Does.Contain("Invalid or expired reset token"));
    }

    [Test]
    public async Task ResetPasswordAsync_WithExpiredToken_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john.doe@example.com",
            PasswordHash = _authService.HashPassword("oldpassword123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        var plainToken = "expired-token-123";
        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = _authService.HashPassword(plainToken),
            ExpiresAt = DateTime.UtcNow.AddMinutes(-30), // Expired
            IsUsed = false,
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync();

        var request = new ResetPasswordRequest
        {
            Token = plainToken,
            NewPassword = "NewSecurePassword123!",
            ConfirmPassword = "NewSecurePassword123!"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _authService.ResetPasswordAsync(request));

        Assert.That(ex?.Message, Does.Contain("Invalid or expired reset token"));
    }

    [Test]
    public async Task ResetPasswordAsync_WithUsedToken_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john.doe@example.com",
            PasswordHash = _authService.HashPassword("oldpassword123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        var plainToken = "used-token-123";
        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = _authService.HashPassword(plainToken),
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            IsUsed = true, // Already used
            CreatedAt = DateTime.UtcNow.AddMinutes(-10)
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync();

        var request = new ResetPasswordRequest
        {
            Token = plainToken,
            NewPassword = "NewSecurePassword123!",
            ConfirmPassword = "NewSecurePassword123!"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _authService.ResetPasswordAsync(request));

        Assert.That(ex?.Message, Does.Contain("Invalid or expired reset token"));
    }

    [Test]
    public async Task ResetPasswordAsync_InvalidatesOtherUnusedTokensForUser()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john.doe@example.com",
            PasswordHash = _authService.HashPassword("oldpassword123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        var validToken = "valid-token-123";
        var resetToken1 = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = _authService.HashPassword(validToken),
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10)
        };

        var resetToken2 = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = _authService.HashPassword("other-token-456"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(20),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5)
        };

        _context.PasswordResetTokens.AddRange(resetToken1, resetToken2);
        await _context.SaveChangesAsync();

        var request = new ResetPasswordRequest
        {
            Token = validToken,
            NewPassword = "NewSecurePassword123!",
            ConfirmPassword = "NewSecurePassword123!"
        };

        // Act
        await _authService.ResetPasswordAsync(request);

        // Assert
        var allTokens = await _context.PasswordResetTokens
            .Where(t => t.UserId == user.Id)
            .ToListAsync();

        Assert.That(allTokens.Count, Is.EqualTo(2));
        Assert.That(allTokens.All(t => t.IsUsed), Is.True); // All tokens should be marked as used
    }

    #endregion
}