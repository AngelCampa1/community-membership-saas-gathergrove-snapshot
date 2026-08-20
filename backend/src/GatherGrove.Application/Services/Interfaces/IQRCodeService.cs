using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services.Interfaces
{
    public interface IQRCodeService
    {
        Task<EventQRCodeResponse> GenerateEventQRCodeAsync(GenerateEventQRCodeRequest request);
        Task<QRCodeValidationResult> ValidateQRCodeAsync(QRCodeCheckinRequest request);
        Task DeactivateQRCodeAsync(int qrCodeId);
        Task<EventQRCodeResponse> RefreshQRCodeAsync(int qrCodeId, DateTime newExpirationTime);
        Task<QRCodeUsageStats> GetQRCodeUsageStatsAsync(int qrCodeId);
        Task<List<EventQRCodeResponse>> BulkGenerateQRCodesAsync(BulkGenerateQRCodesRequest request);
        Task<List<EventQRCodeResponse>> GetEventQRCodesAsync(int eventId);
        Task<DTOs.MemberEventQRCode> GenerateMemberQRCodeAsync(GenerateMemberQRCodeRequest request);
    }
}