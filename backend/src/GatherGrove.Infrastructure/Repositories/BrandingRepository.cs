using Microsoft.EntityFrameworkCore;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for club branding data access
/// </summary>
public class BrandingRepository : IBrandingRepository
{
    private readonly GatherGroveDbContext _context;

    public BrandingRepository(GatherGroveDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets branding settings by club ID
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>The branding settings or null if not found</returns>
    public async Task<ClubBranding?> GetByClubIdAsync(int clubId)
    {
        return await _context.ClubBrandings
            .Include(b => b.Club)
            .FirstOrDefaultAsync(b => b.ClubId == clubId);
    }

    /// <summary>
    /// Adds new branding settings
    /// </summary>
    /// <param name="branding">The branding settings to add</param>
    /// <returns>The added branding settings</returns>
    public async Task<ClubBranding> AddAsync(ClubBranding branding)
    {
        branding.CreatedAt = DateTime.UtcNow;
        branding.UpdatedAt = DateTime.UtcNow;

        _context.ClubBrandings.Add(branding);
        await _context.SaveChangesAsync();
        return branding;
    }

    /// <summary>
    /// Updates existing branding settings
    /// </summary>
    /// <param name="branding">The branding settings to update</param>
    /// <returns>The updated branding settings</returns>
    public async Task<ClubBranding> UpdateAsync(ClubBranding branding)
    {
        branding.UpdatedAt = DateTime.UtcNow;

        _context.ClubBrandings.Update(branding);
        await _context.SaveChangesAsync();
        return branding;
    }

    /// <summary>
    /// Deletes branding settings
    /// </summary>
    /// <param name="branding">The branding settings to delete</param>
    /// <returns>Task</returns>
    public async Task DeleteAsync(ClubBranding branding)
    {
        _context.ClubBrandings.Remove(branding);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Checks if branding settings exist for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>True if branding settings exist</returns>
    public async Task<bool> ExistsAsync(int clubId)
    {
        return await _context.ClubBrandings
            .AnyAsync(b => b.ClubId == clubId);
    }
}