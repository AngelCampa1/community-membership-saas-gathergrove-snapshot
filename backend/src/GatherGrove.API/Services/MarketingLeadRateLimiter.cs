using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace GatherGrove.API.Services;

public sealed class MarketingLeadRateLimiter : IMarketingLeadRateLimiter
{
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(10);
    private const int PermitLimit = 3;
    private readonly IMemoryCache _cache;

    public MarketingLeadRateLimiter(IMemoryCache cache)
    {
        _cache = cache;
    }

    public Task<MarketingLeadRateLimitResult> CheckAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var key = $"marketing-lead-email:{Sha256(normalizedEmail)}";
        var now = DateTimeOffset.UtcNow;

        var bucket = _cache.Get<Bucket>(key);
        if (bucket is null || now >= bucket.ResetAt)
        {
            bucket = new Bucket(1, now.Add(Window));
            _cache.Set(key, bucket, bucket.ResetAt);
            return Task.FromResult(MarketingLeadRateLimitResult.Allowed);
        }

        if (bucket.Count >= PermitLimit)
        {
            return Task.FromResult(MarketingLeadRateLimitResult.Denied(bucket.ResetAt - now));
        }

        bucket = bucket with { Count = bucket.Count + 1 };
        _cache.Set(key, bucket, bucket.ResetAt);
        return Task.FromResult(MarketingLeadRateLimitResult.Allowed);
    }

    private static string Sha256(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }

    private sealed record Bucket(int Count, DateTimeOffset ResetAt);
}
