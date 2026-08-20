using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Repositories;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing event waitlist operations
/// </summary>
public class WaitlistService : IWaitlistService
{
    private readonly IWaitlistRepository _waitlistRepository;
    private readonly IEventRepository _eventRepository;
    private readonly INotificationService _notificationService;
    private readonly ILogger<WaitlistService> _logger;

    public WaitlistService(
        IWaitlistRepository waitlistRepository,
        IEventRepository eventRepository,
        INotificationService notificationService,
        ILogger<WaitlistService> logger)
    {
        _waitlistRepository = waitlistRepository;
        _eventRepository = eventRepository;
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// Adds a member to an event waitlist
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="request">The add to waitlist request</param>
    /// <returns>The created waitlist entry</returns>
    public async Task<WaitlistEntryResponse> AddToWaitlistAsync(int eventId, AddToWaitlistRequest request)
    {
        _logger.LogInformation("Adding member {MemberId} to waitlist for event {EventId}",
            request.MemberId, eventId);

        // Validate event exists
        var eventEntity = await _eventRepository.GetByIdAsync(eventId);
        if (eventEntity == null)
        {
            throw new ArgumentException($"Event with ID {eventId} not found");
        }

        // Get position considering priority
        int position;
        if (request.Priority == WaitlistPriority.Normal)
        {
            // Get next available position
            position = await _waitlistRepository.GetNextPositionAsync(eventId);
        }
        else
        {
            // Get position based on priority ordering
            position = await _waitlistRepository.GetNextPositionForPriorityAsync(eventId, request.Priority);
        }

        var waitlistEntry = new EventWaitlist
        {
            EventId = eventId,
            MemberId = request.MemberId,
            Priority = request.Priority,
            Notes = request.Notes,
            Position = position,
            CreatedAt = DateTime.UtcNow
        };

        var createdEntry = await _waitlistRepository.CreateAsync(waitlistEntry);

        _logger.LogInformation("Member {MemberId} added to waitlist for event {EventId} at position {Position}",
            request.MemberId, eventId, position);

        return MapToWaitlistEntryResponse(createdEntry);
    }

    /// <summary>
    /// Removes a member from an event waitlist
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <returns>Task representing the removal operation</returns>
    public async Task RemoveFromWaitlistAsync(int eventId, int memberId)
    {
        _logger.LogInformation("Removing member {MemberId} from waitlist for event {EventId}",
            memberId, eventId);

        var waitlistEntry = await _waitlistRepository.GetByEventAndMemberAsync(eventId, memberId);
        if (waitlistEntry == null)
        {
            throw new ArgumentException($"Member {memberId} is not on the waitlist for event {eventId}");
        }

        var removedPosition = waitlistEntry.Position;

        // Delete the entry
        await _waitlistRepository.DeleteAsync(waitlistEntry.Id);

        // Reorder remaining entries
        await _waitlistRepository.ReorderPositionsAsync(eventId, removedPosition);

        _logger.LogInformation("Member {MemberId} removed from waitlist for event {EventId}",
            memberId, eventId);
    }

    /// <summary>
    /// Gets the waitlist for an event
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <returns>List of waitlist entries</returns>
    public async Task<List<WaitlistEntryResponse>> GetWaitlistForEventAsync(int eventId)
    {
        _logger.LogInformation("Getting waitlist for event {EventId}", eventId);

        var waitlistEntries = await _waitlistRepository.GetByEventIdAsync(eventId);

        return waitlistEntries
            .OrderBy(w => w.Position)
            .Select(MapToWaitlistEntryResponse)
            .ToList();
    }

    /// <summary>
    /// Processes the waitlist when spots become available
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="availableSpots">Number of available spots</param>
    /// <returns>The processing result</returns>
    public async Task<WaitlistProcessingResult> ProcessWaitlistAsync(int eventId, int availableSpots)
    {
        _logger.LogInformation("Processing waitlist for event {EventId} with {AvailableSpots} available spots",
            eventId, availableSpots);

        var waitlistEntries = await _waitlistRepository.GetByEventIdAsync(eventId);
        var orderedEntries = waitlistEntries
            .OrderBy(w => w.Position)
            .Take(availableSpots)
            .ToList();

        var promotedMembers = new List<WaitlistPromotion>();

        foreach (var entry in orderedEntries)
        {
            // Create promotion record
            var promotion = new WaitlistPromotion
            {
                MemberId = entry.MemberId,
                FromPosition = entry.Position,
                PromotedAt = DateTime.UtcNow
            };
            promotedMembers.Add(promotion);

            // Remove from waitlist
            await _waitlistRepository.DeleteAsync(entry.Id);

            // Send promotion notification
            await _notificationService.SendWaitlistPromotionNotificationAsync(eventId, entry.MemberId);
        }

        var remainingWaitlist = await _waitlistRepository.GetByEventIdAsync(eventId);

        _logger.LogInformation("Processed waitlist for event {EventId}, promoted {PromotedCount} members",
            eventId, promotedMembers.Count);

        return new WaitlistProcessingResult
        {
            Success = true,
            PromotedMembers = promotedMembers,
            SpotsFilled = promotedMembers.Count,
            RemainingWaitlist = remainingWaitlist.Select(w => w.MemberId).ToList()
        };
    }

    /// <summary>
    /// Updates a member's position in the waitlist
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <param name="newPosition">The new position</param>
    /// <returns>Task representing the update operation</returns>
    public async Task UpdateWaitlistPositionAsync(int eventId, int memberId, int newPosition)
    {
        _logger.LogInformation("Updating waitlist position for member {MemberId} in event {EventId} to position {NewPosition}",
            memberId, eventId, newPosition);

        var waitlistEntry = await _waitlistRepository.GetByEventAndMemberAsync(eventId, memberId);
        if (waitlistEntry == null)
        {
            throw new ArgumentException($"Member {memberId} is not on the waitlist for event {eventId}");
        }

        var oldPosition = waitlistEntry.Position;

        // Update the entry position
        await _waitlistRepository.UpdatePositionAsync(waitlistEntry.Id, newPosition);

        // Reorder other entries
        await _waitlistRepository.ReorderAfterPositionChangeAsync(eventId, oldPosition, newPosition);

        _logger.LogInformation("Updated waitlist position for member {MemberId} from {OldPosition} to {NewPosition}",
            memberId, oldPosition, newPosition);
    }

    /// <summary>
    /// Gets a member's waitlist status for an event
    /// </summary>
    /// <param name="eventId">The event ID</param>
    /// <param name="memberId">The member ID</param>
    /// <returns>The member's waitlist status</returns>
    public async Task<MemberWaitlistStatus?> GetMemberWaitlistStatusAsync(int eventId, int memberId)
    {
        _logger.LogInformation("Getting waitlist status for member {MemberId} in event {EventId}",
            memberId, eventId);

        var waitlistEntry = await _waitlistRepository.GetByEventAndMemberAsync(eventId, memberId);
        if (waitlistEntry == null)
        {
            return null;
        }

        var totalInWaitlist = await _waitlistRepository.GetTotalWaitlistCountAsync(eventId);
        var estimatedWaitTime = CalculateEstimatedWaitTime(waitlistEntry.Position, totalInWaitlist);

        return new MemberWaitlistStatus
        {
            MemberId = memberId,
            EventId = eventId,
            IsOnWaitlist = true,
            Position = waitlistEntry.Position,
            TotalInWaitlist = totalInWaitlist,
            EstimatedWaitTime = estimatedWaitTime,
            Priority = waitlistEntry.Priority,
            AddedAt = waitlistEntry.CreatedAt,
            Status = WaitlistStatus.Active,
            NotificationSent = waitlistEntry.NotificationSent
        };
    }

    private TimeSpan CalculateEstimatedWaitTime(int position, int totalInWaitlist)
    {
        // Simple calculation: assume 1 spot opens per week on average
        // More sophisticated calculation could be based on historical data
        var estimatedWeeks = position * 1.0; // 1 week per position ahead
        return TimeSpan.FromDays(estimatedWeeks * 7);
    }

    private WaitlistEntryResponse MapToWaitlistEntryResponse(EventWaitlist waitlistEntry)
    {
        if (waitlistEntry == null)
        {
            throw new ArgumentNullException(nameof(waitlistEntry), "Waitlist entry cannot be null");
        }

        return new WaitlistEntryResponse
        {
            Id = waitlistEntry.Id,
            EventId = waitlistEntry.EventId,
            MemberId = waitlistEntry.MemberId,
            MemberName = waitlistEntry.Member?.FullName ?? "Unknown",
            Position = waitlistEntry.Position,
            Priority = waitlistEntry.Priority,
            Notes = waitlistEntry.Notes,
            CreatedAt = waitlistEntry.CreatedAt,
            AddedAt = waitlistEntry.CreatedAt,
            Status = WaitlistStatus.Active,
            NotificationSent = waitlistEntry.NotificationSent
        };
    }
}