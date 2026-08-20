using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services.Interfaces
{
    /// <summary>
    /// Interface for managing event check-in operations
    /// </summary>
    public interface IEventCheckinService
    {
        /// <summary>
        /// Generates a QR code for event check-in
        /// </summary>
        /// <param name="request">The QR code generation request</param>
        /// <returns>The generated QR code data</returns>
        Task<EventQRCodeResponse> GenerateEventCheckinQRCodeAsync(GenerateEventQRCodeRequest request);

        /// <summary>
        /// Checks in a member using a QR code
        /// </summary>
        /// <param name="request">The QR code check-in request</param>
        /// <returns>The check-in response</returns>
        Task<CheckinResponse> CheckinWithQRCodeAsync(QRCodeCheckinRequest request);

        /// <summary>
        /// Gets all check-ins for an event
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <returns>List of event check-ins</returns>
        Task<List<EventCheckin>> GetEventCheckinsAsync(int eventId);

        /// <summary>
        /// Gets list of event attendees with check-in status (mobile-compatible)
        /// Combines RSVP data with check-in status for display in mobile app
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <returns>List of attendees with check-in status</returns>
        Task<List<EventAttendeeDto>> GetEventAttendeesAsync(int eventId);

        /// <summary>
        /// Checks out a member from an event
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <param name="memberId">The member ID</param>
        /// <param name="checkoutTime">The checkout time</param>
        /// <returns>The checkout response</returns>
        Task<CheckinResponse> CheckoutMemberAsync(int eventId, int memberId, DateTime checkoutTime);

        /// <summary>
        /// Generates a member-specific QR code for an event
        /// </summary>
        /// <param name="request">The member QR code generation request</param>
        /// <returns>The generated member QR code</returns>
        Task<DTOs.MemberEventQRCode> GenerateMemberQRCodeAsync(GenerateMemberQRCodeRequest request);

        /// <summary>
        /// Gets check-in statistics for an event
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <returns>Check-in statistics</returns>
        Task<CheckinStatisticsResponse> GetCheckinStatisticsAsync(int eventId);

        /// <summary>
        /// Performs manual check-in for a member
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <param name="memberId">The member ID</param>
        /// <param name="checkinTime">The check-in time</param>
        /// <param name="location">The check-in location</param>
        /// <returns>The check-in response</returns>
        Task<CheckinResponse> ManualCheckinAsync(int eventId, int memberId, DateTime checkinTime, string? location = null);

        /// <summary>
        /// Gets check-in history for a specific member
        /// </summary>
        /// <param name="memberId">The member ID</param>
        /// <param name="eventId">Optional event ID to filter by</param>
        /// <returns>List of member's check-ins</returns>
        Task<List<EventCheckin>> GetMemberCheckinHistoryAsync(int memberId, int? eventId = null);

        /// <summary>
        /// Validates if a member can check in to an event
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <param name="memberId">The member ID</param>
        /// <returns>Validation result with details</returns>
        Task<(bool CanCheckin, string? Reason)> ValidateCheckinEligibilityAsync(int eventId, int memberId);
    }
}