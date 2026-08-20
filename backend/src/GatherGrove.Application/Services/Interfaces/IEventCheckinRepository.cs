using GatherGrove.Domain.Entities;

namespace GatherGrove.Application.Services.Interfaces
{
    public interface IEventCheckinRepository
    {
        Task<EventCheckin> CreateAsync(EventCheckin checkin);
        Task<EventCheckin?> GetByIdAsync(int id);
        Task<IEnumerable<EventCheckin>> GetByEventIdAsync(int eventId);
        Task<IEnumerable<EventCheckin>> GetByMemberIdAsync(int memberId);
        Task<EventCheckin?> GetByQRCodeAsync(string qrCodeData);
        Task<bool> IsCheckedInAsync(int eventId, int memberId);
        Task UpdateAsync(EventCheckin checkin);
        Task DeleteAsync(int id);
        Task<IEnumerable<EventCheckin>> GetEventCheckinsAsync(int eventId);
        Task<EventCheckin?> GetActiveCheckinAsync(int eventId, int memberId);
        Task UpdateCheckinAsync(EventCheckin checkin);
        Task<EventRsvp?> GetRSVPAsync(int eventId, int memberId);
        Task<bool> HasCheckedInAsync(int eventId, int memberId);
        Task<EventCheckin> CreateCheckinAsync(EventCheckin checkin);
    }
}