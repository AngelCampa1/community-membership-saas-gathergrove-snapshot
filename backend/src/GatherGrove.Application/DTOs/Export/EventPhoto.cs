namespace GatherGrove.Application.DTOs.Export;

public class EventPhoto
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public DateTime DateTaken { get; set; }
    public int? UploadedBy { get; set; }
    public long FileSizeBytes { get; set; }
}