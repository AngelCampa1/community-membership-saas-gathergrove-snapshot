using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for AppleTokenValidator service.
///
/// Note: Full JWT token validation with JWKS requires either:
/// 1. Integration tests with real Apple tokens (time-sensitive, requires real Apple Sign-In)
/// 2. Complex mock setup with proper RSA key generation and token signing
///
/// These tests focus on:
/// - Configuration handling (client ID selection per platform)
/// - Error handling for various failure scenarios
/// - Network error handling
/// - Cache behavior
///
/// Integration tests should be added for full end-to-end validation.
/// </summary>
[TestFixture]
public class AppleTokenValidatorTests
{
    private Mock<IConfiguration> _mockConfiguration;
    private Mock<ILogger<AppleTokenValidator>> _mockLogger;
    private IMemoryCache _cache;

    [SetUp]
    public void SetUp()
    {
        // Mock configuration
        _mockConfiguration = new Mock<IConfiguration>();
        _mockConfiguration.Setup(c => c["OAuth:Apple:ServiceId"]).Returns("com.gathergrove.web");
        _mockConfiguration.Setup(c => c["OAuth:Apple:BundleId"]).Returns("com.gathergrove.app");

        // Mock logger
        _mockLogger = new Mock<ILogger<AppleTokenValidator>>();

        // Real memory cache - fresh for each test
        _cache = new MemoryCache(new MemoryCacheOptions());
    }

    [TearDown]
    public void TearDown()
    {
        _cache.Dispose();
    }

    private AppleTokenValidator CreateValidatorWithHandler(HttpMessageHandler handler)
    {
        var httpClient = new HttpClient(handler);
        return new AppleTokenValidator(httpClient, _cache, _mockConfiguration.Object, _mockLogger.Object);
    }

    #region Configuration Tests

    [Test]
    public async Task ValidateAsync_WhenNoWebClientIdConfigured_ReturnsFailedResult()
    {
        // Arrange
        _mockConfiguration.Setup(c => c["OAuth:Apple:ServiceId"]).Returns((string?)null);

        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("any-token", "web");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not configured");
    }

    [Test]
    public async Task ValidateAsync_WhenNoIosClientIdConfigured_ReturnsFailedResult()
    {
        // Arrange
        _mockConfiguration.Setup(c => c["OAuth:Apple:BundleId"]).Returns((string?)null);

        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("any-token", "ios");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not configured");
    }

