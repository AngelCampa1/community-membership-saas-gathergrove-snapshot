using Microsoft.EntityFrameworkCore;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for club data access
/// </summary>
public class ClubRepository : IClubRepository
{
    private readonly GatherGroveDbContext _context;

    public ClubRepository(GatherGroveDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets a club and verifies the user is an admin
    /// </summary>
    public async Task<Club> GetClubWithAdminCheckAsync(int clubId, int userId)
    {
        var club = await _context.Clubs
            .Include(c => c.ClubAdmins)
            .FirstOrDefaultAsync(c => c.Id == clubId);

        if (club == null)
        {
            throw new KeyNotFoundException($"Club {clubId} not found");
        }

        // Check if user is an admin of this club
        var isAdmin = club.ClubAdmins.Any(ca => ca.UserId == userId);
        if (!isAdmin)
        {
            throw new UnauthorizedAccessException("User is not an admin of this club");
        }

        return club;
    }

    /// <summary>
    /// Gets a club by ID
    /// </summary>
    public async Task<Club?> GetByIdAsync(int clubId)
    {
        return await _context.Clubs.FirstOrDefaultAsync(c => c.Id == clubId);
    }
}