using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Multi-Session Event operations
/// </summary>
public class MultiSessionEventRepository : IMultiSessionEventRepository
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<MultiSessionEventRepository> _logger;

    public MultiSessionEventRepository(GatherGroveDbContext context, ILogger<MultiSessionEventRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new multi-session event
    /// </summary>
    public async Task<MultiSessionEvent> CreateAsync(MultiSessionEvent multiSessionEvent)
    {
        try
        {
            _logger.LogInformation("Creating multi-session event {Name} for club {ClubId}",
                multiSessionEvent.Name, multiSessionEvent.ClubId);

            multiSessionEvent.CreatedAt = DateTime.UtcNow;
            multiSessionEvent.UpdatedAt = DateTime.UtcNow;

            _context.MultiSessionEvents.Add(multiSessionEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created multi-session event with ID {Id}", multiSessionEvent.Id);
            return multiSessionEvent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating multi-session event {Name} for club {ClubId}",
                multiSessionEvent.Name, multiSessionEvent.ClubId);
            throw;
        }
    }

    /// <summary>
    /// Gets a multi-session event by ID
    /// </summary>
    public async Task<MultiSessionEvent?> GetByIdAsync(int id)
    {
        try
        {
            return await _context.MultiSessionEvents
                .Include(mse => mse.Club)
                .Include(mse => mse.Registrations)
                .FirstOrDefaultAsync(mse => mse.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting multi-session event {Id}", id);
            return null;
        }
    }

    /// <summary>
    /// Gets a multi-session event by ID with all sessions included
    /// </summary>
    public async Task<MultiSessionEvent?> GetByIdWithSessionsAsync(int id)
    {
        try
        {
            return await _context.MultiSessionEvents
                .Include(mse => mse.Club)
                .Include(mse => mse.Sessions)
                    .ThenInclude(s => s.SessionRegistrations)
                .Include(mse => mse.Registrations)
                    .ThenInclude(r => r.Member)
                .FirstOrDefaultAsync(mse => mse.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting multi-session event {Id} with sessions", id);
            return null;
        }
    }

    /// <summary>
    /// Gets all multi-session events for a club
    /// </summary>
    public async Task<List<MultiSessionEvent>> GetByClubIdAsync(int clubId)
    {
        try
        {
            return await _context.MultiSessionEvents
                .Include(mse => mse.Sessions)
                .Include(mse => mse.Registrations)
                .Where(mse => mse.ClubId == clubId)
                .OrderByDescending(mse => mse.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting multi-session events for club {ClubId}", clubId);
            return new List<MultiSessionEvent>();
        }
    }

    /// <summary>
    /// Updates an existing multi-session event
    /// </summary>
    public async Task<MultiSessionEvent> UpdateAsync(MultiSessionEvent multiSessionEvent)
    {
        try
        {
            _logger.LogInformation("Updating multi-session event {Id}", multiSessionEvent.Id);

            multiSessionEvent.UpdatedAt = DateTime.UtcNow;

            _context.MultiSessionEvents.Update(multiSessionEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated multi-session event {Id}", multiSessionEvent.Id);
            return multiSessionEvent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating multi-session event {Id}", multiSessionEvent.Id);
            throw;
        }
    }

    /// <summary>
    /// Deletes a multi-session event
    /// </summary>
    public async Task DeleteAsync(int id)
    {
        try
        {
            var multiSessionEvent = await _context.MultiSessionEvents
                .Include(mse => mse.Sessions)
                .Include(mse => mse.Registrations)
                .FirstOrDefaultAsync(mse => mse.Id == id);

            if (multiSessionEvent == null)
            {
                _logger.LogWarning("Multi-session event {Id} not found for deletion", id);
                return;
            }

            // Mark as inactive instead of hard delete to preserve registrations
            multiSessionEvent.IsActive = false;
            multiSessionEvent.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Deactivated multi-session event {Id}", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting multi-session event {Id}", id);
            throw;
        }
    }

    /// <summary>
    /// Creates a registration for a multi-session event
    /// </summary>
    public async Task<MultiSessionEventRegistration> CreateRegistrationAsync(MultiSessionEventRegistration registration)
    {
        try
        {
            _logger.LogInformation("Creating registration for multi-session event {MultiSessionEventId} and member {MemberId}",
                registration.MultiSessionEventId, registration.MemberId);

            registration.CreatedAt = DateTime.UtcNow;
            registration.RegisteredAt = DateTime.UtcNow;

            _context.MultiSessionEventRegistrations.Add(registration);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created registration with ID {Id}", registration.Id);
            return registration;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating registration for multi-session event {MultiSessionEventId}",
                registration.MultiSessionEventId);
            throw;
        }
    }

    /// <summary>
    /// Gets member progress across all sessions in a multi-session event
    /// </summary>
    public async Task<object?> GetMemberProgressAsync(int multiSessionEventId, int memberId)
    {
        try
        {
            var multiSessionEvent = await _context.MultiSessionEvents
                .Include(mse => mse.Sessions)
                    .ThenInclude(s => s.SessionAttendances.Where(sa => sa.MemberId == memberId))
                .Include(mse => mse.Registrations.Where(r => r.MemberId == memberId))
                .FirstOrDefaultAsync(mse => mse.Id == multiSessionEventId);

            if (multiSessionEvent == null)
            {
                return null;
            }

            var registration = multiSessionEvent.Registrations.FirstOrDefault();
            var totalSessions = multiSessionEvent.Sessions.Count;
            var attendedSessions = multiSessionEvent.Sessions
                .Count(s => s.SessionAttendances.Any(sa => sa.AttendedAt.HasValue));
            var mandatorySessions = multiSessionEvent.Sessions.Count(s => s.IsMandatory);
            var attendedMandatorySessions = multiSessionEvent.Sessions
                .Where(s => s.IsMandatory)
                .Count(s => s.SessionAttendances.Any(sa => sa.AttendedAt.HasValue));

            var progress = new
            {
                MemberId = memberId,
                MultiSessionEventId = multiSessionEventId,
                TotalSessions = totalSessions,
                AttendedSessions = attendedSessions,
                CompletionPercentage = totalSessions > 0 ? (decimal)attendedSessions / totalSessions * 100 : 0,
                MandatorySessionsCompleted = attendedMandatorySessions,
                TotalMandatorySessions = mandatorySessions,
                IsEligibleForCompletion = attendedMandatorySessions >= mandatorySessions,
                LastSessionAttended = multiSessionEvent.Sessions
                    .SelectMany(s => s.SessionAttendances)
                    .Where(sa => sa.AttendedAt.HasValue)
                    .OrderByDescending(sa => sa.AttendedAt)
                    .FirstOrDefault()?.AttendedAt,
                PaymentStatus = registration?.PaymentStatus.ToString() ?? "Unknown"
            };

            return progress;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting member progress for multi-session event {MultiSessionEventId} and member {MemberId}",
                multiSessionEventId, memberId);
            return null;
        }
    }

    /// <summary>
    /// Gets all registrations for a multi-session event
    /// </summary>
    public async Task<List<MultiSessionEventRegistration>> GetRegistrationsAsync(int multiSessionEventId)
    {
        try
        {
            return await _context.MultiSessionEventRegistrations
                .Include(r => r.Member)
                .Include(r => r.SessionRegistrations)
                    .ThenInclude(sr => sr.Session)
                .Where(r => r.MultiSessionEventId == multiSessionEventId)
                .OrderBy(r => r.RegisteredAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting registrations for multi-session event {MultiSessionEventId}",
                multiSessionEventId);
            return new List<MultiSessionEventRegistration>();
        }
    }
}
