using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class MemberSegmentTests
{
    #region Default Value Tests (4 tests)

    [Test]
    public void Name_DefaultsToEmptyString()
    {
        var segment = new MemberSegment();
        Assert.That(segment.Name, Is.EqualTo(string.Empty));
    }

    [Test]
    public void FilterCriteria_DefaultsToEmptyJson()
    {
        var segment = new MemberSegment();
        Assert.That(segment.FilterCriteria, Is.EqualTo("{}"));
    }

    [Test]
    public void IsActive_DefaultsToTrue()
    {
        var segment = new MemberSegment();
        Assert.That(segment.IsActive, Is.True);
    }

    [Test]
    public void IsSystemGenerated_DefaultsToFalse()
    {
        var segment = new MemberSegment();
        Assert.That(segment.IsSystemGenerated, Is.False);
    }

    #endregion

    #region Basic Properties Tests (4 tests)

    [Test]
    public void Name_CanBeSet()
    {
        var segment = new MemberSegment { Name = "High Engagement Members" };
        Assert.That(segment.Name, Is.EqualTo("High Engagement Members"));
    }

    [Test]
    public void Description_CanBeSet()
    {
        var segment = new MemberSegment { Description = "Members with >80% event attendance" };
        Assert.That(segment.Description, Is.EqualTo("Members with >80% event attendance"));
    }

    [Test]
    public void ClubId_CanBeSet()
    {
        var segment = new MemberSegment { ClubId = 10 };
        Assert.That(segment.ClubId, Is.EqualTo(10));
    }

    [Test]
    public void CreatedByUserId_CanBeSet()
    {
        var segment = new MemberSegment { CreatedByUserId = 25 };
        Assert.That(segment.CreatedByUserId, Is.EqualTo(25));
    }

    #endregion

    #region Filter Criteria Tests (3 tests)

    [Test]
    public void FilterCriteria_CanStoreComplexJson()
    {
        var criteria = "{\"engagement\":{\"min\":70},\"status\":\"active\"}";
        var segment = new MemberSegment { FilterCriteria = criteria };
        Assert.That(segment.FilterCriteria, Is.EqualTo(criteria));
    }

    [Test]
    public void FilterCriteria_CanStoreMultipleConditions()
    {
        var criteria = "{\"and\":[{\"field\":\"status\",\"op\":\"eq\",\"value\":\"active\"},{\"field\":\"joinDate\",\"op\":\"gt\",\"value\":\"2024-01-01\"}]}";
        var segment = new MemberSegment { FilterCriteria = criteria };
        Assert.That(segment.FilterCriteria, Contains.Substring("and"));
        Assert.That(segment.FilterCriteria, Contains.Substring("status"));
    }

    [Test]
    public void FilterCriteria_SupportsNestedConditions()
    {
        var criteria = "{\"or\":[{\"field\":\"tier\",\"value\":\"premium\"},{\"field\":\"attendance\",\"value\":90}]}";
        var segment = new MemberSegment { FilterCriteria = criteria };
        Assert.That(segment.FilterCriteria, Is.Not.EqualTo("{}"));
    }

    #endregion

    #region Member Count Tests (3 tests)

    [Test]
    public void MemberCount_DefaultsToZero()
    {
        var segment = new MemberSegment();
        Assert.That(segment.MemberCount, Is.EqualTo(0));
    }

    [Test]
    public void MemberCount_CanBeSet()
    {
        var segment = new MemberSegment { MemberCount = 150 };
        Assert.That(segment.MemberCount, Is.EqualTo(150));
    }

    [Test]
    public void MemberCount_CanBeUpdated()
    {
        var segment = new MemberSegment { MemberCount = 100 };
        segment.MemberCount = 125;
        Assert.That(segment.MemberCount, Is.EqualTo(125));
    }

    #endregion

    #region Calculation Metrics Tests (4 tests)

    [Test]
    public void LastCalculated_CanBeSet()
    {
        var calculatedTime = DateTime.UtcNow.AddMinutes(-15);
        var segment = new MemberSegment { LastCalculated = calculatedTime };
        Assert.That(segment.LastCalculated, Is.EqualTo(calculatedTime));
    }

    [Test]
    public void CalculationDurationMs_CanBeTracked()
    {
        var segment = new MemberSegment { CalculationDurationMs = 2500 };
        Assert.That(segment.CalculationDurationMs, Is.EqualTo(2500));
    }

    [Test]
    public void SegmentCalculation_TracksPerformance()
    {
        var segment = new MemberSegment
        {
            LastCalculated = DateTime.UtcNow,
            CalculationDurationMs = 1250,
            MemberCount = 500
        };

        Assert.That(segment.LastCalculated, Is.Not.Null);
        Assert.That(segment.CalculationDurationMs, Is.GreaterThan(0));
        Assert.That(segment.MemberCount, Is.EqualTo(500));
    }

    [Test]
    public void FastCalculation_UnderOneSecond()
    {
        var segment = new MemberSegment { CalculationDurationMs = 750 };
        Assert.That(segment.CalculationDurationMs, Is.LessThan(1000));
    }

    #endregion

    #region System Generated Tests (2 tests)

    [Test]
    public void IsSystemGenerated_CanBeSetToTrue()
    {
        var segment = new MemberSegment { IsSystemGenerated = true };
        Assert.That(segment.IsSystemGenerated, Is.True);
    }

    [Test]
    public void SystemSegment_CanBeDistinguished()
    {
        var systemSegment = new MemberSegment
        {
            Name = "At Risk Members",
            IsSystemGenerated = true
        };
        var customSegment = new MemberSegment
        {
            Name = "Custom VIP List",
            IsSystemGenerated = false
        };

        Assert.That(systemSegment.IsSystemGenerated, Is.True);
        Assert.That(customSegment.IsSystemGenerated, Is.False);
    }

    #endregion
}
