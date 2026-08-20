namespace GatherGrove.Application.DTOs;

/// <summary>
/// Result of searching for members within segments
/// </summary>
public class MemberSegmentSearchResult
{
    /// <summary>
    /// Search query that was executed
    /// </summary>
    public string SearchQuery { get; set; } = string.Empty;

    /// <summary>
    /// Total number of members found
    /// </summary>
    public int TotalResults { get; set; }

    /// <summary>
    /// Members found in the search
    /// </summary>
    public List<MemberSegmentMatch> Members { get; set; } = new();

    /// <summary>
    /// Segments where matches were found
    /// </summary>
    public List<SegmentSearchSummary> SegmentSummaries { get; set; } = new();

    /// <summary>
    /// Search filters that were applied
    /// </summary>
    public MemberSegmentSearchFilters AppliedFilters { get; set; } = new();

    /// <summary>
    /// Search performance metrics
    /// </summary>
    public SearchPerformanceMetrics Performance { get; set; } = new();

    /// <summary>
    /// Suggestions for refining the search
    /// </summary>
    public List<SearchSuggestion> SearchSuggestions { get; set; } = new();

    /// <summary>
    /// Faceted search results for filtering
    /// </summary>
    public SearchFacets Facets { get; set; } = new();

    /// <summary>
    /// Pagination information
    /// </summary>
    public SearchPagination Pagination { get; set; } = new();

    /// <summary>
    /// When the search was performed
    /// </summary>
    public DateTime SearchTimestamp { get; set; }

    /// <summary>
    /// Whether the search had any syntax errors
    /// </summary>
    public bool HasSyntaxErrors { get; set; }

    /// <summary>
    /// Search warnings or notices
    /// </summary>
    public List<string> Warnings { get; set; } = new();

    /// <summary>
    /// Total number of results found (alias for TotalResults)
    /// </summary>
    public int TotalCount => TotalResults;
}

/// <summary>
/// Member match in segment search results
/// </summary>
public class MemberSegmentMatch
{
    /// <summary>
    /// Member identifier
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member's full name
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Member's email address
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Member's phone number
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Member status
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Segments this member belongs to
    /// </summary>
    public List<MemberSegmentInfo> Segments { get; set; } = new();

    /// <summary>
    /// Match relevance score (0-1)
    /// </summary>
    public decimal RelevanceScore { get; set; }

    /// <summary>
    /// Highlighted search matches
    /// </summary>
    public Dictionary<string, List<string>> Highlights { get; set; } = new();

    /// <summary>
    /// Member engagement metrics
    /// </summary>
    public MemberEngagementSummary EngagementSummary { get; set; } = new();

    /// <summary>
    /// Member profile photo URL
    /// </summary>
    public string? ProfilePhotoUrl { get; set; }

    /// <summary>
    /// Location information
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// Join date
    /// </summary>
    public DateTime JoinDate { get; set; }

    /// <summary>
    /// Last activity date
    /// </summary>
    public DateTime? LastActivityDate { get; set; }

    /// <summary>
    /// Member tags
    /// </summary>
    public List<MemberTagInfo> Tags { get; set; } = new();

    /// <summary>
    /// Custom field values (limited set for search results)
    /// </summary>
    public Dictionary<string, object> CustomFields { get; set; } = new();
}

/// <summary>
/// Member's segment information
/// </summary>
public class MemberSegmentInfo
{
    /// <summary>
    /// Segment identifier
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// When member joined this segment
    /// </summary>
    public DateTime JoinDate { get; set; }

    /// <summary>
    /// Whether this segment matched the search criteria
    /// </summary>
    public bool IsMatchingSegment { get; set; }

    /// <summary>
    /// Segment color for UI display
    /// </summary>
    public string? SegmentColor { get; set; }
}

/// <summary>
/// Summary of search results for a specific segment
/// </summary>
public class SegmentSearchSummary
{
    /// <summary>
    /// Segment identifier
    /// </summary>
    public int SegmentId { get; set; }

    /// <summary>
    /// Segment name
    /// </summary>
    public string SegmentName { get; set; } = string.Empty;

    /// <summary>
    /// Number of matches in this segment
    /// </summary>
    public int MatchCount { get; set; }

    /// <summary>
    /// Total members in this segment
    /// </summary>
    public int TotalMembersInSegment { get; set; }

    /// <summary>
    /// Match percentage
    /// </summary>
    public decimal MatchPercentage { get; set; }

    /// <summary>
    /// Average relevance score for matches in this segment
    /// </summary>
    public decimal AverageRelevanceScore { get; set; }

    /// <summary>
    /// Top matching criteria in this segment
    /// </summary>
    public List<string> TopMatchingCriteria { get; set; } = new();
}

