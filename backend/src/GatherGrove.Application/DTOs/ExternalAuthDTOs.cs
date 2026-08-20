using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for external authentication (Google/Apple SSO)
/// </summary>
public class ExternalAuthRequest
{
    /// <summary>
    /// The ID token from the OAuth provider
    /// </summary>
    [Required]
    public string IdToken { get; set; } = string.Empty;

    /// <summary>
    /// Platform the token was obtained from (web, ios, android)
    /// </summary>
    public string Platform { get; set; } = "web";

    /// <summary>
    /// Optional full name for new user registration
    /// (Apple only provides name on first sign-in)
    /// </summary>
    public string? FullName { get; set; }

    /// <summary>
    /// Nonce for Apple Sign-In replay attack protection
    /// Must match the nonce claim in the ID token
    /// </summary>
    public string? Nonce { get; set; }
}

/// <summary>
/// Response from external authentication
/// </summary>
public class ExternalAuthResponse
{
    /// <summary>
    /// Whether the authentication was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Error message if authentication failed
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// User's ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// User's full name
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// User's email
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's club ID (if admin)
    /// </summary>
    public int ClubId { get; set; }

    /// <summary>
    /// User's role (Admin or Member)
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Club's subscription tier
    /// </summary>
    public string ClubTier { get; set; } = string.Empty;

    /// <summary>
    /// Whether the user has completed onboarding
    /// </summary>
    public bool IsOnboardingCompleted { get; set; }

    /// <summary>
    /// Whether this is a newly created user
    /// </summary>
    public bool IsNewUser { get; set; }

    /// <summary>
    /// Whether the SSO account was linked to an existing user
    /// </summary>
    public bool WasLinked { get; set; }

    /// <summary>
    /// JWT token (for mobile clients)
    /// </summary>
    public string? Token { get; set; }
}

/// <summary>
/// Request to link an external provider to an existing account
/// </summary>
public class LinkProviderRequest
{
    /// <summary>
    /// Provider to link (Google or Apple)
    /// </summary>
    [Required]
    public string Provider { get; set; } = string.Empty;

    /// <summary>
    /// ID token from the provider
    /// </summary>
    [Required]
    public string IdToken { get; set; } = string.Empty;

    /// <summary>
    /// Platform the token was obtained from
    /// </summary>
    public string Platform { get; set; } = "web";
}

/// <summary>
/// Response containing linked provider information
/// </summary>
public class LinkedProvidersResponse
{
    /// <summary>
    /// Whether the user has a password set
    /// </summary>
    public bool HasPassword { get; set; }

    /// <summary>
    /// Whether Google is linked
    /// </summary>
    public bool GoogleLinked { get; set; }

    /// <summary>
    /// When Google was linked
    /// </summary>
    public DateTime? GoogleLinkedAt { get; set; }

    /// <summary>
    /// Whether Apple is linked
    /// </summary>
    public bool AppleLinked { get; set; }

    /// <summary>
    /// When Apple was linked
    /// </summary>
    public DateTime? AppleLinkedAt { get; set; }
}

/// <summary>
/// Request to set a password for an SSO-only account
/// </summary>
public class SetPasswordRequest
{
    /// <summary>
    /// The new password to set
    /// </summary>
    [Required]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    public string NewPassword { get; set; } = string.Empty;
}
