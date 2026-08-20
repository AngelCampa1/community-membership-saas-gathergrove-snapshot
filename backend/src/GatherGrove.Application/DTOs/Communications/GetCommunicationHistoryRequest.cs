using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs.Communications;

/// <summary>
/// Request DTO for getting communication history with pagination and filtering
/// </summary>
public class GetCommunicationHistoryRequest
{
    /// <summary>
    /// Page number for pagination (1-based)
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Page must be greater than 0")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// Number of items per page
    /// </summary>
    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// Filter by communication type (Email or Push)
    /// </summary>
    public string? CommunicationType { get; set; }

    /// <summary>
    /// Filter by date range - start date
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Filter by date range - end date
    /// </summary>
    public DateTime? EndDate { get; set; }
}
