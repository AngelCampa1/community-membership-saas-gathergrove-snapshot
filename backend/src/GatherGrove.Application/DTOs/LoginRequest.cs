using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for user login
/// </summary>
public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;

    // Analytics tracking fields
    public string Platform { get; set; } = "web";
    public string? DeviceType { get; set; }
    public string? SessionId { get; set; }
}