using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing email templates for advanced communications
/// </summary>
public class CommunicationTemplateService : ICommunicationTemplateService
{
    private readonly GatherGroveDbContext _context;
    private readonly ILogger<CommunicationTemplateService> _logger;

    public CommunicationTemplateService(
        GatherGroveDbContext context,
        ILogger<CommunicationTemplateService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<EmailTemplateResponse> CreateTemplateAsync(int clubId, int userId, CreateEmailTemplateRequest request)
    {
        _logger.LogInformation("Creating email template {TemplateName} for club {ClubId}",
            request.TemplateName, clubId);

        // Validate club tier - templates are Expand feature
        var club = await _context.Clubs.FindAsync(clubId);
        if (club == null)
        {
            throw new ArgumentException($"Club {clubId} not found");
        }

        if (club.Tier != "Expand" && club.Tier != "Unlimited")
        {
            throw new InvalidOperationException("Email templates are only available for Expand tier clubs");
        }

        var template = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = request.TemplateName,
            Description = request.Description,
            TemplateHtml = request.TemplateHtml,
            TemplateJson = request.TemplateJson,
            ThumbnailUrl = request.ThumbnailUrl,
            IsSystemTemplate = false,
            IsActive = true,
            Version = 1,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EmailTemplates.Add(template);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Email template {TemplateId} created successfully", template.Id);

        return MapToResponse(template);
    }

    public async Task<EmailTemplateResponse> UpdateTemplateAsync(int clubId, int templateId, UpdateEmailTemplateRequest request)
    {
        _logger.LogInformation("Updating email template {TemplateId} for club {ClubId}", templateId, clubId);

        var template = await _context.EmailTemplates
            .FirstOrDefaultAsync(t => t.Id == templateId && t.ClubId == clubId);

        if (template == null)
        {
            throw new ArgumentException($"Template {templateId} not found for club {clubId}");
        }

        if (template.IsSystemTemplate)
        {
            throw new InvalidOperationException("System templates cannot be modified");
        }

        // Update fields if provided
        if (!string.IsNullOrEmpty(request.TemplateName))
        {
            template.TemplateName = request.TemplateName;
        }

        if (request.Description != null)
        {
            template.Description = request.Description;
        }

        if (!string.IsNullOrEmpty(request.TemplateHtml))
        {
            template.TemplateHtml = request.TemplateHtml;
            template.Version++;
        }

        if (request.TemplateJson != null)
        {
            template.TemplateJson = request.TemplateJson;
        }

        if (request.ThumbnailUrl != null)
        {
            template.ThumbnailUrl = request.ThumbnailUrl;
        }

        if (request.IsActive.HasValue)
        {
            template.IsActive = request.IsActive.Value;
        }

        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Email template {TemplateId} updated successfully", templateId);

        return MapToResponse(template);
    }

    public async Task<EmailTemplateResponse> GetTemplateAsync(int clubId, int templateId)
    {
        _logger.LogInformation("Getting email template {TemplateId} for club {ClubId}", templateId, clubId);

        var template = await _context.EmailTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == templateId && t.ClubId == clubId);

        if (template == null)
        {
            throw new ArgumentException($"Template {templateId} not found for club {clubId}");
        }

        return MapToResponse(template);
    }

    public async Task<List<EmailTemplateListResponse>> GetTemplatesAsync(int clubId, bool includeInactive = false)
    {
        _logger.LogInformation("Getting email templates for club {ClubId}", clubId);

        var query = _context.EmailTemplates
            .AsNoTracking()
            .Where(t => t.ClubId == clubId);

        if (!includeInactive)
        {
            query = query.Where(t => t.IsActive);
        }

        var templates = await query
            .OrderByDescending(t => t.LastUsedAt)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();

        return templates.Select(MapToListResponse).ToList();
    }

    public async Task DeleteTemplateAsync(int clubId, int templateId)
    {
        _logger.LogInformation("Deleting email template {TemplateId} for club {ClubId}", templateId, clubId);

        var template = await _context.EmailTemplates
            .FirstOrDefaultAsync(t => t.Id == templateId && t.ClubId == clubId);

        if (template == null)
        {
            throw new ArgumentException($"Template {templateId} not found for club {clubId}");
        }

        if (template.IsSystemTemplate)
        {
            throw new InvalidOperationException("System templates cannot be deleted");
        }

        // Check if template is being used in active A/B tests
        var activeTests = await _context.ABTestCampaigns
            .AnyAsync(c => c.ClubId == clubId &&
                          (c.VariantATemplateId == templateId || c.VariantBTemplateId == templateId) &&
                          c.Status == "Running");

        if (activeTests)
        {
            throw new InvalidOperationException("Cannot delete template that is being used in active A/B tests");
        }

        _context.EmailTemplates.Remove(template);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Email template {TemplateId} deleted successfully", templateId);
    }

    public async Task<EmailTemplateResponse> DuplicateTemplateAsync(int clubId, int userId, int templateId, string newName)
    {
        _logger.LogInformation("Duplicating email template {TemplateId} for club {ClubId}", templateId, clubId);

        var sourceTemplate = await _context.EmailTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == templateId && t.ClubId == clubId);

        if (sourceTemplate == null)
        {
            throw new ArgumentException($"Template {templateId} not found for club {clubId}");
        }

        var newTemplate = new EmailTemplate
        {
            ClubId = clubId,
            TemplateName = newName,
            Description = sourceTemplate.Description,
            TemplateHtml = sourceTemplate.TemplateHtml,
            TemplateJson = sourceTemplate.TemplateJson,
            ThumbnailUrl = sourceTemplate.ThumbnailUrl,
            IsSystemTemplate = false,
            IsActive = true,
            Version = 1,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EmailTemplates.Add(newTemplate);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Email template duplicated to new template {TemplateId}", newTemplate.Id);

        return MapToResponse(newTemplate);
    }

    public async Task IncrementUsageAsync(int templateId)
    {
        var template = await _context.EmailTemplates.FindAsync(templateId);
        if (template != null)
        {
            template.UsageCount++;
            template.LastUsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    private EmailTemplateResponse MapToResponse(EmailTemplate template)
    {
        return new EmailTemplateResponse
        {
            Id = template.Id,
            ClubId = template.ClubId,
            TemplateName = template.TemplateName,
            Description = template.Description,
            TemplateHtml = template.TemplateHtml,
            TemplateJson = template.TemplateJson,
            ThumbnailUrl = template.ThumbnailUrl,
            IsSystemTemplate = template.IsSystemTemplate,
            IsActive = template.IsActive,
            Version = template.Version,
            UsageCount = template.UsageCount,
            LastUsedAt = template.LastUsedAt,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt
        };
    }

    private EmailTemplateListResponse MapToListResponse(EmailTemplate template)
    {
        return new EmailTemplateListResponse
        {
            Id = template.Id,
            TemplateName = template.TemplateName,
            Description = template.Description,
            ThumbnailUrl = template.ThumbnailUrl,
            IsSystemTemplate = template.IsSystemTemplate,
            IsActive = template.IsActive,
            UsageCount = template.UsageCount,
            LastUsedAt = template.LastUsedAt,
            CreatedAt = template.CreatedAt
        };
    }
}
