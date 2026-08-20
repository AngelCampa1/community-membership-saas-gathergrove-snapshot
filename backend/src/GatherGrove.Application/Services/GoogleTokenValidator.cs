using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Validates Google OAuth ID tokens using the official Google.Apis.Auth library
/// </summary>
public class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleTokenValidator> _logger;

    public GoogleTokenValidator(IConfiguration configuration, ILogger<GoogleTokenValidator> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<TokenValidationResult> ValidateAsync(string idToken, string platform = "web")
    {
        try
        {
            // Get the appropriate client ID based on platform
            var clientId = GetClientIdForPlatform(platform);
            if (string.IsNullOrEmpty(clientId))
            {
                _logger.LogWarning("No Google client ID configured for platform: {Platform}", platform);
                return TokenValidationResult.Failed("Google Sign-In is not configured for this platform");
            }

            // Validate the token with Google
            var validationSettings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, validationSettings);

            // Verify email is verified by Google (required for account linking)
            if (!payload.EmailVerified)
            {
                _logger.LogWarning("Google login attempt with unverified email: {Email}", payload.Email);
                return TokenValidationResult.Failed("Email address is not verified by Google");
            }

            _logger.LogInformation("Successfully validated Google token for email: {Email}", payload.Email);

            return new TokenValidationResult
            {
                IsValid = true,
                Provider = "Google",
                ProviderUserId = payload.Subject,
                Email = payload.Email,
                EmailVerified = payload.EmailVerified,
                FullName = payload.Name,
                GivenName = payload.GivenName,
                FamilyName = payload.FamilyName,
                Picture = payload.Picture
            };
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Invalid Google ID token");
            return TokenValidationResult.Failed("Invalid Google token");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Google ID token");
            return TokenValidationResult.Failed("Failed to validate Google token");
        }
    }

    private string? GetClientIdForPlatform(string platform)
    {
        return platform.ToLowerInvariant() switch
        {
            "web" => _configuration["OAuth:Google:WebClientId"],
            "ios" => _configuration["OAuth:Google:IosClientId"],
            "android" => _configuration["OAuth:Google:AndroidClientId"],
            _ => _configuration["OAuth:Google:WebClientId"]
        };
    }
}
