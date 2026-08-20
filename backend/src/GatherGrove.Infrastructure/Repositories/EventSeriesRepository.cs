using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Event Series operations
/// </summary>
public class EventSeriesRepository : IEventSeriesRepository
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<EventSeriesRepository> _logger;

    public EventSeriesRepository(GatherGroveDbContext context, ILogger<EventSeriesRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new event series
    /// </summary>
    public async Task<EventSeries> CreateAsync(EventSeries eventSeries)
    {
        try
        {
            _logger.LogInformation("Creating event series {Name} for club {ClubId}",
                eventSeries.Name, eventSeries.ClubId);

            eventSeries.CreatedAt = DateTime.UtcNow;
            eventSeries.UpdatedAt = DateTime.UtcNow;

            _context.EventSeries.Add(eventSeries);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created event series with ID {Id}", eventSeries.Id);
            return eventSeries;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating event series {Name} for club {ClubId}",
                eventSeries.Name, eventSeries.ClubId);
            throw;
        }
    }

    /// <summary>
    /// Gets an event series by ID
    /// </summary>
    public async Task<EventSeries?> GetByIdAsync(int id)
    {
        try
        {
            return await _context.EventSeries
                .Include(es => es.Club)
                .Include(es => es.GeneratedEvents)
                .FirstOrDefaultAsync(es => es.Id == id && !es.IsDeleted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event series {Id}", id);
            return null;
        }
    }

    /// <summary>
    /// Gets all event series for a club
    /// </summary>
    public async Task<List<EventSeries>> GetByClubIdAsync(int clubId)
    {
        try
        {
            return await _context.EventSeries
                .Include(es => es.GeneratedEvents)
                .Where(es => es.ClubId == clubId && !es.IsDeleted)
                .OrderByDescending(es => es.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event series for club {ClubId}", clubId);
            return new List<EventSeries>();
        }
    }

    /// <summary>
    /// Updates an existing event series
    /// </summary>
    public async Task<EventSeries> UpdateAsync(EventSeries eventSeries)
    {
        try
        {
            _logger.LogInformation("Updating event series {Id}", eventSeries.Id);

            eventSeries.UpdatedAt = DateTime.UtcNow;

            _context.EventSeries.Update(eventSeries);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated event series {Id}", eventSeries.Id);
            return eventSeries;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating event series {Id}", eventSeries.Id);
            throw;
        }
    }

    /// <summary>
    /// Deletes an event series (soft delete)
    /// </summary>
    public async Task DeleteAsync(int id)
    {
        try
        {
            var eventSeries = await _context.EventSeries
                .FirstOrDefaultAsync(es => es.Id == id);

            if (eventSeries == null)
            {
                _logger.LogWarning("Event series {Id} not found for deletion", id);
                return;
            }

            eventSeries.IsDeleted = true;
            eventSeries.IsActive = false;
            eventSeries.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Soft deleted event series {Id}", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting event series {Id}", id);
            throw;
        }
    }

    /// <summary>
    /// Gets active event series for a club
    /// </summary>
    public async Task<List<EventSeries>> GetActiveByClubIdAsync(int clubId)
    {
        try
        {
            return await _context.EventSeries
                .Include(es => es.GeneratedEvents)
                .Where(es => es.ClubId == clubId && es.IsActive && !es.IsDeleted)
                .OrderByDescending(es => es.StartDate)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active event series for club {ClubId}", clubId);
            return new List<EventSeries>();
        }
    }

    /// <summary>
    /// Checks if an event series exists
    /// </summary>
    public async Task<bool> ExistsAsync(int id)
    {
        try
        {
            return await _context.EventSeries
                .AnyAsync(es => es.Id == id && !es.IsDeleted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if event series {Id} exists", id);
            return false;
        }
    }
}
