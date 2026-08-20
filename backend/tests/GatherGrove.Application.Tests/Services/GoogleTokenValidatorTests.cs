using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using FluentAssertions;
using Google.Apis.Auth;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for GoogleTokenValidator service.
///
/// Note: The GoogleJsonWebSignature.ValidateAsync is a static method from Google's library,
/// which makes it difficult to mock directly. These tests focus on:
/// - Configuration handling (client ID selection per platform)
/// - Error handling for various exception types
/// - Edge cases in input validation
///
/// Integration tests with real Google tokens would be needed for full validation coverage.
/// </summary>
[TestFixture]
public class GoogleTokenValidatorTests
{
    private Mock<IConfiguration> _mockConfiguration;
    private Mock<ILogger<GoogleTokenValidator>> _mockLogger;
    private GoogleTokenValidator _validator;

    [SetUp]
    public void SetUp()
    {
        _mockConfiguration = new Mock<IConfiguration>();
        _mockConfiguration.Setup(c => c["OAuth:Google:WebClientId"]).Returns("web-client-id.apps.googleusercontent.com");
        _mockConfiguration.Setup(c => c["OAuth:Google:IosClientId"]).Returns("ios-client-id.apps.googleusercontent.com");
        _mockConfiguration.Setup(c => c["OAuth:Google:AndroidClientId"]).Returns("android-client-id.apps.googleusercontent.com");

        _mockLogger = new Mock<ILogger<GoogleTokenValidator>>();

        _validator = new GoogleTokenValidator(_mockConfiguration.Object, _mockLogger.Object);
    }

    #region Configuration Tests

    [Test]
    public async Task ValidateAsync_WhenNoClientIdConfigured_ReturnsFailedResult()
    {
        // Arrange
        _mockConfiguration.Setup(c => c["OAuth:Google:WebClientId"]).Returns((string?)null);
        var token = "some-invalid-token";

        // Act
        var result = await _validator.ValidateAsync(token, "web");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not configured");
    }

    [Test]
    public async Task ValidateAsync_WhenNoIosClientIdConfigured_ReturnsFailedResult()
    {
        // Arrange
        _mockConfiguration.Setup(c => c["OAuth:Google:IosClientId"]).Returns((string?)null);
        var token = "some-invalid-token";

        // Act
        var result = await _validator.ValidateAsync(token, "ios");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not configured");
    }

    [Test]
    public async Task ValidateAsync_WhenNoAndroidClientIdConfigured_ReturnsFailedResult()
    {
        // Arrange
        _mockConfiguration.Setup(c => c["OAuth:Google:AndroidClientId"]).Returns((string?)null);
        var token = "some-invalid-token";

        // Act
        var result = await _validator.ValidateAsync(token, "android");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not configured");
    }

    [Test]
    public async Task ValidateAsync_UnknownPlatform_DefaultsToWebClientId()
    {
        // Arrange - Web client ID is configured, unknown platform should fall back to it
        // This will fail at Google validation but we're testing the config fallback
        var token = "invalid-token-for-config-test";

        // Act
        var result = await _validator.ValidateAsync(token, "unknown-platform");

        // Assert - Should fail at Google validation, not config
        result.IsValid.Should().BeFalse();
        // Should not say "not configured" since it fell back to web client ID
        result.ErrorMessage.Should().NotContain("not configured");
    }

    #endregion

    #region Token Validation Error Handling

    [Test]
    public async Task ValidateAsync_WithInvalidJwtFormat_ReturnsFailedResult()
    {
        // Arrange
        var malformedToken = "not.a.valid.jwt";

        // Act
        var result = await _validator.ValidateAsync(malformedToken, "web");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Invalid Google token");
    }

