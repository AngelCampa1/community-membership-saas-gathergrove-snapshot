using Microsoft.EntityFrameworkCore;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for alert configuration data access
/// </summary>
public class AlertConfigRepository : IAlertConfigRepository
{
    private readonly GatherGroveDbContext _context;

    public AlertConfigRepository(GatherGroveDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets alert configuration by club ID
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>The alert configuration or null if not found</returns>
    public async Task<AlertConfiguration?> GetByClubIdAsync(int clubId)
    {
        return await _context.AlertConfigurations
            .Include(c => c.Club)
            .FirstOrDefaultAsync(c => c.ClubId == clubId);
    }

    /// <summary>
    /// Adds new alert configuration
    /// </summary>
    /// <param name="config">The alert configuration to add</param>
    /// <returns>The added alert configuration</returns>
    public async Task<AlertConfiguration> AddAsync(AlertConfiguration config)
    {
        config.CreatedAt = DateTime.UtcNow;
        config.UpdatedAt = DateTime.UtcNow;

        _context.AlertConfigurations.Add(config);
        await _context.SaveChangesAsync();
        return config;
    }

    /// <summary>
    /// Updates existing alert configuration
    /// </summary>
    /// <param name="config">The alert configuration to update</param>
    /// <returns>The updated alert configuration</returns>
    public async Task<AlertConfiguration> UpdateAsync(AlertConfiguration config)
    {
        config.UpdatedAt = DateTime.UtcNow;

        _context.AlertConfigurations.Update(config);
        await _context.SaveChangesAsync();
        return config;
    }

    /// <summary>
    /// Checks if alert configuration exists for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>True if alert configuration exists</returns>
    public async Task<bool> ExistsAsync(int clubId)
    {
        return await _context.AlertConfigurations
            .AnyAsync(c => c.ClubId == clubId);
    }
}
