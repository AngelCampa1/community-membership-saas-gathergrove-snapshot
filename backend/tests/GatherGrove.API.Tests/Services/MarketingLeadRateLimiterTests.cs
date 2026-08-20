using FluentAssertions;
using GatherGrove.API.Services;
using Microsoft.Extensions.Caching.Memory;

namespace GatherGrove.API.Tests.Services;

[TestFixture]
public class MarketingLeadRateLimiterTests
{
    private MemoryCache _cache = null!;
    private MarketingLeadRateLimiter _rateLimiter = null!;

    [SetUp]
    public void SetUp()
    {
        _cache = new MemoryCache(new MemoryCacheOptions());
        _rateLimiter = new MarketingLeadRateLimiter(_cache);
    }

    [TearDown]
    public void TearDown()
    {
        _cache.Dispose();
    }

    [Test]
    public async Task CheckAsync_AllowsThreeAttemptsThenDeniesNormalizedEmail()
    {
        // Act
        var first = await _rateLimiter.CheckAsync("Target@Example.com");
        var second = await _rateLimiter.CheckAsync(" target@example.com ");
        var third = await _rateLimiter.CheckAsync("target@example.com");
        var fourth = await _rateLimiter.CheckAsync("TARGET@example.com");

        // Assert
        first.IsAllowed.Should().BeTrue();
        second.IsAllowed.Should().BeTrue();
        third.IsAllowed.Should().BeTrue();
        fourth.IsAllowed.Should().BeFalse();
        fourth.RetryAfter.Should().BeGreaterThan(TimeSpan.Zero);
    }
}
