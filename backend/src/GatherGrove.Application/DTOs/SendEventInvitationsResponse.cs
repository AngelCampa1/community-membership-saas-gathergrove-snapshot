namespace GatherGrove.Application.DTOs;

/// <summary>
/// Response from sending event invitations
/// </summary>
public class SendEventInvitationsResponse
{
    /// <summary>
    /// Success message describing the invitations sent
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Number of members who received invitations
    /// </summary>
    public int SentCount { get; set; }
}