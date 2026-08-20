using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class MemberSegmentCacheTests
{
    #region Default Value Tests (2 tests)

    [Test]
    public void CachedAt_DefaultsToUtcNow()
    {
        var beforeCreation = DateTime.UtcNow.AddSeconds(-1);
        var cache = new MemberSegmentCache();
        var afterCreation = DateTime.UtcNow.AddSeconds(1);

        Assert.That(cache.CachedAt, Is.GreaterThan(beforeCreation));
        Assert.That(cache.CachedAt, Is.LessThan(afterCreation));
    }

    [Test]
    public void IsValid_DefaultsToTrue()
    {
        var cache = new MemberSegmentCache();
        Assert.That(cache.IsValid, Is.True);
    }

    #endregion

    #region Basic Properties Tests (3 tests)

    [Test]
    public void MemberId_CanBeSet()
    {
        var cache = new MemberSegmentCache { MemberId = 100 };
        Assert.That(cache.MemberId, Is.EqualTo(100));
    }

    [Test]
    public void SegmentId_CanBeSet()
    {
        var cache = new MemberSegmentCache { SegmentId = 10 };
        Assert.That(cache.SegmentId, Is.EqualTo(10));
    }

    [Test]
    public void CacheEntry_TracksAllFields()
    {
        var cache = new MemberSegmentCache
        {
            MemberId = 200,
            SegmentId = 5,
            CachedAt = DateTime.UtcNow,
            IsValid = true
        };

        Assert.That(cache.MemberId, Is.EqualTo(200));
        Assert.That(cache.SegmentId, Is.EqualTo(5));
        Assert.That(cache.IsValid, Is.True);
    }

    #endregion

    #region Cache Invalidation Tests (4 tests)

    [Test]
    public void IsValid_CanBeSetToFalse()
    {
        var cache = new MemberSegmentCache { IsValid = false };
        Assert.That(cache.IsValid, Is.False);
    }

    [Test]
    public void InvalidatedCache_CanBeIdentified()
    {
        var validCache = new MemberSegmentCache { IsValid = true };
        var invalidCache = new MemberSegmentCache { IsValid = false };

        Assert.That(validCache.IsValid, Is.True);
        Assert.That(invalidCache.IsValid, Is.False);
    }

    [Test]
    public void StaleCache_CanBeMarkedInvalid()
    {
        var cache = new MemberSegmentCache
        {
            CachedAt = DateTime.UtcNow.AddDays(-30),
            IsValid = false
        };

        Assert.That(cache.IsValid, Is.False);
        Assert.That(cache.CachedAt, Is.LessThan(DateTime.UtcNow.AddDays(-29)));
    }

    [Test]
    public void FreshCache_IsValid()
    {
        var cache = new MemberSegmentCache
        {
            CachedAt = DateTime.UtcNow.AddMinutes(-5),
            IsValid = true
        };

        Assert.That(cache.IsValid, Is.True);
        Assert.That(cache.CachedAt, Is.GreaterThan(DateTime.UtcNow.AddMinutes(-6)));
    }

    #endregion

    #region Cache Performance Scenarios Tests (3 tests)

    [Test]
    public void RecentlyCalculated_HasRecentTimestamp()
    {
        var cache = new MemberSegmentCache
        {
            MemberId = 50,
            SegmentId = 3,
            CachedAt = DateTime.UtcNow.AddMinutes(-1)
        };

        var cacheAge = DateTime.UtcNow - cache.CachedAt;
        Assert.That(cacheAge.TotalMinutes, Is.LessThan(2));
    }

    [Test]
    public void BulkCacheRefresh_AllHaveSameTimestamp()
    {
        var refreshTime = DateTime.UtcNow;
        var cache1 = new MemberSegmentCache { MemberId = 10, SegmentId = 1, CachedAt = refreshTime };
        var cache2 = new MemberSegmentCache { MemberId = 20, SegmentId = 1, CachedAt = refreshTime };
        var cache3 = new MemberSegmentCache { MemberId = 30, SegmentId = 1, CachedAt = refreshTime };

        Assert.That(cache1.CachedAt, Is.EqualTo(cache2.CachedAt));
        Assert.That(cache2.CachedAt, Is.EqualTo(cache3.CachedAt));
    }

    [Test]
    public void OldCache_CanBeRefreshed()
    {
        var oldCacheTime = DateTime.UtcNow.AddDays(-7);
        var newCacheTime = DateTime.UtcNow;

        var cache = new MemberSegmentCache
        {
            MemberId = 100,
            SegmentId = 5,
            CachedAt = oldCacheTime,
            IsValid = false
        };

        // Simulate refresh
        cache.CachedAt = newCacheTime;
        cache.IsValid = true;

        Assert.That(cache.CachedAt, Is.GreaterThan(oldCacheTime));
        Assert.That(cache.IsValid, Is.True);
    }

    #endregion
}
