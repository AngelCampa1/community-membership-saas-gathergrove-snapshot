using GatherGrove.Application.DTOs;

namespace GatherGrove.Application.Services;

public interface IMemberInviteCodeService
{
    Task<(bool Success, string Message, MemberInviteCodeResponse? Data)> CreateInviteCodeAsync(int clubId, int userId, CreateMemberInviteCodeRequest request);
    Task<(bool Success, string Message, List<MemberInviteCodeResponse> Data)> GetClubInviteCodesAsync(int clubId, int userId);
    Task<(bool Success, string Message, MemberInviteCodeResponse? Data)> GetInviteCodeByCodeAsync(string code);
    Task<(bool Success, string Message, MemberInviteCodeResponse? Data)> GetInviteCodeByIdAsync(int id, int clubId, int userId);
    Task<(bool Success, string Message)> ToggleInviteCodeStatusAsync(int id, int clubId, int userId);
    Task<(bool Success, string Message)> DeleteInviteCodeAsync(int id, int clubId, int userId);
    Task<(bool Success, string Message, MemberResponse? Data)> RegisterMemberWithInviteCodeAsync(RegisterWithInviteCodeRequest request);
    Task<(bool Success, string Message, MemberInviteCodeResponse? Data)> ValidateInviteCodeAsync(string code);
}