    [Test]
    public async Task ValidateAsync_WhenAllClientIdsConfigured_WebPlatformUsesServiceId()
    {
        // Arrange - Both configured, request web platform
        // The validation will fail but we can verify it attempts to validate (doesn't fail on config)
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"Keys\":[]}")
        });
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("any-token", "web");

        // Assert - Should fail at JWKS validation, not configuration
        result.ErrorMessage.Should().NotContain("not configured");
    }

    [Test]
    public async Task ValidateAsync_UnknownPlatform_DefaultsToServiceId()
    {
        // Arrange
        _mockConfiguration.Setup(c => c["OAuth:Apple:ServiceId"]).Returns("com.gathergrove.web");

        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"Keys\":[]}")
        });
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("any-token", "unknown-platform");

        // Assert - Should not fail on configuration
        result.ErrorMessage.Should().NotContain("not configured");
    }

    #endregion

    #region JWKS Fetch Error Handling

    [Test]
    public async Task ValidateAsync_WhenJwksFetchThrowsException_ReturnsFailedResult()
    {
        // Arrange
        var handler = new FakeHttpMessageHandler(_ => throw new HttpRequestException("Network error"));
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("any-token", "web");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Failed to verify");
    }

    [Test]
    public async Task ValidateAsync_WhenJwksReturnsEmptyKeys_ReturnsFailedResult()
    {
        // Arrange
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"Keys\":[]}")
        });
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("any-token", "web");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Failed to verify");
    }

    [Test]
    public async Task ValidateAsync_WhenJwksReturnsNullKeys_ReturnsFailedResult()
    {
        // Arrange
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{}")
        });
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("any-token", "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Test]
    public async Task ValidateAsync_WhenJwksReturnsInvalidJson_ReturnsFailedResult()
    {
        // Arrange
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("not valid json")
        });
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("any-token", "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Test]
    public async Task ValidateAsync_WhenJwksReturnsNon200_ReturnsFailedResult()
    {
        // Arrange
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("any-token", "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    #endregion

    #region Token Format Error Handling

    [Test]
    public async Task ValidateAsync_WithEmptyToken_ReturnsFailedResult()
    {
        // Arrange
        var handler = CreateValidJwksHandler();
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("", "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Test]
    public async Task ValidateAsync_WithMalformedToken_ReturnsFailedResult()
    {
        // Arrange
        var handler = CreateValidJwksHandler();
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("not.a.valid.jwt.at.all", "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Test]
    public async Task ValidateAsync_WithRandomString_ReturnsFailedResult()
    {
        // Arrange
        var handler = CreateValidJwksHandler();
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("just-random-text", "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    #endregion

    #region Cache Behavior Tests

    [Test]
    public async Task ValidateAsync_CachesJwksKeys()
    {
        // Arrange
        int callCount = 0;
        var handler = new FakeHttpMessageHandler(_ =>
        {
            callCount++;
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"Keys\":[]}")
            };
        });
        var validator = CreateValidatorWithHandler(handler);

        // Act - call multiple times
        await validator.ValidateAsync("token1", "web");
        await validator.ValidateAsync("token2", "web");
        await validator.ValidateAsync("token3", "web");

        // Assert - HTTP should only be called once due to caching
        callCount.Should().Be(1);
    }

    #endregion

    #region Concurrent Access Tests

    [Test]
    public async Task ValidateAsync_ConcurrentCalls_HandledSafely()
    {
        // Arrange
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"Keys\":[]}")
        });
        var validator = CreateValidatorWithHandler(handler);
        var tasks = new List<Task<TokenValidationResult>>();

        // Act - fire off 10 concurrent requests
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(validator.ValidateAsync($"token-{i}", "web"));
        }

        var results = await Task.WhenAll(tasks);

        // Assert - All should complete (even if they fail validation)
        results.Should().HaveCount(10);
        results.Should().OnlyContain(r => !r.IsValid); // All fail because no valid keys
    }

    #endregion

    #region Logging Tests

    [Test]
    public async Task ValidateAsync_WhenConfigMissing_LogsWarning()
    {
        // Arrange
        _mockConfiguration.Setup(c => c["OAuth:Apple:ServiceId"]).Returns((string?)null);
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var validator = CreateValidatorWithHandler(handler);

        // Act
        await validator.ValidateAsync("any-token", "web");

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No Apple client ID configured")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region TokenValidationResult Tests

    [Test]
    public void TokenValidationResult_Failed_CreatesCorrectResult()
    {
        // Act
        var result = TokenValidationResult.Failed("Test error");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Be("Test error");
        result.Provider.Should().BeEmpty();
        result.ProviderUserId.Should().BeEmpty();
    }

    [Test]
    public void TokenValidationResult_Success_HasCorrectDefaults()
    {
        // Act
        var result = new TokenValidationResult
        {
            IsValid = true,
            Provider = "Apple",
            ProviderUserId = "apple-123",
            Email = "user@example.com",
            EmailVerified = true,
            IsPrivateEmail = true,
            FullName = "Test User"
        };

        // Assert
        result.IsValid.Should().BeTrue();
        result.Provider.Should().Be("Apple");
        result.ProviderUserId.Should().Be("apple-123");
        result.Email.Should().Be("user@example.com");
        result.EmailVerified.Should().BeTrue();
        result.IsPrivateEmail.Should().BeTrue();
        result.FullName.Should().Be("Test User");
    }

    #endregion

    #region Additional Edge Case Tests

    [Test]
    public async Task ValidateAsync_UnknownPlatform_DefaultsToWebServiceId()
    {
        // Arrange
        var handler = CreateValidJwksHandler();
        var validator = CreateValidatorWithHandler(handler);

        // Act - unknown platform should fall back to web
        var result = await validator.ValidateAsync("test-token", "unknown-platform");

        // Assert - Should not fail on config (uses web as default)
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().NotContain("not configured");
    }

    [Test]
    public async Task ValidateAsync_MixedCasePlatforms_CaseInsensitive()
    {
        // Arrange
        var handler = CreateValidJwksHandler();
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var webResult = await validator.ValidateAsync("test-token", "WEB");
        var iosResult = await validator.ValidateAsync("test-token", "IOS");

        // Assert - All should work (case-insensitive)
        webResult.ErrorMessage.Should().NotContain("not configured");
        iosResult.ErrorMessage.Should().NotContain("not configured");
    }

    [Test]
    public async Task ValidateAsync_EmptyClientIdString_TreatedAsNotConfigured()
    {
        // Arrange
        _mockConfiguration.Setup(c => c["OAuth:Apple:ServiceId"]).Returns("");
        var handler = CreateValidJwksHandler();
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("test-token", "web");

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not configured");
    }

    [Test]
    public async Task ValidateAsync_NullPlatform_DefaultsToWebServiceId()
    {
        // Arrange
        var handler = CreateValidJwksHandler();
        var validator = CreateValidatorWithHandler(handler);

        // Act
        var result = await validator.ValidateAsync("test-token", null!);

        // Assert - Should not fail on config
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().NotContain("not configured");
    }

    [Test]
    public async Task ValidateAsync_VeryLongToken_HandlesGracefully()
    {
        // Arrange
        var handler = CreateValidJwksHandler();
        var validator = CreateValidatorWithHandler(handler);
        var veryLongToken = new string('a', 10000);

        // Act
        var result = await validator.ValidateAsync(veryLongToken, "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Test]
    public async Task ValidateAsync_SpecialCharactersInToken_HandlesGracefully()
    {
        // Arrange
        var handler = CreateValidJwksHandler();
        var validator = CreateValidatorWithHandler(handler);
        var specialCharToken = "token!@#$%^&*()_+";

        // Act
        var result = await validator.ValidateAsync(specialCharToken, "web");

        // Assert
        result.IsValid.Should().BeFalse();
    }

    #endregion

    #region Integration Test Documentation

    /*
     * INTEGRATION TESTS NEEDED (require real Apple tokens):
     * ======================================================
     *
     * The following scenarios require integration tests with real Apple Sign-In tokens:
     *
     * 1. ValidateAsync_WithValidAppleToken_ReturnsSuccessResult
     *    - Verify successful validation with real Apple token
     *    - Verify all claims are correctly extracted (sub, email, email_verified, is_private_email)
     *    - Test with both standard and private relay emails
     *
     * 2. ValidateAsync_WithExpiredToken_ReturnsFailedResult
     *    - Verify expired tokens are rejected (line 78: ValidateLifetime = true)
     *
     * 3. ValidateAsync_WithWrongAudience_ReturnsFailedResult
     *    - Verify tokens for different client IDs are rejected (line 77: ValidAudience)
     *
     * 4. ValidateAsync_WithWrongIssuer_ReturnsFailedResult
     *    - Verify tokens not from Apple are rejected (line 75: ValidIssuer)
     *
     * 5. ValidateAsync_WithMissingSubject_ReturnsFailedResult
     *    - Test line 92-95: missing subject claim
     *
     * 6. ValidateAsync_WithNonceValidation_Success
     *    - Test nonce validation (lines 98-113)
     *    - Verify nonce match succeeds
     *
     * 7. ValidateAsync_WithNonceMismatch_ReturnsFailedResult
     *    - Test line 106-110: nonce mismatch detection (replay attack protection)
     *
     * 8. ValidateAsync_WithMissingNonceWhenRequired_ReturnsFailedResult
     *    - Test line 100-104: missing nonce when expectedNonce provided
     *
     * 9. ValidateAsync_WithPrivateRelayEmail_SetsIsPrivateEmailFlag
     *    - Test line 116: is_private_email flag handling
     *    - Verify logging for private relay (line 119-122)
     *
     * 10. GetApplePublicKeysAsync_FetchesAndCachesKeys
     *     - Test JWKS fetching from Apple (line 160)
     *     - Verify RSA key conversion (lines 173-187)
     *     - Verify 24-hour cache (line 192)
     *
     * These tests would need to be in a separate IntegrationTests project with:
     * - Real Apple Developer account
     * - Valid Service ID and Bundle ID configuration
     * - Token generation from Apple Sign-In
     * - Network access to appleid.apple.com
     */

    #endregion

    #region Helper Classes

    /// <summary>
    /// Fake HTTP handler for deterministic testing
    /// </summary>
    private class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responseFactory;

        public FakeHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
        {
            _responseFactory = responseFactory;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(_responseFactory(request));
        }
    }

    private FakeHttpMessageHandler CreateValidJwksHandler()
    {
        // Returns a JWKS with valid structure but dummy key that won't match any token
        var jwksJson = @"{
            ""Keys"": [
                {
                    ""Kty"": ""RSA"",
                    ""Kid"": ""dummy-key-id"",
                    ""Use"": ""sig"",
                    ""Alg"": ""RS256"",
                    ""N"": ""dummy-modulus"",
                    ""E"": ""AQAB""
                }
            ]
        }";

        return new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(jwksJson)
        });
    }

    #endregion
}
