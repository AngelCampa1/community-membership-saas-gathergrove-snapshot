using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

/// <summary>
/// Service for managing email templates for advanced communications
/// </summary>
public interface ICommunicationTemplateService
{
    /// <summary>
    /// Creates a new email template
    /// </summary>
    Task<EmailTemplateResponse> CreateTemplateAsync(int clubId, int userId, CreateEmailTemplateRequest request);

    /// <summary>
    /// Updates an existing email template
    /// </summary>
    Task<EmailTemplateResponse> UpdateTemplateAsync(int clubId, int templateId, UpdateEmailTemplateRequest request);

    /// <summary>
    /// Gets an email template by ID
    /// </summary>
    Task<EmailTemplateResponse> GetTemplateAsync(int clubId, int templateId);

    /// <summary>
    /// Gets all email templates for a club
    /// </summary>
    Task<List<EmailTemplateListResponse>> GetTemplatesAsync(int clubId, bool includeInactive = false);

    /// <summary>
    /// Deletes an email template
    /// </summary>
    Task DeleteTemplateAsync(int clubId, int templateId);

    /// <summary>
    /// Duplicates an existing template
    /// </summary>
    Task<EmailTemplateResponse> DuplicateTemplateAsync(int clubId, int userId, int templateId, string newName);

    /// <summary>
    /// Increments usage count when template is used
    /// </summary>
    Task IncrementUsageAsync(int templateId);
}

