namespace GatherGrove.Application.DTOs.Export;

/// <summary>
/// Security event information
/// </summary>
public class SecurityEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public int UserId { get; set; }
    public int ClubId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Dictionary<string, string> AdditionalData { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string IPAddress { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string Severity { get; set; } = "Info";
}