using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class ExternalAuthServiceTests
{
    private GatherGroveDbContext _context;
    private Mock<IGoogleTokenValidator> _mockGoogleValidator;
    private Mock<IAppleTokenValidator> _mockAppleValidator;
    private Mock<IAuthService> _mockAuthService;
    private Mock<ILogger<ExternalAuthService>> _mockLogger;
    private ExternalAuthService _service;

    [SetUp]
    public void SetUp()
    {
        // Create in-memory database
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);

        // Mock validators
        _mockGoogleValidator = new Mock<IGoogleTokenValidator>();
        _mockAppleValidator = new Mock<IAppleTokenValidator>();

        // Mock auth service
        _mockAuthService = new Mock<IAuthService>();
        _mockAuthService
            .Setup(a => a.GenerateJwtToken(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<bool>()))
            .Returns("test-jwt-token");
        _mockAuthService
            .Setup(a => a.HashPassword(It.IsAny<string>()))
            .Returns("hashed-password");

        // Mock logger
        _mockLogger = new Mock<ILogger<ExternalAuthService>>();

        _service = new ExternalAuthService(
            _context,
            _mockGoogleValidator.Object,
            _mockAppleValidator.Object,
            _mockAuthService.Object,
            _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region AuthenticateWithGoogleAsync Tests

    [Test]
    public async Task AuthenticateWithGoogleAsync_InvalidToken_ReturnsFailure()
    {
        // Arrange
        _mockGoogleValidator
            .Setup(v => v.ValidateAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(TokenValidationResult.Failed("Invalid token"));

        // Act
        var result = await _service.AuthenticateWithGoogleAsync("invalid-token");

        // Assert
        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Be("Invalid token");
    }

    [Test]
    public async Task AuthenticateWithGoogleAsync_NewUser_CreatesUserAndReturnsSuccess()
    {
        // Arrange
        SetupValidGoogleToken("google-user-123", "newuser@example.com");

        // Act
        var result = await _service.AuthenticateWithGoogleAsync("valid-token");

        // Assert
        result.Success.Should().BeTrue();
        result.IsNewUser.Should().BeTrue();
        result.WasLinkedToExisting.Should().BeFalse();
        result.User.Should().NotBeNull();
        result.User!.Email.Should().Be("newuser@example.com");

        // Verify user was created in database
        var createdUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "newuser@example.com");
        createdUser.Should().NotBeNull();

        // Verify external auth provider was created
        var provider = await _context.ExternalAuthProviders
            .FirstOrDefaultAsync(e => e.ProviderUserId == "google-user-123");
        provider.Should().NotBeNull();
        provider!.Provider.Should().Be("Google");
    }

    [Test]
    public async Task AuthenticateWithGoogleAsync_ExistingLinkedUser_LogsInAndUpdatesLastUsed()
    {
        // Arrange
        var existingUser = await CreateUserWithGoogleLink("existing@example.com", "google-existing-123");
        var originalLastUsed = existingUser.ExternalAuthProviders.First().LastUsedAt;

        SetupValidGoogleToken("google-existing-123", "existing@example.com");

        // Act
        await Task.Delay(10); // Ensure time difference
        var result = await _service.AuthenticateWithGoogleAsync("valid-token");

        // Assert
        result.Success.Should().BeTrue();
        result.IsNewUser.Should().BeFalse();
        result.WasLinkedToExisting.Should().BeFalse();
        result.User!.Id.Should().Be(existingUser.Id);

        // Verify LastUsedAt was updated
        var provider = await _context.ExternalAuthProviders
            .FirstOrDefaultAsync(e => e.ProviderUserId == "google-existing-123");
        provider!.LastUsedAt.Should().BeAfter(originalLastUsed);
    }

    [Test]
    public async Task AuthenticateWithGoogleAsync_ExistingUserWithSameEmail_AutoLinksProvider()
    {
        // Arrange
        var existingUser = await CreateUser("autolink@example.com");

        SetupValidGoogleToken("google-new-link-123", "autolink@example.com");

        // Act
        var result = await _service.AuthenticateWithGoogleAsync("valid-token");

        // Assert
        result.Success.Should().BeTrue();
        result.IsNewUser.Should().BeFalse();
        result.WasLinkedToExisting.Should().BeTrue();
        result.User!.Id.Should().Be(existingUser.Id);

        // Verify provider was linked
        var provider = await _context.ExternalAuthProviders
            .FirstOrDefaultAsync(e => e.UserId == existingUser.Id && e.Provider == "Google");
        provider.Should().NotBeNull();
    }

    [Test]
    public async Task AuthenticateWithGoogleAsync_UsesProvidedFullName()
    {
        // Arrange
        SetupValidGoogleToken("google-user-456", "user456@example.com", fullName: null);

        // Act
        var result = await _service.AuthenticateWithGoogleAsync("valid-token", "web", "Custom Name");

        // Assert
        result.Success.Should().BeTrue();
        result.User!.FullName.Should().Be("Custom Name");
    }

    #endregion

    #region AuthenticateWithAppleAsync Tests

    [Test]
    public async Task AuthenticateWithAppleAsync_InvalidToken_ReturnsFailure()
    {
        // Arrange
        _mockAppleValidator
            .Setup(v => v.ValidateAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .ReturnsAsync(TokenValidationResult.Failed("Invalid Apple token"));

        // Act
        var result = await _service.AuthenticateWithAppleAsync("invalid-token");

        // Assert
        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Be("Invalid Apple token");
    }

    [Test]
    public async Task AuthenticateWithAppleAsync_NewUser_CreatesUserWithAppleProvider()
    {
        // Arrange
        SetupValidAppleToken("apple-user-789", "appleuser@example.com");

        // Act
        var result = await _service.AuthenticateWithAppleAsync("valid-token");

        // Assert
        result.Success.Should().BeTrue();
        result.IsNewUser.Should().BeTrue();

        // Verify Apple provider was created
        var provider = await _context.ExternalAuthProviders
            .FirstOrDefaultAsync(e => e.ProviderUserId == "apple-user-789");
        provider.Should().NotBeNull();
        provider!.Provider.Should().Be("Apple");
    }

    [Test]
    public async Task AuthenticateWithAppleAsync_PassesNonceToValidator()
    {
        // Arrange
        SetupValidAppleToken("apple-nonce-user", "nonce@example.com");

        // Act
        await _service.AuthenticateWithAppleAsync("valid-token", "ios", null, "test-nonce");

        // Assert
        _mockAppleValidator.Verify(
            v => v.ValidateAsync("valid-token", "ios", "test-nonce"),
            Times.Once);
    }

    #endregion

    #region LinkProviderAsync Tests

    [Test]
    public async Task LinkProviderAsync_ValidGoogleToken_CreatesLink()
    {
        // Arrange
        var user = await CreateUser("linktest@example.com");
        SetupValidGoogleToken("google-link-123", "linktest@example.com");

        // Act
        var result = await _service.LinkProviderAsync(user.Id, "Google", "valid-token");

        // Assert
        result.Should().BeTrue();

        var provider = await _context.ExternalAuthProviders
            .FirstOrDefaultAsync(e => e.UserId == user.Id && e.Provider == "Google");
        provider.Should().NotBeNull();
        provider!.ProviderUserId.Should().Be("google-link-123");
    }

    [Test]
    public async Task LinkProviderAsync_ValidAppleToken_CreatesLink()
    {
        // Arrange
        var user = await CreateUser("applelink@example.com");
        SetupValidAppleToken("apple-link-456", "applelink@example.com");

        // Act
        var result = await _service.LinkProviderAsync(user.Id, "Apple", "valid-token");

        // Assert
        result.Should().BeTrue();

        var provider = await _context.ExternalAuthProviders
            .FirstOrDefaultAsync(e => e.UserId == user.Id && e.Provider == "Apple");
        provider.Should().NotBeNull();
    }

    [Test]
    public async Task LinkProviderAsync_UnsupportedProvider_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser("test@example.com");

        // Act
        var result = await _service.LinkProviderAsync(user.Id, "Facebook", "token");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task LinkProviderAsync_InvalidToken_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser("test@example.com");
        _mockGoogleValidator
            .Setup(v => v.ValidateAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(TokenValidationResult.Failed("Invalid"));

        // Act
        var result = await _service.LinkProviderAsync(user.Id, "Google", "invalid-token");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task LinkProviderAsync_ProviderAlreadyLinkedToSameUser_ReturnsTrue()
    {
        // Arrange
        var user = await CreateUserWithGoogleLink("alreadylinked@example.com", "google-same-123");
        SetupValidGoogleToken("google-same-123", "alreadylinked@example.com");

        // Act
        var result = await _service.LinkProviderAsync(user.Id, "Google", "valid-token");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task LinkProviderAsync_ProviderAlreadyLinkedToDifferentUser_ReturnsFalse()
    {
        // Arrange
        var user1 = await CreateUserWithGoogleLink("user1@example.com", "shared-google-123");
        var user2 = await CreateUser("user2@example.com");
        SetupValidGoogleToken("shared-google-123", "user2@example.com");

        // Act
        var result = await _service.LinkProviderAsync(user2.Id, "Google", "valid-token");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task LinkProviderAsync_UserAlreadyHasSameProviderLinked_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUserWithGoogleLink("duplicate@example.com", "google-existing-789");
        SetupValidGoogleToken("google-different-789", "duplicate@example.com");

        // Act
        var result = await _service.LinkProviderAsync(user.Id, "Google", "valid-token");

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region UnlinkProviderAsync Tests

    [Test]
    public async Task UnlinkProviderAsync_UserNotFound_ReturnsFailure()
    {
        // Act
        var (success, errorMessage) = await _service.UnlinkProviderAsync(99999, "Google");

        // Assert
        success.Should().BeFalse();
        errorMessage.Should().Be("User not found");
    }

    [Test]
    public async Task UnlinkProviderAsync_ProviderNotLinked_ReturnsFailure()
    {
        // Arrange
        var user = await CreateUser("nolink@example.com");

        // Act
        var (success, errorMessage) = await _service.UnlinkProviderAsync(user.Id, "Google");

        // Assert
        success.Should().BeFalse();
        errorMessage.Should().Contain("not linked");
    }

    [Test]
    public async Task UnlinkProviderAsync_HasPassword_SuccessfullyUnlinks()
    {
        // Arrange
        var user = await CreateUserWithPassword("haspassword@example.com", "hashed-password");
        await LinkGoogleToUser(user, "google-unlink-123");

        // Act
        var (success, errorMessage) = await _service.UnlinkProviderAsync(user.Id, "Google");

        // Assert
        success.Should().BeTrue();
        errorMessage.Should().BeNull();

        var provider = await _context.ExternalAuthProviders
            .FirstOrDefaultAsync(e => e.UserId == user.Id && e.Provider == "Google");
        provider.Should().BeNull();
    }

    [Test]
    public async Task UnlinkProviderAsync_OnlyAuthMethod_ReturnsFailure()
    {
        // Arrange
        var user = await CreateUser("ssoonly@example.com");
        user.PasswordHash = string.Empty; // No password
        await LinkGoogleToUser(user, "google-only-123");
        await _context.SaveChangesAsync();

        // Act
        var (success, errorMessage) = await _service.UnlinkProviderAsync(user.Id, "Google");

        // Assert
        success.Should().BeFalse();
        errorMessage.Should().Contain("Cannot unlink the only authentication method");
    }

    [Test]
    public async Task UnlinkProviderAsync_HasOtherProvider_SuccessfullyUnlinks()
    {
        // Arrange
        var user = await CreateUser("multiauth@example.com");
        user.PasswordHash = string.Empty; // No password
        await LinkGoogleToUser(user, "google-multi-123");
        await LinkAppleToUser(user, "apple-multi-456");
        await _context.SaveChangesAsync();

        // Act
        var (success, errorMessage) = await _service.UnlinkProviderAsync(user.Id, "Google");

        // Assert
        success.Should().BeTrue();

        var googleProvider = await _context.ExternalAuthProviders
            .FirstOrDefaultAsync(e => e.UserId == user.Id && e.Provider == "Google");
        googleProvider.Should().BeNull();

        var appleProvider = await _context.ExternalAuthProviders
            .FirstOrDefaultAsync(e => e.UserId == user.Id && e.Provider == "Apple");
        appleProvider.Should().NotBeNull();
    }

    #endregion

    #region GetLinkedProvidersAsync Tests

    [Test]
    public async Task GetLinkedProvidersAsync_UserNotFound_ReturnsEmptyInfo()
    {
        // Act
        var result = await _service.GetLinkedProvidersAsync(99999);

        // Assert
        result.HasPassword.Should().BeFalse();
        result.GoogleLinked.Should().BeFalse();
        result.AppleLinked.Should().BeFalse();
    }

    [Test]
    public async Task GetLinkedProvidersAsync_UserWithPassword_ReturnsCorrectInfo()
    {
        // Arrange
        var user = await CreateUserWithPassword("withpass@example.com", "hash");

        // Act
        var result = await _service.GetLinkedProvidersAsync(user.Id);

        // Assert
        result.HasPassword.Should().BeTrue();
        result.GoogleLinked.Should().BeFalse();
        result.AppleLinked.Should().BeFalse();
    }

    [Test]
    public async Task GetLinkedProvidersAsync_UserWithGoogleLinked_ReturnsCorrectInfo()
    {
        // Arrange
        var user = await CreateUserWithGoogleLink("googled@example.com", "google-info-123");

        // Act
        var result = await _service.GetLinkedProvidersAsync(user.Id);

        // Assert
        result.GoogleLinked.Should().BeTrue();
        result.GoogleLinkedAt.Should().NotBeNull();
        result.AppleLinked.Should().BeFalse();
    }

    [Test]
    public async Task GetLinkedProvidersAsync_UserWithBothProviders_ReturnsCorrectInfo()
    {
        // Arrange
        var user = await CreateUser("both@example.com");
        await LinkGoogleToUser(user, "google-both-123");
        await LinkAppleToUser(user, "apple-both-456");

        // Act
        var result = await _service.GetLinkedProvidersAsync(user.Id);

        // Assert
        result.GoogleLinked.Should().BeTrue();
        result.GoogleLinkedAt.Should().NotBeNull();
        result.AppleLinked.Should().BeTrue();
        result.AppleLinkedAt.Should().NotBeNull();
    }

    #endregion

    #region SetPasswordAsync Tests

    [Test]
    public async Task SetPasswordAsync_UserNotFound_ReturnsFalse()
    {
        // Act
        var result = await _service.SetPasswordAsync(99999, "newpassword");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task SetPasswordAsync_UserAlreadyHasPassword_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUserWithPassword("haspass@example.com", "existing-hash");

        // Act
        var result = await _service.SetPasswordAsync(user.Id, "newpassword");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task SetPasswordAsync_SsoOnlyUser_SetsPassword()
    {
        // Arrange
        var user = await CreateUser("ssouser@example.com");
        user.PasswordHash = string.Empty;
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.SetPasswordAsync(user.Id, "newpassword");

        // Assert
        result.Should().BeTrue();

        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser!.PasswordHash.Should().Be("hashed-password"); // From mock
    }

    #endregion

    #region Token Generation Tests

    [Test]
    public async Task AuthenticateWithGoogleAsync_NewUser_IncludesToken()
    {
        // Arrange
        SetupValidGoogleToken("google-newuser-token", "tokentest@example.com");

        // Act
        var result = await _service.AuthenticateWithGoogleAsync("valid-token");

        // Assert
        result.Token.Should().NotBeNullOrEmpty();
    }

    [Test]
    public async Task AuthenticateWithGoogleAsync_MobilePlatform_IncludesToken()
    {
        // Arrange
        var existingUser = await CreateUserWithGoogleLink("mobile@example.com", "google-mobile-123");
        SetupValidGoogleToken("google-mobile-123", "mobile@example.com");

        // Act
        var result = await _service.AuthenticateWithGoogleAsync("valid-token", "ios");

        // Assert
        result.Token.Should().NotBeNullOrEmpty();
    }

    #endregion

    #region Helper Methods

    private void SetupValidGoogleToken(string providerUserId, string email, string? fullName = "Test User")
    {
        _mockGoogleValidator
            .Setup(v => v.ValidateAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new TokenValidationResult
            {
                IsValid = true,
                Provider = "Google",
                ProviderUserId = providerUserId,
                Email = email,
                EmailVerified = true,
                FullName = fullName
            });
    }

    private void SetupValidAppleToken(string providerUserId, string email, string? fullName = "Apple User")
    {
        _mockAppleValidator
            .Setup(v => v.ValidateAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .ReturnsAsync(new TokenValidationResult
            {
                IsValid = true,
                Provider = "Apple",
                ProviderUserId = providerUserId,
                Email = email,
                EmailVerified = true,
                FullName = fullName
            });
    }

    private async Task<User> CreateUser(string email)
    {
        var user = new User
        {
            FullName = "Test User",
            Email = email,
            PasswordHash = "some-hash",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    private async Task<User> CreateUserWithPassword(string email, string passwordHash)
    {
        var user = new User
        {
            FullName = "Test User",
            Email = email,
            PasswordHash = passwordHash,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    private async Task<User> CreateUserWithGoogleLink(string email, string googleUserId)
    {
        var user = await CreateUser(email);
        await LinkGoogleToUser(user, googleUserId);
        return user;
    }

    private async Task LinkGoogleToUser(User user, string providerUserId)
    {
        var provider = new ExternalAuthProvider
        {
            UserId = user.Id,
            Provider = "Google",
            ProviderUserId = providerUserId,
            ProviderEmail = user.Email,
            EmailVerifiedAtLinking = true,
            LinkedAt = DateTime.UtcNow,
            LastUsedAt = DateTime.UtcNow
        };
        _context.ExternalAuthProviders.Add(provider);
        await _context.SaveChangesAsync();

        // Reload user to include navigation property
        await _context.Entry(user).Collection(u => u.ExternalAuthProviders).LoadAsync();
    }

    private async Task LinkAppleToUser(User user, string providerUserId)
    {
        var provider = new ExternalAuthProvider
        {
            UserId = user.Id,
            Provider = "Apple",
            ProviderUserId = providerUserId,
            ProviderEmail = user.Email,
            EmailVerifiedAtLinking = true,
            LinkedAt = DateTime.UtcNow,
            LastUsedAt = DateTime.UtcNow
        };
        _context.ExternalAuthProviders.Add(provider);
        await _context.SaveChangesAsync();
    }

    #endregion
}
