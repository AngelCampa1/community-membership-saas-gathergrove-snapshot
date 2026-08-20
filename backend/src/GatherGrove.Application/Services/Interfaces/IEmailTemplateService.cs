using GatherGrove.Application.DTOs.Export;

namespace GatherGrove.Application.Services.Interfaces;

public interface IEmailTemplateService
{
    Task<EmailTemplate> GetTemplateAsync(string templateName);
    Task<string> ProcessTemplateAsync(string templateContent, Dictionary<string, string> variables);
    Task UpdateTemplateAsync(EmailTemplate template);
}