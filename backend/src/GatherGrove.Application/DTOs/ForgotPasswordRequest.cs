using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for forgot password functionality
/// </summary>
public class ForgotPasswordRequest
{
    /// <summary>
    /// The email address of the user requesting a password reset
    /// </summary>
    /// <example>admin@gathergrove.club</example>
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    public string Email { get; set; } = string.Empty;
}