    [Test]
    public async Task ValidateAsync_WithEmptyToken_ReturnsFailedResult()
    {
        // Arrange
        var emptyToken = "";

        // Act
        var result = await _validator.ValidateAsync(emptyToken, "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Test]
    public async Task ValidateAsync_WithNullLikeToken_ReturnsFailedResult()
    {
        // Arrange
        var whitespaceToken = "   ";

        // Act
        var result = await _validator.ValidateAsync(whitespaceToken, "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Test]
    public async Task ValidateAsync_WithVeryLongToken_HandlesGracefully()
    {
        // Arrange - Token that's too long to be valid
        var veryLongToken = new string('a', 10000);

        // Act
        var result = await _validator.ValidateAsync(veryLongToken, "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    #endregion

    #region Platform-Specific Client ID Selection

    [Test]
    public void GetClientIdForPlatform_WebPlatform_ReturnsWebClientId()
    {
        // This is testing via the integration path - the ValidateAsync will fail
        // but we can verify the correct client ID was attempted by checking the error

        // Act
        var result = _validator.ValidateAsync("test-token", "web").Result;

        // Assert - Validate was attempted (not a config error)
        result.ErrorMessage.Should().NotContain("not configured");
    }

    [Test]
    public void GetClientIdForPlatform_IosPlatform_ReturnsIosClientId()
    {
        // Act
        var result = _validator.ValidateAsync("test-token", "ios").Result;

        // Assert
        result.ErrorMessage.Should().NotContain("not configured");
    }

    [Test]
    public void GetClientIdForPlatform_AndroidPlatform_ReturnsAndroidClientId()
    {
        // Act
        var result = _validator.ValidateAsync("test-token", "android").Result;

        // Assert
        result.ErrorMessage.Should().NotContain("not configured");
    }

    [Test]
    public void GetClientIdForPlatform_CaseInsensitive()
    {
        // Act
        var resultUpperWeb = _validator.ValidateAsync("test-token", "WEB").Result;
        var resultMixedIos = _validator.ValidateAsync("test-token", "IOS").Result;
        var resultMixedAndroid = _validator.ValidateAsync("test-token", "ANDROID").Result;

        // Assert - All should attempt validation (not config errors)
        resultUpperWeb.ErrorMessage.Should().NotContain("not configured");
        resultMixedIos.ErrorMessage.Should().NotContain("not configured");
        resultMixedAndroid.ErrorMessage.Should().NotContain("not configured");
    }

    #endregion

    #region TokenValidationResult Tests

    [Test]
    public void TokenValidationResult_Failed_CreatesInvalidResult()
    {
        // Act
        var result = TokenValidationResult.Failed("Test error message");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Be("Test error message");
        result.Provider.Should().BeEmpty();
        result.ProviderUserId.Should().BeEmpty();
    }

    [Test]
    public void TokenValidationResult_SuccessProperties_AreSetCorrectly()
    {
        // Arrange
        var result = new TokenValidationResult
        {
            IsValid = true,
            Provider = "Google",
            ProviderUserId = "google-user-123",
            Email = "user@gmail.com",
            EmailVerified = true,
            FullName = "Test User",
            GivenName = "Test",
            FamilyName = "User",
            Picture = "https://example.com/photo.jpg",
            IsPrivateEmail = false
        };

        // Assert
        result.IsValid.Should().BeTrue();
        result.Provider.Should().Be("Google");
        result.ProviderUserId.Should().Be("google-user-123");
        result.Email.Should().Be("user@gmail.com");
        result.EmailVerified.Should().BeTrue();
        result.FullName.Should().Be("Test User");
        result.GivenName.Should().Be("Test");
        result.FamilyName.Should().Be("User");
        result.Picture.Should().Be("https://example.com/photo.jpg");
        result.IsPrivateEmail.Should().BeFalse();
    }

    #endregion

    #region Logging Verification

    [Test]
    public async Task ValidateAsync_WhenConfigMissing_LogsWarning()
    {
        // Arrange
        _mockConfiguration.Setup(c => c["OAuth:Google:WebClientId"]).Returns((string?)null);

        // Act
        await _validator.ValidateAsync("test-token", "web");

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No Google client ID configured")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task ValidateAsync_WhenTokenInvalid_LogsWarning()
    {
        // Arrange
        var invalidToken = "invalid.jwt.token";

        // Act
        await _validator.ValidateAsync(invalidToken, "web");

        // Assert - Should log either warning or error
        _mockLogger.Verify(
            x => x.Log(
                It.IsIn(LogLevel.Warning, LogLevel.Error),
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    #endregion

    #region Edge Cases

    [Test]
    public async Task ValidateAsync_MultipleSequentialCalls_HandledCorrectly()
    {
        // Arrange
        var token = "test-token";

        // Act
        var results = new List<TokenValidationResult>();
        for (int i = 0; i < 5; i++)
        {
            results.Add(await _validator.ValidateAsync(token, "web"));
        }

        // Assert - All should fail consistently
        results.Should().OnlyContain(r => !r.IsValid);
    }

    [Test]
    public async Task ValidateAsync_ConcurrentCalls_ThreadSafe()
    {
        // Arrange
        var token = "test-token";
        var tasks = new List<Task<TokenValidationResult>>();

        // Act
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(_validator.ValidateAsync(token, "web"));
        }

        var results = await Task.WhenAll(tasks);

        // Assert - All should complete without exceptions
        results.Should().HaveCount(10);
        results.Should().OnlyContain(r => !r.IsValid);
    }

    [Test]
    public async Task ValidateAsync_SpecialCharactersInToken_HandlesGracefully()
    {
        // Arrange
        var specialCharToken = "token!@#$%^&*()_+-=[]{}|;':\",./<>?";

        // Act
        var result = await _validator.ValidateAsync(specialCharToken, "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Test]
    public async Task ValidateAsync_JustTwoDots_HandlesInvalidJwtStructure()
    {
        // Arrange - JWT requires 3 parts (header.payload.signature)
        var twoDotToken = "header.payload";

        // Act
        var result = await _validator.ValidateAsync(twoDotToken, "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Test]
    public async Task ValidateAsync_NullPlatform_DefaultsToWebClientId()
    {
        // Arrange
        var token = "test-token";

        // Act
        var result = await _validator.ValidateAsync(token, null!);

        // Assert - Should not fail on config (defaults to web)
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().NotContain("not configured");
    }

    [Test]
    public async Task ValidateAsync_EmptyStringPlatform_DefaultsToWebClientId()
    {
        // Arrange
        var token = "test-token";

        // Act
        var result = await _validator.ValidateAsync(token, "");

        // Assert - Should not fail on config (defaults to web)
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().NotContain("not configured");
    }

    [Test]
    public async Task ValidateAsync_MixedCasePlatformNames_WorksCorrectly()
    {
        // Arrange
        var token = "test-token";

        // Act
        var resultWeb = await _validator.ValidateAsync(token, "Web");
        var resultIos = await _validator.ValidateAsync(token, "IoS");
        var resultAndroid = await _validator.ValidateAsync(token, "AnDrOiD");

        // Assert - All should work (case-insensitive)
        resultWeb.ErrorMessage.Should().NotContain("not configured");
        resultIos.ErrorMessage.Should().NotContain("not configured");
        resultAndroid.ErrorMessage.Should().NotContain("not configured");
    }

    #endregion

    #region Additional Configuration Edge Cases

    [Test]
    public async Task ValidateAsync_EmptyClientIdString_TreatedAsNotConfigured()
    {
        // Arrange
        _mockConfiguration.Setup(c => c["OAuth:Google:WebClientId"]).Returns("");
        var token = "test-token";

        // Act
        var result = await _validator.ValidateAsync(token, "web");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not configured");
    }

    [Test]
    public async Task ValidateAsync_WhitespaceClientId_FailsAtGoogleValidation()
    {
        // Arrange - Whitespace is not treated as null/empty by string.IsNullOrEmpty()
        // so it will be passed to Google validation and fail there
        _mockConfiguration.Setup(c => c["OAuth:Google:WebClientId"]).Returns("   ");
        var token = "test-token";

        // Act
        var result = await _validator.ValidateAsync(token, "web");

        // Assert
        result.IsValid.Should().BeFalse();
        // Will fail at Google validation, not config check
        result.ErrorMessage.Should().NotContain("not configured");
    }

    [Test]
    public async Task ValidateAsync_AllPlatformsMissingConfig_AllReturnConfigError()
    {
        // Arrange
        _mockConfiguration.Setup(c => c["OAuth:Google:WebClientId"]).Returns((string?)null);
        _mockConfiguration.Setup(c => c["OAuth:Google:IosClientId"]).Returns((string?)null);
        _mockConfiguration.Setup(c => c["OAuth:Google:AndroidClientId"]).Returns((string?)null);

        // Act
        var webResult = await _validator.ValidateAsync("token", "web");
        var iosResult = await _validator.ValidateAsync("token", "ios");
        var androidResult = await _validator.ValidateAsync("token", "android");

        // Assert
        webResult.ErrorMessage.Should().Contain("not configured");
        iosResult.ErrorMessage.Should().Contain("not configured");
        androidResult.ErrorMessage.Should().Contain("not configured");
    }

    #endregion

    #region TokenValidationResult Edge Cases

    [Test]
    public void TokenValidationResult_Failed_WithNullMessage_HandlesGracefully()
    {
        // Act
        var result = TokenValidationResult.Failed(null!);

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void TokenValidationResult_Failed_WithEmptyMessage_HandlesGracefully()
    {
        // Act
        var result = TokenValidationResult.Failed("");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().BeEmpty();
    }

    [Test]
    public void TokenValidationResult_DefaultConstructor_HasExpectedDefaults()
    {
        // Act
        var result = new TokenValidationResult();

        // Assert
        result.IsValid.Should().BeFalse(); // Default should be false for safety
        result.Provider.Should().BeNullOrEmpty();
        result.ProviderUserId.Should().BeNullOrEmpty();
        result.Email.Should().BeNullOrEmpty();
        result.EmailVerified.Should().BeFalse();
        result.FullName.Should().BeNullOrEmpty();
        result.IsPrivateEmail.Should().BeFalse();
    }

    #endregion

    #region Integration Test Documentation

    /*
     * INTEGRATION TESTS NEEDED (require real Google tokens):
     * ========================================================
     *
     * The following scenarios require integration tests with real Google OAuth tokens
     * because GoogleJsonWebSignature.ValidateAsync is a static method:
     *
     * 1. ValidateAsync_WithValidGoogleToken_ReturnsSuccessResult
     *    - Verify successful validation with real Google token
     *    - Verify all payload fields are correctly mapped
     *    - Verify EmailVerified flag is checked
     *
     * 2. ValidateAsync_WithExpiredGoogleToken_ReturnsFailedResult
     *    - Verify expired tokens are rejected
     *
     * 3. ValidateAsync_WithTamperedGoogleToken_ReturnsFailedResult
     *    - Verify signature validation catches tampering
     *
     * 4. ValidateAsync_WithUnverifiedEmail_ReturnsFailedResult
     *    - Verify tokens with EmailVerified=false are rejected
     *    - This is line 43-47 in GoogleTokenValidator.cs
     *
     * 5. ValidateAsync_WithWrongAudience_ReturnsFailedResult
     *    - Verify tokens for different client IDs are rejected
     *
     * These tests would need to be in a separate IntegrationTests project with:
     * - Real Google OAuth configuration
     * - Test Google accounts
     * - Token generation utilities
     * - Network access to Google's validation servers
     */

    #endregion
}

/// <summary>
/// Tests for LinkedProvidersInfo DTO
/// </summary>
[TestFixture]
public class LinkedProvidersInfoTests
{
    [Test]
    public void LinkedProvidersInfo_DefaultValues_AreCorrect()
    {
        // Act
        var info = new LinkedProvidersInfo();

        // Assert
        info.HasPassword.Should().BeFalse();
        info.GoogleLinked.Should().BeFalse();
        info.GoogleLinkedAt.Should().BeNull();
        info.AppleLinked.Should().BeFalse();
        info.AppleLinkedAt.Should().BeNull();
    }

    [Test]
    public void LinkedProvidersInfo_AllPropertiesSet_ReturnsCorrectValues()
    {
        // Arrange
        var googleLinkedAt = DateTime.UtcNow.AddDays(-10);
        var appleLinkedAt = DateTime.UtcNow.AddDays(-5);

        // Act
        var info = new LinkedProvidersInfo
        {
            HasPassword = true,
            GoogleLinked = true,
            GoogleLinkedAt = googleLinkedAt,
            AppleLinked = true,
            AppleLinkedAt = appleLinkedAt
        };

        // Assert
        info.HasPassword.Should().BeTrue();
        info.GoogleLinked.Should().BeTrue();
        info.GoogleLinkedAt.Should().Be(googleLinkedAt);
        info.AppleLinked.Should().BeTrue();
        info.AppleLinkedAt.Should().Be(appleLinkedAt);
    }
}
