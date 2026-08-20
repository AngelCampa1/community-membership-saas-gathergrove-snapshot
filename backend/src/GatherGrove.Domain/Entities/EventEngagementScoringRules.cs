using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Configurable scoring rules for event engagement calculations
/// </summary>
public class EventEngagementScoringRules
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ClubId { get; set; }

    // Rule Configuration
    [Required]
    [StringLength(100)]
    public string RuleName { get; set; } = string.Empty;

    [StringLength(50)]
    public string? EventType { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public int Priority { get; set; } = 1;

    // Scoring Weights (must sum to 100)
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal AttendanceWeight { get; set; } = 30.0m;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal ParticipationWeight { get; set; } = 25.0m;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal InteractionWeight { get; set; } = 20.0m;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal SatisfactionWeight { get; set; } = 15.0m;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal NetworkingWeight { get; set; } = 10.0m;

    // Bonus Multipliers
    [Required]
    [Column(TypeName = "decimal(4,2)")]
    public decimal EarlyRegistrationBonus { get; set; } = 1.1m;

    [Required]
    [Column(TypeName = "decimal(4,2)")]
    public decimal PerfectAttendanceBonus { get; set; } = 1.2m;

    [Required]
    [Column(TypeName = "decimal(4,2)")]
    public decimal HighParticipationBonus { get; set; } = 1.15m;

    // Penalty Multipliers
    [Required]
    [Column(TypeName = "decimal(4,2)")]
    public decimal NoShowPenalty { get; set; } = 0.5m;

    [Required]
    [Column(TypeName = "decimal(4,2)")]
    public decimal LatePenalty { get; set; } = 0.9m;

    [Required]
    [Column(TypeName = "decimal(4,2)")]
    public decimal EarlyDeparturePenalty { get; set; } = 0.8m;

    // Timestamps
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public int CreatedByUserId { get; set; }

    // Navigation Properties
    public virtual Club Club { get; set; } = null!;
    public virtual User CreatedByUser { get; set; } = null!;
}