using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request model for creating a new event
/// </summary>
public class CreateEventRequest
{
    /// <summary>
    /// The name of the event
    /// </summary>
    /// <example>Annual Plant Sale</example>
    [Required(ErrorMessage = "Event name is required")]
    [StringLength(200, ErrorMessage = "Event name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The date and time when the event takes place
    /// </summary>
    /// <example>2025-07-15T10:00:00</example>
    [Required(ErrorMessage = "Event date and time is required")]
    public DateTime EventDateTime { get; set; }

    /// <summary>
    /// The location where the event takes place
    /// </summary>
    /// <example>Town Hall Park</example>
    [Required(ErrorMessage = "Event location is required")]
    [StringLength(500, ErrorMessage = "Location cannot exceed 500 characters")]
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// The description of the event (can contain HTML)
    /// </summary>
    /// <example>&lt;p&gt;Our biggest sale of the year!&lt;/p&gt;</example>
    [StringLength(5000, ErrorMessage = "Description cannot exceed 5000 characters")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Price for club members (null if no specific member pricing)
    /// </summary>
    /// <example>15.99</example>
    [Range(0, 10000, ErrorMessage = "Member price must be between 0 and 10,000")]
    public decimal? MemberPrice { get; set; }

    /// <summary>
    /// Price for non-members (null if no specific non-member pricing)
    /// </summary>
    /// <example>25.99</example>
    [Range(0, 10000, ErrorMessage = "Non-member price must be between 0 and 10,000")]
    public decimal? NonMemberPrice { get; set; }

    /// <summary>
    /// Indicates if the event is free of charge
    /// </summary>
    /// <example>false</example>
    public bool IsFree { get; set; }
}