namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for successful user login
/// </summary>
public class LoginResponse
{
    /// <summary>
    /// Unique identifier for the logged-in user
    /// </summary>
    /// <example>1</example>
    public int UserId { get; set; }

    /// <summary>
    /// User's full name
    /// </summary>
    /// <example>John Doe</example>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// User's email address
    /// </summary>
    /// <example>admin@example.com</example>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// ID of the club that the user belongs to
    /// </summary>
    /// <example>1</example>
    public int ClubId { get; set; }

    /// <summary>
    /// Role of the user (Admin or Member)
    /// </summary>
    /// <example>Admin</example>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Subscription tier of the user's club (Sprout or Grow)
    /// </summary>
    /// <example>Sprout</example>
    public string ClubTier { get; set; } = string.Empty;

    /// <summary>
    /// Whether the user has completed the onboarding process
    /// </summary>
    /// <example>true</example>
    public bool IsOnboardingCompleted { get; set; }

    /// <summary>
    /// Success message for the login operation
    /// </summary>
    /// <example>Login successful! Welcome back.</example>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// JWT token for mobile authentication (only included for mobile clients)
    /// </summary>
    /// <example>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</example>
    public string? Token { get; set; }
}