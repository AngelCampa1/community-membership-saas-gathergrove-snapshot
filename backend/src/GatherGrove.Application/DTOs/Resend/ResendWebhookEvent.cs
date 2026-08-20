using System.Text.Json.Serialization;

namespace GatherGrove.Application.DTOs.Resend;

/// <summary>
/// Resend webhook event envelope
/// </summary>
public class ResendWebhookEvent
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("data")]
    public ResendEmailData Data { get; set; } = new();
}

/// <summary>
/// Email data from Resend webhook
/// </summary>
public class ResendEmailData
{
    [JsonPropertyName("email_id")]
    public string EmailId { get; set; } = string.Empty;

    [JsonPropertyName("from")]
    public string From { get; set; } = string.Empty;

    [JsonPropertyName("to")]
    public List<string> To { get; set; } = new();

    [JsonPropertyName("subject")]
    public string Subject { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string? Text { get; set; }

    [JsonPropertyName("html")]
    public string? Html { get; set; }

    [JsonPropertyName("headers")]
    public Dictionary<string, string> Headers { get; set; } = new();

    [JsonPropertyName("attachments")]
    public List<ResendEmailAttachment> Attachments { get; set; } = new();
}

/// <summary>
/// Email attachment from Resend webhook
/// </summary>
public class ResendEmailAttachment
{
    [JsonPropertyName("filename")]
    public string Filename { get; set; } = string.Empty;

    [JsonPropertyName("content_type")]
    public string ContentType { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty; // Base64 encoded
}
