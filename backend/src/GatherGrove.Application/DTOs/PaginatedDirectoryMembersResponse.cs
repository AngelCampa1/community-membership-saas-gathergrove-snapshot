namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response model for paginated member directory (Story 30)
/// </summary>
public class PaginatedDirectoryMembersResponse
{
    /// <summary>
    /// List of directory members for the current page
    /// </summary>
    public List<DirectoryMemberResponse> Members { get; set; } = new();

    /// <summary>
    /// Current page number (1-based)
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// Total number of members in the directory
    /// </summary>
    public int TotalMembers { get; set; }

    /// <summary>
    /// Number of members per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Whether there are more pages after the current one
    /// </summary>
    public bool HasNextPage { get; set; }

    /// <summary>
    /// Whether there are pages before the current one
    /// </summary>
    public bool HasPreviousPage { get; set; }
}