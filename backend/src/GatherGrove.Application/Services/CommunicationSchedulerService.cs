using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Communications;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for scheduling and managing communication delivery
/// Supports both immediate and scheduled sends with queue management
/// </summary>
public class CommunicationSchedulerService : ICommunicationSchedulerService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<CommunicationSchedulerService> _logger;
    private readonly ICommunicationsService _communicationsService;
    private readonly bool _backgroundJobsEnabled;

    public CommunicationSchedulerService(
        GatherGroveDbContext context,
        ILogger<CommunicationSchedulerService> logger,
        ICommunicationsService communicationsService,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _communicationsService = communicationsService;

        // Check if background jobs are enabled (for production)
        _backgroundJobsEnabled = configuration.GetValue<bool>("BackgroundJobs:Enabled", false);

        if (!_backgroundJobsEnabled)
        {
            _logger.LogWarning("Background jobs are DISABLED. Scheduled communications will not be processed automatically.");
            _logger.LogInformation("To enable: Set BackgroundJobs:Enabled=true in appsettings.json");
        }
    }

    public async Task<ScheduleCommunicationResponse> ScheduleCommunicationAsync(
        int clubId,
        int userId,
        ScheduleCommunicationRequest request)
    {
        _logger.LogInformation("Scheduling communication for club {ClubId} by user {UserId}", clubId, userId);

        try
        {
            // Validate scheduled time
            if (request.ScheduledFor.HasValue && request.ScheduledFor.Value <= DateTime.UtcNow)
            {
                return new ScheduleCommunicationResponse
                {
                    Success = false,
                    Message = "Scheduled time must be in the future"
                };
            }

            // Create communications log with scheduled status
            var commLog = new CommunicationsLog
            {
                ClubId = clubId,
                CommunicationType = request.CommunicationType,
                Subject = request.Subject,
                Body = request.Body,
                RecipientCount = 0, // Will be calculated when sent
                Recipients = "", // Will be populated when sent
                Status = "Scheduled",
                SentByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                ScheduledFor = request.ScheduledFor,
                SegmentId = request.SegmentId,
                TemplateId = request.TemplateId,
                WorkflowId = request.WorkflowId
            };

            _context.CommunicationsLogs.Add(commLog);
            await _context.SaveChangesAsync();

            var response = new ScheduleCommunicationResponse
            {
                Success = true,
                Message = request.ScheduledFor.HasValue
                    ? $"Communication scheduled for {request.ScheduledFor.Value:yyyy-MM-dd HH:mm} UTC"
                    : "Communication queued for immediate delivery",
                CommunicationId = commLog.Id,
                ScheduledFor = request.ScheduledFor
            };

            // If immediate send or no background jobs, send now
            if (!request.ScheduledFor.HasValue || !_backgroundJobsEnabled)
            {
                await ProcessScheduledCommunicationAsync(commLog.Id);
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scheduling communication for club {ClubId}", clubId);
            return new ScheduleCommunicationResponse
            {
                Success = false,
                Message = $"Error scheduling communication: {ex.Message}"
            };
        }
    }

    public async Task<List<ScheduledCommunicationResponse>> GetScheduledCommunicationsAsync(int clubId)
    {
        _logger.LogInformation("Getting scheduled communications for club {ClubId}", clubId);

        var scheduled = await _context.CommunicationsLogs
            .AsNoTracking()
            .Where(c => c.ClubId == clubId && c.Status == "Scheduled")
            .OrderBy(c => c.ScheduledFor)
            .ToListAsync();

        return scheduled.Select(c => new ScheduledCommunicationResponse
        {
            CommunicationId = c.Id,
            CommunicationType = c.CommunicationType,
            Subject = c.Subject,
            ScheduledFor = c.ScheduledFor,
            CreatedAt = c.CreatedAt,
            RecipientCount = c.RecipientCount
        }).ToList();
    }

    public async Task<bool> CancelScheduledCommunicationAsync(int clubId, int communicationId)
    {
        _logger.LogInformation("Cancelling scheduled communication {CommunicationId} for club {ClubId}",
            communicationId, clubId);

        var comm = await _context.CommunicationsLogs
            .FirstOrDefaultAsync(c => c.Id == communicationId && c.ClubId == clubId);

        if (comm == null)
        {
            _logger.LogWarning("Communication {CommunicationId} not found", communicationId);
            return false;
        }

        if (comm.Status != "Scheduled")
        {
            _logger.LogWarning("Communication {CommunicationId} cannot be cancelled (status: {Status})",
                communicationId, comm.Status);
            return false;
        }

        comm.Status = "Cancelled";
        await _context.SaveChangesAsync();

        _logger.LogInformation("Communication {CommunicationId} cancelled successfully", communicationId);
        return true;
    }

    public async Task ProcessScheduledCommunicationsAsync()
    {
        if (!_backgroundJobsEnabled)
        {
            return;
        }

        _logger.LogInformation("Processing scheduled communications");

        var now = DateTime.UtcNow;
        var dueComms = await _context.CommunicationsLogs
            .Where(c => c.Status == "Scheduled" && c.ScheduledFor <= now)
            .ToListAsync();

        _logger.LogInformation("Found {Count} scheduled communications due for processing", dueComms.Count);

        foreach (var comm in dueComms)
        {
            try
            {
                await ProcessScheduledCommunicationAsync(comm.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing scheduled communication {CommId}", comm.Id);

                // Mark as failed
                comm.Status = "Failed";
                await _context.SaveChangesAsync();
            }
        }
    }

    private async Task ProcessScheduledCommunicationAsync(int communicationId)
    {
        _logger.LogInformation("Processing scheduled communication {CommId}", communicationId);

        var comm = await _context.CommunicationsLogs
            .FirstOrDefaultAsync(c => c.Id == communicationId);

        if (comm == null)
        {
            _logger.LogWarning("Communication {CommId} not found", communicationId);
            return;
        }

        try
        {
            // Update status to sending
            comm.Status = "Sending";
            comm.SentAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Send based on type
            switch (comm.CommunicationType.ToLower())
            {
                case "email":
                    await ProcessScheduledEmailAsync(comm);
                    break;

                case "sms":
                    _logger.LogWarning("Scheduled SMS {CommId} cannot be processed because SMS is no longer supported", comm.Id);
                    comm.Status = "Failed";
                    break;

                default:
                    _logger.LogWarning("Unknown communication type: {Type}", comm.CommunicationType);
                    comm.Status = "Failed";
                    break;
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Communication {CommId} processed successfully", communicationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing communication {CommId}", communicationId);
            comm.Status = "Failed";
            await _context.SaveChangesAsync();
            throw;
        }
    }

    private async Task ProcessScheduledEmailAsync(CommunicationsLog comm)
    {
        _logger.LogInformation("Sending scheduled email {CommId}", comm.Id);

        // Call communications service to send bulk email
        var request = new SendBulkEmailRequest
        {
            Subject = comm.Subject ?? "Communication from your club",
            Body = comm.Body
        };

        try
        {
            await _communicationsService.SendBulkEmailAsync(
                comm.ClubId,
                comm.SentByUserId,
                request);

            // Mark as sent - actual recipient count will be updated by the communications service
            comm.Status = "Sent";
            _logger.LogInformation("Scheduled email {CommId} sent successfully", comm.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send scheduled email {CommId}", comm.Id);
            comm.Status = "Failed";
        }
    }

}

