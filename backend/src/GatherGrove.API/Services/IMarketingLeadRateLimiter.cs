namespace GatherGrove.API.Services;

public interface IMarketingLeadRateLimiter
{
    Task<MarketingLeadRateLimitResult> CheckAsync(string email, CancellationToken cancellationToken = default);
}

public sealed record MarketingLeadRateLimitResult(bool IsAllowed, TimeSpan RetryAfter)
{
    public static readonly MarketingLeadRateLimitResult Allowed = new(true, TimeSpan.Zero);

    public static MarketingLeadRateLimitResult Denied(TimeSpan retryAfter) => new(false, retryAfter);
}
