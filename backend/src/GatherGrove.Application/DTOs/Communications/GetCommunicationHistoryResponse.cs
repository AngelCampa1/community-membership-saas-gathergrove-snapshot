namespace GatherGrove.Application.DTOs.Communications;

/// <summary>
/// Response DTO for paginated communication history
/// </summary>
public class GetCommunicationHistoryResponse
{
    /// <summary>
    /// List of communication history entries
    /// </summary>
    public List<CommunicationHistoryResponse> Communications { get; set; } = new();

    /// <summary>
    /// Total number of communications matching the filter criteria
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Current page number
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// Whether there are more pages after this one
    /// </summary>
    public bool HasNextPage { get; set; }

    /// <summary>
    /// Whether there are pages before this one
    /// </summary>
    public bool HasPreviousPage { get; set; }
}