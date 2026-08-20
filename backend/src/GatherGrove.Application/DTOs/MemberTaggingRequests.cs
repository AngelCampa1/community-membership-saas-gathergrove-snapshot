using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.DTOs;

/// <summary>
/// Request for creating a new member tag
/// </summary>
public class CreateTagRequest
{
    /// <summary>
    /// The club this tag belongs to
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// Name of the tag
    /// </summary>
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the tag
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Color for the tag in hex format (e.g., #007bff)
    /// </summary>
    [Required]
    [StringLength(7, MinimumLength = 7)]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color code")]
    public string Color { get; set; } = "#007bff";

    /// <summary>
    /// Whether the tag is visible in the UI
    /// </summary>
    public bool IsVisible { get; set; } = true;

    /// <summary>
    /// Display order for sorting tags
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    /// <summary>
    /// User creating this tag
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }
}

/// <summary>
/// Request for updating an existing tag
/// </summary>
public class UpdateTagRequest
{
    /// <summary>
    /// ID of the tag to update
    /// </summary>
    [Required]
    public int TagId { get; set; }

    /// <summary>
    /// Updated name of the tag
    /// </summary>
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Updated description of the tag
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Updated color for the tag
    /// </summary>
    [Required]
    [StringLength(7, MinimumLength = 7)]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color code")]
    public string Color { get; set; } = "#007bff";

    /// <summary>
    /// Updated visibility flag
    /// </summary>
    public bool IsVisible { get; set; } = true;

    /// <summary>
    /// Updated display order
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    /// <summary>
    /// User updating this tag
    /// </summary>
    [Required]
    public int UpdatedByUserId { get; set; }
}

/// <summary>
/// Request for assigning a tag to a member
/// </summary>
public class AssignTagRequest
{
    /// <summary>
    /// ID of the member to assign the tag to
    /// </summary>
    [Required]
    public int MemberId { get; set; }

    /// <summary>
    /// ID of the tag to assign
    /// </summary>
    [Required]
    public int TagId { get; set; }

    /// <summary>
    /// User assigning the tag
    /// </summary>
    [Required]
    public int AssignedByUserId { get; set; }

    /// <summary>
    /// Optional notes about the assignment
    /// </summary>
    [StringLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// Request for searching members by tags
/// </summary>
public class SearchMembersByTagsRequest
{
    /// <summary>
    /// Club to search within
    /// </summary>
    [Required]
    public int ClubId { get; set; }

    /// <summary>
    /// List of tag IDs to search for
    /// </summary>
    [Required]
    public List<int> TagIds { get; set; } = new();

    /// <summary>
    /// How to match the tags (Any or All)
    /// </summary>
    public TagMatchType MatchType { get; set; } = TagMatchType.Any;

    /// <summary>
    /// Include inactive members in search
    /// </summary>
    public bool IncludeInactiveMembers { get; set; } = false;

    /// <summary>
    /// Page number for pagination
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// Number of results per page
    /// </summary>
    [Range(1, 100)]
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Enum for tag matching types
/// </summary>
public enum TagMatchType
{
    /// <summary>
    /// Member must have at least one of the specified tags
    /// </summary>
    Any = 0,

    /// <summary>
    /// Member must have all of the specified tags
    /// </summary>
    All = 1
}