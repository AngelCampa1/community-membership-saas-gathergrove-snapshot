using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for handling marketing lead capture and analytics
/// </summary>
public class MarketingService : IMarketingService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<MarketingService> _logger;
    private readonly IEmailService _emailService;
    private readonly IPdfGenerationService _pdfGenerationService;
    private readonly ISequencerService _sequencerService;

    public MarketingService(
        GatherGroveDbContext context,
        ILogger<MarketingService> logger,
        IEmailService emailService,
        IPdfGenerationService pdfGenerationService,
        ISequencerService sequencerService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
        _pdfGenerationService = pdfGenerationService;
        _sequencerService = sequencerService;
    }

    /// <summary>
    /// Capture a marketing lead from the website
    /// </summary>
    public async Task<CaptureLeadResponse> CaptureLeadAsync(CaptureLeadRequest request)
    {
        try
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var normalizedSource = request.Source.Trim().ToLowerInvariant();

            // Check if lead already exists (basic deduplication)
            var existingLead = await _context.MarketingLeads
                .FirstOrDefaultAsync(l => l.Email == normalizedEmail && l.Source == normalizedSource);

            if (existingLead != null)
            {
                _logger.LogInformation("Marketing lead already exists for source {Source}", normalizedSource);

                return new CaptureLeadResponse
                {
                    Success = true,
                    Message = "Thank you for your interest! We'll be in touch soon.",
                    LeadId = existingLead.Id.ToString()
                };
            }

            // Create new lead
            var lead = new MarketingLead
            {
                Email = normalizedEmail,
                Name = request.Name,
                Source = normalizedSource,
                Variant = request.Variant,
                UserAgent = request.UserAgent,
                ReferrerUrl = request.Referrer,
                CurrentUrl = request.CurrentUrl,
                SessionId = request.SessionId,
                Metadata = request.Metadata,
                CreatedAt = DateTime.UtcNow
            };

            _context.MarketingLeads.Add(lead);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                _context.Entry(lead).State = EntityState.Detached;
                var duplicateLead = await _context.MarketingLeads
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.Email == normalizedEmail && l.Source == normalizedSource);

                if (duplicateLead != null)
                {
                    _logger.LogInformation("Marketing lead duplicate detected during insert for source {Source}", normalizedSource);
                    return new CaptureLeadResponse
                    {
                        Success = true,
                        Message = "Thank you for your interest! We'll be in touch soon.",
                        LeadId = duplicateLead.Id.ToString()
                    };
                }

                throw;
            }

            _logger.LogInformation("Marketing lead captured from {Source}", normalizedSource);

            try
            {
                await _sequencerService.EnrollMarketingLeadAsync(lead, request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to enroll marketing lead {LeadId} in Sequencer", lead.Id);
            }

            // Send immediate lead-magnet fulfillment without blocking the capture response.
            _ = Task.Run(async () =>
            {
                try
                {
                    if (normalizedSource == "lead-magnet" || normalizedSource == "exit-intent")
                    {
                        var pdfContent = await _pdfGenerationService.GenerateClubManagementChecklistPdfAsync();
                        await _emailService.SendLeadMagnetEmailAsync(normalizedEmail, request.Name, "club-management-checklist", pdfContent);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send lead magnet fulfillment");
                }
            });

            return new CaptureLeadResponse
            {
                Success = true,
                Message = "Thank you for your interest! Check your email for valuable club management resources.",
                LeadId = lead.Id.ToString()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to capture marketing lead");

            return new CaptureLeadResponse
            {
                Success = false,
                Message = "Sorry, there was an error processing your request. Please try again."
            };
        }
    }

    /// <summary>
    /// Track an analytics event
    /// </summary>
    public async Task TrackEventAsync(TrackAnalyticsRequest request)
    {
        try
        {
            // Create session if it doesn't exist
            var sessionId = request.SessionId ?? GenerateSessionId();

            var session = await _context.AnalyticsSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null)
            {
                session = new AnalyticsSession
                {
                    Id = sessionId,
                    StartedAt = DateTime.UtcNow,
                    LastActivityAt = DateTime.UtcNow,
                    Platform = GetPlatformFromUserAgent(request.UserAgent),
                    UserAgent = request.UserAgent,
                    EntryUrl = request.Url
                };
                _context.AnalyticsSessions.Add(session);
            }
            else
            {
                session.LastActivityAt = DateTime.UtcNow;
                session.EventCount++;
            }

            // Create analytics event
            var analyticsEvent = new AnalyticsEvent
            {
                EventType = request.EventName ?? "unknown",
                Category = request.Category ?? "Marketing",
                Action = request.EventName ?? "unknown",
                SessionId = sessionId,
                Platform = GetPlatformFromUserAgent(request.UserAgent),
                UserAgent = request.UserAgent,
                PageUrl = request.Url,
                Properties = request.Data,
                CreatedAt = DateTime.UtcNow
            };

            _context.AnalyticsEvents.Add(analyticsEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Analytics event tracked: {Event} for session {SessionId}",
                request.EventName, sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track analytics event: {Event}", request.EventName);
            // Don't throw - analytics failures should not break user experience
        }
    }

    /// <summary>
    /// Get lead magnet content for download
    /// </summary>
    public async Task<(string downloadUrl, string fileName)> GetLeadMagnetAsync(string type)
    {
        try
        {
            // For now, return static content
            // In the future, this could generate PDFs dynamically or serve from storage
            return type.ToLower() switch
            {
                "club-management-checklist" => (
                    "/api/v1/marketing/lead-magnets/club-management-checklist/download",
                    "Ultimate Club Management Checklist.pdf"
                ),
                _ => throw new ArgumentException($"Unknown lead magnet type: {type}")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get lead magnet for type: {Type}", type);
            throw;
        }
    }

    private static string GenerateSessionId()
    {
        return $"session_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}";
    }

    private static string GetPlatformFromUserAgent(string? userAgent)
    {
        if (string.IsNullOrEmpty(userAgent))
            return "Unknown";

        userAgent = userAgent.ToLower();

        if (userAgent.Contains("mobile") || userAgent.Contains("android") || userAgent.Contains("iphone"))
            return "Mobile";

        if (userAgent.Contains("tablet") || userAgent.Contains("ipad"))
            return "Tablet";

        return "Desktop";
    }
}
