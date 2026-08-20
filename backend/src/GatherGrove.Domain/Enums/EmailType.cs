namespace GatherGrove.Domain.Enums;

/// <summary>
/// Types of emails sent by the system for tracking and limiting purposes
/// </summary>
public enum EmailType
{
    /// <summary>
    /// Direct communication sent by club admin (counts toward tier limit)
    /// </summary>
    AdminCommunication = 1,

    /// <summary>
    /// System-generated member account activation email (does not count toward limit)
    /// </summary>
    MemberActivation = 2,

    /// <summary>
    /// System-generated payment request email (does not count toward limit)
    /// </summary>
    PaymentRequest = 3,

    /// <summary>
    /// System-generated event invitation email (does not count toward limit)
    /// </summary>
    EventInvitation = 4,

    /// <summary>
    /// System-generated password reset email (does not count toward limit)
    /// </summary>
    PasswordReset = 5,

    /// <summary>
    /// System-generated notification email (does not count toward limit)
    /// </summary>
    SystemNotification = 6
}