using Microsoft.EntityFrameworkCore;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for membership type operations
/// </summary>
public class MembershipTypeService : IMembershipTypeService
{
    private readonly GatherGroveDbContext _context;

    public MembershipTypeService(GatherGroveDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Creates a new membership type for a club
    /// </summary>
    public async Task<MembershipTypeResponse> CreateMembershipTypeAsync(int clubId, CreateMembershipTypeRequest request)
    {
        // Check if club exists
        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException($"Club with ID {clubId} not found", nameof(clubId));
        }

        // Check if membership type name already exists in this club
        var existingType = await _context.MembershipTypes
            .FirstOrDefaultAsync(mt => mt.ClubId == clubId && mt.Name == request.Name);

        if (existingType != null)
        {
            throw new ArgumentException($"A membership type with the name '{request.Name}' already exists in this club");
        }

        var now = DateTime.UtcNow;
        var membershipType = new MembershipType
        {
            ClubId = clubId,
            Name = request.Name,
            Description = request.Description,
            DuesAmount = request.DuesAmount,
            DuesFrequency = request.DuesFrequency,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        return new MembershipTypeResponse
        {
            Id = membershipType.Id,
            ClubId = membershipType.ClubId,
            Name = membershipType.Name,
            Description = membershipType.Description,
            DuesAmount = membershipType.DuesAmount,
            DuesFrequency = membershipType.DuesFrequency,
            IsActive = membershipType.IsActive,
            CreatedAt = membershipType.CreatedAt,
            UpdatedAt = membershipType.UpdatedAt,
            MemberCount = 0 // New membership type has no members
        };
    }

    /// <summary>
    /// Gets all membership types for a club
    /// </summary>
    public async Task<List<MembershipTypeResponse>> GetMembershipTypesByClubAsync(int clubId)
    {
        var membershipTypes = await _context.MembershipTypes
            .Where(mt => mt.ClubId == clubId)
            .OrderBy(mt => mt.Name)
            .AsNoTracking()
            .ToListAsync();

        // Get member counts for each membership type
        var membershipTypeIds = membershipTypes.Select(mt => mt.Id).ToList();
        var memberCounts = await _context.Members
            .Where(m => membershipTypeIds.Contains(m.MembershipTypeId) && m.Status == "Active")
            .GroupBy(m => m.MembershipTypeId)
            .Select(g => new { MembershipTypeId = g.Key, Count = g.Count() })
            .AsNoTracking()
            .ToListAsync();

        var memberCountDict = memberCounts.ToDictionary(mc => mc.MembershipTypeId, mc => mc.Count);

        return membershipTypes.Select(mt => new MembershipTypeResponse
        {
            Id = mt.Id,
            ClubId = mt.ClubId,
            Name = mt.Name,
            Description = mt.Description,
            DuesAmount = mt.DuesAmount,
            DuesFrequency = mt.DuesFrequency,
            IsActive = mt.IsActive,
            CreatedAt = mt.CreatedAt,
            UpdatedAt = mt.UpdatedAt,
            MemberCount = memberCountDict.GetValueOrDefault(mt.Id, 0)
        }).ToList();
    }

    /// <summary>
    /// Gets a specific membership type by ID
    /// </summary>
    public async Task<MembershipTypeResponse?> GetMembershipTypeByIdAsync(int clubId, int membershipTypeId)
    {
        var membershipType = await _context.MembershipTypes
            .Where(mt => mt.ClubId == clubId && mt.Id == membershipTypeId)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (membershipType == null)
        {
            return null;
        }

        // Get member count for this membership type
        var memberCount = await _context.Members
            .CountAsync(m => m.MembershipTypeId == membershipType.Id && m.Status == "Active");

        return new MembershipTypeResponse
        {
            Id = membershipType.Id,
            ClubId = membershipType.ClubId,
            Name = membershipType.Name,
            Description = membershipType.Description,
            DuesAmount = membershipType.DuesAmount,
            DuesFrequency = membershipType.DuesFrequency,
            IsActive = membershipType.IsActive,
            CreatedAt = membershipType.CreatedAt,
            UpdatedAt = membershipType.UpdatedAt,
            MemberCount = memberCount
        };
    }

    /// <summary>
    /// Updates an existing membership type
    /// </summary>
    public async Task<MembershipTypeResponse> UpdateMembershipTypeAsync(int clubId, int membershipTypeId, UpdateMembershipTypeRequest request)
    {
        var membershipType = await _context.MembershipTypes
            .FirstOrDefaultAsync(mt => mt.ClubId == clubId && mt.Id == membershipTypeId);

        if (membershipType == null)
        {
            throw new ArgumentException($"Membership type with ID {membershipTypeId} not found in club {clubId}");
        }

        // Check if the new name conflicts with an existing membership type (excluding current one)
        var existingType = await _context.MembershipTypes
            .FirstOrDefaultAsync(mt => mt.ClubId == clubId && mt.Name == request.Name && mt.Id != membershipTypeId);

        if (existingType != null)
        {
            throw new ArgumentException($"A membership type with the name '{request.Name}' already exists in this club");
        }

        // Update properties
        membershipType.Name = request.Name;

        // Only update Description if provided (not empty)
        if (!string.IsNullOrEmpty(request.Description))
        {
            membershipType.Description = request.Description;
        }

        membershipType.DuesAmount = request.DuesAmount;

        // Only update DuesFrequency if provided (not empty)
        if (!string.IsNullOrEmpty(request.DuesFrequency))
        {
            membershipType.DuesFrequency = request.DuesFrequency;
        }

        membershipType.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Get member count for this membership type
        var memberCount = await _context.Members
            .CountAsync(m => m.MembershipTypeId == membershipType.Id && m.Status == "Active");

        return new MembershipTypeResponse
        {
            Id = membershipType.Id,
            ClubId = membershipType.ClubId,
            Name = membershipType.Name,
            Description = membershipType.Description,
            DuesAmount = membershipType.DuesAmount,
            DuesFrequency = membershipType.DuesFrequency,
            IsActive = membershipType.IsActive,
            CreatedAt = membershipType.CreatedAt,
            UpdatedAt = membershipType.UpdatedAt,
            MemberCount = memberCount
        };
    }

    /// <summary>
    /// Deletes a membership type
    /// </summary>
    public async Task<bool> DeleteMembershipTypeAsync(int clubId, int membershipTypeId)
    {
        var membershipType = await _context.MembershipTypes
            .FirstOrDefaultAsync(mt => mt.ClubId == clubId && mt.Id == membershipTypeId);

        if (membershipType == null)
        {
            return false;
        }

        // Check if any members are assigned to this membership type
        var memberCount = await _context.Members
            .CountAsync(m => m.MembershipTypeId == membershipTypeId);

        if (memberCount > 0)
        {
            var memberText = memberCount == 1 ? "member" : "members";
            throw new InvalidOperationException($"Cannot delete membership type because it is assigned to {memberCount} {memberText}. Please reassign these members to a different membership type before deletion.");
        }

        _context.MembershipTypes.Remove(membershipType);
        await _context.SaveChangesAsync();

        return true;
    }
}