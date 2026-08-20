using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class SegmentFilterTemplateTests
{
    #region Default Value Tests (4 tests)

    [Test]
    public void Name_DefaultsToEmptyString()
    {
        var template = new SegmentFilterTemplate();
        Assert.That(template.Name, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Category_DefaultsToGeneral()
    {
        var template = new SegmentFilterTemplate();
        Assert.That(template.Category, Is.EqualTo("General"));
    }

    [Test]
    public void IsSystemTemplate_DefaultsToFalse()
    {
        var template = new SegmentFilterTemplate();
        Assert.That(template.IsSystemTemplate, Is.False);
    }

    [Test]
    public void IsActive_DefaultsToTrue()
    {
        var template = new SegmentFilterTemplate();
        Assert.That(template.IsActive, Is.True);
    }

    #endregion

    #region Category Tests (5 tests)

    [Test]
    public void Category_CanBeMembership()
    {
        var template = new SegmentFilterTemplate { Category = "Membership" };
        Assert.That(template.Category, Is.EqualTo("Membership"));
    }

    [Test]
    public void Category_CanBeEngagement()
    {
        var template = new SegmentFilterTemplate { Category = "Engagement" };
        Assert.That(template.Category, Is.EqualTo("Engagement"));
    }

    [Test]
    public void Category_CanBeFinancial()
    {
        var template = new SegmentFilterTemplate { Category = "Financial" };
        Assert.That(template.Category, Is.EqualTo("Financial"));
    }

    [Test]
    public void Category_CanBeDemographic()
    {
        var template = new SegmentFilterTemplate { Category = "Demographic" };
        Assert.That(template.Category, Is.EqualTo("Demographic"));
    }

    [Test]
    public void DifferentCategories_CanBeUsedToOrganizeTemplates()
    {
        var membershipTemplate = new SegmentFilterTemplate { Category = "Membership" };
        var engagementTemplate = new SegmentFilterTemplate { Category = "Engagement" };

        Assert.That(membershipTemplate.Category, Is.Not.EqualTo(engagementTemplate.Category));
    }

    #endregion

    #region Filter Criteria Tests (4 tests)

    [Test]
    public void FilterCriteria_DefaultsToEmptyString()
    {
        var template = new SegmentFilterTemplate();
        Assert.That(template.FilterCriteria, Is.EqualTo(string.Empty));
    }

    [Test]
    public void FilterCriteria_CanStoreJsonConfiguration()
    {
        var template = new SegmentFilterTemplate
        {
            FilterCriteria = "{\"membershipStatus\":\"Active\",\"joinedAfter\":\"2024-01-01\"}"
        };
        Assert.That(template.FilterCriteria, Contains.Substring("membershipStatus"));
        Assert.That(template.FilterCriteria, Contains.Substring("Active"));
    }

    [Test]
    public void FilterCriteria_CanHaveComplexConditions()
    {
        var template = new SegmentFilterTemplate
        {
            FilterCriteria = "{\"AND\":[{\"field\":\"status\",\"operator\":\"equals\",\"value\":\"Active\"},{\"field\":\"lastActivity\",\"operator\":\"greaterThan\",\"value\":\"2024-01-01\"}]}"
        };
        Assert.That(template.FilterCriteria, Contains.Substring("AND"));
        Assert.That(template.FilterCriteria, Contains.Substring("operator"));
    }

    [Test]
    public void FilterCriteria_CanTargetSpecificProperties()
    {
        var template = new SegmentFilterTemplate
        {
            Name = "High Engagement Members",
            FilterCriteria = "{\"eventsAttended\":{\"greaterThan\":10}}"
        };
        Assert.That(template.FilterCriteria, Contains.Substring("eventsAttended"));
    }

    #endregion

    #region Template Type Tests (3 tests)

    [Test]
    public void SystemTemplate_CanBeIdentified()
    {
        var systemTemplate = new SegmentFilterTemplate { IsSystemTemplate = true };
        var customTemplate = new SegmentFilterTemplate { IsSystemTemplate = false };

        Assert.That(systemTemplate.IsSystemTemplate, Is.True);
        Assert.That(customTemplate.IsSystemTemplate, Is.False);
    }

    [Test]
    public void Description_CanExplainTemplate()
    {
        var template = new SegmentFilterTemplate
        {
            Name = "Active VIP Members",
            Description = "Members with VIP status who attended at least 5 events"
        };
        Assert.That(template.Description, Is.EqualTo("Members with VIP status who attended at least 5 events"));
    }

    [Test]
    public void Description_CanBeNull()
    {
        var template = new SegmentFilterTemplate { Description = null };
        Assert.That(template.Description, Is.Null);
    }

    #endregion

    #region Usage Tracking Tests (4 tests)

    [Test]
    public void UsageCount_DefaultsToZero()
    {
        var template = new SegmentFilterTemplate();
        Assert.That(template.UsageCount, Is.EqualTo(0));
    }

    [Test]
    public void UsageCount_CanBeIncremented()
    {
        var template = new SegmentFilterTemplate { UsageCount = 25 };
        Assert.That(template.UsageCount, Is.EqualTo(25));
    }

    [Test]
    public void PopularTemplate_HasHighUsageCount()
    {
        var template = new SegmentFilterTemplate
        {
            Name = "Active Members",
            UsageCount = 150
        };
        Assert.That(template.UsageCount, Is.GreaterThan(100));
    }

    [Test]
    public void UnusedTemplate_HasZeroUsageCount()
    {
        var template = new SegmentFilterTemplate
        {
            Name = "Experimental Filter",
            UsageCount = 0,
            IsActive = false
        };
        Assert.That(template.UsageCount, Is.EqualTo(0));
    }

    #endregion

    #region Status Tests (3 tests)

    [Test]
    public void IsActive_CanBeSetToFalse()
    {
        var template = new SegmentFilterTemplate { IsActive = false };
        Assert.That(template.IsActive, Is.False);
    }

    [Test]
    public void ArchivedTemplate_IsInactive()
    {
        var template = new SegmentFilterTemplate
        {
            Name = "Deprecated Filter",
            IsActive = false,
            UpdatedAt = DateTime.UtcNow.AddMonths(-6)
        };
        Assert.That(template.IsActive, Is.False);
    }

    [Test]
    public void ActiveTemplate_CanBeUsed()
    {
        var template = new SegmentFilterTemplate
        {
            IsActive = true,
            FilterCriteria = "{\"status\":\"Active\"}"
        };
        Assert.That(template.IsActive, Is.True);
        Assert.That(template.FilterCriteria, Is.Not.Empty);
    }

    #endregion

    #region Timestamps Tests (2 tests)

    [Test]
    public void CreatedAt_DefaultsToUtcNow()
    {
        var beforeCreation = DateTime.UtcNow.AddSeconds(-1);
        var template = new SegmentFilterTemplate();
        var afterCreation = DateTime.UtcNow.AddSeconds(1);

        Assert.That(template.CreatedAt, Is.GreaterThan(beforeCreation));
        Assert.That(template.CreatedAt, Is.LessThan(afterCreation));
    }

    [Test]
    public void UpdatedAt_DefaultsToUtcNow()
    {
        var beforeCreation = DateTime.UtcNow.AddSeconds(-1);
        var template = new SegmentFilterTemplate();
        var afterCreation = DateTime.UtcNow.AddSeconds(1);

        Assert.That(template.UpdatedAt, Is.GreaterThan(beforeCreation));
        Assert.That(template.UpdatedAt, Is.LessThan(afterCreation));
    }

    #endregion

    #region Complete Template Scenarios Tests (5 tests)

    [Test]
    public void ActiveMembersTemplate_FiltersActiveStatus()
    {
        var template = new SegmentFilterTemplate
        {
            Name = "Active Members",
            Description = "All members with Active status",
            Category = "Membership",
            FilterCriteria = "{\"membershipStatus\":\"Active\"}",
            IsSystemTemplate = true,
            IsActive = true,
            UsageCount = 500
        };

        Assert.That(template.Category, Is.EqualTo("Membership"));
        Assert.That(template.IsSystemTemplate, Is.True);
        Assert.That(template.UsageCount, Is.GreaterThan(0));
    }

    [Test]
    public void HighEngagementTemplate_ComplexCriteria()
    {
        var template = new SegmentFilterTemplate
        {
            Name = "High Engagement Members",
            Description = "Members who attended 10+ events in last 6 months",
            Category = "Engagement",
            FilterCriteria = "{\"AND\":[{\"eventsAttended\":{\"greaterThan\":10}},{\"lastActivity\":{\"within\":\"6months\"}}]}",
            IsSystemTemplate = false,
            IsActive = true,
            UsageCount = 75
        };

        Assert.That(template.Category, Is.EqualTo("Engagement"));
        Assert.That(template.FilterCriteria, Contains.Substring("eventsAttended"));
        Assert.That(template.FilterCriteria, Contains.Substring("lastActivity"));
    }

    [Test]
    public void VIPMembersTemplate_FinancialCategory()
    {
        var template = new SegmentFilterTemplate
        {
            Name = "VIP Members",
            Description = "Members with premium tier subscriptions",
            Category = "Financial",
            FilterCriteria = "{\"subscriptionTier\":\"Premium\"}",
            IsActive = true,
            UsageCount = 200
        };

        Assert.That(template.Category, Is.EqualTo("Financial"));
        Assert.That(template.FilterCriteria, Contains.Substring("subscriptionTier"));
    }

    [Test]
    public void NewMembersTemplate_TimeBasedFilter()
    {
        var template = new SegmentFilterTemplate
        {
            Name = "New Members (Last 30 Days)",
            Description = "Members who joined in the last 30 days",
            Category = "Membership",
            FilterCriteria = "{\"joinedAfter\":{\"daysAgo\":30}}",
            IsSystemTemplate = true,
            IsActive = true,
            UsageCount = 350
        };

        Assert.That(template.FilterCriteria, Contains.Substring("joinedAfter"));
        Assert.That(template.IsSystemTemplate, Is.True);
    }

    [Test]
    public void CustomTemplate_UserDefined()
    {
        var template = new SegmentFilterTemplate
        {
            Name = "Custom Segment",
            Description = "User-defined custom filter",
            Category = "General",
            FilterCriteria = "{\"customField\":\"CustomValue\"}",
            IsSystemTemplate = false,
            IsActive = true,
            UsageCount = 5,
            CreatedAt = DateTime.UtcNow.AddDays(-7)
        };

        Assert.That(template.IsSystemTemplate, Is.False);
        Assert.That(template.Category, Is.EqualTo("General"));
        Assert.That(template.UsageCount, Is.LessThan(10));
    }

    #endregion
}
