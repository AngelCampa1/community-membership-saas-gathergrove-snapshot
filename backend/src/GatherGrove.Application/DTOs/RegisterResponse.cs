namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response DTO for successful user registration
/// </summary>
public class RegisterResponse
{
    /// <summary>
    /// JWT authentication token
    /// </summary>
    /// <example>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</example>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// User information
    /// </summary>
    public UserInfoDto User { get; set; } = new();

    /// <summary>
    /// Club information
    /// </summary>
    public ClubInfoDto Club { get; set; } = new();
}

/// <summary>
/// User information DTO
/// </summary>
public class UserInfoDto
{
    /// <summary>
    /// User's ID
    /// </summary>
    /// <example>123</example>
    public int Id { get; set; }

    /// <summary>
    /// User's full name
    /// </summary>
    /// <example>John Doe</example>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// User's email address
    /// </summary>
    /// <example>john.doe@example.com</example>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Whether user has completed onboarding
    /// </summary>
    /// <example>false</example>
    public bool OnboardingCompleted { get; set; }
}

/// <summary>
/// Club information DTO
/// </summary>
public class ClubInfoDto
{
    /// <summary>
    /// Club's ID
    /// </summary>
    /// <example>456</example>
    public int Id { get; set; }

    /// <summary>
    /// Club's name
    /// </summary>
    /// <example>Mountain Hiking Club</example>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Club's current tier (Sprout or Grow)
    /// </summary>
    /// <example>Sprout</example>
    public string Tier { get; set; } = string.Empty;
}