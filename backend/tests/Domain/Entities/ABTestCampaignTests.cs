using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class ABTestCampaignTests
{
    #region Default Value Tests (5 tests)

    [Test]
    public void CampaignName_DefaultsToEmptyString()
    {
        var campaign = new ABTestCampaign();
        Assert.That(campaign.CampaignName, Is.EqualTo(string.Empty));
    }

    [Test]
    public void TestType_DefaultsToEmptyString()
    {
        var campaign = new ABTestCampaign();
        Assert.That(campaign.TestType, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Status_DefaultsToDraft()
    {
        var campaign = new ABTestCampaign();
        Assert.That(campaign.Status, Is.EqualTo("Draft"));
    }

    [Test]
    public void TestPercentage_DefaultsTo50()
    {
        var campaign = new ABTestCampaign();
        Assert.That(campaign.TestPercentage, Is.EqualTo(50));
    }

    [Test]
    public void MinimumSampleSize_DefaultsTo100()
    {
        var campaign = new ABTestCampaign();
        Assert.That(campaign.MinimumSampleSize, Is.EqualTo(100));
    }

    #endregion

    #region Test Configuration Tests (5 tests)

    [Test]
    public void TestType_CanBeSetToSubjectLine()
    {
        var campaign = new ABTestCampaign { TestType = "SubjectLine" };
        Assert.That(campaign.TestType, Is.EqualTo("SubjectLine"));
    }

    [Test]
    public void TestType_CanBeSetToContent()
    {
        var campaign = new ABTestCampaign { TestType = "Content" };
        Assert.That(campaign.TestType, Is.EqualTo("Content"));
    }

    [Test]
    public void TestType_CanBeSetToSendTime()
    {
        var campaign = new ABTestCampaign { TestType = "SendTime" };
        Assert.That(campaign.TestType, Is.EqualTo("SendTime"));
    }

    [Test]
    public void TestPercentage_CanBeCustomized()
    {
        var campaign = new ABTestCampaign { TestPercentage = 30 };
        Assert.That(campaign.TestPercentage, Is.EqualTo(30));
    }

    [Test]
    public void ConfidenceLevel_DefaultsTo95Percent()
    {
        var campaign = new ABTestCampaign();
        Assert.That(campaign.ConfidenceLevel, Is.EqualTo(95.0m));
    }

    #endregion

    #region Variant A Tests (4 tests)

    [Test]
    public void VariantA_CanUseTemplate()
    {
        var campaign = new ABTestCampaign
        {
            VariantATemplateId = 5,
            VariantASubject = "Welcome to Our Club!"
        };

        Assert.That(campaign.VariantATemplateId, Is.EqualTo(5));
        Assert.That(campaign.VariantASubject, Is.EqualTo("Welcome to Our Club!"));
    }

    [Test]
    public void VariantA_CanUseCustomContent()
    {
        var campaign = new ABTestCampaign
        {
            VariantASubject = "Join Us Today",
            VariantAContent = "<html><body>Custom email content</body></html>"
        };

        Assert.That(campaign.VariantASubject, Is.EqualTo("Join Us Today"));
        Assert.That(campaign.VariantAContent, Is.Not.Null);
    }

    [Test]
    public void VariantA_CanHaveDifferentSubjectLine()
    {
        var campaign = new ABTestCampaign
        {
            TestType = "SubjectLine",
            VariantASubject = "Special Offer Inside"
        };

        Assert.That(campaign.TestType, Is.EqualTo("SubjectLine"));
        Assert.That(campaign.VariantASubject, Is.EqualTo("Special Offer Inside"));
    }

    [Test]
    public void VariantA_SubjectCanBeLong()
    {
        var longSubject = "Check Out Our Amazing New Features and Benefits - Limited Time Offer!";
        var campaign = new ABTestCampaign { VariantASubject = longSubject };
        Assert.That(campaign.VariantASubject, Is.EqualTo(longSubject));
    }

    #endregion

    #region Variant B Tests (4 tests)

    [Test]
    public void VariantB_CanUseTemplate()
    {
        var campaign = new ABTestCampaign
        {
            VariantBTemplateId = 6,
            VariantBSubject = "Discover What's New"
        };

        Assert.That(campaign.VariantBTemplateId, Is.EqualTo(6));
        Assert.That(campaign.VariantBSubject, Is.EqualTo("Discover What's New"));
    }

    [Test]
    public void VariantB_CanUseCustomContent()
    {
        var campaign = new ABTestCampaign
        {
            VariantBSubject = "Get Started Now",
            VariantBContent = "<html><body>Alternative email content</body></html>"
        };

        Assert.That(campaign.VariantBSubject, Is.EqualTo("Get Started Now"));
        Assert.That(campaign.VariantBContent, Is.Not.Null);
    }

    [Test]
    public void VariantB_CanDifferFromVariantA()
    {
        var campaign = new ABTestCampaign
        {
            VariantASubject = "Version A Subject",
            VariantBSubject = "Version B Subject"
        };

        Assert.That(campaign.VariantASubject, Is.Not.EqualTo(campaign.VariantBSubject));
    }

    [Test]
    public void BothVariants_CanUseDifferentTemplates()
    {
        var campaign = new ABTestCampaign
        {
            VariantATemplateId = 1,
            VariantBTemplateId = 2
        };

        Assert.That(campaign.VariantATemplateId, Is.EqualTo(1));
        Assert.That(campaign.VariantBTemplateId, Is.EqualTo(2));
        Assert.That(campaign.VariantATemplateId, Is.Not.EqualTo(campaign.VariantBTemplateId));
    }

    #endregion

    #region Campaign Lifecycle Tests (5 tests)

    [Test]
    public void Status_CanBeSetToRunning()
    {
        var campaign = new ABTestCampaign
        {
            Status = "Running",
            StartedAt = DateTime.UtcNow
        };

        Assert.That(campaign.Status, Is.EqualTo("Running"));
        Assert.That(campaign.StartedAt, Is.Not.Null);
    }

    [Test]
    public void Status_CanBeSetToCompleted()
    {
        var campaign = new ABTestCampaign
        {
            Status = "Completed",
            EndedAt = DateTime.UtcNow
        };

        Assert.That(campaign.Status, Is.EqualTo("Completed"));
        Assert.That(campaign.EndedAt, Is.Not.Null);
    }

    [Test]
    public void Status_CanBeSetToCancelled()
    {
        var campaign = new ABTestCampaign { Status = "Cancelled" };
        Assert.That(campaign.Status, Is.EqualTo("Cancelled"));
    }

    [Test]
    public void RunningCampaign_HasStartTime()
    {
        var startTime = DateTime.UtcNow.AddHours(-2);
        var campaign = new ABTestCampaign
        {
            Status = "Running",
            StartedAt = startTime
        };

        Assert.That(campaign.StartedAt, Is.EqualTo(startTime));
        Assert.That(campaign.StartedAt, Is.LessThan(DateTime.UtcNow));
    }

    [Test]
    public void CompletedCampaign_HasStartAndEndTimes()
    {
        var campaign = new ABTestCampaign
        {
            Status = "Completed",
            StartedAt = DateTime.UtcNow.AddDays(-7),
            EndedAt = DateTime.UtcNow.AddDays(-1)
        };

        Assert.That(campaign.StartedAt, Is.Not.Null);
        Assert.That(campaign.EndedAt, Is.Not.Null);
        Assert.That(campaign.EndedAt, Is.GreaterThan(campaign.StartedAt));
    }

    #endregion

    #region Winner Determination Tests (4 tests)

    [Test]
    public void WinnerVariant_CanBeSetToA()
    {
        var campaign = new ABTestCampaign { WinnerVariant = "A" };
        Assert.That(campaign.WinnerVariant, Is.EqualTo("A"));
    }

    [Test]
    public void WinnerVariant_CanBeSetToB()
    {
        var campaign = new ABTestCampaign { WinnerVariant = "B" };
        Assert.That(campaign.WinnerVariant, Is.EqualTo("B"));
    }

    [Test]
    public void CompletedTest_CanHaveWinner()
    {
        var campaign = new ABTestCampaign
        {
            Status = "Completed",
            WinnerVariant = "A",
            StatisticalSignificance = 97.5m
        };

        Assert.That(campaign.Status, Is.EqualTo("Completed"));
        Assert.That(campaign.WinnerVariant, Is.EqualTo("A"));
        Assert.That(campaign.StatisticalSignificance, Is.GreaterThan(95.0m));
    }

    [Test]
    public void StatisticalSignificance_CanBeTracked()
    {
        var campaign = new ABTestCampaign { StatisticalSignificance = 98.2m };
        Assert.That(campaign.StatisticalSignificance, Is.EqualTo(98.2m));
    }

    #endregion

    #region Targeting Tests (2 tests)

    [Test]
    public void SegmentId_CanBeSetForTargetedTest()
    {
        var campaign = new ABTestCampaign { SegmentId = 10 };
        Assert.That(campaign.SegmentId, Is.EqualTo(10));
    }

    [Test]
    public void AllMembersTest_HasNullSegmentId()
    {
        var campaign = new ABTestCampaign
        {
            CampaignName = "Full Member Test",
            SegmentId = null
        };

        Assert.That(campaign.SegmentId, Is.Null);
    }

    #endregion
}
