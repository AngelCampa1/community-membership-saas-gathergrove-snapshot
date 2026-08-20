using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for updating an existing membership type
/// </summary>
public class UpdateMembershipTypeRequest
{
    /// <summary>
    /// Name of the membership type (e.g., "Individual", "Family", "Student")
    /// </summary>
    /// <example>Individual</example>
    [Required(ErrorMessage = "Membership type name is required")]
    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the membership type
    /// </summary>
    /// <example>Standard individual membership with full benefits</example>
    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Dues amount for this membership type
    /// </summary>
    /// <example>25.00</example>
    [Required(ErrorMessage = "Dues amount is required")]
    [Range(0, 9999.99, ErrorMessage = "Dues amount must be between 0 and 9999.99")]
    public decimal DuesAmount { get; set; }

    /// <summary>
    /// How often dues are collected (Weekly, Biweekly, Monthly, Quarterly, Semiannually, Annually, Biennially, OneTime)
    /// </summary>
    /// <example>Monthly</example>
    [Required(ErrorMessage = "Dues frequency is required")]
    [RegularExpression("^(Weekly|Biweekly|Monthly|Quarterly|Semiannually|Annually|Biennially|OneTime)$",
        ErrorMessage = "Dues frequency must be Weekly, Biweekly, Monthly, Quarterly, Semiannually, Annually, Biennially, or OneTime")]
    public string DuesFrequency { get; set; } = "Monthly";
}