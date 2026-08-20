using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for changing user password
/// </summary>
public class ChangePasswordRequest
{
    /// <summary>
    /// The user's current password for verification
    /// </summary>
    /// <example>currentPassword123!</example>
    [Required(ErrorMessage = "Current password is required")]
    public string CurrentPassword { get; set; } = string.Empty;

    /// <summary>
    /// The new password the user wants to set
    /// </summary>
    /// <example>newPassword456@</example>
    [Required(ErrorMessage = "New password is required")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 100 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$",
        ErrorMessage = "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character")]
    public string NewPassword { get; set; } = string.Empty;
}