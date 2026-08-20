using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Repositories;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing event series operations
/// </summary>
public class EventSeriesService : IEventSeriesService
{
    private readonly IEventSeriesRepository _eventSeriesRepository;
    private readonly IEventRepository _eventRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly IEventService _eventService;
    private readonly ILogger<EventSeriesService> _logger;

    public EventSeriesService(
        IEventSeriesRepository eventSeriesRepository,
        IEventRepository eventRepository,
        IMemberRepository memberRepository,
        IEventService eventService,
        ILogger<EventSeriesService> logger)
    {
        _eventSeriesRepository = eventSeriesRepository;
        _eventRepository = eventRepository;
        _memberRepository = memberRepository;
        _eventService = eventService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new event series
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="request">The create request</param>
    /// <returns>The created event series response</returns>
    public async Task<EventSeriesResponse> CreateEventSeriesAsync(int clubId, CreateEventSeriesRequest request)
    {
        _logger.LogInformation("Creating event series '{Name}' for club {ClubId}", request.Name, clubId);

        var eventSeries = new EventSeries
        {
            ClubId = clubId,
            Name = request.Name,
            Description = request.Description,
            RecurrencePattern = request.RecurrencePattern,
            RecurrenceInterval = request.RecurrenceInterval,
            DaysOfWeek = request.DaysOfWeek,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MaxEvents = request.MaxEvents,
            EventTemplate = request.EventTemplate,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdSeries = await _eventSeriesRepository.CreateAsync(eventSeries);

        _logger.LogInformation("Event series '{Name}' created with ID {Id}", createdSeries.Name, createdSeries.Id);

        return MapToResponse(createdSeries);
    }

    /// <summary>
    /// Gets an event series by ID
    /// </summary>
    /// <param name="id">The event series ID</param>
    /// <returns>The event series response</returns>
    public async Task<EventSeriesResponse?> GetEventSeriesAsync(int id)
    {
        var eventSeries = await _eventSeriesRepository.GetByIdAsync(id);
        return eventSeries != null ? MapToResponse(eventSeries) : null;
    }

    /// <summary>
    /// Gets all event series for a club
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <returns>List of event series for the club</returns>
    public async Task<List<EventSeriesResponse>> GetEventSeriesByClubAsync(int clubId)
    {
        var eventSeries = await _eventSeriesRepository.GetByClubIdAsync(clubId);
        return eventSeries.Select(MapToResponse).ToList();
    }

    /// <summary>
    /// Updates an existing event series
    /// </summary>
    /// <param name="id">The event series ID</param>
    /// <param name="request">The update request</param>
    /// <returns>The updated event series response</returns>
    public async Task<EventSeriesResponse?> UpdateEventSeriesAsync(int id, UpdateEventSeriesRequest request)
    {
        var eventSeries = await _eventSeriesRepository.GetByIdAsync(id);
        if (eventSeries == null)
        {
            _logger.LogWarning("Event series with ID {Id} not found for update", id);
            return null;
        }

        // Update only provided fields
        if (!string.IsNullOrEmpty(request.Name))
            eventSeries.Name = request.Name;

        if (!string.IsNullOrEmpty(request.Description))
            eventSeries.Description = request.Description;

        if (request.IsActive.HasValue)
            eventSeries.IsActive = request.IsActive.Value;

        if (request.EndDate.HasValue)
            eventSeries.EndDate = request.EndDate;

        if (request.MaxEvents.HasValue)
            eventSeries.MaxEvents = request.MaxEvents;

        eventSeries.UpdatedAt = DateTime.UtcNow;

        var updatedSeries = await _eventSeriesRepository.UpdateAsync(eventSeries);

        _logger.LogInformation("Event series {Id} updated", id);

        return MapToResponse(updatedSeries);
    }

    /// <summary>
    /// Deletes an event series
    /// </summary>
    /// <param name="id">The event series ID</param>
    /// <returns>Task representing the delete operation</returns>
    public async Task DeleteEventSeriesAsync(int id)
    {
        _logger.LogInformation("Deleting event series {Id}", id);
        await _eventSeriesRepository.DeleteAsync(id);
    }

    /// <summary>
    /// Generates events from a series based on its recurrence pattern
    /// </summary>
    /// <param name="eventSeriesId">The event series ID</param>
    /// <returns>List of generated events</returns>
    public async Task<List<Event>> GenerateSeriesEventsAsync(int eventSeriesId)
    {
        var eventSeries = await _eventSeriesRepository.GetByIdAsync(eventSeriesId);
        if (eventSeries == null)
        {
            throw new ArgumentException($"Event series with ID {eventSeriesId} not found");
        }

        _logger.LogInformation("Generating events for series {Id} with pattern {Pattern}",
            eventSeriesId, eventSeries.RecurrencePattern);

        var events = new List<Event>();
        var currentDate = eventSeries.StartDate;
        var eventNumber = 1;

        while (ShouldGenerateEvent(currentDate, eventSeries, eventNumber))
        {
            var eventDateTime = CalculateEventDateTime(currentDate, eventSeries);

            var generatedEvent = new Event
            {
                ClubId = eventSeries.ClubId,
                Name = ProcessTemplate(eventSeries.EventTemplate.Name, eventNumber, currentDate),
                EventDateTime = eventDateTime,
                Location = eventSeries.EventTemplate.Location,
                Description = ProcessTemplate(eventSeries.EventTemplate.Description, eventNumber, currentDate),
                MaxCapacity = eventSeries.EventTemplate.MaxCapacity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdEvent = await _eventRepository.CreateAsync(generatedEvent);
            events.Add(createdEvent);

            currentDate = CalculateNextDate(currentDate, eventSeries);
            eventNumber++;
        }

        _logger.LogInformation("Generated {Count} events for series {Id}", events.Count, eventSeriesId);

        return events;
    }

    private bool ShouldGenerateEvent(DateTime currentDate, EventSeries eventSeries, int eventNumber)
    {
        // Check if we've reached or exceeded the end date
        if (eventSeries.EndDate.HasValue)
        {
            var pattern = eventSeries.RecurrencePattern.ToLower();

            // For monthly/yearly patterns: Allow events that fall exactly on the end date
            // For daily/weekly patterns: Exclude events on or after the end date
            // This handles the case where 365 days = exactly 1 year for monthly recurrence
            if (pattern == "monthly" || pattern == "yearly")
            {
                // Allow events up to and including the end date
                if (currentDate.Date > eventSeries.EndDate.Value.Date)
                    return false;
            }
            else
            {
                // For daily/weekly, the end date is exclusive
                if (currentDate.Date >= eventSeries.EndDate.Value.Date)
                    return false;
            }
        }

        // Check if we've reached the maximum number of events
        if (eventSeries.MaxEvents.HasValue && eventNumber > eventSeries.MaxEvents.Value)
            return false;

        return true;
    }

    private DateTime CalculateEventDateTime(DateTime date, EventSeries eventSeries)
    {
        // Combine date with the template time
        var timeOnly = eventSeries.EventTemplate.EventTime;
        return date.Date.Add(timeOnly.ToTimeSpan());
    }

    private DateTime CalculateNextDate(DateTime currentDate, EventSeries eventSeries)
    {
        return eventSeries.RecurrencePattern.ToLower() switch
        {
            "daily" => currentDate.AddDays(eventSeries.RecurrenceInterval),
            "weekly" => currentDate.AddDays(7 * eventSeries.RecurrenceInterval),
            "monthly" => currentDate.AddMonths(eventSeries.RecurrenceInterval),
            "yearly" => currentDate.AddYears(eventSeries.RecurrenceInterval),
            _ => currentDate.AddDays(eventSeries.RecurrenceInterval)
        };
    }

    private string ProcessTemplate(string template, int eventNumber, DateTime date)
    {
        return template
            .Replace("{SeriesNumber}", eventNumber.ToString())
            .Replace("{Date}", date.ToString("MMM dd, yyyy"))
            .Replace("{ShortDate}", date.ToString("MM/dd"))
            .Replace("{DayOfWeek}", date.DayOfWeek.ToString());
    }

    /// <summary>
    /// Registers a member for all upcoming events in a series (bulk RSVP)
    /// </summary>
    /// <param name="clubId">The club ID</param>
    /// <param name="eventSeriesId">The event series ID</param>
    /// <param name="request">The bulk RSVP request</param>
    /// <returns>Result of the bulk RSVP operation</returns>
    public async Task<BulkSeriesRsvpResult> RegisterMemberForSeriesAsync(int clubId, int eventSeriesId, BulkSeriesRsvpRequest request)
    {
        _logger.LogInformation("Starting bulk RSVP for member {MemberId} to series {SeriesId} in club {ClubId}",
            request.MemberId, eventSeriesId, clubId);

        var result = new BulkSeriesRsvpResult();

        // Validate series exists and belongs to club
        var eventSeries = await _eventSeriesRepository.GetByIdAsync(eventSeriesId);
        if (eventSeries == null || eventSeries.ClubId != clubId)
        {
            throw new ArgumentException($"Event series with ID {eventSeriesId} not found in club {clubId}");
        }

        // Note: Member validation is done by EventService.UpsertRsvpAsync

        // Get or generate events from series
        var allEvents = await _eventRepository.GetEventsByClubIdAsync(clubId);
        var events = allEvents.Where(e => e.EventSeriesId == eventSeriesId).ToList();

        if (!events.Any())
        {
            _logger.LogInformation("No events found for series {SeriesId}, generating now", eventSeriesId);
            events = await GenerateSeriesEventsAsync(eventSeriesId);
        }

        // Filter to only upcoming events
        var upcomingEvents = events.Where(e => e.EventDateTime > DateTime.UtcNow).ToList();
        if (!upcomingEvents.Any())
        {
            _logger.LogWarning("No upcoming events found for series {SeriesId}", eventSeriesId);
            return result;
        }

        _logger.LogInformation("Processing {Count} upcoming events for bulk RSVP", upcomingEvents.Count);

        // Process each event
        foreach (var eventEntity in upcomingEvents)
        {
            try
            {
                // Create or update RSVP using EventService (handles capacity checks, validation, etc.)
                var rsvpRequest = new UpdateRsvpRequest
                {
                    Status = request.Status
                };

                var rsvpResponse = await _eventService.UpsertRsvpAsync(clubId, eventEntity.Id, request.MemberId, rsvpRequest);

                result.SuccessCount++;
                result.SuccessfulRsvps.Add(rsvpResponse);

                _logger.LogDebug("Successfully created/updated RSVP for event {EventId}", eventEntity.Id);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("capacity"))
            {
                // Event at capacity
                if (request.SkipFullEvents)
                {
                    result.SkippedCount++;
                    result.SkippedEvents.Add(new SkippedEventInfo
                    {
                        EventId = eventEntity.Id,
                        EventName = eventEntity.Name,
                        EventDateTime = eventEntity.EventDateTime,
                        Reason = SkipReason.AtCapacity,
                        Details = ex.Message
                    });
                    _logger.LogWarning("Skipped event {EventId} - at capacity", eventEntity.Id);
                }
                else
                {
                    throw; // Rethrow if not skipping
                }
            }
            catch (Exception ex)
            {
                // Log error and track in result
                _logger.LogError(ex, "Error creating RSVP for event {EventId}", eventEntity.Id);
                result.ErrorCount++;
                result.Errors.Add(new BulkOperationError
                {
                    ItemNumber = result.SuccessCount + result.ErrorCount + result.SkippedCount,
                    ItemId = eventEntity.Id.ToString(),
                    Message = ex.Message,
                    ErrorCode = ex.GetType().Name
                });
            }
        }

        _logger.LogInformation(
            "Bulk RSVP complete for series {SeriesId}: {Success} succeeded, {Error} errors, {Skipped} skipped",
            eventSeriesId, result.SuccessCount, result.ErrorCount, result.SkippedCount);

        return result;
    }

    private EventSeriesResponse MapToResponse(EventSeries eventSeries)
    {
        return new EventSeriesResponse
        {
            Id = eventSeries.Id,
            ClubId = eventSeries.ClubId,
            Name = eventSeries.Name,
            Description = eventSeries.Description,
            RecurrencePattern = eventSeries.RecurrencePattern,
            RecurrenceInterval = eventSeries.RecurrenceInterval,
            DaysOfWeek = eventSeries.DaysOfWeek,
            StartDate = eventSeries.StartDate,
            EndDate = eventSeries.EndDate,
            MaxEvents = eventSeries.MaxEvents,
            EventTemplate = eventSeries.EventTemplate,
            IsActive = eventSeries.IsActive,
            GeneratedEventsCount = eventSeries.GeneratedEvents?.Count ?? 0,
            CreatedAt = eventSeries.CreatedAt,
            UpdatedAt = eventSeries.UpdatedAt
        };
    }
}