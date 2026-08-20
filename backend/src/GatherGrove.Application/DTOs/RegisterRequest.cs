using System.ComponentModel.DataAnnotations;
using GatherGrove.Application.Validation;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for user registration
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// User's full name
    /// </summary>
    /// <example>John Doe</example>
    [Required(ErrorMessage = "Full name is required")]
    [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// User's email address
    /// </summary>
    /// <example>john.doe@example.com</example>
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's password
    /// </summary>
    /// <example>SecurePassword123!</example>
    [Required(ErrorMessage = "Password is required")]
    [PasswordRequirement]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Name of the club to create
    /// </summary>
    /// <example>Mountain Hiking Club</example>
    [Required(ErrorMessage = "Club name is required")]
    [StringLength(100, ErrorMessage = "Club name cannot exceed 100 characters")]
    public string ClubName { get; set; } = string.Empty;
}