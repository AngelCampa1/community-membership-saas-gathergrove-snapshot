using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for activating a member account
/// </summary>
public class ActivateMemberAccountRequest
{
    /// <summary>
    /// The unique activation token from the email link
    /// </summary>
    [Required(ErrorMessage = "Activation token is required")]
    public string ActivationToken { get; set; } = string.Empty;

    /// <summary>
    /// The new password for the member account
    /// </summary>
    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 100 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$",
        ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")]
    public string NewPassword { get; set; } = string.Empty;
}