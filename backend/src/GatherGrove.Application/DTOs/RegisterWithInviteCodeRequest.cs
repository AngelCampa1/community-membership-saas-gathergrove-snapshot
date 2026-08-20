using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

public class RegisterWithInviteCodeRequest
{
    [Required]
    [StringLength(50)]
    public string InviteCode { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    [StringLength(20)]
    public string? PhoneNumber { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    public bool HasSmsConsent { get; set; } = false;
}