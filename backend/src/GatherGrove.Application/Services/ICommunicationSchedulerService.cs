using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service interface for scheduling and managing communication delivery
/// </summary>
public interface ICommunicationSchedulerService
{
    /// <summary>
    /// Schedules a communication for future delivery
    /// </summary>
    Task<ScheduleCommunicationResponse> ScheduleCommunicationAsync(
        int clubId,
        int userId,
        ScheduleCommunicationRequest request);

    /// <summary>
    /// Gets all scheduled communications for a club
    /// </summary>
    Task<List<ScheduledCommunicationResponse>> GetScheduledCommunicationsAsync(int clubId);

    /// <summary>
    /// Cancels a scheduled communication
    /// </summary>
    Task<bool> CancelScheduledCommunicationAsync(int clubId, int communicationId);

    /// <summary>
    /// Processes all scheduled communications that are due (called by background job)
    /// </summary>
    Task ProcessScheduledCommunicationsAsync();
}

