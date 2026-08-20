using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Event Waitlist operations
/// </summary>
public class WaitlistRepository : IWaitlistRepository
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<WaitlistRepository> _logger;

    public WaitlistRepository(GatherGroveDbContext context, ILogger<WaitlistRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new waitlist entry
    /// </summary>
    public async Task<EventWaitlist> CreateAsync(EventWaitlist waitlistEntry)
    {
        try
        {
            _logger.LogInformation("Creating waitlist entry for event {EventId} and member {MemberId}",
                waitlistEntry.EventId, waitlistEntry.MemberId);

            waitlistEntry.CreatedAt = DateTime.UtcNow;
            waitlistEntry.UpdatedAt = DateTime.UtcNow;

            _context.EventWaitlists.Add(waitlistEntry);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created waitlist entry with ID {Id} at position {Position}",
                waitlistEntry.Id, waitlistEntry.Position);
            return waitlistEntry;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating waitlist entry for event {EventId} and member {MemberId}",
                waitlistEntry.EventId, waitlistEntry.MemberId);
            throw;
        }
    }

    /// <summary>
    /// Gets waitlist entries for an event ordered by position
    /// </summary>
    public async Task<List<EventWaitlist>> GetByEventIdAsync(int eventId)
    {
        try
        {
            return await _context.EventWaitlists
                .Include(w => w.Event)
                .Include(w => w.Member)
                .Where(w => w.EventId == eventId)
                .OrderBy(w => w.Position)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting waitlist entries for event {EventId}", eventId);
            return new List<EventWaitlist>();
        }
    }

    /// <summary>
    /// Gets a specific waitlist entry by event and member
    /// </summary>
    public async Task<EventWaitlist?> GetByEventAndMemberAsync(int eventId, int memberId)
    {
        try
        {
            return await _context.EventWaitlists
                .Include(w => w.Event)
                .Include(w => w.Member)
                .FirstOrDefaultAsync(w => w.EventId == eventId && w.MemberId == memberId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting waitlist entry for event {EventId} and member {MemberId}",
                eventId, memberId);
            return null;
        }
    }

    /// <summary>
    /// Deletes a waitlist entry
    /// </summary>
    public async Task DeleteAsync(int id)
    {
        try
        {
            var waitlistEntry = await _context.EventWaitlists
                .FirstOrDefaultAsync(w => w.Id == id);

            if (waitlistEntry == null)
            {
                _logger.LogWarning("Waitlist entry {Id} not found for deletion", id);
                return;
            }

            var eventId = waitlistEntry.EventId;
            var deletedPosition = waitlistEntry.Position;

            _context.EventWaitlists.Remove(waitlistEntry);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted waitlist entry {Id}", id);

            // Reorder positions after deletion
            await ReorderPositionsAsync(eventId, deletedPosition);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting waitlist entry {Id}", id);
            throw;
        }
    }

    /// <summary>
    /// Gets the next position number for a waitlist
    /// </summary>
    public async Task<int> GetNextPositionAsync(int eventId)
    {
        try
        {
            var maxPosition = await _context.EventWaitlists
                .Where(w => w.EventId == eventId)
                .MaxAsync(w => (int?)w.Position) ?? 0;

            return maxPosition + 1;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting next position for event {EventId}", eventId);
            return 1;
        }
    }

    /// <summary>
    /// Gets the next position for a specific priority level
    /// </summary>
    public async Task<int> GetNextPositionForPriorityAsync(int eventId, WaitlistPriority priority)
    {
        try
        {
            // Get all waitlist entries for this event with higher or equal priority
            var samePriorityEntries = await _context.EventWaitlists
                .Where(w => w.EventId == eventId && w.Priority >= priority)
                .OrderBy(w => w.Position)
                .ToListAsync();

            if (!samePriorityEntries.Any())
            {
                // No entries with same or higher priority, add to the end
                return await GetNextPositionAsync(eventId);
            }

            // Find the last position of entries with the same or higher priority
            var lastSamePriorityPosition = samePriorityEntries.Max(w => w.Position);

            // Insert after the last entry with same or higher priority
            return lastSamePriorityPosition + 1;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting next position for priority {Priority} on event {EventId}",
                priority, eventId);
            return 1;
        }
    }

    /// <summary>
    /// Reorders positions after a deletion
    /// </summary>
    public async Task ReorderPositionsAsync(int eventId, int deletedPosition)
    {
        try
        {
            var affectedEntries = await _context.EventWaitlists
                .Where(w => w.EventId == eventId && w.Position > deletedPosition)
                .ToListAsync();

            foreach (var entry in affectedEntries)
            {
                entry.Position -= 1;
                entry.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Reordered {Count} waitlist positions after deletion at position {DeletedPosition}",
                affectedEntries.Count, deletedPosition);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering positions for event {EventId} after deletion at position {DeletedPosition}",
                eventId, deletedPosition);
            throw;
        }
    }

    /// <summary>
    /// Updates a waitlist entry position
    /// </summary>
    public async Task UpdatePositionAsync(int id, int newPosition)
    {
        try
        {
            var waitlistEntry = await _context.EventWaitlists
                .FirstOrDefaultAsync(w => w.Id == id);

            if (waitlistEntry == null)
            {
                _logger.LogWarning("Waitlist entry {Id} not found for position update", id);
                return;
            }

            var oldPosition = waitlistEntry.Position;
            waitlistEntry.Position = newPosition;
            waitlistEntry.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated waitlist entry {Id} position from {OldPosition} to {NewPosition}",
                id, oldPosition, newPosition);

            // Reorder other entries affected by this change
            await ReorderAfterPositionChangeAsync(waitlistEntry.EventId, oldPosition, newPosition, id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating position for waitlist entry {Id}", id);
            throw;
        }
    }

    /// <summary>
    /// Reorders positions after a position change
    /// </summary>
    public async Task ReorderAfterPositionChangeAsync(int eventId, int oldPosition, int newPosition, int? excludeEntryId = null)
    {
        try
        {
            if (oldPosition == newPosition)
            {
                return;
            }

            List<EventWaitlist> affectedEntries;

            if (newPosition < oldPosition)
            {
                // Moving up - shift entries down between new and old positions
                affectedEntries = await _context.EventWaitlists
                    .Where(w => w.EventId == eventId &&
                               w.Position >= newPosition &&
                               w.Position < oldPosition &&
                               (!excludeEntryId.HasValue || w.Id != excludeEntryId.Value))
                    .ToListAsync();

                foreach (var entry in affectedEntries)
                {
                    entry.Position += 1;
                    entry.UpdatedAt = DateTime.UtcNow;
                }
            }
            else
            {
                // Moving down - shift entries up between old and new positions
                affectedEntries = await _context.EventWaitlists
                    .Where(w => w.EventId == eventId &&
                               w.Position > oldPosition &&
                               w.Position <= newPosition &&
                               (!excludeEntryId.HasValue || w.Id != excludeEntryId.Value))
                    .ToListAsync();

                foreach (var entry in affectedEntries)
                {
                    entry.Position -= 1;
                    entry.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Reordered {Count} waitlist entries after position change from {OldPosition} to {NewPosition}",
                affectedEntries.Count, oldPosition, newPosition);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering positions for event {EventId} after position change from {OldPosition} to {NewPosition}",
                eventId, oldPosition, newPosition);
            throw;
        }
    }

    /// <summary>
    /// Gets the total count of waitlist entries for an event
    /// </summary>
    public async Task<int> GetTotalWaitlistCountAsync(int eventId)
    {
        try
        {
            return await _context.EventWaitlists
                .Where(w => w.EventId == eventId)
                .CountAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting total waitlist count for event {EventId}", eventId);
            return 0;
        }
    }

    /// <summary>
    /// Updates a waitlist entry
    /// </summary>
    public async Task<EventWaitlist> UpdateAsync(EventWaitlist waitlistEntry)
    {
        try
        {
            _logger.LogInformation("Updating waitlist entry {Id}", waitlistEntry.Id);

            waitlistEntry.UpdatedAt = DateTime.UtcNow;

            _context.EventWaitlists.Update(waitlistEntry);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated waitlist entry {Id}", waitlistEntry.Id);
            return waitlistEntry;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating waitlist entry {Id}", waitlistEntry.Id);
            throw;
        }
    }
}
