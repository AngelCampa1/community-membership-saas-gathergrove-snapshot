using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class ClubEmailUsageTests
{
    #region Usage Tracking Tests (6 tests)

    [Test]
    public void UsageMonth_CanBeSet()
    {
        var usageMonth = new DateTime(2025, 1, 1);
        var usage = new ClubEmailUsage { UsageMonth = usageMonth };
        Assert.That(usage.UsageMonth, Is.EqualTo(usageMonth));
    }

    [Test]
    public void UsageMonth_ShouldBeFirstDayOfMonth()
    {
        var usage = new ClubEmailUsage { UsageMonth = new DateTime(2025, 3, 1) };
        Assert.That(usage.UsageMonth.Day, Is.EqualTo(1));
    }

    [Test]
    public void AdminEmailsSentCount_CanBeSet()
    {
        var usage = new ClubEmailUsage { AdminEmailsSentCount = 150 };
        Assert.That(usage.AdminEmailsSentCount, Is.EqualTo(150));
    }

    [Test]
    public void AdminEmailsSentCount_CanBeIncremented()
    {
        var usage = new ClubEmailUsage { AdminEmailsSentCount = 100 };
        usage.AdminEmailsSentCount += 25;
        Assert.That(usage.AdminEmailsSentCount, Is.EqualTo(125));
    }

    [Test]
    public void NewUsageRecord_StartsAtZero()
    {
        var usage = new ClubEmailUsage
        {
            UsageMonth = new DateTime(2025, 1, 1),
            AdminEmailsSentCount = 0
        };

        Assert.That(usage.AdminEmailsSentCount, Is.EqualTo(0));
    }

    [Test]
    public void MonthlyUsage_CanTrackHighVolume()
    {
        var usage = new ClubEmailUsage
        {
            UsageMonth = new DateTime(2025, 2, 1),
            AdminEmailsSentCount = 5000
        };

        Assert.That(usage.AdminEmailsSentCount, Is.EqualTo(5000));
    }

    #endregion

    #region Tier Limit Scenarios Tests (6 tests)

    [Test]
    public void BasicTierUsage_CanTrackUpTo500Emails()
    {
        var usage = new ClubEmailUsage
        {
            AdminEmailsSentCount = 500,
            UsageMonth = new DateTime(2025, 1, 1)
        };

        Assert.That(usage.AdminEmailsSentCount, Is.EqualTo(500));
    }

    [Test]
    public void GrowTierUsage_CanTrackUpTo5000Emails()
    {
        var usage = new ClubEmailUsage
        {
            AdminEmailsSentCount = 5000,
            UsageMonth = new DateTime(2025, 1, 1)
        };

        Assert.That(usage.AdminEmailsSentCount, Is.EqualTo(5000));
    }

    [Test]
    public void UnlimitedTierUsage_CanExceedNormalLimits()
    {
        var usage = new ClubEmailUsage
        {
            AdminEmailsSentCount = 15000,
            UsageMonth = new DateTime(2025, 1, 1)
        };

        Assert.That(usage.AdminEmailsSentCount, Is.GreaterThan(5000));
    }

    [Test]
    public void ApproachingLimit_CanBeDetected()
    {
        var basicLimit = 500;
        var usage = new ClubEmailUsage
        {
            AdminEmailsSentCount = 475,
            UsageMonth = new DateTime(2025, 1, 1)
        };

        var remaining = basicLimit - usage.AdminEmailsSentCount;
        Assert.That(remaining, Is.EqualTo(25));
        Assert.That(remaining, Is.LessThan(50)); // Within warning threshold
    }

    [Test]
    public void MonthlyReset_StartsNewPeriod()
    {
        var januaryUsage = new ClubEmailUsage
        {
            UsageMonth = new DateTime(2025, 1, 1),
            AdminEmailsSentCount = 500
        };

        var februaryUsage = new ClubEmailUsage
        {
            UsageMonth = new DateTime(2025, 2, 1),
            AdminEmailsSentCount = 0
        };

        Assert.That(januaryUsage.AdminEmailsSentCount, Is.EqualTo(500));
        Assert.That(februaryUsage.AdminEmailsSentCount, Is.EqualTo(0));
        Assert.That(februaryUsage.UsageMonth, Is.GreaterThan(januaryUsage.UsageMonth));
    }

    [Test]
    public void OverageTracking_CanExceedTierLimit()
    {
        var basicLimit = 500;
        var usage = new ClubEmailUsage
        {
            AdminEmailsSentCount = 550,
            UsageMonth = new DateTime(2025, 1, 1)
        };

        var overage = usage.AdminEmailsSentCount - basicLimit;
        Assert.That(overage, Is.EqualTo(50));
        Assert.That(usage.AdminEmailsSentCount, Is.GreaterThan(basicLimit));
    }

    #endregion

    #region Timestamp Tests (3 tests)

    [Test]
    public void CreatedAt_CanBeSet()
    {
        var created = DateTime.UtcNow.AddDays(-30);
        var usage = new ClubEmailUsage { CreatedAt = created };
        Assert.That(usage.CreatedAt, Is.EqualTo(created));
    }

    [Test]
    public void UpdatedAt_CanBeSet()
    {
        var updated = DateTime.UtcNow.AddMinutes(-5);
        var usage = new ClubEmailUsage { UpdatedAt = updated };
        Assert.That(usage.UpdatedAt, Is.EqualTo(updated));
    }

    [Test]
    public void UpdatedAt_ShouldBeAfterCreatedAt()
    {
        var usage = new ClubEmailUsage
        {
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };

        Assert.That(usage.UpdatedAt, Is.GreaterThan(usage.CreatedAt));
    }

    #endregion

    #region Historical Tracking Tests (3 tests)

    [Test]
    public void MultipleMonths_CanBeTrackedSeparately()
    {
        var month1 = new ClubEmailUsage
        {
            ClubId = 1,
            UsageMonth = new DateTime(2025, 1, 1),
            AdminEmailsSentCount = 200
        };

        var month2 = new ClubEmailUsage
        {
            ClubId = 1,
            UsageMonth = new DateTime(2025, 2, 1),
            AdminEmailsSentCount = 350
        };

        Assert.That(month1.ClubId, Is.EqualTo(month2.ClubId));
        Assert.That(month1.UsageMonth, Is.Not.EqualTo(month2.UsageMonth));
        Assert.That(month1.AdminEmailsSentCount, Is.Not.EqualTo(month2.AdminEmailsSentCount));
    }

    [Test]
    public void YearOverYear_CanCompareUsage()
    {
        var year2024 = new ClubEmailUsage
        {
            UsageMonth = new DateTime(2024, 12, 1),
            AdminEmailsSentCount = 300
        };

        var year2025 = new ClubEmailUsage
        {
            UsageMonth = new DateTime(2025, 12, 1),
            AdminEmailsSentCount = 450
        };

        var growth = year2025.AdminEmailsSentCount - year2024.AdminEmailsSentCount;
        Assert.That(growth, Is.EqualTo(150));
    }

    [Test]
    public void QuarterlyUsage_CanBeAggregated()
    {
        var q1Usage = new[]
        {
            new ClubEmailUsage { UsageMonth = new DateTime(2025, 1, 1), AdminEmailsSentCount = 100 },
            new ClubEmailUsage { UsageMonth = new DateTime(2025, 2, 1), AdminEmailsSentCount = 150 },
            new ClubEmailUsage { UsageMonth = new DateTime(2025, 3, 1), AdminEmailsSentCount = 200 }
        };

        var totalQ1 = q1Usage.Sum(u => u.AdminEmailsSentCount);
        Assert.That(totalQ1, Is.EqualTo(450));
    }

    #endregion
}
