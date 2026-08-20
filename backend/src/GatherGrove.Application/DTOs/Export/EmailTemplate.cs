namespace GatherGrove.Application.DTOs.Export;

public class EmailTemplate
{
    public string TemplateId { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string PlainTextBody { get; set; } = string.Empty;
    public List<string> Recipients { get; set; } = new();
    public Dictionary<string, string> Variables { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Type of the email template
    /// </summary>
    public string TemplateType { get; set; } = string.Empty;

    /// <summary>
    /// Email body content
    /// </summary>
    public string Body { get; set; } = string.Empty;
}