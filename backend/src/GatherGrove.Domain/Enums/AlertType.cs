namespace GatherGrove.Domain.Enums;

/// <summary>
/// Types of engagement alerts
/// </summary>
public enum AlertType
{
    ScoreDecline = 1,       // Score dropped by threshold amount
    InactivityWarning = 2,  // No activity for extended period
    AtRisk = 3,            // Score consistently below threshold
    CommunicationGap = 4,   // No communication interaction
    EventAbsenteeism = 5,   // Missed consecutive events
    ProfileIncomplete = 6,  // Profile completion below threshold
    FollowUp = 7,          // Follow-up task created
    PersonalOutreach = 8,   // Personal outreach assigned
    PhoneCallScheduled = 9  // Phone call scheduled
}