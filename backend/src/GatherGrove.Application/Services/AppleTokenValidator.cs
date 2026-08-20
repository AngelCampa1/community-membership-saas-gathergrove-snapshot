using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json;

namespace GatherGrove.Application.Services;

/// <summary>
/// Validates Apple Sign-In ID tokens by fetching Apple's public keys
/// </summary>
public class AppleTokenValidator : IAppleTokenValidator
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AppleTokenValidator> _logger;

    private const string AppleKeysUrl = "https://appleid.apple.com/auth/keys";
    private const string AppleIssuer = "https://appleid.apple.com";
    private const string CacheKey = "apple_jwks_keys";

    public AppleTokenValidator(
        HttpClient httpClient,
        IMemoryCache cache,
        IConfiguration configuration,
        ILogger<AppleTokenValidator> logger)
    {
        _httpClient = httpClient;
        _cache = cache;
        _configuration = configuration;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<TokenValidationResult> ValidateAsync(string idToken, string platform = "web", string? expectedNonce = null)
    {
        try
        {
            // Get the appropriate client ID based on platform
            var clientId = GetClientIdForPlatform(platform);
            if (string.IsNullOrEmpty(clientId))
            {
                _logger.LogWarning("No Apple client ID configured for platform: {Platform}", platform);
                return TokenValidationResult.Failed("Apple Sign-In is not configured for this platform");
            }

            // Fetch Apple's public keys
            var keys = await GetApplePublicKeysAsync();
            if (keys == null || keys.Count == 0)
            {
                _logger.LogError("Failed to fetch Apple public keys");
                return TokenValidationResult.Failed("Failed to verify Apple token");
            }

            // Parse the token to get the key ID
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(idToken);
            var kid = jwtToken.Header.Kid;

            // Find the matching key
            var key = keys.FirstOrDefault(k => k.KeyId == kid);
            if (key == null)
            {
                _logger.LogWarning("No matching key found for kid: {KeyId}", kid);
                return TokenValidationResult.Failed("Invalid Apple token");
            }

            // Validate the token
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = AppleIssuer,
                ValidateAudience = true,
                ValidAudience = clientId,
                ValidateLifetime = true,
                IssuerSigningKey = key,
                ValidateIssuerSigningKey = true
            };

            var principal = handler.ValidateToken(idToken, validationParameters, out _);

            // Extract claims
            var subject = principal.FindFirst("sub")?.Value;
            var email = principal.FindFirst("email")?.Value;
            var emailVerifiedClaim = principal.FindFirst("email_verified")?.Value;
            var isPrivateEmailClaim = principal.FindFirst("is_private_email")?.Value;
            var nonceClaim = principal.FindFirst("nonce")?.Value;

            if (string.IsNullOrEmpty(subject))
            {
                return TokenValidationResult.Failed("Invalid Apple token: missing subject");
            }

            // Validate nonce if provided (for replay attack protection)
            if (!string.IsNullOrEmpty(expectedNonce))
            {
                if (string.IsNullOrEmpty(nonceClaim))
                {
                    _logger.LogWarning("Apple token missing nonce claim when nonce validation was requested");
                    return TokenValidationResult.Failed("Invalid Apple token: missing nonce");
                }

                if (!string.Equals(nonceClaim, expectedNonce, StringComparison.Ordinal))
                {
                    _logger.LogWarning("Apple token nonce mismatch - possible replay attack");
                    return TokenValidationResult.Failed("Invalid Apple token: nonce mismatch");
                }

                _logger.LogDebug("Apple token nonce validated successfully");
            }

            var emailVerified = emailVerifiedClaim?.ToLowerInvariant() == "true";
            var isPrivateEmail = isPrivateEmailClaim?.ToLowerInvariant() == "true";

            // Log if using private relay email
            if (isPrivateEmail)
            {
                _logger.LogInformation("Apple Sign-In with private relay email for subject: {Subject}", subject);
            }

            _logger.LogInformation("Successfully validated Apple token for subject: {Subject}", subject);

            return new TokenValidationResult
            {
                IsValid = true,
                Provider = "Apple",
                ProviderUserId = subject,
                Email = email,
                EmailVerified = emailVerified,
                IsPrivateEmail = isPrivateEmail,
                // Note: Apple only provides name on FIRST sign-in, must be passed from client
                FullName = null
            };
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogWarning(ex, "Invalid Apple ID token");
            return TokenValidationResult.Failed("Invalid Apple token");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Apple ID token");
            return TokenValidationResult.Failed("Failed to validate Apple token");
        }
    }

    private async Task<List<SecurityKey>> GetApplePublicKeysAsync()
    {
        // Try to get from cache
        if (_cache.TryGetValue(CacheKey, out List<SecurityKey>? cachedKeys) && cachedKeys != null)
        {
            return cachedKeys;
        }

        try
        {
            var response = await _httpClient.GetStringAsync(AppleKeysUrl);
            var jwks = JsonSerializer.Deserialize<AppleJwks>(response);

            if (jwks?.Keys == null)
            {
                return new List<SecurityKey>();
            }

            var keys = new List<SecurityKey>();
            foreach (var key in jwks.Keys)
            {
                if (key.Kty == "RSA")
                {
                    var rsaParameters = new RSAParameters
                    {
                        Modulus = Base64UrlDecode(key.N),
                        Exponent = Base64UrlDecode(key.E)
                    };

                    var rsa = RSA.Create();
                    rsa.ImportParameters(rsaParameters);

                    var securityKey = new RsaSecurityKey(rsa)
                    {
                        KeyId = key.Kid
                    };

                    keys.Add(securityKey);
                }
            }

            // Cache the keys for 24 hours
            _cache.Set(CacheKey, keys, TimeSpan.FromHours(24));

            return keys;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch Apple public keys");
            return new List<SecurityKey>();
        }
    }

    private string? GetClientIdForPlatform(string platform)
    {
        return platform.ToLowerInvariant() switch
        {
            "web" => _configuration["OAuth:Apple:ServiceId"],
            "ios" => _configuration["OAuth:Apple:BundleId"],
            _ => _configuration["OAuth:Apple:ServiceId"]
        };
    }

    private static byte[] Base64UrlDecode(string input)
    {
        var output = input
            .Replace('-', '+')
            .Replace('_', '/');

        switch (output.Length % 4)
        {
            case 2: output += "=="; break;
            case 3: output += "="; break;
        }

        return Convert.FromBase64String(output);
    }

    // Classes for deserializing Apple's JWKS response
    private class AppleJwks
    {
        public List<AppleJwk>? Keys { get; set; }
    }

    private class AppleJwk
    {
        public string? Kty { get; set; }
        public string? Kid { get; set; }
        public string? Use { get; set; }
        public string? Alg { get; set; }
        public string N { get; set; } = string.Empty;
        public string E { get; set; } = string.Empty;
    }
}
