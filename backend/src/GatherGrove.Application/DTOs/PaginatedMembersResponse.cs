namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response containing paginated member data with search and pagination metadata
/// </summary>
public class PaginatedMembersResponse
{
    /// <summary>
    /// List of members for the current page
    /// </summary>
    public List<MemberResponse> Members { get; set; } = new();

    /// <summary>
    /// Current page number (1-based)
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of members matching the search criteria
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// Whether there is a previous page
    /// </summary>
    public bool HasPrevious { get; set; }

    /// <summary>
    /// Whether there is a next page
    /// </summary>
    public bool HasNext { get; set; }

    /// <summary>
    /// Search term that was applied (if any)
    /// </summary>
    public string? Search { get; set; }
}