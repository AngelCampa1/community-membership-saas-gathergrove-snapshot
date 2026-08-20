using MemberEntity = GatherGrove.Domain.Entities.Member;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository interface for member data access
/// </summary>
public interface IMemberRepository
{
    /// <summary>
    /// Gets members by club ID with optional date filtering
    /// </summary>
    Task<List<MemberEntity>> GetMembersByClubIdAsync(int clubId, DateTime? dateFrom, DateTime? dateTo);

    /// <summary>
    /// Gets members with custom field values
    /// </summary>
    Task<List<MemberEntity>> GetMembersWithCustomFieldsAsync(int clubId, List<int> customFieldIds);

    /// <summary>
    /// Gets members with attendance and RSVP data included
    /// </summary>
    Task<List<MemberEntity>> GetMembersWithAttendanceAsync(int clubId);

    /// <summary>
    /// Gets filtered members with complex filtering options
    /// Parameters passed individually to avoid Application layer DTO dependency
    /// </summary>
    Task<List<MemberEntity>> GetFilteredMembersAsync(
        int clubId,
        DateTime? dateFrom,
        DateTime? dateTo,
        string? membershipTypeFilter,
        string? statusFilter,
        bool includeCustomFields,
        List<int> customFieldIds,
        bool includeAttendanceStats);

    /// <summary>
    /// Gets member statistics as anonymous object
    /// Returns dynamic to avoid Application layer DTO dependency
    /// </summary>
    Task<dynamic> GetMemberStatisticsAsync(int clubId);
}