/// <summary>
/// Search filters applied to member segment search
/// </summary>
public class MemberSegmentSearchFilters
{
    /// <summary>
    /// Specific segment IDs to search within
    /// </summary>
    public List<int>? SegmentIds { get; set; }

    /// <summary>
    /// Member status filters
    /// </summary>
    public List<string>? StatusFilters { get; set; }

    /// <summary>
    /// Engagement score range
    /// </summary>
    public EngagementScoreRange? EngagementRange { get; set; }

    /// <summary>
    /// Join date range
    /// </summary>
    public DateRange? JoinDateRange { get; set; }

    /// <summary>
    /// Last activity date range
    /// </summary>
    public DateRange? LastActivityRange { get; set; }

    /// <summary>
    /// Tag filters
    /// </summary>
    public List<int>? TagIds { get; set; }

    /// <summary>
    /// Location filters
    /// </summary>
    public List<string>? Locations { get; set; }

    /// <summary>
    /// Custom field filters
    /// </summary>
    public Dictionary<string, object>? CustomFieldFilters { get; set; }

    /// <summary>
    /// Membership type filters
    /// </summary>
    public List<string>? MembershipTypes { get; set; }

    /// <summary>
    /// Include inactive members
    /// </summary>
    public bool IncludeInactive { get; set; } = false;
}

/// <summary>
/// Search performance metrics
/// </summary>
public class SearchPerformanceMetrics
{
    /// <summary>
    /// Query execution time in milliseconds
    /// </summary>
    public int ExecutionTimeMs { get; set; }

    /// <summary>
    /// Number of segments searched
    /// </summary>
    public int SegmentsSearched { get; set; }

    /// <summary>
    /// Total members examined
    /// </summary>
    public int MembersExamined { get; set; }

    /// <summary>
    /// Index usage statistics
    /// </summary>
    public Dictionary<string, int> IndexUsage { get; set; } = new();

    /// <summary>
    /// Cache hit information
    /// </summary>
    public CacheHitInfo CacheInfo { get; set; } = new();
}

/// <summary>
/// Search suggestion for query refinement
/// </summary>
public class SearchSuggestion
{
    /// <summary>
    /// Suggestion type
    /// </summary>
    public SearchSuggestionType Type { get; set; }

    /// <summary>
    /// Suggested query or filter
    /// </summary>
    public string Suggestion { get; set; } = string.Empty;

    /// <summary>
    /// Description of what this suggestion does
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Expected result count improvement
    /// </summary>
    public int? ExpectedResultCount { get; set; }
}

/// <summary>
/// Faceted search results for filtering options
/// </summary>
public class SearchFacets
{
    /// <summary>
    /// Status facets with counts
    /// </summary>
    public Dictionary<string, int> StatusFacets { get; set; } = new();

    /// <summary>
    /// Segment facets with counts
    /// </summary>
    public Dictionary<string, int> SegmentFacets { get; set; } = new();

    /// <summary>
    /// Tag facets with counts
    /// </summary>
    public Dictionary<string, int> TagFacets { get; set; } = new();

    /// <summary>
    /// Location facets with counts
    /// </summary>
    public Dictionary<string, int> LocationFacets { get; set; } = new();

    /// <summary>
    /// Membership type facets with counts
    /// </summary>
    public Dictionary<string, int> MembershipTypeFacets { get; set; } = new();

    /// <summary>
    /// Engagement score ranges with counts
    /// </summary>
    public Dictionary<string, int> EngagementRangeFacets { get; set; } = new();
}

/// <summary>
/// Pagination information for search results
/// </summary>
public class SearchPagination
{
    /// <summary>
    /// Current page number (1-based)
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// Page size
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// Whether there's a next page
    /// </summary>
    public bool HasNext { get; set; }

    /// <summary>
    /// Whether there's a previous page
    /// </summary>
    public bool HasPrevious { get; set; }
}

// MemberEngagementSummary class already exists elsewhere - using existing definition

/// <summary>
/// Cache hit information for search performance
/// </summary>
public class CacheHitInfo
{
    /// <summary>
    /// Number of cache hits
    /// </summary>
    public int CacheHits { get; set; }

    /// <summary>
    /// Number of cache misses
    /// </summary>
    public int CacheMisses { get; set; }

    /// <summary>
    /// Cache hit rate percentage
    /// </summary>
    public decimal CacheHitRate { get; set; }
}

/// <summary>
/// Search suggestion types
/// </summary>
public enum SearchSuggestionType
{
    /// <summary>
    /// Query refinement suggestion
    /// </summary>
    QueryRefinement,

    /// <summary>
    /// Filter addition suggestion
    /// </summary>
    FilterAddition,

    /// <summary>
    /// Search scope expansion
    /// </summary>
    ScopeExpansion,

    /// <summary>
    /// Alternative search terms
    /// </summary>
    AlternativeTerms,

    /// <summary>
    /// Spelling correction
    /// </summary>
    SpellingCorrection
}