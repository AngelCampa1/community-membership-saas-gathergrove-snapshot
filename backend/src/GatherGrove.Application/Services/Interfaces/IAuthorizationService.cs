using System.Security.Claims;

namespace GatherGrove.Application.Services.Interfaces;

public interface IAuthorizationService
{
    Task<bool> CanAccessResourceAsync(int userId, string resourceType, int resourceId);
    Task<bool> HasPermissionAsync(int userId, string permission);
    Task<bool> CanExportDataAsync(int userId, int clubId, string dataType);
    Task<ClaimsPrincipal> GetUserClaimsAsync(int userId);

    // Additional methods expected by tests
    Task<int> GetUserExportQuotaAsync(int userId);
}