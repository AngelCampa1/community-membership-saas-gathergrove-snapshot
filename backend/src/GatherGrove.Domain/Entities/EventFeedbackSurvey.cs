using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Domain.Entities;

/// <summary>
/// Represents a feedback survey for an event
/// </summary>
public class EventFeedbackSurvey
{
    /// <summary>
    /// Unique identifier for the survey
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The event this survey is for
    /// </summary>
    public int EventId { get; set; }

    /// <summary>
    /// Title of the survey
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Description of the survey
    /// </summary>
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Whether responses are anonymous
    /// </summary>
    public bool IsAnonymous { get; set; } = false;

    /// <summary>
    /// Whether the survey is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When the survey closes (optional)
    /// </summary>
    public DateTime? ClosesAt { get; set; }

    /// <summary>
    /// When this survey was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When this survey was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property for the event
    /// </summary>
    public virtual Event Event { get; set; } = null!;

    /// <summary>
    /// Navigation property for survey questions
    /// </summary>
    public virtual ICollection<SurveyQuestion> Questions { get; set; } = new List<SurveyQuestion>();

    /// <summary>
    /// Navigation property for survey responses
    /// </summary>
    public virtual ICollection<EventFeedbackResponse> Responses { get; set; } = new List<EventFeedbackResponse>();
}

/// <summary>
/// Represents a question in a feedback survey
/// </summary>
public class SurveyQuestion
{
    /// <summary>
    /// Unique identifier for the question
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The survey this question belongs to
    /// </summary>
    public int SurveyId { get; set; }

    /// <summary>
    /// Order of this question in the survey
    /// </summary>
    public int QuestionOrder { get; set; }

    /// <summary>
    /// The question text
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Type of question
    /// </summary>
    public QuestionType Type { get; set; }

    /// <summary>
    /// Whether this question is required
    /// </summary>
    public bool IsRequired { get; set; } = false;

    /// <summary>
    /// Available options for multiple choice questions
    /// </summary>
    public List<string>? Options { get; set; }

    /// <summary>
    /// Minimum value for rating questions
    /// </summary>
    public int? MinValue { get; set; }

    /// <summary>
    /// Maximum value for rating questions
    /// </summary>
    public int? MaxValue { get; set; }

    /// <summary>
    /// Navigation property for the survey
    /// </summary>
    public virtual EventFeedbackSurvey Survey { get; set; } = null!;

    /// <summary>
    /// Navigation property for responses to this question
    /// </summary>
    public virtual ICollection<SurveyResponse> Responses { get; set; } = new List<SurveyResponse>();
}

/// <summary>
/// Represents a member's response to a feedback survey
/// </summary>
public class EventFeedbackResponse
{
    /// <summary>
    /// Unique identifier for the response
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The survey being responded to
    /// </summary>
    public int SurveyId { get; set; }

    /// <summary>
    /// The member responding (null for anonymous surveys)
    /// </summary>
    public int? MemberId { get; set; }

    /// <summary>
    /// When the response was submitted
    /// </summary>
    public DateTime SubmittedAt { get; set; }

    /// <summary>
    /// IP address of the respondent (for tracking purposes)
    /// </summary>
    [MaxLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent of the respondent
    /// </summary>
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Navigation property for the survey
    /// </summary>
    public virtual EventFeedbackSurvey Survey { get; set; } = null!;

    /// <summary>
    /// Navigation property for the member (if not anonymous)
    /// </summary>
    public virtual Member? Member { get; set; }

    /// <summary>
    /// Navigation property for individual question responses
    /// </summary>
    public virtual ICollection<SurveyResponse> Responses { get; set; } = new List<SurveyResponse>();
}

/// <summary>
/// Represents a response to a specific survey question
/// </summary>
public class SurveyResponse
{
    /// <summary>
    /// Unique identifier for the response
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The feedback response this belongs to
    /// </summary>
    public int FeedbackResponseId { get; set; }

    /// <summary>
    /// The question being answered
    /// </summary>
    public int QuestionId { get; set; }

    /// <summary>
    /// The answer text
    /// </summary>
    [MaxLength(2000)]
    public string Answer { get; set; } = string.Empty;

    /// <summary>
    /// Numeric value for rating questions
    /// </summary>
    public int? NumericValue { get; set; }

    /// <summary>
    /// Type of question this response is for
    /// </summary>
    public QuestionType QuestionType { get; set; }

    /// <summary>
    /// Navigation property for the feedback response
    /// </summary>
    public virtual EventFeedbackResponse FeedbackResponse { get; set; } = null!;

    /// <summary>
    /// Navigation property for the question
    /// </summary>
    public virtual SurveyQuestion Question { get; set; } = null!;
}

/// <summary>
/// Question type enumeration
/// </summary>
public enum QuestionType
{
    Text = 1,
    TextArea = 2,
    MultipleChoice = 3,
    Rating = 4,
    YesNo = 5,
    Checkbox = 6,
    Dropdown = 7,
    Date = 8,
    Number = 9
}