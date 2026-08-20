using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents feedback for an event
/// </summary>
public class EventFeedback
{
    /// <summary>
    /// Unique identifier for the feedback
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The event this feedback is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// The member who provided this feedback
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Rating from 1-5
    /// </summary>
    [Range(1, 5)]
    public int Rating { get; set; }

    /// <summary>
    /// Optional comments about the event
    /// </summary>
    public string? Comments { get; set; }

    /// <summary>
    /// When this feedback was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this feedback was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the event
    /// </summary>
    public virtual Event Event { get; set; } = null!;

    /// <summary>
    /// Navigation property for the member
    /// </summary>
    public virtual Member Member { get; set; } = null!;
}