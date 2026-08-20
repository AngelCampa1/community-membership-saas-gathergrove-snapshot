namespace GatherGrove.Application.DTOs.Export;

public class BulkEmailRequest
{
    public List<string> Recipients { get; set; } = new();
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public List<EmailAttachment> Attachments { get; set; } = new();
    public Dictionary<string, string> GlobalVariables { get; set; } = new();

    /// <summary>
    /// Club identifier for the bulk email request
    /// </summary>
    public Guid ClubId { get; set; }

    /// <summary>
    /// Individual recipient email for single email requests
    /// </summary>
    public string RecipientEmail { get; set; } = string.Empty;

    /// <summary>
    /// Report name for the email request
    /// </summary>
    public string ReportName { get; set; } = string.Empty;

    /// <summary>
    /// Report data as byte array
    /// </summary>
    public byte[] ReportData { get; set; } = Array.Empty<byte>();

    /// <summary>
    /// File name for the report attachment
    /// </summary>
    public string FileName { get; set; } = string.Empty;
}

public class EmailAttachment
{
    public string FileName { get; set; } = string.Empty;
    public byte[] Content { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = "application/octet-stream";
}