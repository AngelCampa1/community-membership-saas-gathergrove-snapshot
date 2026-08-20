using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services;

/// <summary>
/// Result of validating an OAuth ID token
/// </summary>
public class TokenValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string ProviderUserId { get; set; } = string.Empty;
    public string? Email { get; set; }
    public bool EmailVerified { get; set; }
    public string? FullName { get; set; }
    public string? GivenName { get; set; }
    public string? FamilyName { get; set; }
    public string? Picture { get; set; }
    public bool IsPrivateEmail { get; set; }

    public static TokenValidationResult Failed(string message) => new()
    {
        IsValid = false,
        ErrorMessage = message
    };
}

/// <summary>
/// Interface for Google OAuth token validation
/// </summary>
public interface IGoogleTokenValidator
{
    /// <summary>
    /// Validates a Google ID token
    /// </summary>
    /// <param name="idToken">The ID token from Google Sign-In</param>
    /// <param name="platform">Platform the token was obtained from (web, ios, android)</param>
    /// <returns>Token validation result with user claims</returns>
    Task<TokenValidationResult> ValidateAsync(string idToken, string platform = "web");
}

/// <summary>
/// Interface for Apple OAuth token validation
/// </summary>
public interface IAppleTokenValidator
{
    /// <summary>
    /// Validates an Apple ID token
    /// </summary>
    /// <param name="idToken">The ID token from Apple Sign-In</param>
    /// <param name="platform">Platform the token was obtained from (web, ios)</param>
    /// <param name="expectedNonce">Optional nonce to validate against the token's nonce claim (for replay protection)</param>
    /// <returns>Token validation result with user claims</returns>
    Task<TokenValidationResult> ValidateAsync(string idToken, string platform = "web", string? expectedNonce = null);
}

/// <summary>
/// Result of external authentication attempt
/// </summary>
public class ExternalAuthResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public User? User { get; set; }
    public bool IsNewUser { get; set; }
    public bool WasLinkedToExisting { get; set; }
    public string? Token { get; set; }
}

/// <summary>
/// Interface for external authentication service (Google, Apple SSO)
/// </summary>
public interface IExternalAuthService
{
    /// <summary>
    /// Authenticates a user with Google SSO
    /// </summary>
    /// <param name="idToken">Google ID token</param>
    /// <param name="platform">Platform (web, ios, android)</param>
    /// <param name="fullName">Optional full name (for new user registration)</param>
    /// <returns>Authentication result</returns>
    Task<ExternalAuthResult> AuthenticateWithGoogleAsync(string idToken, string platform = "web", string? fullName = null);

    /// <summary>
    /// Authenticates a user with Apple SSO
    /// </summary>
    /// <param name="idToken">Apple ID token</param>
    /// <param name="platform">Platform (web, ios)</param>
    /// <param name="fullName">Optional full name (Apple only provides on first sign-in)</param>
    /// <param name="nonce">Optional nonce for replay attack protection</param>
    /// <returns>Authentication result</returns>
    Task<ExternalAuthResult> AuthenticateWithAppleAsync(string idToken, string platform = "web", string? fullName = null, string? nonce = null);

    /// <summary>
    /// Links an external provider to an existing user account
    /// </summary>
    /// <param name="userId">User ID to link to</param>
    /// <param name="provider">Provider name (Google or Apple)</param>
    /// <param name="idToken">ID token from the provider</param>
    /// <param name="platform">Platform (web, ios, android)</param>
    /// <returns>True if linking was successful</returns>
    Task<bool> LinkProviderAsync(int userId, string provider, string idToken, string platform = "web");

    /// <summary>
    /// Unlinks an external provider from a user account
    /// </summary>
    /// <param name="userId">User ID to unlink from</param>
    /// <param name="provider">Provider name to unlink</param>
    /// <returns>True if unlinking was successful, false if it would leave user without auth method</returns>
    Task<(bool Success, string? ErrorMessage)> UnlinkProviderAsync(int userId, string provider);

    /// <summary>
    /// Gets the linked providers for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>List of linked provider information</returns>
    Task<LinkedProvidersInfo> GetLinkedProvidersAsync(int userId);

    /// <summary>
    /// Sets a password for a user who only has SSO authentication
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="newPassword">New password to set</param>
    /// <returns>True if successful</returns>
    Task<bool> SetPasswordAsync(int userId, string newPassword);
}

/// <summary>
/// Information about linked external auth providers
/// </summary>
public class LinkedProvidersInfo
{
    public bool HasPassword { get; set; }
    public bool GoogleLinked { get; set; }
    public DateTime? GoogleLinkedAt { get; set; }
    public bool AppleLinked { get; set; }
    public DateTime? AppleLinkedAt { get; set; }
}
