using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class CommunicationsLogTests
{
    #region Default Value Tests (4 tests)

    [Test]
    public void CommunicationType_DefaultsToEmptyString()
    {
        var log = new CommunicationsLog();
        Assert.That(log.CommunicationType, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Body_DefaultsToEmptyString()
    {
        var log = new CommunicationsLog();
        Assert.That(log.Body, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Recipients_DefaultsToEmptyString()
    {
        var log = new CommunicationsLog();
        Assert.That(log.Recipients, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Status_DefaultsToPending()
    {
        var log = new CommunicationsLog();
        Assert.That(log.Status, Is.EqualTo("Pending"));
    }

    #endregion

    #region Communication Type Tests (4 tests)

    [Test]
    public void CommunicationType_CanBeSetToEmail()
    {
        var log = new CommunicationsLog { CommunicationType = "Email" };
        Assert.That(log.CommunicationType, Is.EqualTo("Email"));
    }

    [Test]
    public void CommunicationType_CanBeSetToSMS()
    {
        var log = new CommunicationsLog { CommunicationType = "SMS" };
        Assert.That(log.CommunicationType, Is.EqualTo("SMS"));
    }

    [Test]
    public void CommunicationType_CanBeSetToWhatsApp()
    {
        var log = new CommunicationsLog { CommunicationType = "WhatsApp" };
        Assert.That(log.CommunicationType, Is.EqualTo("WhatsApp"));
    }

    [Test]
    public void Email_HasSubjectAndBody()
    {
        var log = new CommunicationsLog
        {
            CommunicationType = "Email",
            Subject = "Monthly Newsletter",
            Body = "<html><body>Newsletter content</body></html>"
        };

        Assert.That(log.CommunicationType, Is.EqualTo("Email"));
        Assert.That(log.Subject, Is.EqualTo("Monthly Newsletter"));
        Assert.That(log.Body, Is.Not.Empty);
    }

    #endregion

    #region Recipient Tracking Tests (4 tests)

    [Test]
    public void RecipientCount_CanBeSet()
    {
        var log = new CommunicationsLog { RecipientCount = 150 };
        Assert.That(log.RecipientCount, Is.EqualTo(150));
    }

    [Test]
    public void Recipients_CanStoreJsonArray()
    {
        var recipientsJson = "[\"user1@example.com\",\"user2@example.com\",\"user3@example.com\"]";
        var log = new CommunicationsLog
        {
            Recipients = recipientsJson,
            RecipientCount = 3
        };

        Assert.That(log.Recipients, Is.EqualTo(recipientsJson));
        Assert.That(log.RecipientCount, Is.EqualTo(3));
    }

    [Test]
    public void BulkEmail_CanTrackLargeRecipientList()
    {
        var log = new CommunicationsLog
        {
            RecipientCount = 500,
            Recipients = "[\"member1@example.com\",\"member2@example.com\",...]"
        };

        Assert.That(log.RecipientCount, Is.EqualTo(500));
    }

    [Test]
    public void SingleRecipient_HasCountOfOne()
    {
        var log = new CommunicationsLog
        {
            RecipientCount = 1,
            Recipients = "[\"single@example.com\"]"
        };

        Assert.That(log.RecipientCount, Is.EqualTo(1));
    }

    #endregion

    #region Status Tracking Tests (4 tests)

    [Test]
    public void Status_CanBeSetToSent()
    {
        var log = new CommunicationsLog { Status = "Sent" };
        Assert.That(log.Status, Is.EqualTo("Sent"));
    }

    [Test]
    public void Status_CanBeSetToFailed()
    {
        var log = new CommunicationsLog { Status = "Failed" };
        Assert.That(log.Status, Is.EqualTo("Failed"));
    }

    [Test]
    public void SuccessfulCommunication_HasSentStatus()
    {
        var log = new CommunicationsLog
        {
            Status = "Sent",
            SentAt = DateTime.UtcNow
        };

        Assert.That(log.Status, Is.EqualTo("Sent"));
        Assert.That(log.SentAt, Is.LessThanOrEqualTo(DateTime.UtcNow));
    }

    [Test]
    public void PendingCommunication_CanHaveScheduledTime()
    {
        var scheduledTime = DateTime.UtcNow.AddHours(2);
        var log = new CommunicationsLog
        {
            Status = "Pending",
            ScheduledFor = scheduledTime
        };

        Assert.That(log.Status, Is.EqualTo("Pending"));
        Assert.That(log.ScheduledFor, Is.EqualTo(scheduledTime));
        Assert.That(log.ScheduledFor, Is.GreaterThan(DateTime.UtcNow));
    }

    #endregion

    #region Campaign Association Tests (4 tests)

    [Test]
    public void TemplateId_CanBeSet()
    {
        var log = new CommunicationsLog { TemplateId = 5 };
        Assert.That(log.TemplateId, Is.EqualTo(5));
    }

    [Test]
    public void ABTestCampaignId_CanBeSet()
    {
        var log = new CommunicationsLog { ABTestCampaignId = 10 };
        Assert.That(log.ABTestCampaignId, Is.EqualTo(10));
    }

    [Test]
    public void WorkflowId_CanBeSet()
    {
        var log = new CommunicationsLog { WorkflowId = 3 };
        Assert.That(log.WorkflowId, Is.EqualTo(3));
    }

    [Test]
    public void CommunicationFromWorkflow_TracksAllAssociations()
    {
        var log = new CommunicationsLog
        {
            TemplateId = 12,
            WorkflowId = 4,
            SegmentId = 7,
            Status = "Sent"
        };

        Assert.That(log.TemplateId, Is.EqualTo(12));
        Assert.That(log.WorkflowId, Is.EqualTo(4));
        Assert.That(log.SegmentId, Is.EqualTo(7));
    }

    #endregion

    #region Segmentation Tests (2 tests)

    [Test]
    public void SegmentId_CanBeSetForTargetedCommunication()
    {
        var log = new CommunicationsLog { SegmentId = 15 };
        Assert.That(log.SegmentId, Is.EqualTo(15));
    }

    [Test]
    public void AllMembersCommunication_HasNullSegmentId()
    {
        var log = new CommunicationsLog
        {
            SegmentId = null,
            RecipientCount = 1000
        };

        Assert.That(log.SegmentId, Is.Null);
        Assert.That(log.RecipientCount, Is.EqualTo(1000));
    }

    #endregion
}
