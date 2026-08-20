using NUnit.Framework;
using GatherGrove.Domain.Entities;

namespace Domain.Tests.Entities;

[TestFixture]
public class EventEngagementTrackingTests
{
    #region Default Value Tests (8 tests)

    [Test]
    public void RegistrationStatus_DefaultsToRegistered()
    {
        var tracking = new EventEngagementTracking();
        Assert.That(tracking.RegistrationStatus, Is.EqualTo("registered"));
    }

    [Test]
    public void AttendanceStatus_DefaultsToPending()
    {
        var tracking = new EventEngagementTracking();
        Assert.That(tracking.AttendanceStatus, Is.EqualTo("pending"));
    }

    [Test]
    public void AttendancePercentage_DefaultsToZero()
    {
        var tracking = new EventEngagementTracking();
        Assert.That(tracking.AttendancePercentage, Is.EqualTo(0));
    }

    [Test]
    public void InteractionCount_DefaultsToZero()
    {
        var tracking = new EventEngagementTracking();
        Assert.That(tracking.InteractionCount, Is.EqualTo(0));
    }

    [Test]
    public void NetworkingConnections_DefaultsToZero()
    {
        var tracking = new EventEngagementTracking();
        Assert.That(tracking.NetworkingConnections, Is.EqualTo(0));
    }

    [Test]
    public void ParticipationLevel_DefaultsToPassive()
    {
        var tracking = new EventEngagementTracking();
        Assert.That(tracking.ParticipationLevel, Is.EqualTo("passive"));
    }

    [Test]
    public void ParticipationScore_DefaultsToZero()
    {
        var tracking = new EventEngagementTracking();
        Assert.That(tracking.ParticipationScore, Is.EqualTo(0));
    }

    [Test]
    public void Platform_DefaultsToWeb()
    {
        var tracking = new EventEngagementTracking();
        Assert.That(tracking.Platform, Is.EqualTo("web"));
    }

    #endregion

    #region Engagement Metrics Tests (5 tests)

    [Test]
    public void CheckInTimestamp_CanBeSet()
    {
        var checkInTime = DateTime.UtcNow;
        var tracking = new EventEngagementTracking { CheckInTimestamp = checkInTime };
        Assert.That(tracking.CheckInTimestamp, Is.EqualTo(checkInTime));
    }

    [Test]
    public void SessionDurationMinutes_CanBeCalculated()
    {
        var tracking = new EventEngagementTracking { SessionDurationMinutes = 75 };
        Assert.That(tracking.SessionDurationMinutes, Is.EqualTo(75));
    }

    [Test]
    public void InteractionCount_CanBeIncremented()
    {
        var tracking = new EventEngagementTracking { InteractionCount = 5 };
        tracking.InteractionCount++;
        Assert.That(tracking.InteractionCount, Is.EqualTo(6));
    }

    [Test]
    public void NetworkingConnections_CanBeTracked()
    {
        var tracking = new EventEngagementTracking { NetworkingConnections = 12 };
        Assert.That(tracking.NetworkingConnections, Is.EqualTo(12));
    }

    [Test]
    public void AttendancePercentage_CanBeSetToFullAttendance()
    {
        var tracking = new EventEngagementTracking { AttendancePercentage = 100.00m };
        Assert.That(tracking.AttendancePercentage, Is.EqualTo(100.00m));
    }

    #endregion

    #region Event-Specific Engagement Tests (5 tests)

    [Test]
    public void QuestionsAsked_CanBeTracked()
    {
        var tracking = new EventEngagementTracking { QuestionsAsked = 3 };
        Assert.That(tracking.QuestionsAsked, Is.EqualTo(3));
    }

    [Test]
    public void PollsParticipated_CanBeTracked()
    {
        var tracking = new EventEngagementTracking { PollsParticipated = 4 };
        Assert.That(tracking.PollsParticipated, Is.EqualTo(4));
    }

    [Test]
    public void ResourcesDownloaded_CanBeTracked()
    {
        var tracking = new EventEngagementTracking { ResourcesDownloaded = 2 };
        Assert.That(tracking.ResourcesDownloaded, Is.EqualTo(2));
    }

    [Test]
    public void ChatMessages_CanBeTracked()
    {
        var tracking = new EventEngagementTracking { ChatMessages = 15 };
        Assert.That(tracking.ChatMessages, Is.EqualTo(15));
    }

    [Test]
    public void BreakoutParticipation_CanBeEnabled()
    {
        var tracking = new EventEngagementTracking { BreakoutParticipation = true };
        Assert.That(tracking.BreakoutParticipation, Is.True);
    }

    #endregion

    #region Technology Usage Tests (3 tests)

    [Test]
    public void Platform_SupportsMultiplePlatforms()
    {
        var webTracking = new EventEngagementTracking { Platform = "web" };
        var mobileTracking = new EventEngagementTracking { Platform = "mobile" };
        var desktopTracking = new EventEngagementTracking { Platform = "desktop" };

        Assert.That(webTracking.Platform, Is.EqualTo("web"));
        Assert.That(mobileTracking.Platform, Is.EqualTo("mobile"));
        Assert.That(desktopTracking.Platform, Is.EqualTo("desktop"));
    }

    [Test]
    public void DeviceType_CanBeSet()
    {
        var tracking = new EventEngagementTracking { DeviceType = "iPhone" };
        Assert.That(tracking.DeviceType, Is.EqualTo("iPhone"));
    }

    [Test]
    public void TechnicalIssues_CanBeReported()
    {
        var tracking = new EventEngagementTracking
        {
            TechnicalIssues = true,
            ConnectionQuality = "poor"
        };

        Assert.That(tracking.TechnicalIssues, Is.True);
        Assert.That(tracking.ConnectionQuality, Is.EqualTo("poor"));
    }

    #endregion

    #region Feedback Integration Tests (3 tests)

    [Test]
    public void PostEventSurveyCompleted_CanBeSet()
    {
        var tracking = new EventEngagementTracking { PostEventSurveyCompleted = true };
        Assert.That(tracking.PostEventSurveyCompleted, Is.True);
    }

    [Test]
    public void SatisfactionRating_CanBeSet()
    {
        var tracking = new EventEngagementTracking { SatisfactionRating = 4.5m };
        Assert.That(tracking.SatisfactionRating, Is.EqualTo(4.5m));
    }

    [Test]
    public void NetPromoterScore_CanBeTracked()
    {
        var tracking = new EventEngagementTracking { NetPromoterScore = 9 };
        Assert.That(tracking.NetPromoterScore, Is.EqualTo(9));
    }

    #endregion
}
