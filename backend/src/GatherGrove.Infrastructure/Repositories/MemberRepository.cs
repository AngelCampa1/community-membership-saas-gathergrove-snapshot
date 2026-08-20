using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MemberEntity = GatherGrove.Domain.Entities.Member;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for member data access
/// </summary>
public class MemberRepository : IMemberRepository
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<MemberRepository> _logger;

    public MemberRepository(GatherGroveDbContext context, ILogger<MemberRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<MemberEntity>> GetMembersByClubIdAsync(int clubId, DateTime? dateFrom, DateTime? dateTo)
    {
        _logger.LogInformation("Getting members for club {ClubId} from {DateFrom} to {DateTo}", clubId, dateFrom, dateTo);

        var query = _context.Members
            .Include(m => m.MembershipType)
            .Include(m => m.ClubLocation)
            .Where(m => m.ClubId == clubId);

        // Apply date filtering if provided
        if (dateFrom.HasValue)
        {
            query = query.Where(m => m.JoinDate >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(m => m.JoinDate <= dateTo.Value);
        }

        return await query
            .OrderBy(m => m.FullName)
            .ToListAsync();
    }

    public async Task<List<MemberEntity>> GetMembersWithCustomFieldsAsync(int clubId, List<int> customFieldIds)
    {
        _logger.LogInformation("Getting members with custom fields for club {ClubId}", clubId);

        var query = _context.Members
            .Include(m => m.MembershipType)
            .Include(m => m.ClubLocation)
            .Include(m => m.CustomFieldValues)
                .ThenInclude(cfv => cfv.CustomField)
            .Where(m => m.ClubId == clubId);

        // Filter by custom field IDs if provided
        if (customFieldIds != null && customFieldIds.Any())
        {
            query = query.Where(m => m.CustomFieldValues
                .Any(cfv => customFieldIds.Contains(cfv.CustomFieldId)));
        }

        return await query
            .OrderBy(m => m.FullName)
            .ToListAsync();
    }

    public async Task<List<MemberEntity>> GetMembersWithAttendanceAsync(int clubId)
    {
        _logger.LogInformation("Getting members with attendance for club {ClubId}", clubId);

        return await _context.Members
            .Include(m => m.MembershipType)
            .Include(m => m.ClubLocation)
            .Include(m => m.EventAttendances)
                .ThenInclude(a => a.Event)
            .Include(m => m.EventRsvps)
                .ThenInclude(r => r.Event)
            .Where(m => m.ClubId == clubId)
            .OrderBy(m => m.FullName)
            .ToListAsync();
    }

    public async Task<List<MemberEntity>> GetFilteredMembersAsync(
        int clubId,
        DateTime? dateFrom,
        DateTime? dateTo,
        string? membershipTypeFilter,
        string? statusFilter,
        bool includeCustomFields,
        List<int> customFieldIds,
        bool includeAttendanceStats)
    {
        _logger.LogInformation("Getting filtered members for club {ClubId}", clubId);

        var query = _context.Members
            .Include(m => m.MembershipType)
            .Include(m => m.ClubLocation)
            .Where(m => m.ClubId == clubId);

        // Apply date filters if specified
        if (dateFrom.HasValue)
        {
            query = query.Where(m => m.JoinDate >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(m => m.JoinDate <= dateTo.Value);
        }

        // Apply membership type filter if specified
        if (!string.IsNullOrEmpty(membershipTypeFilter))
        {
            query = query.Where(m => m.MembershipType.Name == membershipTypeFilter);
        }

        // Apply status filter if specified
        if (!string.IsNullOrEmpty(statusFilter))
        {
            query = query.Where(m => m.Status == statusFilter);
        }

        // Include custom fields if requested
        if (includeCustomFields && customFieldIds.Any())
        {
            query = query.Include(m => m.CustomFieldValues)
                .ThenInclude(cfv => cfv.CustomField);
        }

        // Include attendance data if requested
        if (includeAttendanceStats)
        {
            query = query.Include(m => m.EventAttendances)
                .ThenInclude(a => a.Event)
                .Include(m => m.EventRsvps)
                .ThenInclude(r => r.Event);
        }

        return await query
            .OrderBy(m => m.FullName)
            .ToListAsync();
    }

    public async Task<dynamic> GetMemberStatisticsAsync(int clubId)
    {
        _logger.LogInformation("Getting member statistics for club {ClubId}", clubId);

        var allMembers = await _context.Members
            .Where(m => m.ClubId == clubId)
            .ToListAsync();

        var currentDate = DateTime.UtcNow;
        var firstDayOfMonth = new DateTime(currentDate.Year, currentDate.Month, 1);

        var totalMembers = allMembers.Count;
        var activeMembers = allMembers.Count(m => m.Status == "Active");
        var inactiveMembers = allMembers.Count(m => m.Status == "Inactive");
        var suspendedMembers = allMembers.Count(m => m.Status == "Suspended");
        var newMembersThisMonth = allMembers.Count(m => m.JoinDate >= firstDayOfMonth);
        var membersWithDuesPaid = allMembers.Count(m => m.DuesPaidUntil.HasValue && m.DuesPaidUntil.Value >= currentDate);
        var membersWithDuesOverdue = allMembers.Count(m => !m.DuesPaidUntil.HasValue || m.DuesPaidUntil.Value < currentDate);

        return await Task.FromResult(new
        {
            TotalMembers = totalMembers,
            ActiveMembers = activeMembers,
            InactiveMembers = inactiveMembers,
            SuspendedMembers = suspendedMembers,
            NewMembersThisMonth = newMembersThisMonth,
            MembersWithDuesPaid = membersWithDuesPaid,
            MembersWithDuesOverdue = membersWithDuesOverdue,
            AverageMembershipDurationDays = totalMembers > 0
                ? allMembers.Average(m => (currentDate - m.JoinDate).TotalDays)
                : 0
        });
    }
}
