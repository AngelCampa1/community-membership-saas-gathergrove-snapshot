namespace GatherGrove.API.Services;

public interface ITurnstileVerificationService
{
    Task<bool> VerifyAsync(string? token, string? remoteIp, CancellationToken cancellationToken = default);
}
