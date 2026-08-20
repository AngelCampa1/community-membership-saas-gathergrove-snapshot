using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request DTO for admin to request payment from a member
/// </summary>
public class RequestPaymentRequest
{
    /// <summary>
    /// The amount to request from the member
    /// </summary>
    [Required(ErrorMessage = "Amount is required")]
    [Range(0.01, 99999.99, ErrorMessage = "Amount must be between $0.01 and $99,999.99")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Description of what the payment is for (e.g., "Monthly dues for January 2025")
    /// </summary>
    [Required(ErrorMessage = "Description is required")]
    [StringLength(500, ErrorMessage = "Description must be 500 characters or less")]
    public string Description { get; set; } = string.Empty;
}