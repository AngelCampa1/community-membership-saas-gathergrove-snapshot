using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for resetting a password with a valid token
/// </summary>
public class ResetPasswordRequest
{
    /// <summary>
    /// The password reset token received via email
    /// </summary>
    /// <example>abc123def456ghi789</example>
    [Required(ErrorMessage = "Token is required")]
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// The new password that meets security requirements
    /// </summary>
    /// <example>NewSecurePassword123!</example>
    [Required(ErrorMessage = "Password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters long")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]",
        ErrorMessage = "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character")]
    public string NewPassword { get; set; } = string.Empty;

    /// <summary>
    /// Confirmation of the new password (must match NewPassword)
    /// </summary>
    /// <example>NewSecurePassword123!</example>
    [Required(ErrorMessage = "Password confirmation is required")]
    [Compare(nameof(NewPassword), ErrorMessage = "Password and confirmation do not match")]
    public string ConfirmPassword { get; set; } = string.Empty;
}