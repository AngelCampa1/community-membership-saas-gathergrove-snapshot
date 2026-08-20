using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class AuthServiceTests
{
    private GatherGroveDbContext _context;
    private Mock<IConfiguration> _mockConfiguration;
    private Mock<ILogger<AuthService>> _mockLogger;
    private Mock<ILoginAttemptService> _mockLoginAttemptService;
    private Mock<IEmailService> _mockEmailService;
    private AuthService _authService;

    [SetUp]
    public void SetUp()
    {
        // Create in-memory database
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);

        // Mock configuration
        _mockConfiguration = new Mock<IConfiguration>();
        var mockJwtSection = new Mock<IConfigurationSection>();

        mockJwtSection.Setup(x => x["SecretKey"]).Returns("test-secret-key-for-jwt-token-generation-testing");
        mockJwtSection.Setup(x => x["Issuer"]).Returns("TestIssuer");
        mockJwtSection.Setup(x => x["Audience"]).Returns("TestAudience");
        mockJwtSection.Setup(x => x["ExpiryMinutes"]).Returns("60");

        _mockConfiguration.Setup(x => x.GetSection("JwtSettings")).Returns(mockJwtSection.Object);

        // Mock logger
        _mockLogger = new Mock<ILogger<AuthService>>();

        // Mock login attempt service
        _mockLoginAttemptService = new Mock<ILoginAttemptService>();
        _mockLoginAttemptService.Setup(x => x.IsAccountLockedAsync(It.IsAny<string>())).ReturnsAsync(false);
        _mockLoginAttemptService.Setup(x => x.RecordFailedAttemptAsync(It.IsAny<string>())).Returns(Task.CompletedTask);
        _mockLoginAttemptService.Setup(x => x.RecordSuccessfulLoginAsync(It.IsAny<string>())).Returns(Task.CompletedTask);

        // Mock email service
        _mockEmailService = new Mock<IEmailService>();
        _mockEmailService.Setup(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>())).ReturnsAsync(true);

        _authService = new AuthService(_context, _mockConfiguration.Object, _mockLogger.Object, _mockLoginAttemptService.Object, _mockEmailService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task RegisterAsync_WithValidRequest_ShouldCreateUserAndClub()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "SecurePassword123!",
            ClubName = "Test Club"
        };

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Token, Is.Not.Null.And.Not.Empty);
        Assert.That(result.User.FullName, Is.EqualTo("John Doe"));
        Assert.That(result.User.Email, Is.EqualTo("john.doe@example.com"));
        Assert.That(result.Club.Name, Is.EqualTo("Test Club"));
        Assert.That(result.Club.Tier, Is.EqualTo("Grow"));

        // Verify entities were created in database
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == "john.doe@example.com");
        var club = await _context.Clubs.FirstOrDefaultAsync(c => c.Name == "Test Club");
        var clubAdmin = await _context.ClubAdmins.FirstOrDefaultAsync(ca => ca.UserId == user!.Id);

        Assert.That(user, Is.Not.Null);
        Assert.That(club, Is.Not.Null);
        Assert.That(clubAdmin, Is.Not.Null);
        Assert.That(club.Tier, Is.EqualTo("Grow"));
        Assert.That(club.SubscriptionStatus, Is.EqualTo("trialing"));
        Assert.That(club.TrialExpiresAt, Is.Not.Null);
        Assert.That(club.TrialExpiresAt, Is.GreaterThan(DateTime.UtcNow.AddDays(29)));
        Assert.That(club.TrialExpiresAt, Is.LessThan(DateTime.UtcNow.AddDays(31)));
    }

    [Test]
    public void HashPassword_ShouldReturnHashedPassword()
    {
        // Arrange
        var password = "SecurePassword123!";

        // Act
        var hashedPassword = _authService.HashPassword(password);

        // Assert
        Assert.That(hashedPassword, Is.Not.Null);
        Assert.That(hashedPassword, Is.Not.EqualTo(password));
        Assert.That(hashedPassword.Length, Is.GreaterThan(50)); // BCrypt hashes are typically 60 characters
    }

    [Test]
    public void VerifyPassword_WithCorrectPassword_ShouldReturnTrue()
    {
        // Arrange
        var password = "SecurePassword123!";
        var hashedPassword = _authService.HashPassword(password);

        // Act
        var result = _authService.VerifyPassword(password, hashedPassword);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void VerifyPassword_WithIncorrectPassword_ShouldReturnFalse()
    {
        // Arrange
        var correctPassword = "SecurePassword123!";
        var incorrectPassword = "WrongPassword456!";
        var hashedPassword = _authService.HashPassword(correctPassword);

        // Act
        var result = _authService.VerifyPassword(incorrectPassword, hashedPassword);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void GenerateJwtToken_ShouldReturnValidToken()
    {
        // Arrange
        var userId = 123;
        var email = "test@example.com";
        var clubId = 1;

        // Act
        var token = _authService.GenerateJwtToken(userId, email, clubId, "Admin", false);

        // Assert
        Assert.That(token, Is.Not.Null);
        Assert.That(token, Is.Not.Empty);

        // JWT tokens have 3 parts separated by dots
        var tokenParts = token.Split('.');
        Assert.That(tokenParts.Length, Is.EqualTo(3));
    }

    [Test]
    public void GenerateJwtToken_WithMissingSecretKey_ShouldThrowInvalidOperationException()
    {
        // Arrange - Clear the environment variable to ensure we test config-only path
        var originalEnvValue = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
        Environment.SetEnvironmentVariable("JWT_SECRET_KEY", null);

        try
        {
            var mockJwtSection = new Mock<IConfigurationSection>();
            mockJwtSection.Setup(x => x["SecretKey"]).Returns((string?)null);
            _mockConfiguration.Setup(x => x.GetSection("JwtSettings")).Returns(mockJwtSection.Object);

            var mockLoginAttemptService = new Mock<ILoginAttemptService>();
            var mockEmailService = new Mock<IEmailService>();
            var authServiceWithBadConfig = new AuthService(_context, _mockConfiguration.Object, _mockLogger.Object, mockLoginAttemptService.Object, mockEmailService.Object);

            // Act & Assert
            var exception = Assert.Throws<InvalidOperationException>(
                () => authServiceWithBadConfig.GenerateJwtToken(123, "test@example.com", 1, "Admin", false));

            Assert.That(exception.Message, Does.Contain("JWT SecretKey not configured"));
        }
        finally
        {
            // Restore the original environment variable
            Environment.SetEnvironmentVariable("JWT_SECRET_KEY", originalEnvValue);
        }
    }

    [Test]
    public void GenerateJwtToken_WithRememberMe_ShouldGenerateLongerExpiryToken()
    {
        // Arrange
        var userId = 123;
        var email = "test@example.com";
        var clubId = 1;

        // Act
        var regularToken = _authService.GenerateJwtToken(userId, email, clubId, "Admin", false);
        var rememberMeToken = _authService.GenerateJwtToken(userId, email, clubId, "Admin", true);

        // Assert
        Assert.That(regularToken, Is.Not.Null);
        Assert.That(rememberMeToken, Is.Not.Null);

        // Both tokens should be valid JWT tokens
        Assert.That(regularToken.Split('.').Length, Is.EqualTo(3));
        Assert.That(rememberMeToken.Split('.').Length, Is.EqualTo(3));

        // Note: We can't easily compare expiry times without decoding the JWT
        // In a more comprehensive test, we would decode and compare the exp claims
    }

    [Test]
    public async Task RegisterAsync_ShouldSetClubTierToGrow()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "Admin User",
            Email = "admin@test.com",
            Password = "AdminPassword123!",
            ClubName = "Admin Club"
        };

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        var club = await _context.Clubs.FirstOrDefaultAsync(c => c.Name == "Admin Club");
        Assert.That(club, Is.Not.Null);
        Assert.That(club!.Tier, Is.EqualTo("Grow"));
    }

    [Test]
    public void HashPassword_ShouldProduceDifferentHashesForSamePassword()
    {
        // Arrange
        var password = "SecurePassword123!";

        // Act
        var hash1 = _authService.HashPassword(password);
        var hash2 = _authService.HashPassword(password);

        // Assert
        Assert.That(hash1, Is.Not.Null);
        Assert.That(hash2, Is.Not.Null);
        Assert.That(hash1, Is.Not.EqualTo(hash2)); // Salts should make them different

        // But both should verify correctly
        Assert.That(_authService.VerifyPassword(password, hash1), Is.True);
        Assert.That(_authService.VerifyPassword(password, hash2), Is.True);
    }

    [Test]
    public async Task LoginAsync_WithValidCredentials_ReturnsLoginResponse()
    {
        // Arrange
        var email = "test@example.com";
        var password = "testpassword123";
        var hashedPassword = _authService.HashPassword(password);

        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = email,
            PasswordHash = hashedPassword,
            IsActive = true, // User must be active to login
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Create a club for the user
        var club = new Club
        {
            Id = 1,
            Name = "Test Club",
            Tier = "Sprout",
            CreatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Create club admin relationship
        var clubAdmin = new ClubAdmin
        {
            UserId = user.Id,
            ClubId = club.Id,
            CreatedAt = DateTime.UtcNow
        };

        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = email,
            Password = password
        };

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.UserId, Is.EqualTo(user.Id));
        Assert.That(result.FullName, Is.EqualTo(user.FullName));
        Assert.That(result.Email, Is.EqualTo(user.Email));
        Assert.That(result.ClubId, Is.EqualTo(club.Id));
        Assert.That(result.Message, Is.EqualTo("Login successful! Welcome back."));
    }

    #region Onboarding Tests

    [Test]
    public async Task CompleteOnboardingAsync_WithValidUserId_MarksOnboardingAsCompleted()
    {
        // Arrange
        var user = new User
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            PasswordHash = _authService.HashPassword("password123"),
            OnboardingCompleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Small delay to ensure UpdatedAt timestamp changes
        await Task.Delay(10);

        // Act
        await _authService.CompleteOnboardingAsync(user.Id);

        // Assert
        var updatedUser = await _context.Users.FindAsync(user.Id);
        Assert.That(updatedUser, Is.Not.Null);
        Assert.That(updatedUser!.OnboardingCompleted, Is.True);
    }

    [Test]
    public async Task CompleteOnboardingAsync_WithNonExistentUserId_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _authService.CompleteOnboardingAsync(999));

        Assert.That(ex.Message, Does.Contain("User with ID 999 not found"));
        Assert.That(ex.ParamName, Is.EqualTo("userId"));
    }

    [Test]
    public async Task CompleteOnboardingAsync_WithAlreadyCompletedUser_UpdatesSuccessfully()
    {
        // Arrange
        var user = new User
        {
            FullName = "Jane Smith",
            Email = "jane.smith@example.com",
            PasswordHash = _authService.HashPassword("password123"),
            OnboardingCompleted = true, // Already completed
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        var originalUpdateTime = user.UpdatedAt;

        // Small delay to ensure UpdatedAt changes
        await Task.Delay(50);

        // Act
        await _authService.CompleteOnboardingAsync(user.Id);

        // Assert
        var updatedUser = await _context.Users.FindAsync(user.Id);
        Assert.That(updatedUser, Is.Not.Null);
        Assert.That(updatedUser!.OnboardingCompleted, Is.True);
        Assert.That(updatedUser.UpdatedAt, Is.GreaterThan(originalUpdateTime));
    }

    [Test]
    public async Task CompleteOnboardingAsync_WithPendingTrialClub_StartsTrial()
    {
        // Arrange
        var user = new User
        {
            FullName = "Pending Trial Owner",
            Email = "pending.owner@example.com",
            PasswordHash = _authService.HashPassword("password123"),
            OnboardingCompleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Pending Trial Club",
            Tier = "Grow",
            SubscriptionStatus = "pending_trial_claim",
            TrialExpiresAt = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        _context.ClubAdmins.Add(new ClubAdmin
        {
            UserId = user.Id,
            ClubId = club.Id,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        await _authService.CompleteOnboardingAsync(user.Id);

        // Assert
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        Assert.That(updatedClub, Is.Not.Null);
        Assert.That(updatedClub!.SubscriptionStatus, Is.EqualTo("trialing"));
        Assert.That(updatedClub.TrialExpiresAt, Is.Not.Null);
        Assert.That(updatedClub.TrialExpiresAt, Is.GreaterThan(DateTime.UtcNow.AddDays(29)));
        Assert.That(updatedClub.TrialExpiresAt, Is.LessThan(DateTime.UtcNow.AddDays(31)));
    }

    [Test]
    public async Task IsOnboardingCompletedAsync_WithCompletedUser_ReturnsTrue()
    {
        // Arrange
        var user = new User
        {
            FullName = "Completed User",
            Email = "completed@example.com",
            PasswordHash = _authService.HashPassword("password123"),
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.IsOnboardingCompletedAsync(user.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task IsOnboardingCompletedAsync_WithIncompleteUser_ReturnsFalse()
    {
        // Arrange
        var user = new User
        {
            FullName = "Incomplete User",
            Email = "incomplete@example.com",
            PasswordHash = _authService.HashPassword("password123"),
            OnboardingCompleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.IsOnboardingCompletedAsync(user.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task IsOnboardingCompletedAsync_WithNonExistentUser_ReturnsFalse()
    {
        // Act
        var result = await _authService.IsOnboardingCompletedAsync(999);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task IsOnboardingCompletedAsync_WithDefaultUser_ReturnsFalse()
    {
        // Arrange - Create user without explicitly setting OnboardingCompleted (should default to false)
        var user = new User
        {
            FullName = "Default User",
            Email = "default@example.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
            // OnboardingCompleted not set, should default to false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.IsOnboardingCompletedAsync(user.Id);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region Profile Management Tests

    [Test]
    public async Task UpdateProfileAsync_ValidRequest_UpdatesUserProfile()
    {
        // Arrange
        var originalTimestamp = DateTime.UtcNow.AddDays(-1);
        var user = new User
        {
            Id = 1,
            FullName = "Original Name",
            Email = "test@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = originalTimestamp
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new UpdateProfileRequest
        {
            FullName = "Updated Name"
        };

        // Act
        await _authService.UpdateProfileAsync(user.Id, request);

        // Assert
        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser.Should().NotBeNull();
        updatedUser!.FullName.Should().Be("Updated Name");
        updatedUser.UpdatedAt.Should().BeAfter(originalTimestamp);
    }

    [Test]
    public async Task UpdateProfileAsync_NonExistentUser_ThrowsArgumentException()
    {
        // Arrange
        var request = new UpdateProfileRequest
        {
            FullName = "New Name"
        };

        // Act & Assert
        try
        {
            await _authService.UpdateProfileAsync(999, request);
            Assert.Fail("Expected ArgumentException was not thrown");
        }
        catch (ArgumentException ex)
        {
            ex.Message.Should().Contain("User with ID 999 not found");
            ex.ParamName.Should().Be("userId");
        }
    }

    [Test]
    public async Task ChangePasswordAsync_ValidRequest_UpdatesPasswordHash()
    {
        // Arrange
        var originalPassword = "oldPassword123!";
        var originalTimestamp = DateTime.UtcNow.AddDays(-1);
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(originalPassword),
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = originalTimestamp
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = originalPassword,
            NewPassword = "newPassword456@"
        };

        // Act
        await _authService.ChangePasswordAsync(user.Id, request);

        // Assert
        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser.Should().NotBeNull();

        // Verify old password no longer works
        BCrypt.Net.BCrypt.Verify(originalPassword, updatedUser!.PasswordHash).Should().BeFalse();

        // Verify new password works
        BCrypt.Net.BCrypt.Verify("newPassword456@", updatedUser.PasswordHash).Should().BeTrue();

        updatedUser.UpdatedAt.Should().BeAfter(originalTimestamp);
    }

    [Test]
    public async Task ChangePasswordAsync_IncorrectCurrentPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctPassword123!"),
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "wrongPassword123!",
            NewPassword = "newPassword456@"
        };

        // Act & Assert
        try
        {
            await _authService.ChangePasswordAsync(user.Id, request);
            Assert.Fail("Expected UnauthorizedAccessException was not thrown");
        }
        catch (UnauthorizedAccessException ex)
        {
            ex.Message.Should().Be("Current password is incorrect.");
        }
    }

    [Test]
    public async Task ChangePasswordAsync_NonExistentUser_ThrowsArgumentException()
    {
        // Arrange
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "password123!",
            NewPassword = "newPassword456@"
        };

        // Act & Assert
        try
        {
            await _authService.ChangePasswordAsync(999, request);
            Assert.Fail("Expected ArgumentException was not thrown");
        }
        catch (ArgumentException ex)
        {
            ex.Message.Should().Contain("User with ID 999 not found");
            ex.ParamName.Should().Be("userId");
        }
    }

    [Test]
    public async Task ChangePasswordAsync_ValidRequest_DoesNotChangeOtherUserFields()
    {
        // Arrange
        var originalPassword = "oldPassword123!";
        var originalTimestamp = DateTime.UtcNow.AddDays(-1);
        var user = new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(originalPassword),
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = originalTimestamp
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = originalPassword,
            NewPassword = "newPassword456@"
        };

        // Act
        await _authService.ChangePasswordAsync(user.Id, request);

        // Assert
        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser.Should().NotBeNull();
        updatedUser!.FullName.Should().Be("Test User");
        updatedUser.Email.Should().Be("test@example.com");
        updatedUser.OnboardingCompleted.Should().Be(true);
        updatedUser.CreatedAt.Should().Be(user.CreatedAt);
        updatedUser.UpdatedAt.Should().BeAfter(originalTimestamp);
    }

    #endregion

    #region Invitation Acceptance Tests

    [Test]
    public async Task ValidateInviteTokenAsync_WithValidToken_ReturnsValidResponse()
    {
        // Arrange
        var invitingUser = new User
        {
            FullName = "Inviting User",
            Email = "inviting@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(invitingUser);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var invite = new ClubAdminInvite
        {
            ClubId = club.Id,
            Email = "newadmin@test.com",
            InviteToken = "test-token-123",
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invitingUser.Id
        };

        _context.ClubAdminInvites.Add(invite);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.ValidateInviteTokenAsync("test-token-123");

        // Assert
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.Email, Is.EqualTo("newadmin@test.com"));
        Assert.That(result.ClubName, Is.EqualTo("Test Club"));
        Assert.That(result.HasExistingAccount, Is.False);
        Assert.That(result.InvitedByName, Is.EqualTo("Inviting User"));
        Assert.That(result.ErrorMessage, Is.Null);
    }

    [Test]
    public async Task ValidateInviteTokenAsync_WithExistingUser_SetsHasExistingAccountTrue()
    {
        // Arrange
        var invitingUser = new User
        {
            FullName = "Inviting User",
            Email = "inviting@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var existingUser = new User
        {
            FullName = "Existing User",
            Email = "existing@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.AddRange(invitingUser, existingUser);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var invite = new ClubAdminInvite
        {
            ClubId = club.Id,
            Email = "existing@test.com", // Email matches existing user
            InviteToken = "test-token-123",
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invitingUser.Id
        };

        _context.ClubAdminInvites.Add(invite);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.ValidateInviteTokenAsync("test-token-123");

        // Assert
        Assert.That(result.IsValid, Is.True);
        Assert.That(result.HasExistingAccount, Is.True);
    }

    [Test]
    public async Task ValidateInviteTokenAsync_WithInvalidToken_ReturnsInvalidResponse()
    {
        // Act
        var result = await _authService.ValidateInviteTokenAsync("invalid-token");

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("Invalid invitation link"));
    }

    [Test]
    public async Task ValidateInviteTokenAsync_WithExpiredToken_ReturnsInvalidResponse()
    {
        // Arrange
        var invitingUser = new User
        {
            FullName = "Inviting User",
            Email = "inviting@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(invitingUser);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var invite = new ClubAdminInvite
        {
            ClubId = club.Id,
            Email = "newadmin@test.com",
            InviteToken = "expired-token-123",
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddDays(-1), // Expired
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invitingUser.Id
        };

        _context.ClubAdminInvites.Add(invite);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.ValidateInviteTokenAsync("expired-token-123");

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("expired"));
    }

    [Test]
    public async Task ValidateInviteTokenAsync_WithAcceptedToken_ReturnsInvalidResponse()
    {
        // Arrange
        var invitingUser = new User
        {
            FullName = "Inviting User",
            Email = "inviting@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(invitingUser);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var invite = new ClubAdminInvite
        {
            ClubId = club.Id,
            Email = "newadmin@test.com",
            InviteToken = "accepted-token-123",
            Status = "Accepted", // Already accepted
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invitingUser.Id
        };

        _context.ClubAdminInvites.Add(invite);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.ValidateInviteTokenAsync("accepted-token-123");

        // Assert
        Assert.That(result.IsValid, Is.False);
        Assert.That(result.ErrorMessage, Does.Contain("already been accepted"));
    }

    [Test]
    public async Task AcceptAdminInviteAsync_WithNewUser_CreatesUserAndAddsAsAdmin()
    {
        // Arrange
        var invitingUser = new User
        {
            FullName = "Inviting User",
            Email = "inviting@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(invitingUser);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var invite = new ClubAdminInvite
        {
            ClubId = club.Id,
            Email = "newadmin@test.com",
            InviteToken = "valid-token-123",
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invitingUser.Id
        };

        _context.ClubAdminInvites.Add(invite);
        await _context.SaveChangesAsync();

        var request = new AcceptAdminInviteRequest
        {
            Token = "valid-token-123",
            FullName = "New Admin User",
            Password = "NewPassword123!"
        };

        // Act
        var result = await _authService.AcceptAdminInviteAsync(request);

        // Assert
        Assert.That(result.IsNewUser, Is.True);
        Assert.That(result.User.FullName, Is.EqualTo("New Admin User"));
        Assert.That(result.User.Email, Is.EqualTo("newadmin@test.com"));
        Assert.That(result.User.OnboardingCompleted, Is.True); // Should skip onboarding for invited admins
        Assert.That(result.Club.Name, Is.EqualTo("Test Club"));
        Assert.That(result.Message, Does.Contain("administrator for Test Club"));

        // Verify user was created
        var newUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "newadmin@test.com");
        Assert.That(newUser, Is.Not.Null);
        Assert.That(newUser!.OnboardingCompleted, Is.True);

        // Verify admin relationship was created
        var adminRelation = await _context.ClubAdmins
            .FirstOrDefaultAsync(ca => ca.UserId == newUser.Id && ca.ClubId == club.Id);
        Assert.That(adminRelation, Is.Not.Null);

        // Verify invitation was marked as accepted
        var updatedInvite = await _context.ClubAdminInvites.FindAsync(invite.InviteId);
        Assert.That(updatedInvite!.Status, Is.EqualTo("Accepted"));
    }

    [Test]
    public async Task AcceptAdminInviteAsync_WithExistingUser_AddsAsAdminWithoutCreatingUser()
    {
        // Arrange
        var invitingUser = new User
        {
            FullName = "Inviting User",
            Email = "inviting@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var existingUser = new User
        {
            FullName = "Existing User",
            Email = "existing@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.AddRange(invitingUser, existingUser);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var invite = new ClubAdminInvite
        {
            ClubId = club.Id,
            Email = "existing@test.com",
            InviteToken = "valid-token-123",
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invitingUser.Id
        };

        _context.ClubAdminInvites.Add(invite);
        await _context.SaveChangesAsync();

        var request = new AcceptAdminInviteRequest
        {
            Token = "valid-token-123"
            // No password or fullName for existing user
        };

        // Act
        var result = await _authService.AcceptAdminInviteAsync(request);

        // Assert
        Assert.That(result.IsNewUser, Is.False);
        Assert.That(result.User.FullName, Is.EqualTo("Existing User"));
        Assert.That(result.User.Email, Is.EqualTo("existing@test.com"));
        Assert.That(result.Club.Name, Is.EqualTo("Test Club"));

        // Verify admin relationship was created
        var adminRelation = await _context.ClubAdmins
            .FirstOrDefaultAsync(ca => ca.UserId == existingUser.Id && ca.ClubId == club.Id);
        Assert.That(adminRelation, Is.Not.Null);

        // Verify invitation was marked as accepted
        var updatedInvite = await _context.ClubAdminInvites.FindAsync(invite.InviteId);
        Assert.That(updatedInvite!.Status, Is.EqualTo("Accepted"));
    }

    [Test]
    public async Task AcceptAdminInviteAsync_WithNewUserMissingPassword_ThrowsArgumentException()
    {
        // Arrange
        var invitingUser = new User
        {
            FullName = "Inviting User",
            Email = "inviting@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(invitingUser);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var invite = new ClubAdminInvite
        {
            ClubId = club.Id,
            Email = "newadmin@test.com",
            InviteToken = "valid-token-123",
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invitingUser.Id
        };

        _context.ClubAdminInvites.Add(invite);
        await _context.SaveChangesAsync();

        var request = new AcceptAdminInviteRequest
        {
            Token = "valid-token-123",
            FullName = "New Admin User"
            // Missing password
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _authService.AcceptAdminInviteAsync(request));

        Assert.That(exception.Message, Does.Contain("Password is required for new users"));
    }

    [Test]
    public async Task AcceptAdminInviteAsync_WithNewUserMissingFullName_ThrowsArgumentException()
    {
        // Arrange
        var invitingUser = new User
        {
            FullName = "Inviting User",
            Email = "inviting@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(invitingUser);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var invite = new ClubAdminInvite
        {
            ClubId = club.Id,
            Email = "newadmin@test.com",
            InviteToken = "valid-token-123",
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invitingUser.Id
        };

        _context.ClubAdminInvites.Add(invite);
        await _context.SaveChangesAsync();

        var request = new AcceptAdminInviteRequest
        {
            Token = "valid-token-123",
            Password = "NewPassword123!"
            // Missing full name
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _authService.AcceptAdminInviteAsync(request));

        Assert.That(exception.Message, Does.Contain("Full name is required for new users"));
    }

    [Test]
    public async Task AcceptAdminInviteAsync_WithInvalidToken_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new AcceptAdminInviteRequest
        {
            Token = "invalid-token",
            FullName = "New Admin User",
            Password = "NewPassword123!"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.AcceptAdminInviteAsync(request));

        Assert.That(exception.Message, Does.Contain("Invalid invitation link"));
    }

    [Test]
    public async Task AcceptAdminInviteAsync_WithUserAlreadyAdmin_ThrowsInvalidOperationException()
    {
        // Arrange
        var existingUser = new User
        {
            FullName = "Existing User",
            Email = "existing@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var invitingUser = new User
        {
            FullName = "Inviting User",
            Email = "inviting@test.com",
            PasswordHash = _authService.HashPassword("password123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.AddRange(existingUser, invitingUser);
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Make existing user already an admin
        var existingAdmin = new ClubAdmin
        {
            UserId = existingUser.Id,
            ClubId = club.Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubAdmins.Add(existingAdmin);

        var invite = new ClubAdminInvite
        {
            ClubId = club.Id,
            Email = "existing@test.com",
            InviteToken = "valid-token-123",
            Status = "Pending",
            ExpiresAt = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invitingUser.Id
        };

        _context.ClubAdminInvites.Add(invite);
        await _context.SaveChangesAsync();

        var request = new AcceptAdminInviteRequest
        {
            Token = "valid-token-123"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.AcceptAdminInviteAsync(request));

        Assert.That(exception.Message, Does.Contain("already an administrator"));
    }

    #endregion

    #region GetCurrentSessionAsync Tests - Critical 0% Coverage

    [Test]
    public async Task GetCurrentSessionAsync_AdminUser_ReturnsAdminSession()
    {
        // Arrange
        var user = new User
        {
            Email = "admin@test.com",
            FullName = "Admin User",
            PasswordHash = "hash",
            IsActive = true,
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var clubAdmin = new ClubAdmin
        {
            UserId = user.Id,
            ClubId = club.Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.GetCurrentSessionAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(user.Id);
        result.FullName.Should().Be("Admin User");
        result.Email.Should().Be("admin@test.com");
        result.ClubId.Should().Be(club.Id);
        result.ClubName.Should().Be("Test Club");
        result.ClubTier.Should().Be("Grow");
        result.Role.Should().Be("Admin");
        result.IsOnboardingCompleted.Should().BeTrue();
    }

    [Test]
    public async Task GetCurrentSessionAsync_MemberUser_ReturnsMemberSession()
    {
        // Arrange
        var user = new User
        {
            Email = "member@test.com",
            FullName = "Member User",
            PasswordHash = "hash",
            IsActive = true,
            OnboardingCompleted = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var club = new Club
        {
            Name = "Member Club",
            Tier = "Sprout",
            CreatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var member = new Member
        {
            Email = "member@test.com",
            FullName = "Member User",
            ClubId = club.Id,
            Status = "Active",
            JoinDate = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.GetCurrentSessionAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(user.Id);
        result.FullName.Should().Be("Member User");
        result.Email.Should().Be("member@test.com");
        result.ClubId.Should().Be(club.Id);
        result.ClubName.Should().Be("Member Club");
        result.ClubTier.Should().Be("Sprout");
        result.Role.Should().Be("Member");
        result.MemberId.Should().Be(member.Id);
        result.IsOnboardingCompleted.Should().BeFalse();
    }

    [Test]
    public async Task GetCurrentSessionAsync_NonExistentUser_ThrowsArgumentException()
    {
        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _authService.GetCurrentSessionAsync(999));

        exception.Message.Should().Contain("User with ID 999 not found");
    }

    [Test]
    public async Task GetCurrentSessionAsync_UserWithoutClub_ThrowsInvalidOperationException()
    {
        // Arrange
        var user = new User
        {
            Email = "orphan@test.com",
            FullName = "Orphan User",
            PasswordHash = "hash",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.GetCurrentSessionAsync(user.Id));

        exception.Message.Should().Contain("No club found for user");
    }

    #endregion

    #region RegisterAsync with createClub Parameter - Critical 0% Coverage

    [Test]
    public async Task RegisterAsync_WithCreateClubTrue_CreatesUserAndClub()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "New Admin",
            Email = "newadmin@test.com",
            Password = "SecurePass123!",
            ClubName = "New Admin Club"
        };

        // Act
        var (success, message) = await _authService.RegisterAsync(request, createClub: true);

        // Assert
        success.Should().BeTrue();
        message.Should().Be("User and club created successfully.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == "newadmin@test.com");
        var club = await _context.Clubs.FirstOrDefaultAsync(c => c.Name == "New Admin Club");
        var clubAdmin = await _context.ClubAdmins.FirstOrDefaultAsync(ca => ca.UserId == user!.Id);

        user.Should().NotBeNull();
        club.Should().NotBeNull();
        clubAdmin.Should().NotBeNull();
    }

    [Test]
    public async Task RegisterAsync_WithCreateClubFalse_CreatesUserOnly()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FullName = "Member Only",
            Email = "memberonly@test.com",
            Password = "SecurePass123!",
            ClubName = "Should Not Be Created"
        };

        // Act
        var (success, message) = await _authService.RegisterAsync(request, createClub: false);

        // Assert
        success.Should().BeTrue();
        message.Should().Be("User account created successfully.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == "memberonly@test.com");
        user.Should().NotBeNull();
        user!.IsActive.Should().BeTrue();

        var clubs = await _context.Clubs.Where(c => c.Name == "Should Not Be Created").ToListAsync();
        clubs.Should().BeEmpty();
    }

    [Test]
    public async Task RegisterAsync_WithCreateClubFalse_ExistingEmail_ReturnsFalse()
    {
        // Arrange
        var existingUser = new User
        {
            Email = "existing@test.com",
            FullName = "Existing User",
            PasswordHash = "hash",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var request = new RegisterRequest
        {
            FullName = "Duplicate User",
            Email = "existing@test.com",
            Password = "Pass123!"
        };

        // Act
        var (success, message) = await _authService.RegisterAsync(request, createClub: false);

        // Assert
        success.Should().BeFalse();
        message.Should().Be("A user with this email already exists.");
    }

    #endregion

    #region LoginAsync Edge Cases - Improve from 43.3% to 95%+

    [Test]
    public async Task LoginAsync_LockedAccount_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        _mockLoginAttemptService.Setup(x => x.IsAccountLockedAsync("locked@test.com"))
            .ReturnsAsync(true);

        var request = new LoginRequest
        {
            Email = "locked@test.com",
            Password = "password",
            Platform = "web"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync(request));

        exception.Message.Should().Contain("Account temporarily locked");
    }

    [Test]
    public async Task LoginAsync_NonExistentUser_RecordsFailedAttempt()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "nonexistent@test.com",
            Password = "password",
            Platform = "web"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync(request));

        exception.Message.Should().Contain("Invalid email or password");
        _mockLoginAttemptService.Verify(x => x.RecordFailedAttemptAsync("nonexistent@test.com"), Times.Once);
    }

    [Test]
    public async Task LoginAsync_InactiveAccount_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var user = new User
        {
            Email = "inactive@test.com",
            FullName = "Inactive User",
            PasswordHash = _authService.HashPassword("password"),
            IsActive = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "inactive@test.com",
            Password = "password",
            Platform = "web"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync(request));

        exception.Message.Should().Contain("account has not been activated");
    }

    [Test]
    public async Task LoginAsync_IncorrectPassword_RecordsFailedAttempt()
    {
        // Arrange
        var user = new User
        {
            Email = "user@test.com",
            FullName = "Test User",
            PasswordHash = _authService.HashPassword("correctpassword"),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "user@test.com",
            Password = "wrongpassword",
            Platform = "web"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync(request));

        exception.Message.Should().Contain("Invalid email or password");
        _mockLoginAttemptService.Verify(x => x.RecordFailedAttemptAsync("user@test.com"), Times.Once);
    }

    [Test]
    public async Task LoginAsync_AdminUser_ReturnsAdminLoginResponse()
    {
        // Arrange
        var user = new User
        {
            Email = "admin@test.com",
            FullName = "Admin User",
            PasswordHash = _authService.HashPassword("adminpass"),
            IsActive = true,
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var club = new Club
        {
            Name = "Admin Club",
            Tier = "Unlimited",
            CreatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var clubAdmin = new ClubAdmin
        {
            UserId = user.Id,
            ClubId = club.Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "admin@test.com",
            Password = "adminpass",
            Platform = "web",
            DeviceType = "desktop",
            SessionId = null
        };

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(user.Id);
        result.Email.Should().Be("admin@test.com");
        result.ClubId.Should().Be(club.Id);
        result.Role.Should().Be("Admin");
        result.ClubTier.Should().Be("Unlimited");
        result.IsOnboardingCompleted.Should().BeTrue();
        result.Message.Should().Contain("Welcome back");

        _mockLoginAttemptService.Verify(x => x.RecordSuccessfulLoginAsync("admin@test.com"), Times.Once);
    }

    [Test]
    public async Task LoginAsync_MemberInGrowTierClub_ReturnsSuccess()
    {
        // Arrange
        var user = new User
        {
            Email = "member@test.com",
            FullName = "Member User",
            PasswordHash = _authService.HashPassword("memberpass"),
            IsActive = true,
            OnboardingCompleted = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var club = new Club
        {
            Name = "Grow Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var member = new Member
        {
            Email = "member@test.com",
            FullName = "Member User",
            ClubId = club.Id,
            Status = "Active",
            JoinDate = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "member@test.com",
            Password = "memberpass",
            Platform = "mobile",
            DeviceType = "ios"
        };

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(user.Id);
        result.Role.Should().Be("Member");
        result.ClubTier.Should().Be("Grow");
    }

    [Test]
    public async Task LoginAsync_MemberInSproutTierClub_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var user = new User
        {
            Email = "sproutmember@test.com",
            FullName = "Sprout Member",
            PasswordHash = _authService.HashPassword("password"),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var club = new Club
        {
            Name = "Sprout Club",
            Tier = "Sprout",
            CreatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var member = new Member
        {
            Email = "sproutmember@test.com",
            FullName = "Sprout Member",
            ClubId = club.Id,
            Status = "Active",
            JoinDate = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "sproutmember@test.com",
            Password = "password",
            Platform = "web"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync(request));

        exception.Message.Should().Contain("Member portal access requires your club to be on the Grow tier");
    }

    [Test]
    public async Task LoginAsync_UserWithNoAdminOrMemberRelationship_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var user = new User
        {
            Email = "orphan@test.com",
            FullName = "Orphan User",
            PasswordHash = _authService.HashPassword("password"),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "orphan@test.com",
            Password = "password",
            Platform = "web"
        };

        // Act & Assert
        var exception = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync(request));

        exception.Message.Should().Contain("User account is not properly configured");
    }

    [Test]
    public async Task LoginAsync_WithAnalyticsSessionId_RecordsLoginAnalytics()
    {
        // Arrange
        var user = new User
        {
            Email = "analytics@test.com",
            FullName = "Analytics User",
            PasswordHash = _authService.HashPassword("password"),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var club = new Club
        {
            Name = "Analytics Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var member = new Member
        {
            Email = "analytics@test.com",
            FullName = "Analytics User",
            ClubId = club.Id,
            Status = "Active",
            JoinDate = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "analytics@test.com",
            Password = "password",
            Platform = "mobile",
            DeviceType = "android",
            SessionId = "test-session-123"
        };

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();

        // Verify analytics session was created
        var session = await _context.AnalyticsSessions.FirstOrDefaultAsync(s => s.Id == "test-session-123");
        session.Should().NotBeNull();
        session!.ClubId.Should().Be(club.Id);
        session.UserId.Should().Be(user.Id);
        session.MemberId.Should().Be(member.Id);
        session.Platform.Should().Be("mobile");
        session.DeviceType.Should().Be("android");
        session.IsLoginSession.Should().BeTrue();
        session.IsSuccessfulLogin.Should().BeTrue();
        session.LoginMethod.Should().Be("email");

        // Verify analytics event was created
        var loginEvent = await _context.AnalyticsEvents.FirstOrDefaultAsync(e => e.SessionId == "test-session-123");
        loginEvent.Should().NotBeNull();
        loginEvent!.EventType.Should().Be("Login");
        loginEvent.Category.Should().Be("Authentication");
        loginEvent.Action.Should().Be("Login_Success");
    }

    #endregion
}
