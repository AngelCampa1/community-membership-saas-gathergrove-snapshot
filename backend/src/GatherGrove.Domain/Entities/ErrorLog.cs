using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

public class ErrorLog
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    public string? StackTrace { get; set; }

    [Required]
    [MaxLength(100)]
    public string Source { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? RequestMethod { get; set; }

    [MaxLength(1000)]
    public string? RequestPath { get; set; }

    [MaxLength(100)]
    public string? UserId { get; set; }

    [MaxLength(50)]
    public string? UserAgent { get; set; }

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    [Required]
    [MaxLength(50)]
    public string Level { get; set; } = "Error";

    public string? AdditionalData { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? ClubId { get; set; }

    // Navigation property
    public Club? Club { get; set; }
}