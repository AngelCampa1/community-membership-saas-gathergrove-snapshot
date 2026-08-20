using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for updating user profile information
/// </summary>
public class UpdateProfileRequest
{
    /// <summary>
    /// The user's updated full name
    /// </summary>
    /// <example>Brenda J. Smith</example>
    [Required(ErrorMessage = "Full name is required")]
    [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
    public string FullName { get; set; } = string.Empty;
}